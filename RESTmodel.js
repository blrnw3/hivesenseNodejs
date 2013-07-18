var azure = require('azure');
var nconf = require('nconf');

nconf.env().file({file: 'config.json'});
var tblService = azure.createTableService(nconf.get("STORAGE_NAME"), nconf.get("STORAGE_KEY"));

var _channels = [];

function setup() {
	var query = azure.TableQuery.select().from('Channel');
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			//_channels = entities.slice();
			for(var i = 0; i < entities.length; i++) {
				console.log(entities[i]);
				_channels[entities[i].Name] = { key : entities[i].RowKey, unit: entities[i].Unit };
			}
			console.log(_channels);
		} else {
			throw error;
		}
	});
}

function saveDataPoint(data) {
	var channels = data.split("\n");
	console.log(channels);
	console.log(_channels);
	var dt = new Date().getTime();

	for (var i = 0; i < channels.length; i++) {
		var keyvalue = channels[i].split(",");
		if(_channels[keyvalue[0]].key === undefined) {
			console.log(keyvalue[0] + " is not a valid channel name, fucktard");
			continue;
		}
		var fk = _channels[keyvalue[0]].key; //FK into Channel tbl
		var dataPt = {
			PartitionKey: fk,
			RowKey: dt + "-" + fk,
			Value: parseFloat(keyvalue[1]),
			DateTime: dt
		};
		tblService.insertEntity('DataPoint', dataPt, function(error) {
			if (error) {
				throw error;
			}
		});
	}
}

exports.saveDataPoint = saveDataPoint;
exports.setup = setup;