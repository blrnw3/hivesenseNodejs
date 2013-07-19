//Actually, Model object (or singleton class)
var Model = new function() {
	this.xivelyFeedID = 1693757499;
	this.xivelyAPIkey = "597SF7dgmQt6V5H4uf9KGmNzA52Z28KYCGHl7fkBZ8sJlc1i";
	var API_ENDPOINT = "/feed";

	this.sensorValues = [];
	this.sensorValuesRecent = [];
	this.sensorNames = ['temp1', 'temp2', 'temp3', 'light', 'motion', 'humi'];

	this.XivelyMappings = {
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
		lastMovement: 1000
	};

	this.pages = [ "home", "graphs", "history", "about" ];

	this.UPDATE_RATE_SENSORS = 30; // in secs
	this.UPDATE_RATE_HISTORY = 300; // in secs
	this.UPDATE_RATE_WEATHER = 900; // in secs

	this.localWeatherLocation = "London";

	this.currTime = 0;
	var OLD_DATA_THRESHOLD = 300; // In seconds

	function diffTime(unixTime) {
		var d = new Date();
		return d.getTime() - unixTime;
	};

	this.updated_ago = function() {
		return Util.prettyTimeAgo( diffTime(Model.currTime) );
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
		for(var i = dataSeries.length -1; i >= 0; i--) {
			if(dataSeries[i].value == 1)
				break;
		}
		//console.log(i + " gives " + dataSeries[i]);
		if(i === -1) {
			return "No recent motion";
		} else {
			lastMoveTime = diffTime( Date.parse(dataSeries[i].at) );
			return "Last motion: " + Util.prettyTimeAgo(lastMoveTime) + " ago";
		}
	};

	this.getLocalWeather = function(callback) {
		//console.log("wx get pt 2");
		var wxAPIsrc = '/ext/wxgrab';
		$.get(wxAPIsrc + "?place=" + Model.localWeatherLocation,
			function(data) {
				//console.log("wx get pt 3");
				var backup = {
					weather: "Unknown",
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
				for (var i = 0; i < data.datastreams.length; i++) {
					var name = Model.XivelyMappings[data.datastreams[i].id];
					if (true || Object.keys(Model.sensorValues).length > 0) {
						Model.sensorValuesRecent[name] = Model.sensorValues[name];
					}
					Model.sensorValues[name] = data.datastreams[i].current_value;
				}
				Model.sensorValuesRecent["temp3"] = Model.sensorValues['temp3'];
				Model.sensorValues["temp3"] = Model.sensorValues['temp1'] - Model.sensorValues['temp2'];

				Model.currTime = Date.parse(data.updated);
				propagateChanges();
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