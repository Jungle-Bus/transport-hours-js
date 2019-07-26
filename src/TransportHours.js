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
	 * @return {Object} The hours of the line, with structure { opens: {@link #gettable|opening hours table}, defaultInterval: minutes (int), otherIntervals: {@link #intervalconditionalstringtoobject|interval rules object}, otherIntervalsByDays: list of interval by days (structure: { days: string[], intervals: { hoursRange: interval } }) }. Each field can also have value "unset" if no tag is defined, or "invalid" if tag can't be read.
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
		
		// Send result
		return {
			opens: opens,
			defaultInterval: interval,
			otherIntervals: intervalCond,
			otherIntervalsByDays: intervalCondByDay
		};
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
