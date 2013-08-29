/**
 * Module: API/DataPoint.js
 * API resource handler for manipuating data points - receive and deliver.
 * Multiple operations for retrieval are supported:
 *		current, recent, and historical
 */

var fs = require('fs');

var util = require('../Model/utillib');
var httpWrite = require('../Model/HttpWriter');
var dbHandle = require('../Model/DbHandler');
var jtox = require('../Model/extlib/jsonToXml');
var alarmWatcher = require('../Services/AlarmWatcher');

/** JSON, XML, or CSV, the three supported return types */
var outputFormat;
/** Corresponding MIME type to return the correct HTTP header */
var outputMIME;

/** Template for returning multiple data points */
var multiResultShell = {
	datapoints : [],
	updated : ""
};

/*
 * Save one to many data points
 * @param {Object} res HTTP response
 * @param {string} data JSON data point(s)
 */
exports.saveDataPoint = function(res, data) {
	try {
		data = JSON.parse( data.toString() ).datapoints;
	} catch(e) {
		console.log("Input not parsable. Terminating");
		httpWrite.giveRequestError(res);
		return;
	}
	var isCurrent = (data.length === 1 && data[0].datetime === undefined);

	if(isCurrent) {
		//Check whether any channels of the data point raise any alarms
		alarmWatcher.checkForBreaches(data[0].channels);
	}

	for (var i = 0; i < data.length; i++) {
		var d = isCurrent ? new Date() : new Date(data[i].datetime);

		if(isNaN(d)) {
			//Invalid data point, move on
			console.log("bad datetime was " + data[i].datetime);
			console.log("faulty input. Dying now");
			continue;
		}

		var dt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
			d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0);
		console.log("point " + i + " has UTCdate: " + dt + "; hours= " + d.getUTCHours());

		//Datetime properties of the data point
		var options = {
			date: dt,
			dateObj: d
		};

		//Shell for the data point, including datetime
		var dataPt = {
			DateTime: dt
		};

		var cnt = 0;

		//Extract channels from the data point
		Object.keys(data[i].channels).forEach(function(key) {
			var val = parseFloat(data[i].channels[key]);
			if(isNaN(val)) {
				console.log("Error: tried to save non value " + data[i].channels[key] + " with key " + key);
			} else {
				dataPt[key] = val;
				cnt++;
			}
		});

		if(cnt > 0) {
			//Save into database
			console.log("Processing " + cnt + " channels");
			httpWrite.giveSuccess(res);
			dbHandle.insertDataPoint(dataPt, options);
		} else {
			httpWrite.giveRequestError(res);
		}
	}
};

/**
 * Return the most recently available data point
 * @param {Object} res HTTP response
 */
exports.getCurrentDataPoint = function(res) {
	var resultShell = {
		updated: "",
		datastreams: []
	};
	dbHandle.retieveCurrentDataPt(resultShell, dbReturn, res);
};

/**
 * Return a set of the most recently available data points
 * @param {Object} res HTTP response
 * @param {Object} period range of recency (see user API docs)
 */
exports.getRecentDataPoints = function(res, period) {
	var queryProperties = ageToDateQuery( parsePeriod(period.recent) );
	queryProperties.skippable = false;
	dbHandle.retieveRecentDataPts(multiResultShell, queryProperties, dbReturn, res);
};

/**
 * Return a set of data points from a specified range
 * @param {Object} res HTTP response
 * @param {type} period date range over which to look for data
 */
exports.getHistoricalDataPoints = function(res, period) {
	var queryProperties = dateRangeToQueryProperties(period.date1, period.date2);
	if(queryProperties === null) {
		httpWrite.giveRequestError(res);
		return;
	}
	queryProperties.skippable = true;
	dbHandle.retieveHistoricalDataPts(multiResultShell, queryProperties, dbReturn, res);
};

/**
 * Return the current system time (good for synching clients)
 * @param {Object} res HTTP response
 */
exports.getTime = function(res) {
	httpWrite.giveSuccess(res, formatOuput({curr_time: new Date().getTime()}));
};

