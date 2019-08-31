const OpeningHoursBuilder = require("./OpeningHoursBuilder");

describe("OpeningHoursBuilder", () => {
	describe("constructor", () => {
		it("works with multiple days & hours period", () => {
			const periods = [
				{ days: ["mo","we"], hours: [ "08:00-15:00", "18:00-22:00" ] }
			];
			const expected = "Mo,We 08:00-15:00,18:00-22:00";

			const result = (new OpeningHoursBuilder(periods)).getValue();
			expect(result).toStrictEqual(expected);
		});

		it("works with several periods", () => {
			const periods = [
				{ days: ["mo","we"], hours: [ "08:00-15:00", "18:00-22:00" ] },
				{ days: ["tu","fr"], hours: [ "03:00-10:00", "15:00-23:00" ] }
			];
			const expected = "Mo,We 08:00-15:00,18:00-22:00; Tu,Fr 03:00-10:00,15:00-23:00";

			const result = (new OpeningHoursBuilder(periods)).getValue();
			expect(result).toStrictEqual(expected);
		});

		it("merges days having same hours", () => {
			const periods = [
				{ days: ["mo","tu","we"], hours: [ "12:00-15:00","15:00-17:00" ] },
				{ days: ["sa","su"], hours: [ "12:00-17:00" ] }
			];
			const expected = "Mo-We,Sa,Su 12:00-17:00";

			const result = (new OpeningHoursBuilder(periods)).getValue();
			expect(result).toStrictEqual(expected);
		});

		it("detects 24/7 case", () => {
			const periods = [
				{ days: ["mo","tu","we","th","fr"], hours: [ "00:00-12:00","12:00-24:00" ] },
				{ days: ["sa","su","ph"], hours: [ "00:00-15:00","15:00-24:00" ] }
			];
			const expected = "24/7";

			const result = (new OpeningHoursBuilder(periods)).getValue();
			expect(result).toStrictEqual(expected);
		});

		it("detects 24/7 case but doesn't simplify if explicitPH true", () => {
			const periods = [
				{ days: ["mo","tu","we","th","fr"], hours: [ "00:00-12:00","12:00-24:00" ] },
				{ days: ["sa","su","ph"], hours: [ "00:00-15:00","15:00-24:00" ] }
			];
			const expected = "Mo-Su,PH 00:00-24:00";

			const result = (new OpeningHoursBuilder(periods, {explicitPH: true})).getValue();
			expect(result).toStrictEqual(expected);
		});

		it("doesn't transform into 24/7 if PH off and explicitPH option true", () => {
			const periods = [
				{ days: ["mo","tu","we","th","fr"], hours: [ "00:00-12:00","12:00-24:00" ] },
				{ days: ["sa","su"], hours: [ "00:00-15:00","15:00-24:00" ] }
			];
			const expected = "Mo-Su 00:00-24:00; PH off";

			const result = (new OpeningHoursBuilder(periods, {explicitPH: true})).getValue();
			expect(result).toStrictEqual(expected);
		});

		it("doesn't transform into 24/7 if PH off and no option set", () => {
			const periods = [
				{ days: ["mo","tu","we","th","fr"], hours: [ "00:00-12:00","12:00-24:00" ] },
				{ days: ["sa","su"], hours: [ "00:00-15:00","15:00-24:00" ] }
			];
			const expected = "Mo-Su 00:00-24:00";

			const result = (new OpeningHoursBuilder(periods)).getValue();
			expect(result).toStrictEqual(expected);
		});
	});

	describe("IsPeriodValid", () => {
		it("works with valid period", () => {
			const period = { days: [ "mo", "tu" ], hours: [ "08:00-10:00" ] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeTruthy();
		});

		it("detects invalid hours", () => {
			const period = { days: [ "mo", "tu" ], hours: [ "08:000:00" ] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeFalsy();
		});

		it("detects empty hours array", () => {
			const period = { days: [ "mo", "tu" ], hours: [] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeFalsy();
		});

		it("detects missing hours", () => {
			const period = { days: [ "mo", "tu" ] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeFalsy();
		});

		it("detects missing days", () => {
			const period = { hours: [ "08:00-10:00" ] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeFalsy();
		});

		it("detects invalid days", () => {
			const period = { days: [ "monday", "tu" ], hours: [ "08:00-10:00" ] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeFalsy();
		});

		it("detects empty days", () => {
			const period = { days: [], hours: [ "08:00-10:00" ] };
			const result = OpeningHoursBuilder.IsPeriodValid(period);
			expect(result).toBeFalsy();
		});
	});

	describe("DaysToOH", () => {
		it("works with single day", () => {
			const days = ["mo"];
			const expected = "Mo";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("works with multiple days & single hour period", () => {
			const days = ["mo","we"];
			const expected = "Mo,We";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("merges following days", () => {
			const days = ["mo","tu","we","th"];
			const expected = "Mo-Th";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("merges following days, keeping separate not following ones", () => {
			const days = ["mo","we","th","fr","su"];
			const expected = "Mo,We-Fr,Su";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("works if days are not sorted", () => {
			const days = ["we","mo","th","tu"];
			const expected = "Mo-Th";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("simplifies all days set", () => {
			const days = ["mo","tu","we","th","fr","sa","su","ph"];
			const expected = "Mo-Su,PH";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("merges all days in week", () => {
			const days = ["mo","tu","we","th","fr","sa","su"];
			const expected = "Mo-Su";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});

		it("removes duplicates", () => {
			const days = ["mo","mo","tu","tu","we","tu","we","sa"];
			const expected = "Mo-We,Sa";

			const result = OpeningHoursBuilder.DaysToOH(days);
			expect(result).toStrictEqual(expected);
		});
	});

	describe("HoursToOH", () => {
		it("works with single hour period", () => {
			const hours = [ "08:00-15:00" ];
			const expected = "08:00-15:00";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("works with single day & multiple hours period", () => {
			const hours = [ "08:00-15:00", "18:00-22:00" ];
			const expected = "08:00-15:00,18:00-22:00";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("merges following hour ranges", () => {
			const hours = [ "00:00-10:00", "10:00-15:00" ];
			const expected = "00:00-15:00";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("merges overlapping hour ranges", () => {
			const hours = [ "00:00-10:00", "09:30-15:00" ];
			const expected = "00:00-15:00";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("merges overlapping hour ranges going after midnight", () => {
			const hours = [ "18:30-01:30", "15:00-19:00" ];
			const expected = "15:00-01:30";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("merges hour ranges included in another one", () => {
			const hours = [ "12:00-15:00", "13:00-13:30" ];
			const expected = "12:00-15:00";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("works with unsorted time ranges", () => {
			const hours = [ "15:30-17:25", "03:59-06:07", "12:50-23:59" ];
			const expected = "03:59-06:07,12:50-23:59";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});

		it("handles duplicates", () => {
			const hours = [ "00:00-01:00", "00:00-01:00" ];
			const expected = "00:00-01:00";

			const result = OpeningHoursBuilder.HoursToOH(hours);
			expect(result).toStrictEqual(expected);
		});
	});

	describe("TimeToMinutes", () => {
		it("works", () => {
			const time = "13:37";
			const expected = 817;
			const result = OpeningHoursBuilder.TimeToMinutes(time);
			expect(result).toStrictEqual(expected);
		});
	});

	describe("MinutesToTime", () => {
		it("works", () => {
			const minutes = 1439;
			const expected = "23:59";
			const result = OpeningHoursBuilder.MinutesToTime(minutes);
			expect(result).toStrictEqual(expected);
		});

		it("shows correctly small values", () => {
			const minutes = 5;
			const expected = "00:05";
			const result = OpeningHoursBuilder.MinutesToTime(minutes);
			expect(result).toStrictEqual(expected);
		});
	});
});
