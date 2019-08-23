const TransportHours = require('./TransportHours');
const fs = require('fs');

describe("TransportHours", () => {
	const th = new TransportHours();

	describe("tagsToHoursObject", () => {
		it("handles all tags set", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42",
				opening_hours: "Mo-Fr 05:00-22:00",
				interval: "00:30",
				"interval:conditional": "00:10 @ (Mo-Fr 07:00-09:30, 16:30-19:00)"
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: {
					"mo": ["05:00-22:00"],
					"tu": ["05:00-22:00"],
					"we": ["05:00-22:00"],
					"th": ["05:00-22:00"],
					"fr": ["05:00-22:00"],
					"sa": [],
					"su": [],
					"ph": []
				},
				defaultInterval: 30,
				otherIntervals: [
					{
						interval: 10,
						applies: {
							"mo": ["07:00-09:30", "16:30-19:00"],
							"tu": ["07:00-09:30", "16:30-19:00"],
							"we": ["07:00-09:30", "16:30-19:00"],
							"th": ["07:00-09:30", "16:30-19:00"],
							"fr": ["07:00-09:30", "16:30-19:00"],
							"sa": [],
							"su": [],
							"ph": []
						}
					}
				],
				otherIntervalsByDays: [
					{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "07:00-09:30": 10, "16:30-19:00": 10 } }
				],
				allComputedIntervals: [
					{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "05:00-07:00": 30, "07:00-09:30": 10, "09:30-16:30": 30, "16:30-19:00": 10, "19:00-22:00": 30 } }
				]
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles no interval:conditional tag", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42",
				opening_hours: "Mo-Fr 05:00-22:00",
				interval: "00:30"
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: {
					"mo": ["05:00-22:00"],
					"tu": ["05:00-22:00"],
					"we": ["05:00-22:00"],
					"th": ["05:00-22:00"],
					"fr": ["05:00-22:00"],
					"sa": [],
					"su": [],
					"ph": []
				},
				defaultInterval: 30,
				otherIntervals: "unset",
				otherIntervalsByDays: "unset",
				allComputedIntervals: [
					{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "05:00-22:00": 30 } }
				]
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles no opening_hours tag", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42",
				interval: "00:30"
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: "unset",
				defaultInterval: 30,
				otherIntervals: "unset",
				otherIntervalsByDays: "unset",
				allComputedIntervals: [
					{ days: [ "mo", "tu", "we", "th", "fr", "sa", "su", "ph" ], intervals: { "00:00-24:00": 30 } }
				]
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles case where all tags are missing", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42"
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: "unset",
				defaultInterval: "unset",
				otherIntervals: "unset",
				otherIntervalsByDays: "unset",
				allComputedIntervals: "unset"
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles opening_hours being invalid", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42",
				opening_hours: "what ?",
				interval: "00:30"
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: "invalid",
				defaultInterval: 30,
				otherIntervals: "unset",
				otherIntervalsByDays: "unset",
				allComputedIntervals: "invalid"
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles interval being invalid", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42",
				interval: "12 minutes is so long to wait for a bus..."
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: "unset",
				defaultInterval: "invalid",
				otherIntervals: "unset",
				otherIntervalsByDays: "unset",
				allComputedIntervals: "invalid"
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles interval:conditional being invalid", () => {
			const tags = {
				type: "route",
				route: "bus",
				name: "Ligne 42",
				interval: "00:30",
				"interval:conditional": "12 @ random hours"
			};
			const result = th.tagsToHoursObject(tags);
			const expected = {
				opens: "unset",
				defaultInterval: 30,
				otherIntervals: "invalid",
				otherIntervalsByDays: "invalid",
				allComputedIntervals: "invalid"
			};
			expect(result).toStrictEqual(expected);
		});
	});

	describe("intervalsObjectToTags", () => {
		it("works with constant interval and single day", () => {
			const intervals = [
				{ days: [ "mo" ], intervals: { "03:00-22:00": 10 } }
			];

			const expected = {
				"opening_hours": "Mo 03:00-22:00",
				"interval": "10"
			};

			const result = th.intervalsObjectToTags(intervals);
			expect(result).toStrictEqual(expected);
		});

		it("works with two intervals and single day", () => {
			const intervals = [
				{ days: [ "mo" ], intervals: { "05:00-07:00": 30, "07:00-10:00": 15, "10:00-16:00": 30, "16:00-19:00": 15, "19:00-23:00": 30 } }
			];

			const expected = {
				"opening_hours": "Mo 05:00-23:00",
				"interval": "30",
				"interval:conditional": "15 @ (Mo 07:00-10:00,16:00-19:00)"
			};

			const result = th.intervalsObjectToTags(intervals);
			expect(result).toStrictEqual(expected);
		});

		it("works two intervals and several days", () => {
			const intervals = [
				{ days: [ "mo", "tu" ], intervals: { "05:00-07:00": 30, "07:00-10:00": 15, "10:00-16:00": 30, "16:00-19:00": 15, "19:00-23:00": 30 } },
				{ days: [ "we" ], intervals: { "04:00-06:30": 30, "06:30-11:00": 15, "11:00-16:15": 30, "16:15-19:00": 15, "19:00-23:00": 30 } }
			];

			const expected = {
				"opening_hours": "Mo,Tu 05:00-23:00; We 04:00-23:00",
				"interval": "30",
				"interval:conditional": "15 @ (Mo,Tu 07:00-10:00,16:00-19:00; We 06:30-11:00,16:15-19:00)"
			};

			const result = th.intervalsObjectToTags(intervals);
			expect(result).toStrictEqual(expected);
		});
	});

	describe("_timerangeDuration", () => {
		it("works with basic timerange", () => {
			const timerange = "10:00-11:25";
			const expected = 85;
			const result = th._timerangeDuration(timerange);
			expect(result).toStrictEqual(expected);
		});

		it("handles timeranges going after midnight", () => {
			const timerange = "23:30-01:10";
			const expected = 100;
			const result = th._timerangeDuration(timerange);
			expect(result).toStrictEqual(expected);
		});
	});

	describe("intervalConditionalStringToObject", () => {
		it("handles standard tag", () => {
			const intervalCond = "00:05 @ (Mo-Fr 07:00-10:00); 00:10 @ (Mo-Fr 16:30-19:00); 00:30 @ (Mo-Su 22:00-05:00)";
			const result = th.intervalConditionalStringToObject(intervalCond);
			const expected = [
				{
					interval: 5,
					applies: {
						"mo": ["07:00-10:00"],
						"tu": ["07:00-10:00"],
						"we": ["07:00-10:00"],
						"th": ["07:00-10:00"],
						"fr": ["07:00-10:00"],
						"sa": [],
						"su": [],
						"ph": []
					}
				},
				{
					interval: 10,
					applies: {
						"mo": ["16:30-19:00"],
						"tu": ["16:30-19:00"],
						"we": ["16:30-19:00"],
						"th": ["16:30-19:00"],
						"fr": ["16:30-19:00"],
						"sa": [],
						"su": [],
						"ph": []
					}
				},
				{
					interval: 30,
					applies: {
						"mo": ["22:00-05:00"],
						"tu": ["22:00-05:00"],
						"we": ["22:00-05:00"],
						"th": ["22:00-05:00"],
						"fr": ["22:00-05:00"],
						"sa": ["22:00-05:00"],
						"su": ["22:00-05:00"],
						"ph": []
					}
				},
			];
			expect(result).toStrictEqual(expected);
		});

		it("handles 95% of existing values in OSM database", done => {
			fs.readFile('res/interval_conditional.txt', 'utf8', (err, data) => {
				if(err) {
					throw err;
				}
				else {
					// Read data
					const values = data.split("\n").filter(d => d.trim() !== "");
					const total = values.length;
					let working = 0;

					values.forEach(value => {
						try {
							th.intervalConditionalStringToObject(value);
							working++;
						}
						catch(e) {
// 							console.log("Skipping", value, e.message);
						}
					});

					expect(working).toBeGreaterThan(total*0.80);
					done();
				}
			});
		});
	});

	describe("_computeAllIntervals", () => {
		it("works with all data set", () => {
			const interval = 10;
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:00-22:00"],
				"we": ["05:00-22:00"],
				"th": ["05:00-22:00"],
				"fr": ["05:00-22:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "05:00-08:00": 10, "08:00-10:00": 5, "10:00-16:30": 10, "16:30-18:30": 5, "18:30-22:00": 10 } },
				{ days: [ "sa" ], intervals: { "07:00-11:00": 10, "11:00-13:00": 6, "13:00-23:00": 10 } }
			];

			expect(result).toStrictEqual(expected);
		});

		it("works with all data set and certain days not having conditional intervals", () => {
			const interval = 10;
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:00-22:00"],
				"we": ["05:00-22:00"],
				"th": ["05:00-22:00"],
				"fr": ["05:00-22:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = [
				{ days: [ "mo", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = [
				{ days: [ "mo", "fr" ], intervals: { "05:00-08:00": 10, "08:00-10:00": 5, "10:00-16:30": 10, "16:30-18:30": 5, "18:30-22:00": 10 } },
				{ days: [ "tu", "we", "th" ], intervals: { "05:00-22:00": 10 } },
				{ days: [ "sa" ], intervals: { "07:00-11:00": 10, "11:00-13:00": 6, "13:00-23:00": 10 } }
			];

			expect(result).toStrictEqual(expected);
		});

		it("works with varying opening hours but same conditional interval", () => {
			const interval = 10;
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:30-22:30"],
				"we": ["05:00-22:00"],
				"th": ["05:30-22:30"],
				"fr": ["05:00-22:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = [
				{ days: [ "mo", "we", "fr" ], intervals: { "05:00-08:00": 10, "08:00-10:00": 5, "10:00-16:30": 10, "16:30-18:30": 5, "18:30-22:00": 10 } },
				{ days: [ "tu", "th" ], intervals: { "05:30-08:00": 10, "08:00-10:00": 5, "10:00-16:30": 10, "16:30-18:30": 5, "18:30-22:30": 10 } },
				{ days: [ "sa" ], intervals: { "07:00-11:00": 10, "11:00-13:00": 6, "13:00-23:00": 10 } }
			];

			expect(result).toStrictEqual(expected);
		});

		it("works if no interval conditional is defined", () => {
			const interval = 10;
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:00-22:00"],
				"we": ["05:00-22:00"],
				"th": ["05:00-22:00"],
				"fr": ["05:00-22:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = "unset";
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "05:00-22:00": 10 } },
				{ days: [ "sa" ], intervals: { "07:00-23:00": 10 } }
			];

			expect(result).toStrictEqual(expected);
		});

		it("fails if interval conditional is invalid", () => {
			const interval = 10;
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:00-22:00"],
				"we": ["05:00-22:00"],
				"th": ["05:00-22:00"],
				"fr": ["05:00-22:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = "invalid";
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = "invalid";

			expect(result).toStrictEqual(expected);
		});

		it("works if opening_hours is unset", () => {
			const interval = 10;
			const openingHours = "unset";
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "00:00-08:00": 10, "08:00-10:00": 5, "10:00-16:30": 10, "16:30-18:30": 5, "18:30-24:00": 10 } },
				{ days: [ "sa" ], intervals: { "00:00-11:00": 10, "11:00-13:00": 6, "13:00-24:00": 10 } },
				{ days: [ "su", "ph" ], intervals: { "00:00-24:00": 10 } }
			];

			expect(result).toStrictEqual(expected);
		});

		it("returns only conditional intervals if opening_hours is invalid", () => {
			const interval = 10;
			const openingHours = "invalid";
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = intervalCondByDay;

			expect(result).toStrictEqual(expected);
		});

		it("returns only conditional intervals if interval is unset", () => {
			const interval = "unset";
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:00-22:00"],
				"we": ["05:00-22:00"],
				"th": ["05:00-22:00"],
				"fr": ["05:00-22:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = intervalCondByDay;

			expect(result).toStrictEqual(expected);
		});

		it("handles cases where opening_hours are not covering all conditional intervals", () => {
			const interval = 10;
			const openingHours = {
				"mo": ["05:00-12:00"],
				"tu": ["05:00-12:00"],
				"we": ["05:00-12:00"],
				"th": ["05:00-12:00"],
				"fr": ["05:00-12:00"],
				"sa": ["07:00-23:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "08:00-10:00": 5, "16:30-18:30": 5 } },
				{ days: [ "sa" ], intervals: { "11:00-13:00": 6 } }
			];
			const result = () => th._computeAllIntervals(openingHours, interval, intervalCondByDay);
			expect(result).toThrow(new Error("Conditional intervals are not contained in opening hours"));
		});

		it("handles conditional intervals start/end overlapping opening hours", () => {
			const interval = 30;
			const openingHours = {
				"mo": ["05:00-22:00"],
				"tu": ["05:00-22:00"],
				"we": ["05:00-22:00"],
				"th": ["05:00-22:00"],
				"fr": ["05:00-22:00"],
				"sa": ["05:00-22:00"],
				"su": [],
				"ph": []
			};
			const intervalCondByDay = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "05:00-09:00": 15, "16:00-20:00": 15 } },
				{ days: [ "sa" ], intervals: { "05:00-10:00": 60, "20:00-22:00": 60 } }
			];
			const result = th._computeAllIntervals(openingHours, interval, intervalCondByDay);

			const expected = [
				{ days: [ "mo", "tu", "we", "th", "fr" ], intervals: { "05:00-09:00": 15, "09:00-16:00": 30, "16:00-20:00": 15, "20:00-22:00": 30 } },
				{ days: [ "sa" ], intervals: { "05:00-10:00": 60, "10:00-20:00": 30, "20:00-22:00": 60 } }
			];

			expect(result).toStrictEqual(expected);
		});
	});

	describe("_mergeIntervalsSingleDay", () => {
		it("works with one hour range in opening hours", () => {
			const ohRanges = ["03:00-22:30"];
			const interval = 10;
			const condIntervals = { "07:00-09:30": 5, "18:00-20:25": 4 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = { "03:00-07:00": 10, "07:00-09:30": 5, "09:30-18:00": 10, "18:00-20:25": 4, "20:25-22:30": 10 };

			expect(result).toStrictEqual(expected);
		});

		it("works with multiple hour ranges in opening hours", () => {
			const ohRanges = ["03:00-12:00", "15:00-23:50"];
			const interval = 10;
			const condIntervals = { "07:00-09:30": 5, "18:00-20:25": 4 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = { "03:00-07:00": 10, "07:00-09:30": 5, "09:30-12:00": 10, "15:00-18:00": 10, "18:00-20:25": 4, "20:25-23:50": 10 };

			expect(result).toStrictEqual(expected);
		});

		it("fails with opening hours not covering conditional intervals", () => {
			const ohRanges = ["03:00-15:15"];
			const interval = 10;
			const condIntervals = { "07:00-09:30": 5, "18:00-20:25": 4 };

			const result = () => th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			expect(result).toThrow(new Error("Conditional intervals are not contained in opening hours"));
		});

		it("fails with multiple hour ranges in opening hours and not covering conditional intervals", () => {
			const ohRanges = ["03:00-12:00", "15:00-20:00"];
			const interval = 10;
			const condIntervals = { "01:00-04:00": 12, "11:30-12:30": 5, "14:00-16:00": 4, "19:00-22:00": 3 };

			const result = () => th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			expect(result).toThrow(new Error("Conditional intervals are not contained in opening hours"));
		});

		it("works with opening hours being equal to conditional intervals", () => {
			const ohRanges = ["07:00-09:30", "18:00-20:25"];
			const interval = 10;
			const condIntervals = { "07:00-09:30": 5, "18:00-20:25": 4 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = condIntervals;

			expect(result).toStrictEqual(expected);
		});

		it("works with conditional interval overlapping start opening hours", () => {
			const ohRanges = ["05:00-22:00"];
			const interval = 30;
			const condIntervals = { "05:00-09:00": 15, "16:00-20:00": 15 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = { "05:00-09:00": 15, "09:00-16:00": 30, "16:00-20:00": 15, "20:00-22:00": 30 };

			expect(result).toStrictEqual(expected);
		});

		it("works with conditional interval overlapping end opening hours", () => {
			const ohRanges = ["05:00-22:00"];
			const interval = 30;
			const condIntervals = { "05:30-09:00": 15, "16:00-22:00": 15 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = { "05:00-05:30": 30, "05:30-09:00": 15, "09:00-16:00": 30, "16:00-22:00": 15 };

			expect(result).toStrictEqual(expected);
		});

		it("works with conditional interval overlapping start/end opening hours", () => {
			const ohRanges = ["05:00-22:00"];
			const interval = 30;
			const condIntervals = { "05:00-09:00": 15, "16:00-22:00": 15 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = { "05:00-09:00": 15, "09:00-16:00": 30, "16:00-22:00": 15 };

			expect(result).toStrictEqual(expected);
		});

		it("works with conditional interval overlapping start/end opening hours 2", () => {
			const ohRanges = ["05:00-22:00"];
			const interval = 30;
			const condIntervals = { "05:00-09:00": 15 };

			const result = th._mergeIntervalsSingleDay(ohRanges, interval, condIntervals);
			const expected = { "05:00-09:00": 15, "09:00-22:00": 30 };

			expect(result).toStrictEqual(expected);
		});
	});

	describe("_intervalConditionObjectToIntervalByDays", () => {
		it("works with distinct days", () => {
			const intvObj = [
				{ interval: 10, applies: { mo: [ "00:00-01:00" ], tu: [ "01:00-02:00" ], we: [ "02:00-03:00" ], th: [], fr: [], sa: [], su: [], ph: [] } },
				{ interval: 20, applies: { mo: [], tu: [], we: [], th: [], fr: [], sa: [ "05:00-07:00" ], su: [], ph: [] } }
			];
			const result = th._intervalConditionObjectToIntervalByDays(intvObj);
			const expected = [
				{ days: [ "mo" ], intervals: { "00:00-01:00": 10 } },
				{ days: [ "tu" ], intervals: { "01:00-02:00": 10 } },
				{ days: [ "we" ], intervals: { "02:00-03:00": 10 } },
				{ days: [ "sa" ], intervals: { "05:00-07:00": 20 } }
			];
			expect(result).toStrictEqual(expected);
		});

		it("merges equal days", () => {
			const intvObj = [
				{ interval: 10, applies: { mo: [ "00:00-01:00" ], tu: [ "00:00-01:00" ], we: [ "00:00-01:00" ], th: [], fr: [], sa: [], su: [], ph: [] } },
				{ interval: 20, applies: { mo: [], tu: [], we: [], th: [], fr: [], sa: [ "05:00-07:00" ], su: [], ph: [] } }
			];
			const result = th._intervalConditionObjectToIntervalByDays(intvObj);
			const expected = [
				{ days: [ "mo", "tu", "we" ], intervals: { "00:00-01:00": 10 } },
				{ days: [ "sa" ], intervals: { "05:00-07:00": 20 } }
			];
			expect(result).toStrictEqual(expected);
		});

		it("distinguish partially equal days", () => {
			const intvObj = [
				{ interval: 10, applies: { mo: [ "00:00-01:00" ], tu: [ "00:00-01:00", "05:00-07:00" ], we: [ "00:00-01:00" ], th: [], fr: [], sa: [], su: [], ph: [] } },
				{ interval: 20, applies: { mo: [], tu: [], we: [], th: [], fr: [], sa: [ "05:00-07:00" ], su: [], ph: [] } }
			];
			const result = th._intervalConditionObjectToIntervalByDays(intvObj);
			const expected = [
				{ days: [ "mo", "we" ], intervals: { "00:00-01:00": 10 } },
				{ days: [ "tu" ], intervals: { "00:00-01:00": 10, "05:00-07:00": 10 } },
				{ days: [ "sa" ], intervals: { "05:00-07:00": 20 } }
			];
			expect(result).toStrictEqual(expected);
		});
	});

	describe("_splitMultipleIntervalConditionalString", () => {
		it("handles strings without semicolons in opening hours part", () => {
			const intervalCond = "00:05 @ (Mo-Fr 07:00-10:00); 00:05 @ (Mo-Fr 16:30-19:00); 00:30 @ (Mo-Su 22:00-05:00)";
			const result = th._splitMultipleIntervalConditionalString(intervalCond);
			const expected = ["00:05 @ (Mo-Fr 07:00-10:00)","00:05 @ (Mo-Fr 16:30-19:00)","00:30 @ (Mo-Su 22:00-05:00)"];
			expect(result).toStrictEqual(expected);
		});

		it("handles strings with semicolons in opening hours part", () => {
			const intervalCond = "00:05 @ (Mo-Fr 07:00-10:00 ; Su 16:30-19:00) ; 00:30 @ (Mo-Su 22:00-05:00)";
			const result = th._splitMultipleIntervalConditionalString(intervalCond);
			const expected = ["00:05 @ (Mo-Fr 07:00-10:00 ; Su 16:30-19:00)","00:30 @ (Mo-Su 22:00-05:00)"];
			expect(result).toStrictEqual(expected);
		});
	});

	describe("_readSingleIntervalConditionalString", () => {
		it("handles basic syntax", () => {
			const intervalCond = "00:10 @ (Sa-Su 06:00-22:00)";
			const result = th._readSingleIntervalConditionalString(intervalCond);
			const expected = {
				interval: 10,
				applies: {
					"mo": [],
					"tu": [],
					"we": [],
					"th": [],
					"fr": [],
					"sa": ["06:00-22:00"],
					"su": ["06:00-22:00"],
					"ph": []
				}
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles opening hours not being surrounded by quotes", () => {
			const intervalCond = "15 @ Mo 06:00-22:00";
			const result = th._readSingleIntervalConditionalString(intervalCond);
			const expected = {
				interval: 15,
				applies: {
					"mo": ["06:00-22:00"],
					"tu": [],
					"we": [],
					"th": [],
					"fr": [],
					"sa": [],
					"su": [],
					"ph": []
				}
			};
			expect(result).toStrictEqual(expected);
		});

		it("handles lack of spaces between parts", () => {
			const intervalCond = "15@Mo 06:00-22:00";
			const result = th._readSingleIntervalConditionalString(intervalCond);
			const expected = {
				interval: 15,
				applies: {
					"mo": ["06:00-22:00"],
					"tu": [],
					"we": [],
					"th": [],
					"fr": [],
					"sa": [],
					"su": [],
					"ph": []
				}
			};
			expect(result).toStrictEqual(expected);
		});
	});

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

		it("handles h:mm", () => {
			const interval = "3:10";
			const result = th.intervalStringToMinutes(interval);
			const expected = 190;
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
