var azure = require('azure');
var nconf = require('nconf');

var TABLE_NAME_DATA = 'DataPoint';

nconf.env().file({file: 'config.json'});
var tblService = azure.createTableService(nconf.get("STORAGE_NAME"), nconf.get("STORAGE_KEY"));

var _channels = [];
var _channelNames = [];
var numChannels = 0;

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
	var channels = data.split("\n");
	console.log(channels);
	//console.log(_channels);
	var d = new Date();
	var dt = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
		d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0);

//Aid filtering rows in the table by time
	var period = 0;
	if(d.getUTCMinutes() % 5 === 0)
		period = 1;
	if(d.getUTCMinutes() % 20 === 0)
		period = 2;
	if(d.getUTCMinutes() === 0) {
		period = 3;
		if(d.getUTCHours % 3 === 0)
			period = 4;
		if(d.getUTCHours === 0)
			period = 5;
	}

	//var pkDateTime = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0,0,0,0);
	var offset = 9999999999999;

	for (var i = 0; i < channels.length; i++) {
		var keyvalue = channels[i].split(",");
		if (_channels[keyvalue[0]] === undefined) {
			console.log(keyvalue[0] + " is not a valid channel name, idiota");
			continue;
		}
		var fk = _channels[keyvalue[0]].key; //FK into Channel tbl
		//Coerce Azure Table Service to order results by most recently added
		var dataPt = {
			PartitionKey: (offset - dt).toString(),
			RowKey: fk.toString(), // Sensor channel
			Value: parseFloat(keyvalue[1]),
			DateTime: dt,
			Period: period
		};
		tblService.insertEntity(TABLE_NAME_DATA, dataPt, function(error) {
			if (error) {
				throw error;
			}
		});
	}
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
			throw error;
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

	// distance between consecutive datapoints to get
	//var interval = Math.ceil(period / 3);

	//Period in ms for a gap in the data to be considered excessive
	var dataJumpExcessive = 60000 * 60 * 0.5;

	var query = azure.TableQuery
		.select()
		.from(TABLE_NAME_DATA)
		.top(numChannels * Math.round(period * 60));
		//.where("DateTime");
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			for (var i = 0; i < entities.length; i++) {
				if(i < entities.length -1) {
					var timeDiff = entities[i].DateTime - entities[i+1].DateTime;
					if(timeDiff > dataJumpExcessive) {
						console.log(timeDiff + " at " + i);
						break;
					}
				}
				datastreams[entities[i].RowKey -1].datapoints.push({
					value: entities[i].Value,
					at: entities[i].DateTime
				});
			}
			var result = {
				datastreams : datastreams,
				updated : new Date(entities[1].DateTime).toUTCString()
			};
			giveGETsuccess(res, JSON.stringify(result));
		} else {
			giveGETfailure(res);
			throw error;
		}
	});
}

function giveGETsuccess(res, data) {
	res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': data.length});
	res.write(data);
	res.end();
}

function giveGETfailure(res) {
	res.writeHead(500, {'Content-Type': 'application/json'});
	res.end(JSON.stringify({ error: 'Could not handle request at this time. Try again later' }));
}

exports.saveDataPoint = saveDataPoint;
exports.getCurrentDataPoint = getCurrentDataPoint;
exports.getRecentDataPoints = getRecentDataPoints;
exports.setup = setup;