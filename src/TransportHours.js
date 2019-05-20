/**
 * TransportHours is the main class of the library.
 * It contains all main functions which can help managing public transport hours.
 */
class TransportHours {
	/**
	 * Converts an interval=* string into an amount of minutes
	 * @param {string} interval The {@link https://wiki.openstreetmap.org/wiki/Key:interval|interval string}
	 * @return {number} The amount of minutes (can be a decimal values if seconds are used)
	 * @throws {Error} If interval is invalid
	 */
	intervalStringToMinutes(interval) {
		interval = interval.trim();
		
		// hh:mm:ss
		if(/^\d{2}:\d{2}:\d{2}$/.test(interval)) {
			const parts = interval.split(":").map(t => parseInt(t));
			return parts[0] * 60 + parts[1] + parts[2] / 60;
		}
		// hh:mm
		else if(/^\d{2}:\d{2}$/.test(interval)) {
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
