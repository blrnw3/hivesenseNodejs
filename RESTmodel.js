var azure = require('azure');
var nconf = require('nconf');
var fs = require('fs');
var jtox = require('./extlib/jsonToXml');
var util = require('./utillib');
var alarmWatcher = require('./AlarmWatcher');

var TABLE_NAME_DATA = 'DataPoint';
var PATH_TO_CAM_DIR = './blobs/hivecam/';
var PATH_TO_CAM = PATH_TO_CAM_DIR + 'camLatest.bmp';

//nconf.env().file({file: 'config.json'});
//var tblService = azure.createTableService(nconf.get("STORAGE_NAME"), nconf.get("STORAGE_KEY"));
var tblService = azure.createTableService();

var settingsFile = "./settings.json";

// distance in minutes between consecutive datapoints to use
var periodGaps = [1, 5, 20, 60, 180, 1440];

//System properties of each row in the database (need to be ignored when looping for actual sensor values)
var systemProperties = ["Timestamp", "PartitionKey", "RowKey", "DateTime", "Period", "_"];

var offset = 9999999999999;

/**
 * Runs at server start
 * @returns {undefined}
 */
function setup() {
	tblService.createTableIfNotExists(TABLE_NAME_DATA, function(error) {
		if (error) {
			throw error;
		}
	});
}

function saveDataPoint(data, res) {
	data = JSON.parse( data.toString() ).datapoints;
	var isCurrent = (data.length === 1 && data[0].datetime === undefined);
	var period = 0;

	if(isCurrent) {
		alarmWatcher.checkForBreaches(data[0].channels);
	}

	//var pkDateTime = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0,0,0,0);

	for (var i = 0; i < data.length; i++) {
		var d = isCurrent ? new Date() : new Date(data[i].datetime);

		if(isNaN(d)) {
			console.log("bad datetime was " + data[i].datetime);
			console.log("faulty input. Dying now");
			giveRequestError(res);
			return;
		}

		var dt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
			d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0);
		console.log("point " + i + " has UTCdate: " + dt + "; hours= " + d.getUTCHours());


		//Aid filtering rows in the table by time
		if (d.getUTCMinutes() % 5 === 0)
			period = 1;
		if (d.getUTCMinutes() % 20 === 0)
			period = 2;
		if (d.getUTCMinutes() === 0) {
			period = 3;
			if (d.getUTCHours() % 3 === 0)
				period = 4;
			if (d.getUTCHours() === 12)
				period = 5;
		}

		var dataPt = {
			PartitionKey: (offset - dt).toString(), //Coerce Azure Table Service to order results by most recently added
			RowKey: "0",
			DateTime: dt,
			Period: period //convenience entry for quicker retrieval of historical data
		};

		var cnt = 0;
		Object.keys(data[i].channels).forEach(function(key) {
//			var channelValue = data[i].channels[_channelNames[j].name];
//
//			if (channelValue === undefined) {
//				console.log(_channelNames[j].name + " is not a valid channel");
//				continue;
//			}

			var val = parseFloat(data[i].channels[key]);

			if(isNaN(val)) {
				console.log("Error: tried to insert non value " + data[i].channels[key] + " with key " + key);
			} else {
				dataPt[key] = val;
				cnt++;
			}
		});

		if(cnt > 0) {
			console.log("Processing " + cnt + " channels");
			givePOSTsuccess(res);
			tblService.insertEntity(TABLE_NAME_DATA, dataPt, function(error) {
				if (error) {
					console.log(error);
				} else {
					console.log(" inserted at " + new Date().getUTCSeconds());
				}
			});
		} else {
			giveRequestError(res);
		}

	}
}

function saveImage(data, res) {
	console.log("SAVING a binary post of length " + data.length);
	givePOSTsuccess(res);
	//var buf = new Buffer()
	fs.writeFile(PATH_TO_CAM, data, 'binary', function(err){
        if (err) throw err;
	});
}

function getImage(res) {
	fs.readFile(PATH_TO_CAM, function(err, data) {
		if (err) {
			console.log(err);
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end("Error - not found");
		} else {
			res.writeHead(200, {'Content-Type': 'image/bmp', 'Content-Length': data.length, 'Cache-Control': 'public; max-age: 30'});
			res.end(data, 'binary');
		}
	});
}

