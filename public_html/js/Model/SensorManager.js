/**
 * Mangages the Channels (Sensors) and their current data
 * @namespace Model
 */
Model.SensorManager = new function() {

	var isUnitMetric = true;

	var lastMoveTime = Number.MAX_VALUE;

	/** Sensors object to store settings about each Channel */
	var sensors = {};

	var sensorData = {
		current: {},
		recent: {}
	};

	/**
	 * Get data for all the Channel blocks
	 * @returns {Object} current value and trend
	 */
	this.getSensorData = function() {
		var result = {};
		$.each(sensors, function(i, sensor) {
			var name = sensor.id;
			result[name] = {};
			result[name].value = Model.SensorManager.convert( sensorData.current[name], name );
			if(sensorData.recent[name] !== undefined && name !== "motion") {
				result[name].trend = getTrend(name);
			}
		});

		return result;
	};

	/**
	 * Gets a Sensor settings object
	 * @param {string} id of the Sensor
	 * @returns {Object} sensor
	 */
	this.getSensor = function(id) {
		return sensors[id];
	};
	/**
	 * Gets all sensor settings objects
	 * @returns {Objects} sensors
	 */
	this.getAllSensors = function() {
		return sensors;
	};
	/**
	 * Adds a sensor object to the stored list
	 * @param {Object} sen sensor
	 */
	this.addSensor = function(sen) {
		sensors[sen.id] = sen;
	};
	/**
	 * Gets the current values of all Channels
	 * @returns {Object} key-value object of sensor values
	 */
	this.getCurrentSensorValues = function() {
		return sensorData.current;
	};

	/**
	 * Gets the unit of a Channel object
	 * @param {string} label Sensor id
	 * @returns {string} unit
	 */
	this.getUnit = function(label) {
		return sensors[label].unit;
	};

	/** Sets the units for all sensors to metric */
	this.setMetric = function() {
		isUnitMetric = true;
	};
	/** Sets the units for all sensors to imperial */
	this.setImperial = function() {
		isUnitMetric = false;
	};

	/**
	 * Retrieve current data feed from the API to update sensor data
	 * @param {function} propagateChanges execute after success
	 */
	this.getCurrentDataValues = function(propagateChanges) {
		Model.ApiConnector.getDataCurrent(
			function(data) {
				var newTime = Date.parse(data.updated);
				if(newTime === Model.TimeManager.currTime) {
					console.log("No new data feed available.");
					propagateChanges(0, false);
					return;
				}
				Model.TimeManager.currTime = newTime;
				var newDataAge = Math.round(Model.TimeManager.diffTime(Model.TimeManager.currTime) / 1000);
				var syncTime = (newDataAge < Model.SettingsManager.getUpdateRate() && newDataAge >= 5) ?
					newDataAge - 5 : 0;
				console.log(syncTime + " s out of sync");

				for (var i = 0; i < data.datastreams.length; i++) {
					var name = data.datastreams[i].id;
					var value = data.datastreams[i].current_value;

					sensorData.recent[name] = sensorData.current[name]; //save recent value before it's updated
					sensorData.current[name] = value;

					//add to recent data to update dashboard graphs without having to requery db
					Model.DataFeed.appendCurrentSeries(name, [newTime, value]);
				}

				propagateChanges(syncTime % Model.SettingsManager.getUpdateRate(), true);
			}
		);
	};

	/**
	 * Convert and neaten a raw value from the API
	 * @param {number} value
	 * @param {string} type id of the Channel that produced the value
	 * @returns {String} clean, convertd value, with unit
	 */
	this.convert = function(value, type) {
		var unitT = isUnitMetric ? 'C' : 'F';
		if(value === undefined) {
			value = "N/A";
		}
		var unit = Model.SensorManager.getUnit(type);
		switch(unit) {
			case "C":
				return (isUnitMetric ? new Number(value).toFixed(1) :
					Util.CtoFdegrees(value, type === "tempdiff")) + " " + unitT;
			case "%":
				return Math.round(value) + " %";
				break;
			case "bool":
				return (value == 0) ? "Stationary" : "Moving!";
				break;
			default:
				return value + " " + unit;
		}
	};

	/**
	 * Special function to get last time that movement was recorded (motion sensor).
	 * Only the past 180 data points are examined.
	 * @returns {String} pretty time
	 */
	this.getLastMotion = function() {
		var dataSeries = Model.DataFeed.getCurrentSeries("motion");
		if(dataSeries === undefined) {
			return "";
		}
		var newestTime = 0;
		for(var i = 0; i < dataSeries.length; i++) {
			var wasMoving = dataSeries[i][1];
			if(wasMoving) {
				var movingTime = dataSeries[i][0];
				if(movingTime > newestTime) {
					newestTime = movingTime;
				}
			}
		}
		if(newestTime === 0) {
			return "No recent motion";
		} else {
			lastMoveTime = Model.TimeManager.diffTime(newestTime);
			return "Last motion: " + Util.prettyTimeAgo(lastMoveTime) + " ago";
		}
	};
	/**
	 * Get the datetime of the last motion event
	 * @returns {integer} in ms
	 */
	this.getLastMoveTime = function() {
		return lastMoveTime;
	};

	/**
	 * Gets a trend (up, down, level) for a channel.
	 * Trend is determined by change since last data point
	 * @param {string} name id of channel
	 * @returns {String} trend
	 */
	function getTrend(name) {
		var change = sensorData.current[name] - sensorData.recent[name];
		if(change === 0) {
			return "level";
		} else {
			return (change > 0) ? "up" : "down";
		}
	};
};
