Model.ApiConnector = new function() {
	//Absolute constants
	var API_ENDPOINT_DATA = "/feed";
	var API_ENDPOINT_IMAGE = "/image";
	var API_ENDPOINT_SETTINGS = "/settings";
	var API_ENDPOINT_WX = "/ext/wx";

	this.getTime = function(callback) {
		$.get(API_ENDPOINT_DATA + "?time",
			function(data) {
				callback(data.curr_time);
			}, "json"
		);
	};

	this.getDataCurrent = function(callback) {
		$.get(API_ENDPOINT_DATA + "?current",
			function(data) {
				callback(data);
			}, "json"
		);
	};

	this.getRecentDataValues = function(period, propagateChanges) {
		$.get(API_ENDPOINT_DATA + "?recent=" + period,
			function(data) {
				propagateChanges(data);
			},
			"json"
		);
	};

	this.getHistoricalDataValues = function(date1, date2, format, propagateChanges) {
		$.get(API_ENDPOINT_DATA + "." + format + "?date1=" + date1 + "&date2=" + date2,
			function(data) {
				propagateChanges(data);
			},
			"json"
		).error(function() {
			propagateChanges();
		});
	};

	this.buildApiUrl = function(queryString) {
		return API_ENDPOINT_DATA + queryString;
	};

	this.getHiveCam = function() {
		return API_ENDPOINT_IMAGE + '?uid=_' + Math.random();
	};

	this.getSettings = function(updateUI, updateModel) {
		$.get(API_ENDPOINT_SETTINGS,
			function(settings) {
				updateUI(settings);
				updateModel(settings);
			},
			"json"
		);
	};

	this.getLocalWeather = function(callback, location) {
		$.get(API_ENDPOINT_WX + "?place=" + location,
			function(data) {
				var backup = {
					weather: "Unknown",
					place: "N/A",
					temp: -99,
					time: "HH:mm BST"
				};
				var result = (data.weather === undefined) ? backup : data;
				callback(result);
			},
			"json"
		);
	};

	this.sendSettings = function(settings, callback) {
		$.ajax(API_ENDPOINT_SETTINGS, {
			type: "POST",
			beforeSend: function(request) { request.setRequestHeader("x-hivesensesecurekey", 'blr2013ucl'); },
			contentType: "application/json",
			data: JSON.stringify(settings),
			processData: false,
			complete: function(res) {
				callback(res.status);
			}
		});
	}
};
