var fs = require('fs');

var jtox = require('../Model/extlib/jsonToXml');
var util = require('../Model/utillib');
var alarmWatcher = require('../Services/AlarmWatcher');
var httpWrite = require('../Model/HttpWriter');

var dbHandle = require('../Model/DbHandler');

// distance in minutes between consecutive datapoints to use
var periodGaps = [1, 5, 20, 60, 180, 1440];

var outputFormat;
var outputMIME;

exports.saveDataPoint = function(res, data) {
	try {
		data = JSON.parse( data.toString() ).datapoints;
	} catch(e) {
		console.log("Input not parseable. Terminating");
		httpWrite.giveRequestError(res);
		return;
	}
	var isCurrent = (data.length === 1 && data[0].datetime === undefined);

	if(isCurrent) {
		alarmWatcher.checkForBreaches(data[0].channels);
	}

	for (var i = 0; i < data.length; i++) {
		var d = isCurrent ? new Date() : new Date(data[i].datetime);

		if(isNaN(d)) {
			console.log("bad datetime was " + data[i].datetime);
			console.log("faulty input. Dying now");
			httpWrite.giveRequestError(res);
			return;
		}

		var dt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
			d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0);
		console.log("point " + i + " has UTCdate: " + dt + "; hours= " + d.getUTCHours());

		var options = {
			date: dt,
			dateObj: d
		};

		var dataPt = {
			DateTime: dt
		};

		var cnt = 0;

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
			console.log("Processing " + cnt + " channels");
			httpWrite.giveSuccess(res);
			dbHandle.insertDataPoint(dataPt, options);
		} else {
			httpWrite.giveRequestError(res);
		}
	}
};

exports.getCurrentDataPoint = function(res) {
	var resultShell = {
		updated: "",
		datastreams: []
	};
	dbHandle.retieveCurrentDataPt(resultShell, dbReturn, res);
};

var multiResultShell = {
	datapoints : [],
	updated : ""
};
exports.getRecentDataPoints = function(res, period) {
	var queryProperties = ageToDateQuery( parsePeriod(period.recent) );
	queryProperties.skippable = false;
	dbHandle.retieveRecentDataPts(multiResultShell, queryProperties, dbReturn, res);
};
exports.getHistoricalDataPoints = function(res, period) {
	var queryProperties = dateRangeToQueryProperties(period.date1, period.date2);
	if(queryProperties === null) {
		httpWrite.giveRequestError(res);
		return;
	}
	queryProperties.skippable = true;
	dbHandle.retieveHistoricalDataPts(multiResultShell, queryProperties, dbReturn, res);
};

exports.getTime = function(res) {
	httpWrite.giveSuccess(res, formatOuput({curr_time: new Date().getTime()}));
};

function dbReturn(wasSuccesful, result, res) {
	if(wasSuccesful) {
		httpWrite.giveSuccess(res, formatOuput(result), outputMIME);
	} else {
		httpWrite.giveFailure(res);
		console.log(result);
	}
}

/**
 * Takes a raw user API query for historical data and returns the correct period to use in the db query,
 * or false if the query is bad
 * @param {type} period
 * @returns {Boolean}
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

function ageToDateQuery(age) {
	console.log("Request made for a period of " + age + " minutes");

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
	var numDataPoints = Math.max(minDataPoints, Math.min(Math.round(age / resolution) * pointsPerMinute, maxDataPoints));

	return {
		"number": numDataPoints,
		"resolution": resolution,
		"resIndex": i
	};
}

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
