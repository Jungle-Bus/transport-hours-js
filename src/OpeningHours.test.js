const OpeningHours = require("./OpeningHours");

describe("OpeningHours", () => {
	describe("constructor", () => {
		it("handles hours", () => {
			const value = "10:00-12:00";
			const oh = new OpeningHours(value);
			const result = oh.getTable();
			const expected = {
				mo: ["10:00-12:00"],
				tu: ["10:00-12:00"],
				we: ["10:00-12:00"],
				th: ["10:00-12:00"],
				fr: ["10:00-12:00"],
				sa: ["10:00-12:00"],
				su: ["10:00-12:00"],
				ph: ["10:00-12:00"]
			};
			expect(result).toEqual(expected);
		});
		
		it("handles day + hours", () => {
			const value = "Mo 10:00-12:00";
			const oh = new OpeningHours(value);
			const result = oh.getTable();
			const expected = {
				mo: ["10:00-12:00"],
				tu: [],
				we: [],
				th: [],
				fr: [],
				sa: [],
				su: [],
				ph: []
			};
			expect(result).toEqual(expected);
		});
		
		it("handles days range + hours", () => {
			const value = "Mo-We 10:00-12:00";
			const oh = new OpeningHours(value);
			const result = oh.getTable();
			const expected = {
				mo: ["10:00-12:00"],
				tu: ["10:00-12:00"],
				we: ["10:00-12:00"],
				th: [],
				fr: [],
				sa: [],
				su: [],
				ph: []
			};
			expect(result).toEqual(expected);
		});
		
		it("handles days list + hours", () => {
			const value = "Mo,We 10:00-12:00";
			const oh = new OpeningHours(value);
			const result = oh.getTable();
			const expected = {
				mo: ["10:00-12:00"],
				tu: [],
				we: ["10:00-12:00"],
				th: [],
				fr: [],
				sa: [],
				su: [],
				ph: []
			};
			expect(result).toEqual(expected);
		});
		
		it("handles days + different hours", () => {
			const value = "Mo-We 10:00-12:00; Th-Sa 09:00-15:00";
			const oh = new OpeningHours(value);
			const result = oh.getTable();
			const expected = {
				mo: ["10:00-12:00"],
				tu: ["10:00-12:00"],
				we: ["10:00-12:00"],
				th: ["09:00-15:00"],
				fr: ["09:00-15:00"],
				sa: ["09:00-15:00"],
				su: [],
				ph: []
			};
			expect(result).toEqual(expected);
		});
		
		it("handles several hours ranges for same day", () => {
			const value = "Mo-We 10:00-12:00, 17:00-19:00";
			const oh = new OpeningHours(value);
			const result = oh.getTable();
			const expected = {
				mo: ["10:00-12:00", "17:00-19:00"],
				tu: ["10:00-12:00", "17:00-19:00"],
				we: ["10:00-12:00", "17:00-19:00"],
				th: [],
				fr: [],
				sa: [],
				su: [],
				ph: []
			};
			expect(result).toEqual(expected);
		});
		
		it("throws an error if value can't be handled", () => {
			const value = "This is not opening_hours !";
			const result = () => (new OpeningHours(value));
			expect(result).toThrow(new Error("Can't parse opening_hours : "+value));
		});
	});
});
