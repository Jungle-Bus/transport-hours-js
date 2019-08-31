require("array-flat-polyfill");
const DAYS = [ "mo", "tu", "we", "th", "fr", "sa", "su", "ph" ];
const DAYS_OH = [ "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", "PH" ];
const HOURS_RGX = /^\d{2}\:\d{2}\-\d{2}\:\d{2}$/;

/**
 * OpeningHoursBuilder allows to create a clean value for OSM tag opening_hours\=*
 */
class OpeningHoursBuilder {
	/**
	 * Creates a new builder object.
	 * @param {Object[]} periods List of periods (objects like { days: [ "mo", "tu", "we" ], hours: [ "08:00-15:00", "19:30-22:50" ] })
	 * @param {Object} [options] Other parameters
	 * @param {boolean} [options.explicitPH] True to always add an explicit rule for public holidays (defaults to false)
	 */
	constructor(periods, options) {
		if(!periods || !Array.isArray(periods) || periods.filter(p => !OpeningHoursBuilder.IsPeriodValid(p)).length > 0) {
			throw new Error("The given periods are not valid");
		}

		options = Object.assign({ explicitPH: false }, options);

		// Convert hours ranges
		const ohHours = periods.map(p => ({ days: p.days, hours: OpeningHoursBuilder.HoursToOH(p.hours) }));

		// Find and merge days having same hours ranges
		const ohHoursDays = {};
		ohHours.forEach(p => {
			if(ohHoursDays[p.hours]) {
				ohHoursDays[p.hours] = ohHoursDays[p.hours].concat(p.days);
			}
			else {
				ohHoursDays[p.hours] = p.days;
			}
		});

		// Convert periods
		const ohPeriods = Object.entries(ohHoursDays).map(e => [
			OpeningHoursBuilder.DaysToOH(e[1]),
			e[0]
		]);

		this._ohValue = ohPeriods.map(p => p.join(" ").trim()).join("; ");

		// Simplify syntax
		if(!options.explicitPH && (this._ohValue === "00:00-24:00" || this._ohValue === "Mo-Su,PH 00:00-24:00")) {
			this._ohValue = "24/7";
		}

		const distinctDays = [...new Set(periods.map(p => p.days).flat())];
		if(options.explicitPH && distinctDays.length === 7 && !distinctDays.includes("ph")) {
			this._ohValue += "; PH off";
		}
	}

	/**
	 * Is a given period valid ?
	 * @param {Object} p The period to check
	 * @return {boolean} True if valid
	 */
	static IsPeriodValid(p) {
		return p
			&& p.days
			&& p.days.length > 0
			&& p.days.filter(d => !d || typeof d !== "string" || !DAYS.includes(d)).length === 0
			&& p.hours
			&& p.hours.length > 0
			&& p.hours.filter(h => !h || typeof h !== "string" || !HOURS_RGX.test(h)).length === 0;
	}

	/**
	 * Converts a single list of days into opening_hours syntax
	 * @param {string[]} days The list of days
	 * @return {string} The opening_hours syntax for these days
	 */
	static DaysToOH(days) {
		// Sort days
		const daysId = [...new Set(days.map(d => DAYS.indexOf(d)))].sort();

		// Merge following days
		for(let id=1; id < daysId.length; id++) {
			const currDay = daysId[id];
			let prevDay = daysId[id-1];
			if(Array.isArray(prevDay)) { prevDay = prevDay[1]; }

			// Following days = merge
			if(currDay === prevDay+1 && currDay !== DAYS.indexOf("ph")) {
				if(Array.isArray(daysId[id-1])) {
					daysId[id-1][1] = currDay;
				}
				else {
					daysId[id-1] = [prevDay,currDay];
				}

				daysId.splice(id, 1);
				id--;
			}
		}

		// Create day part (for example "Mo-We,Fr")
		let dayPart = daysId.map(dId => (
			Array.isArray(dId) ? dId.map(d => DAYS_OH[d]).join(dId[1]-dId[0] > 1 ? "-" : ",") : DAYS_OH[dId]
		)).join(",");

		return dayPart;
	}

	/**
	 * Converts a list of hour ranges into opening_hours syntax
	 * @param {string[]} hours The list of ranges (each range in format HH:MM-HH:MM)
	 * @return {string} The opening_hours syntax for these ranges
	 */
	static HoursToOH(hours) {
		// Convert hours into minutes from midnight (0 -> 1440)
		const minutesRanges = hours.map(h => h.split("-").map(hp => OpeningHoursBuilder.TimeToMinutes(hp))).sort((a,b) => a[0] - b[0]);

		// Merge following ranges
		for(let id=1; id < minutesRanges.length; id++) {
			const currRange = minutesRanges[id];
			const prevRange = minutesRanges[id-1];

			if(prevRange[1] >= currRange[0]) {
				if(prevRange[1] < currRange[1] || currRange[0] > currRange[1]) {
					prevRange[1] = currRange[1];
				}
				minutesRanges.splice(id, 1);
				id--;
			}
		}

		const hourPart = minutesRanges.map(mr => mr.map(mrp => OpeningHoursBuilder.MinutesToTime(mrp)).join("-")).join(",");

		return hourPart;
	}

	/**
	 * Convert a time string like "12:00" into minutes from midnight (0 for 00:00, 720 for 12:00, 1440 for 24:00)
	 * @param {string} time The string to convert
	 * @return {int} The amount of minutes since midnight
	 */
	static TimeToMinutes(time) {
		const parts = time.split(":").map(p => parseInt(p));
		return parts[0] * 60 + parts[1];
	}

	/**
	 * Converts an amount of minutes since midnight into time string like "12:00".
	 * This is the revert operation of TimeToMinutes.
	 * @param {int} minutes The amount of minutes since midnight
	 * @return {string} The corresponding hour, in format HH:MM
	 */
	static MinutesToTime(minutes) {
		const twoDigits = v => v < 10 ? "0"+v.toString() : v.toString();
		return twoDigits(Math.floor(minutes / 60).toFixed(0)) + ":" + twoDigits(minutes % 60);
	}


	/**
	 * Get as OSM opening_hours value
	 * @return {string} The OSM tag value
	 */
	getValue() {
		return this._ohValue;
	}
}

module.exports = OpeningHoursBuilder;
