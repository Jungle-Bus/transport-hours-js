require("array-flat-polyfill");
const OpeningHours = require("./OpeningHours");
const deepEqual = require("fast-deep-equal");

const TAG_UNSET = "unset";
const TAG_INVALID = "invalid";

/**
 * TransportHours is the main class of the library.
 * It contains all main functions which can help managing public transport hours.
 */
class TransportHours {
	/**
	 * Converts OpenStreetMap tags into a ready-to-use JS object representing the hours of the public transport line.
	 * Parsed tags are : interval=\*, opening_hours=\* and interval:conditional=\*
	 * @param {Object} tags The list of tags from OpenStreetMap
	 * @return {Object} The hours of the line, with structure { opens: {@link #gettable|opening hours table}, defaultInterval: minutes (int), otherIntervals: {@link #intervalconditionalstringtoobject|interval rules object}, otherIntervalsByDays: list of interval by days (structure: { days: string[], intervals: { hoursRange: interval } }), allComputedIntervals: same as otherIntervalsByDays but taking also default interval and opening_hours }. Each field can also have value "unset" if no tag is defined, or "invalid" if tag can't be read.
	 */
	tagsToHoursObject(tags) {
		// Read opening_hours
		let opens;
		try {
			opens = tags.opening_hours ? (new OpeningHours(tags.opening_hours)).getTable() : TAG_UNSET;
		}
		catch(e) {
			opens = TAG_INVALID;
		}

		// Read interval
		let interval;
		try {
			interval = tags.interval ? this.intervalStringToMinutes(tags.interval) : TAG_UNSET;
		}
		catch(e) {
			interval = TAG_INVALID;
		}

		// Read interval:conditional
		let intervalCond, intervalCondByDay;
		try {
			intervalCond = tags["interval:conditional"] ? this.intervalConditionalStringToObject(tags["interval:conditional"]) : TAG_UNSET;
			intervalCondByDay = intervalCond !== TAG_UNSET ? this._intervalConditionObjectToIntervalByDays(intervalCond) : TAG_UNSET;
		}
		catch(e) {
			intervalCond = TAG_INVALID;
			intervalCondByDay = TAG_INVALID;
		}

		// Create computed calendar of intervals using previous data
		let computedIntervals;
		try {
			computedIntervals = this._computeAllIntervals(opens, interval, intervalCondByDay);
		}
		catch(e) {
			computedIntervals = TAG_INVALID;
		}

		// Send result
		return {
			opens: opens,
			defaultInterval: interval,
			otherIntervals: intervalCond,
			otherIntervalsByDays: intervalCondByDay,
			allComputedIntervals: computedIntervals
		};
	}

	/**
	 * Reads all information, and generates a merged calendar of all intervals.
	 * @private
	 */
	_computeAllIntervals(openingHours, interval, intervalCondByDay) {
		// If opening hours or interval is invalid, returns interval conditional as is
		if(openingHours === TAG_INVALID || interval === TAG_INVALID || interval === TAG_UNSET || intervalCondByDay === TAG_INVALID) {
			return (openingHours === TAG_INVALID || interval === TAG_INVALID) && intervalCondByDay === TAG_UNSET ? TAG_INVALID : intervalCondByDay;
		}
		else {
			let myIntervalCondByDay = intervalCondByDay === TAG_UNSET ? [] : intervalCondByDay;

			// Check opening hours, if missing we default to 24/7
			let myOH = openingHours;
			if(openingHours === TAG_UNSET) {
				myOH = (new OpeningHours("24/7")).getTable();
			}

			// Copy existing intervals (split day by day)
			let result = [];
			myIntervalCondByDay.forEach(di => {
				di.days.forEach(d => {
					result.push({ days: [d], intervals: di.intervals });
				});
			});

			// Complete existing days
			result = result.map(di => {
				// Find opening hours for this day
				const ohDay = myOH[di.days[0]];

				// Merge intervals
				di.intervals = this._mergeIntervalsSingleDay(ohDay, interval, di.intervals);

				return di;
			});

			// List days not in myIntervalCondByDay, and add directly opening hours
			const daysInCondInt = [...new Set(myIntervalCondByDay.map(d => d.days).flat())];
			const missingDays = Object.keys(myOH).filter(d => !daysInCondInt.includes(d));
			const missingDaysOH = {};
			missingDays.forEach(day => {
				missingDaysOH[day] = myOH[day];
			});
			result = result.concat(this._intervalConditionObjectToIntervalByDays([{ interval: interval, applies: missingDaysOH }]));

			// Merge similar days
			for(let i=1; i < result.length; i++) {
				for(let j=0; j < i; j++) {
					if(deepEqual(result[i].intervals, result[j].intervals)) {
						result[j].days = result[j].days.concat(result[i].days);
						result.splice(i, 1);
						i--;
						break;
					}
				}
			}

			// Sort results by day
			const daysId = [ "mo", "tu", "we", "th", "fr", "sa", "su", "ph" ];
			result.forEach(r => r.days.sort((a,b) => daysId.indexOf(a) - daysId.indexOf(b)));
			result.sort((a,b) => daysId.indexOf(a.days[0]) - daysId.indexOf(b.days[0]));

			return result;
		}
	}