/**
 * Callback for the dbHandler to execute on retriving data points.
 * Outputs the data to the HTTP response
 * @param {bool} wasSuccesful whether data could be returned from the db
 * @param {Object} result the data points, or an error message if not successful
 * @param {Object} res HTTP response
 */
function dbReturn(wasSuccesful, result, res) {
	if(wasSuccesful) {
		httpWrite.giveSuccess(res, formatOuput(result), outputMIME);
	} else {
		httpWrite.giveFailure(res);
		console.log(result);
	}
}

/**
 * Parses a raw user API query for recent data
 * @param {string} period friendly representation of a number of hours, days, or months
 * @returns {number} Number of minutes represented by the period
 */
function parsePeriod(period) {
	var re = /^([\d]+(?:\.[\d]+)?)([hmd]?)$/;
	var result = re.exec(period);
	//console.log(result);

	var length;
	var type;
	//Invalid period query
	if(!result) {
		length = 1;
		type = "h";
	} else {
		length = result[1];
		type = result[2];
	}

	//valid periods (hour, day, month); empty string gives default - hour
	periodTypes = { "h": 1, "d": 24, "m": 30 * 24, "": 1 };

	var age = length * periodTypes[type] * 60; //in minutes
	return age;
}

/**
 * Finds the correct sampling interval of data points for a given date period.
 * @param {number} age period length in minutes
 * @returns {Object} Sampling interval and number of data points covered by the period and interval
 */
function ageToDateQuery(age) {
	console.log("Request made for a period of " + age + " minutes");

	// distance in minutes between consecutive datapoints to use
	var periodGaps = [1, 5, 20, 60, 180, 1440];

	//reasonable limits on number of data points to return
	var maxDataPoints = 1000;
	var minDataPoints = 3;

	var pointsPerMinute = 60 / require("../Storage/settings.json").updateRate;
	var resolutionIdeal = age / maxDataPoints * pointsPerMinute;
	//console.log("Ideal res: " + resolutionIdeal);
	var resolution = periodGaps[periodGaps.length-1];

	for(var i = 0; i < periodGaps.length; i++) {
		if(resolutionIdeal <= periodGaps[i]) {
			resolution = periodGaps[i];
			break;
		}
	}

	//get suitable number of data points in valid range
	var numDataPoints = Math.max(minDataPoints,
		Math.min(Math.round(age / resolution) * pointsPerMinute, maxDataPoints));

	return {
		"number": numDataPoints,
		"resolution": resolution,
		"resIndex": i
	};
}

/**
 * Converts two datetimes, representating a date range,
 *  in to properties useful for further parsing
 * @param {string} date1 datetime one
 * @param {string} date2 datetime two
 * @returns {Object} Useful properties
 */
function dateRangeToQueryProperties(date1, date2) {
	var d1 = util.parseDate(date1);
	var d2 = util.parseDate(date2);
	var dmax = Math.max(d1, d2);
	var dmin = Math.min(d1, d2);

	var age = Math.round( (dmax - dmin) / 60000 );
	if(isNaN(age)) {
		return null;
	}

	var qp = ageToDateQuery(age);
	qp.upper = dmax.toString();
	qp.lower = dmin.toString();
	return qp;
}


this.setFormat = function(format) {
	outputFormat = format;
};

/**
 * Formats a data point representation into CSV, JSON, or XML,
 *  and set the correct MIME type for HTTP delivery
 * @param {Object} obj data point(s) as JSON
 * @returns Formatted data point(s)
 */
function formatOuput(obj) {
	if(outputFormat === 'csv') {
		outputMIME = 'text/csv';
		return util.jsonToCsv(obj, obj.datastreams !== undefined);
	} else if(outputFormat === 'xml') {
		outputMIME = 'application/xml';
		return jtox.jsonToXml(obj);
	} else {
		outputFormat = 'json';
		outputMIME = 'application/json';
		return JSON.stringify(obj);
	}
}
