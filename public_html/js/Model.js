//Actually, Model object (or singleton class)
var Model = new function() {
	var API_ENDPOINT = "/feed";

	this.sensorValues = [];
	this.sensorValuesRecent = [];
	this.sensorNames = ['temp1', 'temp2', 'temp3', 'light', 'motion', 'humi'];

	this.APIMappings = {
		AmbientTemp: 'temp1',
		Temperature: 'temp2',
		Light: 'light',
		IsMoving: 'motion',
		Humidity: 'humi'
	};

	this.trendArrowUnicodes = {
		level: '&#x25ac;',
		down: '&#x25bc;',
		up: '&#x25b2;'
	};

	this.thresholdsHigh = {
		humi: 75,
		temp: 40,
		light: 20
	};
	this.thresholdsLow = {
		temp: 10,
		lastMovement: 3600
	};

	this.pages = [ "settings", "home", "graphs", "history", "about" ];

	this.UPDATE_RATE_SENSORS = 60; // in secs
	this.UPDATE_RATE_HISTORY = 3000; // in secs
	this.UPDATE_RATE_WEATHER = 900; // in secs

	this.localWeatherLocation = "London";

	this.currTime = 0;
	var OLD_DATA_THRESHOLD = 300; // In seconds

	var sysTime = 0;

	function diffTime(unixTime) {
		var d = sysTime || new Date().getTime();
		//console.log("SYStime: " + d);
		return d - unixTime;
	};

	this.updated_ago = function() {
		return Util.prettyTimeAgo( diffTime(Model.currTime) );
	};

	this.syncTime = function(full) {
		if(!full) {
			sysTime += 1000;
			return;
		}
		$.get(API_ENDPOINT + "?time",
			function(data) {
				sysTime = data.curr_time;
			}, "json"
		);
	};

	this.isOld = function() {
		return diffTime(Model.currTime) > OLD_DATA_THRESHOLD * 1000;
	};

	this.getTrend = function(name) {
		var change = Model.sensorValues[name] - Model.sensorValuesRecent[name];
		if(change === 0) {
			return "level";
		} else {
			return (change > 0) ? "up" : "down";
		}
	};

	this.saveSettings = function(wxPlace) {
		Model.localWeatherLocation = wxPlace;
	};

	this.getAlarm = function(name, level) {
		if(level === "high") {
			return Model.sensorValues[name] > Model.thresholdsHigh[name];
		} else {
			return Model.sensorValues[name] < Model.thresholdsLow[name];
		}
	};
	var lastMoveTime = Number.MAX_VALUE;
	this.getMovementAlarm = function() {
		return (lastMoveTime / 1000) < Model.thresholdsLow.lastMovement;
	};

	this.isUnitMetric = true;

	this.convert = function(value, type) {
		var unitT = Model.isUnitMetric ? 'C' : 'F';
		switch(type) {
			case "temp1":
			case "temp2":
			case "temp3":
				return (Model.isUnitMetric ? new Number(value).toFixed(1) :
					Util.CtoFdegrees(value, type === "temp3")) + " " + unitT;
			case "humi":
			case "light":
				return Math.round(value) + " %";
				break;
			case "motion":
				return (value == 0) ? "Stationary" : "Moving!";
				break;
		}
		return value;
	};

	this.getLastMotion = function(dataSeries) {
		if(dataSeries === undefined) {
			return "";
		}
		for(var i = 0; i < dataSeries.length; i++) {
			if(dataSeries[i].value == 1) {
				break;
			}
		}
		//console.log(i + " gives " + dataSeries[i]);
		if(i === dataSeries.length) {
			return "No recent motion";
		} else {
			//console.log("last moved index: " + i);
			lastMoveTime = diffTime( dataSeries[i].at );
			//console.log("last moved epoch: " + dataSeries[i].at);
			return "Last motion: " + Util.prettyTimeAgo(lastMoveTime) + " ago";
		}
	};

	this.getLocalWeather = function(callback) {
		console.log("updating local weather");
		var wxAPIsrc = '/ext/wxgrab';
		$.get(wxAPIsrc + "?place=" + Model.localWeatherLocation,
			function(data) {
				var backup = {
					weather: "Unknown",
					place: "N/A",
					temp: -99,
					time: "HH:mm BST"
				};
				var result = (data.weather === undefined) ? backup : data;
				console.log(result);
				callback(result);
			},
			"json"
		);
	};

	this.getCurrentDataValues = function(propagateChanges) {
		$.get(API_ENDPOINT + "?current",
			function(data) {

				var newTime = Date.parse(data.updated);
				if(newTime === Model.currTime) {
					console.log("No new data feed available.");
					propagateChanges(0, false);
					return;
				}

				for (var i = 0; i < data.datastreams.length; i++) {
					var name = Model.APIMappings[data.datastreams[i].id];
					if (true || Object.keys(Model.sensorValues).length > 0) {
						Model.sensorValuesRecent[name] = Model.sensorValues[name];
					}
					Model.sensorValues[name] = data.datastreams[i].current_value;
				}
				Model.sensorValuesRecent["temp3"] = Model.sensorValues['temp3'];
				Model.sensorValues["temp3"] = Model.sensorValues['temp1'] - Model.sensorValues['temp2'];

				Model.currTime = newTime;
				var newDataAge = Math.round(diffTime(Model.currTime) / 1000);
				var syncTime = (newDataAge > 5) ? Model.UPDATE_RATE_SENSORS - newDataAge + 5 : 0;
				if(syncTime < 0) {
					syncTime = 0;
				}

				console.log(syncTime + " s out of sync");
				propagateChanges(syncTime % Model.UPDATE_RATE_SENSORS, true);
			},
			"json"
		);
	};

	this.getRecentDataValues = function(period, propagateChanges) {
		$.get(API_ENDPOINT + "?recent=" + period,
			function(data) {
				propagateChanges(data);
			},
			"json"
		);
	};

};