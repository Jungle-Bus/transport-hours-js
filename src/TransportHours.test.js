const TransportHours = require('./TransportHours');

describe("TransportHours", () => {
	const th = new TransportHours();
	
	describe("intervalStringToMinutes", () => {
		it("handles hh:mm:ss format 1", () => {
			const interval = "01:00:00";
			const result = th.intervalStringToMinutes(interval);
			const expected = 60;
			expect(result).toBe(expected);
		});
		
		it("handles hh:mm:ss format 2", () => {
			const interval = "01:30:00";
			const result = th.intervalStringToMinutes(interval);
			const expected = 90;
			expect(result).toBe(expected);
		});
		
		it("handles hh:mm:ss format 3", () => {
			const interval = "02:45:30";
			const result = th.intervalStringToMinutes(interval);
			const expected = 165.5;
			expect(result).toBe(expected);
		});
		
		it("handles hh:mm format 1", () => {
			const interval = "01:00";
			const result = th.intervalStringToMinutes(interval);
			const expected = 60;
			expect(result).toBe(expected);
		});
		
		it("handles hh:mm format 2", () => {
			const interval = "03:12";
			const result = th.intervalStringToMinutes(interval);
			const expected = 192;
			expect(result).toBe(expected);
		});
		
		it("handles mm format 1", () => {
			const interval = "15";
			const result = th.intervalStringToMinutes(interval);
			const expected = 15;
			expect(result).toBe(expected);
		});
		
		it("handles mm format 2", () => {
			const interval = "135";
			const result = th.intervalStringToMinutes(interval);
			const expected = 135;
			expect(result).toBe(expected);
		});
		
		it("throw error if format not recognized", () => {
			const interval = "12 minutes";
			const result = () => th.intervalStringToMinutes(interval);
			expect(result).toThrow(new Error("Interval value can't be parsed : 12 minutes"));
		});
	});
	
	describe("minutesToIntervalString", () => {
		it("handles less than an hour", () => {
			const mins = 35;
			const result = th.minutesToIntervalString(mins);
			const expected = "00:35:00";
			expect(result).toBe(expected);
		});
		
		it("handles more than an hour", () => {
			const mins = 135;
			const result = th.minutesToIntervalString(mins);
			const expected = "02:15:00";
			expect(result).toBe(expected);
		});
		
		it("handles seconds", () => {
			const mins = 135.5;
			const result = th.minutesToIntervalString(mins);
			const expected = "02:15:30";
			expect(result).toBe(expected);
		});
		
		it("handles not-round seconds", () => {
			const mins = 0.21;
			const result = th.minutesToIntervalString(mins);
			const expected = "00:00:13";
			expect(result).toBe(expected);
		});
	});
});