	/**
	 * Add default interval within opening hours to conditional intervals
	 * @private
	 */
	_mergeIntervalsSingleDay(hours, interval, condIntervals) {
		const hourRangeToArr = hr => hr.map(h => h.split("-"));
		const ohHours = hourRangeToArr(hours);
		const condHours = hourRangeToArr(Object.keys(condIntervals));

		// Check all conditional hours belong into opening hours
		const invalidCondHours = condHours.filter(ch => {
			let foundOhHours = false;

			for(let i=0; i < ohHours.length; i++) {
				const ohh = ohHours[i];
				if(ch[0] >= ohh[0] && ch[1] <= ohh[1]) {
					foundOhHours = true;
					break;
				}
			}

			return !foundOhHours;
		});

		if(invalidCondHours.length > 0) {
			throw new Error("Conditional intervals are not contained in opening hours");
		}


		let ohHoursWithoutConds = [];

		ohHours.forEach((ohh,i) => {
			const thisHours = [];

			if(condHours.length === 0 || ohh[0] !== condHours[0][0]) {
				thisHours.push(ohh[0]);
			}

			condHours.forEach((ch,j) => {
				if(ch[0] > ohh[0] && ch[0] < ohh[1]) {
					thisHours.push(ch[0]);
				}
				if(ch[1] > ohh[0] && ch[1] < ohh[1]) {
					thisHours.push(ch[1]);
				}
			});

			if(condHours.length === 0 || ohh[1] !== condHours[condHours.length-1][1]) {
				thisHours.push(ohh[1]);
			}

			ohHoursWithoutConds = ohHoursWithoutConds.concat(thisHours.map((h,i) => i%2 === 0 ? null : thisHours[i-1]+"-"+h).filter(h => h !== null));
		});

		let result = {};
		ohHoursWithoutConds.forEach(h => { result[h] = interval; });
		result = Object.assign(result, condIntervals);

		return result;
	}

	/**
	 * Reads an interval:conditional=* tag from OpenStreetMap, and converts it into a JS object.
	 * @param {string} intervalConditional The {@link https://wiki.openstreetmap.org/wiki/Key:interval|interval:conditional} tag
	 * @return {Object[]} A list of rules, each having structure { interval: minutes (int), applies: {@link #gettable|opening hours table} }
	 */
	intervalConditionalStringToObject(intervalConditional) {
		return this._splitMultipleIntervalConditionalString(intervalConditional).map(p => this._readSingleIntervalConditionalString(p));
	}

	/**
	 * Transforms an object containing the conditional intervals into an object structured day by day.
	 * @private
	 */
	_intervalConditionObjectToIntervalByDays(intervalConditionalObject) {
		const result = [];
		const itvByDay = {};

		// List hours -> interval day by day
		intervalConditionalObject.forEach(itv => {
			Object.entries(itv.applies).forEach(e => {
				const [ day, hours ] = e;
				if(!itvByDay[day]) { itvByDay[day] = {}; }
				hours.forEach(h => {
					itvByDay[day][h] = itv.interval;
				});
			});
		});

		// Merge days
		Object.entries(itvByDay).forEach(e => {
			const [ day, intervals ] = e;

			if(Object.keys(intervals).length > 0) {
				// Look for identical days
				const ident = result.filter(r => deepEqual(r.intervals, intervals));

				if(ident.length === 1) {
					ident[0].days.push(day);
				}
				else {
					result.push({ days: [ day ], intervals: intervals });
				}
			}
		});

		return result;
	}