function getCurrentDataPoint(res, callback) {
	//console.log("getting dataPoint");
	var query = azure.TableQuery
		.select()
		.from(TABLE_NAME_DATA)
		.top(1);
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			var dataPt = entities[0];
			var result = {
				updated: new Date(dataPt.DateTime).toUTCString()
			};

			//Eliminate redundant properties
			for(var i = 0; i < systemProperties.length; i++) {
				delete dataPt[systemProperties[i]];
			}

			var dataPtOut = [];
			var i = 0;
			Object.keys(dataPt).forEach(function(key) {
				dataPtOut[i] = {
					id: key,
					current_value: dataPt[key]
				};
				i++;
			});
			result.datastreams = dataPtOut;

			if(callback === undefined) {
				giveGETsuccess(res, formatOuput(result));
			} else {
				callback(result);
			}
		} else {
			if(callback === undefined) {
				giveGETfailure(res);
			} else {
				callback();
			}
			console.log(error);
		}
	});
}

/**
 *
 * @param {type} res
 * @param {string} period
 * @returns {undefined}
 */
function getRecentDataPoints(res, period) {
	var queryProperties = ageToAzureDateQuery( parsePeriod(period.recent) );
	queryProperties.skippable = false;

	var query = getBasicRangeQuery(queryProperties.resolution);
	var numToget = queryProperties.number;
	console.log("Attempting to retrieve top " + numToget + " queries");
	var fullQuery = query.top(numToget);
	queryPastData(res, fullQuery, queryProperties );
}

function getBasicRangeQuery(resolution) {
	console.log("Getting basic query for periodGap " + resolution);
	return azure.TableQuery
				.select()
				.from(TABLE_NAME_DATA)
				.where("Period gt ?", periodGaps.indexOf(resolution)-1);
}

function queryPastData(res, query, queryProperties) {
	var dataPoints = [];

	var allowedNumberOfPointsToSkip = 30;
	//Period in ms for a gap in the data to be considered excessive
	var dataJumpExcessive = 60000 * allowedNumberOfPointsToSkip * queryProperties.resolution;

	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			var numResults = entities.length;
			if(numResults === 0) {
				giveNoResultError(res);
				return;
			}

			console.log("RETURNING "+ numResults +" DATAPOINTS FROM AZT");
			var updated = entities[0].DateTime;

			var validCnt = -1;
			for (var i = 0; i < numResults; i++) {
				//console.log(entities[i]);
				var dataPt = entities[i];

				validCnt++;
				if(i < numResults-1) {
					var timeDiff = dataPt.DateTime - entities[i+1].DateTime;
					if(!queryProperties.skippable && timeDiff > dataJumpExcessive) {
						console.log("Time gap too big at " + timeDiff + ", cnt " + i);
						break;
					}
					if(timeDiff < 60000 && queryProperties.resolution > 1) {
//						console.log("ignoring small time gap at " + i);
						validCnt--;
						continue;
					}
				}

				dataPoints[validCnt] = {
					datetime : dataPt.DateTime,
					channels: {}
				};

				//Eliminate redundant properties
				for (var j = 0; j < systemProperties.length; j++) {
					delete dataPt[systemProperties[j]];
				}

				Object.keys(dataPt).forEach(function(key) {
					dataPoints[validCnt].channels[key] = dataPt[key];
				});

			}
			console.log((validCnt+1) + " results returned out of " + numResults);

			var result = {
				datapoints : dataPoints,
				updated : new Date(updated).toUTCString()
			};
			giveGETsuccess(res, formatOuput(result));
		} else {
			giveGETfailure(res);
			console.log(error);
		}
	});
}

function getHistoricalDataPoints(res, period) {
	var queryProperties = dateRangeToQueryProperties(period.date1, period.date2);
	if(queryProperties === null) {
		giveRequestError(res);
		return;
	}
	queryProperties.skippable = true;

	var query = getBasicRangeQuery(queryProperties.resolution);
	var fullQuery = query.and("PartitionKey lt ?", queryProperties.upper)
						.and("PartitionKey gt ?", queryProperties.lower);
	queryPastData(res, fullQuery, queryProperties );
}

