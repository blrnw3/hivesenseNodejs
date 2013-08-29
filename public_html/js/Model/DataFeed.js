/**
 * Utility functions
 * @namespace Model
 */
Model.DataFeed = new function() {

	var dataStruct = {
		now: {},
		day: {},
		week: {},
		month: {}
	};

	this.initialise = function() {
		//period types
		$.each(dataStruct, function(key) {
			dataStruct[key].updated = 0;
			$.each(Model.SensorManager.getAllSensors(), function(name) {
				// initialise empty array of datapoints for each desired channel
				dataStruct[key][name] = [];
			});
		});
	};

	this.getCurrentSeries = function(sensorLabel) {
		return dataStruct.now[sensorLabel];
	};

	this.appendCurrentSeries = function(sensorLabel, value) {
		if(dataStruct.now[sensorLabel] !== undefined) {
			dataStruct.now[sensorLabel].unshift(value);
		}
	};

	this.getPeriod = function(period) {
		return dataStruct[period];
	};

	this.saveDataFeed = function(feed, period) {
		if(feed.datapoints === undefined) {
			console.log("Empty feed for period " + period);
			return;
		}
		var newUpdated = Date.parse(feed.updated);
		if(newUpdated <= dataStruct[period].updated) {
			console.log("Old feed for period " + period);
			return;
		}

		//New and valid feed
		$.each(dataStruct[period], function(key, val) {
			//clear previous data
			dataStruct[period][key] = [];
		});
		for(var i = 0; i < feed.datapoints.length; i++) {
			var dp = feed.datapoints[i];
			$.each(dp.channels, function(key, val) {
				if(dataStruct[period][key]) {
					dataStruct[period][key].push([dp.datetime, val]);
				} else {
					console.log("Failed to push to " + key);
				}
			});
		}
	};
};
