/**
 * Executes AJAX calls to the API to retrieve resources,
 * and triggers any passed callbacks.
 * Also manages API URLs
 * @namespace Model
 */
Model.ApiConnector = new function() {
	//Absolute constants
	var API_ENDPOINT_DATA = "/feed";
	var API_ENDPOINT_IMAGE = "/image";
	var API_ENDPOINT_SETTINGS = "/settings";
	var API_ENDPOINT_WX = "/ext/wx";

	/** Gets accurate UTC timestamp */
	this.getTime = function(callback) {
		$.get(API_ENDPOINT_DATA + "?time",
			function(data) {
				callback(data.curr_time);
			}, "json"
		);
	};

	/** Gets current data feed */
	this.getDataCurrent = function(callback) {
		$.get(API_ENDPOINT_DATA + "?current",
			function(data) {
				callback(data);
			}, "json"
		);
	};

	/** Gets recent data feed for a named @param period */
	this.getRecentDataValues = function(period, propagateChanges) {
		$.get(API_ENDPOINT_DATA + "?recent=" + period,
			function(data) {
				propagateChanges(data);
			},
			"json"
		);
	};

	/**
	 * Gets historical data feed
	 * @param {String} date1 JS timestamp for start date
	 * @param {String} date2 JS timestamp for end date
	 * @param {String} format desired type of the response data (JSON, CSV, XML...)
	 */
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

	/**
	 * Gets the URL for a specific request to the data point API resource
	 * @param {String} queryString for a specific feed
	 * @returns {String} URL
	 */
	this.buildApiUrl = function(queryString) {
		return API_ENDPOINT_DATA + queryString;
	};

	/**
	 * Gets the API URL of the hive camera image resource
	 * @returns {String} URL
	 */
	this.getHiveCam = function() {
		return API_ENDPOINT_IMAGE + '?uid=_' + Math.random();
	};

	/**	Gets the API settings resource */
	this.getSettings = function(updateUI, updateModel) {
		$.get(API_ENDPOINT_SETTINGS,
			function(settings) {
				updateUI(settings);
				updateModel(settings);
			},
			"json"
		);
	};

	/**
	 * Gets the API weather resource for a named UK city
	 * @param {type} location city name
	 */
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

	/** Commit settings to the API */
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
