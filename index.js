'use strict';
const mongojs = require('mongojs');
const lineReader = require('line-reader');
const async = require('async');
const lookup = require('country-code-lookup');
const db = mongojs('mongodb://localhost:27017/energy-data', [ 'series' ]);
var index = 0;

db.series.ensureIndex({ value: 1 });
db.series.ensureIndex({ name: 1, value: 1 });
db.series.ensureIndex({ year: 1 });
db.series.ensureIndex({ country: 1 });

lineReader.eachLine(`${__dirname}/INTL.txt`, function (line, last, callback) {
	var original_series = JSON.parse(line);
	async.each(original_series.data, (year, next) => {
		let country_name = original_series.geography
			.split('+')
			.map((country_code) => {
				try {
					return lookup.byIso(country_code).country
				} catch (E) {
					return null;
				}
			})
			.filter(Boolean)
			.map((country) => {
				return country
					.replace("Myanmar (Burma)", 'Myanmar')
					.replace('Falkland Islands (Islas Malvinas)', 'Falkland Islands (Malvinas)')
					.replace('Zaire (Dem Rep of Congo)', 'Zaire')
					.replace(/\s(China)/ig, '');
			});
		let series = {
			_id: original_series.series_id,
			name: original_series.name,
			year: new Date(year[0]),
			value: year[1],
			country: original_series.geography.split('+'),
			country_name: country_name,
			unit: original_series.units
		};

		db.series.save(series, (error) => {
			console.log(`saved record ${series._id}`);
			next(error);
		});
	}, (error) => {
		callback(error);
	});
});	