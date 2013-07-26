var azure = require('azure');
var nconf = require('nconf');
var fs = require('fs');

var TABLE_NAME_DATA = 'DataPoint';
var PATH_TO_CAM_DIR = './blobs/hivecam/';
var PATH_TO_CAM = PATH_TO_CAM_DIR + 'camLatest.bmp';

nconf.env().file({file: 'config.json'});
var tblService = azure.createTableService(nconf.get("STORAGE_NAME"), nconf.get("STORAGE_KEY"));

var _channels = [];
var _channelNames = [];
var numChannels = 0;

// distance in minutes between consecutive datapoints to use
var periodGaps = [1, 5, 20, 60, 180, 1440];

/**
 * Runs at server start so the channel properties can be loaded into memory
 * @returns {undefined}
 */
function setup() {
	var query = azure.TableQuery.select().from('Channel');
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			//_channels = entities.slice();
			for (var i = 0; i < entities.length; i++) {
				//console.log(entities[i]);
				_channels[entities[i].Name] = {
					key: entities[i].RowKey,
					unit: entities[i].Unit
				};
				_channelNames[entities[i].RowKey] = {
					name: entities[i].Name,
					unit: entities[i].Unit
				};
			}
			numChannels = i;
			console.log(_channels);
		} else {
			throw error;
		}
	});
	tblService.createTableIfNotExists(TABLE_NAME_DATA, function(error) {
		if (error) {
			throw error;
		}
	});
}

function saveDataPoint(data) {
	data = JSON.parse( data.toString() ).datapoints;
	var isCurrent = (data.length === 1);
	var period = 0;

	//var pkDateTime = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0,0,0,0);
	var offset = 9999999999999;

	for (var i = 0; i < data.length; i++) {
		//console.log(_channels);
		var d = isCurrent ? new Date() : new Date(data[i].datetime);
		var dt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
			d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0);

		//Aid filtering rows in the table by time
		if (d.getUTCMinutes() % 5 === 0)
			period = 1;
		if (d.getUTCMinutes() % 20 === 0)
			period = 2;
		if (d.getUTCMinutes() === 0) {
			period = 3;
			if (d.getUTCHours % 3 === 0)
				period = 4;
			if (d.getUTCHours === 12)
				period = 5;
		}

		for (var j = 1; j <= numChannels; j++) {
			var channelValue = data[i].channels[_channelNames[j].name];

			if (channelValue === undefined) {
				console.log(_channelNames[j].name + " is not a valid channel");
				continue;
			}

			var dataPt = {
				PartitionKey: (offset - dt).toString(), //Coerce Azure Table Service to order results by most recently added
				RowKey: j.toString(), // Sensor channel (Foreign Key)
				Value: parseFloat(channelValue),
				DateTime: dt,
				Period: period //convenience entry for quicker retreival of historical data
			};
			tblService.insertEntity(TABLE_NAME_DATA, dataPt, function(error) {
				if (error) {
					console.log(error);
				} else {
					console.log(" inserted at " + new Date().getUTCSeconds());
				}
			});
		}
	}
}

function saveImage(data) {
	console.log("SAVING a binary post of length " + data.length);
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

function getCurrentDataPoint(res) {
	console.log("\ngetting dataPoint\n");
	var data = [];

	if(numChannels === 0) {
		giveGETfailure(res);
		return;
	}
//	console.log("channel length: " + _channels.length);
//	console.log("channelN length: " + );
	var query = azure.TableQuery
		.select()
		.from(TABLE_NAME_DATA)
		.top(numChannels);
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			for (var i = 0; i < entities.length; i++) {
				//console.log(entities[i]);
				data[i] = {
					id: _channelNames[entities[i].RowKey].name,
					current_value: entities[i].Value
				};
			}
			var result = {
				datastreams : data,
				updated : new Date(entities[1].DateTime).toUTCString()
			};
			giveGETsuccess(res, JSON.stringify(result));
		} else {
			giveGETfailure(res);
			console.log(error);
		}
	});
}

/**
 *
 * @param {type} res
 * @param {number} period most recent [int] hrs data to grab
 * @returns {undefined}
 */
function getRecentDataPoints(res, period) {
	console.log("\ngetting Recent dataPoints\n");
	var datastreams = [];
	for(var i = 1; i <= numChannels; i++) {
		datastreams.push({
			id: _channelNames[i].name,
			unit: _channelNames[i].unit,
			datapoints: []
		});
	}

	var queryProperties = parsePeriod(period);
	console.log("\nRequest made for ");
	console.log(queryProperties);

	var allowedNumberOfPointsToSkip = 50;
	//Period in ms for a gap in the data to be considered excessive
	var dataJumpExcessive = 60000 * allowedNumberOfPointsToSkip * queryProperties.resolution;

	var query = azure.TableQuery
		.select()
		.from(TABLE_NAME_DATA)
		.where("Period gt ?", periodGaps.indexOf(queryProperties.resolution)-1)
		.top(numChannels * queryProperties.number);
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			var numResults = entities.length;
			console.log("RETURNING "+ numResults +" DATAPOINTS FROM AZT");
			for (var i = 0; i < numResults; i++) {
				//console.log(entities[i]);
				if(i < numResults-1) {
					var timeDiff = entities[i].DateTime - entities[i+1].DateTime;
					if(timeDiff > dataJumpExcessive) {
						console.log("Time gap too big at " + timeDiff + ", cnt " + i);
						break;
					}
				}
				datastreams[entities[i].RowKey -1].datapoints.push({
					value: entities[i].Value,
					at: entities[i].DateTime
				});
			}
			var result = (numResults === 0) ?
			{ "error": "no valid results available. Try another query" } :
			{
				datastreams : datastreams,
				updated : new Date(entities[1].DateTime).toUTCString()
			};
			giveGETsuccess(res, JSON.stringify(result));
		} else {
			giveGETfailure(res);
			console.log(error);
		}
	});
}

function getTime(res) {
	giveGETsuccess(res, JSON.stringify({curr_time: new Date().getTime()}));
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

	var length = result[1];
	var type = result[2];
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

	var maxDataPoints = 200; //limit on number of datapoints to return
	var minDataPoints = 3;
	var resolutionIdeal = Math.ceil(age / maxDataPoints);

	var resolution = periodGaps[periodGaps.length-1];
	for(var i = 0; i < periodGaps.length; i++) {
		if(resolutionIdeal <= periodGaps[i]) {
			resolution = periodGaps[i];
			break;
		}
	}

	//get suitable number of datapoints in valid range
	var numDataPoints = Math.max(minDataPoints, Math.min(age / resolution, maxDataPoints));

	return {
		"number": numDataPoints,
		"resolution": resolution
	};
}

function giveGETsuccess(res, data) {
	res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': data.length, 'Cache-Control': 'public; no-cache'});
	res.write(data);
	res.end();
}

function giveGETfailure(res) {
	res.writeHead(500, {'Content-Type': 'application/json'});
	res.end(JSON.stringify({ error: 'Could not handle request at this time. Try again later' }));
}

exports.getTime = getTime;
exports.saveImage = saveImage;
exports.getImage = getImage;
exports.saveDataPoint = saveDataPoint;
exports.getCurrentDataPoint = getCurrentDataPoint;
exports.getRecentDataPoints = getRecentDataPoints;
exports.setup = setup;