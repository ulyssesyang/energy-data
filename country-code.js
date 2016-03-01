'use strict';

const db = require('mongojs')('mongodb://localhost:27017/energy-data', [ 'series' ])
const async = require('async')
const lookup = require('country-code-lookup');

db.series.ensureIndex({ country_name: 1 }, { background: true })

async.waterfall([
	($next) => {
		db.series.distinct('country', {}, (error, arr) => {
			$next(error, arr);
		});
	}, 
	(codes, $next) => {
		async.each(codes, (code, next) => {
			try {
				let country = lookup.byIso(code);
				if (!country)
					return next();
				let country_name = country.country;
				setImmediate(() => {
					db.series.update({
						country: [
							code
						]
					}, {
						$addToSet: {
							country_name: country_name
						}
					}, { 
						multi: true
					}, (error, up) => {
						console.log(error, up)
						next();
					});
				});
			} catch (e) {
				setImmediate(() => {
					next()
				});
			}
		}, $next)
	}
], (error) => {
	if (error)
		console.error(error.message)
})