	/**
	 * Splits several conditional interval rules being separated by semicolon.
	 * @param {string} intervalConditional
	 * @return {string[]} List of single rules
	 * @private
	 */
	_splitMultipleIntervalConditionalString(intervalConditional) {
		if(intervalConditional.match(/\(.*\)/)) {
			const semicolons = intervalConditional.split("").map((c,i) => c === ";" ? i : null).filter(i => i !== null);
			let cursor = 0;
			const stack = [];

			while(semicolons.length > 0) {
				const scid = semicolons[0];
				const part = intervalConditional.substring(cursor, scid);

				if(part.match(/^[^\(\)]$/) || part.match(/\(.*\)/)) {
					stack.push(part);
					cursor = scid+1;
				}

				semicolons.shift();
			}

			stack.push(intervalConditional.substring(cursor));
			return stack.map(p => p.trim()).filter(p => p.length > 0);
		}
		else {
			return intervalConditional.split(";").map(p => p.trim()).filter(p => p.length > 0);
		}
	}

	/**
	 * Parses a single conditional interval value (for example : `15 @ (08:00-15:00)`).
	 * This should be used as many times as you have different rules (separated by semicolon).
	 * @param {string} intervalConditional
	 * @return {Object} Object with structure { interval: minutes (int), applies: {@link #gettable|opening hours table} }
	 * @private
	 */
	_readSingleIntervalConditionalString(intervalConditional) {
		const result = {};
		const parts = intervalConditional.split("@").map(p => p.trim());

		if(parts.length !== 2) {
			throw new Error("Conditional interval can't be parsed : "+intervalConditional);
		}

		// Read interval
		result.interval = this.intervalStringToMinutes(parts[0]);

		// Read opening hours
		if(parts[1].match(/^\(.*\)$/)) {
			parts[1] = parts[1].substring(1, parts[1].length-1);
		}

		result.applies = (new OpeningHours(parts[1])).getTable();

		return result;
	}

	/**
	 * Converts an interval=* string into an amount of minutes
	 * @param {string} interval The {@link https://wiki.openstreetmap.org/wiki/Key:interval|interval string}
	 * @return {number} The amount of minutes (can be a decimal values if seconds are used)
	 * @throws {Error} If interval is invalid
	 */
	intervalStringToMinutes(interval) {
		interval = interval.trim();

		// hh:mm:ss
		if(/^\d{1,2}:\d{2}:\d{2}$/.test(interval)) {
			const parts = interval.split(":").map(t => parseInt(t));
			return parts[0] * 60 + parts[1] + parts[2] / 60;
		}
		// hh:mm
		else if(/^\d{1,2}:\d{2}$/.test(interval)) {
			const parts = interval.split(":").map(t => parseInt(t));
			return parts[0] * 60 + parts[1];
		}
		// mm
		else if(/^\d+$/.test(interval)) {
			return parseInt(interval);
		}
		// invalid
		else {
			throw new Error("Interval value can't be parsed : "+interval);
		}
	}

	/**
	 * Converts an amount of minutes into an interval=* string
	 * @param {number} minutes The amount of minutes
	 * @return {string} The {@link https://wiki.openstreetmap.org/wiki/Key:interval|interval string}, in HH:MM:SS format
	 */
	minutesToIntervalString(minutes) {
		if(typeof minutes !== "number") {
			throw new Error("Parameter minutes is not a number");
		}

		const h = Math.floor(minutes / 60);
		const m = Math.floor(minutes % 60);
		const s = Math.round((minutes - h*60 - m) * 60);

		return [ h, m, s ].map(t => t.toString().padStart(2, "0")).join(":");
	}
}

module.exports = TransportHours;
