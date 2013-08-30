/**
 * Manager for the API data feeds of recent data points
 * @namespace Model
 */
Model.DataFeed = new function() {

	/** Data structure for the feeds */
	var dataStruct = {
		now: {},
		day: {},
		week: {},
		month: {}
	};

	/** Load the data struct with empty arrays for each Channel */
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

	/**
	 * Get the current (past few hours) feed for a named Channel
	 * @param {String} sensorLabel Channel id
	 * @returns {Object} feed
	 */
	this.getCurrentSeries = function(sensorLabel) {
		return dataStruct.now[sensorLabel];
	};

	/**
	 * Append a value to the current feed of a named Channel.
	 * @param {String} sensorLabel Channel id
	 * @param {number} value new value
	 */
	this.appendCurrentSeries = function(sensorLabel, value) {
		if(dataStruct.now[sensorLabel] !== undefined) {
			dataStruct.now[sensorLabel].unshift(value);
		}
	};

	/**
	 * Get data feed of all Channels for a named period
	 * @param {String} period now, day, week, or month
	 * @returns {Object} feed
	 */
	this.getPeriod = function(period) {
		return dataStruct[period];
	};

	/**
	 * Saves a data feed of all Channels for a named period
	 * @param {Object} feed
	 * @param {String} period now, day, week, or month
	 */
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
