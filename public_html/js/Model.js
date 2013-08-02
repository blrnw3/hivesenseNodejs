var dataStruct = {
	now: {
		format: "%Hz"
	},
	day: {
		format: "%Hz %d %b"
	},
	week: {
		format: "%Hz %d %b"
	},
	month: {
		format: "%Hz %d %b"
	}
};

//Actually, Model object (or singleton class)
var Model = new function() {

	//Absolute constants
	var API_ENDPOINT = "/feed";
	this.UPDATE_RATE_HISTORY = 1500; // in secs
	this.UPDATE_RATE_WEATHER = 900; // in secs
	var OLD_DATA_THRESHOLD = 10; // in cycles (missed updates)

	this.pages = [ "settings", "home", "graphs", "history", "about" ];


	//Configured by server settings file
	this.UPDATE_RATE_SENSORS;
	this.localWeatherLocation;
	var sensors = {};
	var sensorsRaw = [];
	var alarms = [];

	this.addSensor = function(sen) {
		sensors[sen.id] = sen;
		sensorsRaw.push(sen);
	};

	var sensorData = {
		current: {},
		recent: {}
	};

	this.getSensors = function() {
		var result = {};
		$.each(sensors, function(i, sensor) {
			var name = sensor.id;
			result[name] = {};
			result[name].value = Model.convert( sensorData.current[name], name );
			if(sensorData.recent[name] !== undefined && name !== "motion") {
				result[name].trend = getTrend(name);
			}
		});

		return result;
	};

	this.getSensor = function(id) {
		return sensors[id];
	};

	this.getAllSensors = function() {
		return sensors;
	};

	this.addAlarm = function(alarm) {
		alarms.push(alarm);
	};
	this.getAlarms = function() {
		result = {};
		$.each(alarms, function(i, alarm) {
			var element = "#" + "alarm-" + alarm.sensor + "-" + alarm.type;
			if(alarm.type === "high") {
				result[element] = sensorData.current[alarm.sensor] > alarm.value;
			} else {
				result[element] = sensorData.current[alarm.sensor] < alarm.value;
			}
			result["#alarm-motion"] = getMovementAlarm();
		});
		return result;
	};

	var lastMoveTime = Number.MAX_VALUE;
	function getMovementAlarm() {
		return (lastMoveTime / 1000) < 3600 || sensorData.current["motion"] == 1;
	};


	this.currTime = 0;
	var sysTime = 0;

	function diffTime(unixTime) {
		var d = sysTime || new Date().getTime();
		//console.log("SYStime: " + d);
		return d - unixTime;
	};

	this.updated_ago = function() {
		return Util.prettyTimeAgo( diffTime(Model.currTime) );
	};

	this.syncTime = function(doFullUpdate) {
		if(!doFullUpdate) {
			sysTime += 1000; //increment casually
			return;
		}
		$.get(API_ENDPOINT + "?time",
			function(data) {
				sysTime = data.curr_time;
			}, "json"
		);
	};

	this.isOld = function() {
		return diffTime(Model.currTime) > OLD_DATA_THRESHOLD * Model.UPDATE_RATE_SENSORS * 1000;
	};

	function getTrend(name) {
		var change = sensorData.current[name] - sensorData.recent[name];
		if(change === 0) {
			return "level";
		} else {
			return (change > 0) ? "up" : "down";
		}
	};

	this.saveSettings = function(wxPlace) {
		Model.localWeatherLocation = wxPlace;
	};
	this.commitSettings = function(pw, callback) {
		var settings = {
			wxplace: Model.localWeatherLocation,
			password: pw
		};
		$.ajax("/posty" + "?settings", {
			type: "PUT",
			contentType: "application/json",
			data: JSON.stringify(settings),
			processData: false,
			complete: function(res) {
				callback(res.status);
//				console.log(res);
			}
		});
	};

	this.isUnitMetric = true;

	this.convert = function(value, type) {
		var unitT = Model.isUnitMetric ? 'C' : 'F';
		if(value === undefined) {
			value = "N/A";
		}
		switch(sensors[type].unit) {
			case "C":
				return (Model.isUnitMetric ? new Number(value).toFixed(1) :
					Util.CtoFdegrees(value, type === "tempdiff")) + " " + unitT;
			case "%":
				return Math.round(value) + " %";
				break;
			case "bool":
				return (value == 0) ? "Stationary" : "Moving!";
				break;
			default:
				return value + " " + sensors[type].unit;
		}
	};

	this.getLastMotion = function() {
		var dataSeries = dataStruct.now.motion;
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
		//console.log(i + " gives " + dataSeries[i]);
		if(newestTime === 0) {
			return "No recent motion";
		} else {
			//console.log("last moved index: " + i);
			lastMoveTime = diffTime(newestTime);
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

	var settingsLoaded = false;
	this.isReady = function() {
		return settingsLoaded;
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
				Model.currTime = newTime;
				var newDataAge = Math.round(diffTime(Model.currTime) / 1000);
				var syncTime = (newDataAge < Model.UPDATE_RATE_SENSORS && newDataAge >= 5) ?
					newDataAge - 5 : 0;
				console.log(syncTime + " s out of sync");

				for (var i = 0; i < data.datastreams.length; i++) {
					var name = data.datastreams[i].id;
					var value = data.datastreams[i].current_value;

					sensorData.recent[name] = sensorData.current[name]; //save recent value before it's updated
					sensorData.current[name] = value;

					//add to recent data to update dashboard graphs without having to requery db
					dataStruct.now[name].unshift([newTime, value]);
				}

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

	this.getSettings = function(callback) {
		$.get(API_ENDPOINT + "?settings",
			function(settings) {
				callback(settings);
				Model.localWeatherLocation = settings.wxplace;
				Model.UPDATE_RATE_SENSORS = settings.updateRate;
				settingsLoaded = true;
			},
			"json"
		);
	};
};