function getTime(res) {
	giveGETsuccess(res, formatOuput({curr_time: new Date().getTime()}));
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
	console.log(result);

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

function ageToAzureDateQuery(age) {
	console.log("Request made for a period of " + age + " minutes");

	var maxDataPoints = 1000; //limit on number of datapoints allowed by ATS to return
	var minDataPoints = 3;

	var pointsPerMinute = 60 / require(settingsFile).updateRate;
	var resolutionIdeal = age / maxDataPoints * pointsPerMinute;
	console.log("Ideal res: " + resolutionIdeal);
	var resolution = periodGaps[periodGaps.length-1];

	for(var i = 0; i < periodGaps.length; i++) {
		if(resolutionIdeal <= periodGaps[i]) {
			resolution = periodGaps[i];
			break;
		}
	}

	//get suitable number of datapoints in valid range
	var numDataPoints = Math.max(minDataPoints, Math.min(Math.round(age / resolution) * pointsPerMinute, maxDataPoints));

	return {
		"number": numDataPoints,
		"resolution": resolution
	};
}

function dateRangeToQueryProperties(date1, date2) {
	var d1 = offset - util.parseDate(date1);
	var d2 = offset - util.parseDate(date2);
	var dmax = Math.max(d1, d2);
	var dmin = Math.min(d1, d2);


	var age = Math.round( (dmax - dmin) / 60000 );
	if(isNaN(age)) {
		return null;
	}

	var qp = ageToAzureDateQuery(age);

	return {
		number: qp.numDataPoints,
		resolution: qp.resolution,
		upper: dmax.toString(),
		lower: dmin.toString()
	};
}

function getSettings(res) {
	//remove from local cache before returning in case it was changed in the filesystem (locally or by HTTP request)
	delete require.cache[require.resolve(settingsFile)];
	var settings = JSON.stringify(require(settingsFile));
	outputMIME = "application/json";
	giveGETsuccess(res, settings);
}

function saveSettings(res, data) {
	var settings = JSON.parse(data);
	console.log(settings);
	if(settings === undefined || settings.password !== "livehive") {
		giveValidationError(res);
	} else {
		delete settings.password; //for security
		var oldSettings = require(settingsFile);
		Object.keys(settings).forEach(function(key) {
			oldSettings[key] = settings[key];
		});
		fs.writeFile(settingsFile, JSON.stringify(oldSettings, null, '\t'), function(err) {
			if (err) {
				console.log("SOME ERROR SAVING SETTINGS");
				console.log(err);
				giveGETfailure(res);
			} else {
				console.log("SAVING SETTINGS SUCCESS!!!!!!!!!!!");
				givePOSTsuccess(res);
			}
		 });
		delete require.cache[require.resolve(settingsFile)]; //beat the cache
	}
}

//################
// REST responses
//################
function giveGETsuccess(res, data) {
	res.writeHead(200, {'Content-Type': outputMIME, 'Content-Length': data.length, 'Cache-Control': 'public; no-cache'});
	res.write(data);
	res.end();
}
function giveGETfailure(res) {
	res.writeHead(500, {'Content-Type': "application/json"});
	res.end(JSON.stringify({ error: 'Could not handle request at this time. Try again later' }));
}
function giveRequestError(res) {
	res.writeHead(400, {'Content-Type': "application/json"});
	res.end(JSON.stringify({ error: 'Bad request. Check input against API docs before retrying' }));
}
function giveNoResultError(res) {
	res.writeHead(400, {'Content-Type': "application/json"});
	res.end(JSON.stringify({"error": "no valid results available. Try another query"}));
}
function giveValidationError(res) {
	res.writeHead(401, {'Content-Type': "application/json"});
	res.end(JSON.stringify({ error: 'Invalid password. Do not attempt again unless authorised' }));
}
function givePOSTsuccess(res) {
	res.writeHead(200, {'Content-Type': "application/json"});
	res.end(JSON.stringify({ response: 'Data saved' }));
}


function setFormat(format) {
	outputFormat = format;
}
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

exports.setFormat = setFormat;
exports.getTime = getTime;
exports.saveImage = saveImage;
exports.getImage = getImage;
exports.saveDataPoint = saveDataPoint;
exports.getCurrentDataPoint = getCurrentDataPoint;
exports.getRecentDataPoints = getRecentDataPoints;
exports.getHistoricalDataPoints = getHistoricalDataPoints;
exports.getSettings = getSettings;
exports.saveSettings = saveSettings;
exports.setup = setup;