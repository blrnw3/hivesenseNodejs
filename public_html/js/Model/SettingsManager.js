/**
 * Utility functions
 * @namespace Model
 */
Model.SettingsManager = new function() {

	/** Frequency at which to update the historical data feeds, in seconds */
	this.UPDATE_RATE_HISTORY = 1500;
	/** Frequency at which to update the weather feed, in seconds */
	this.UPDATE_RATE_WEATHER = 900;

	//Configured by server settings file
	/** Update frequency for retrieving the data feed */
	var updateRate;
	/** Place name for the weather feed */
	var localWeatherLocation;
	/** Name of the hive to show on the Dashboard */
	var hiveName;

	var settingsLoaded = false;

	/**
	 * Load the server-stored settings
	 * @param {function} callback executed on retrieval
	 */
	this.loadSettings = function(callback) {
		Model.ApiConnector.getSettings(callback, function(settings) {
			updateRate = settings.updateRate;
			localWeatherLocation = settings.wxplace;
			hiveName = settings.hiveName;
			settingsLoaded = true;
		});
	};

	/**
	 * Save the settings (set by the user on the GUI) to the server
	 * @param {String} pw password required by server
	 * @param {function} callback executed on retrieval
	 */
	this.commitSettings = function(pw, callback) {
		var settings = {
			wxplace: localWeatherLocation,
			hiveName: hiveName,
			alarms: Model.AlarmManager.getAlarmsForSetings(),
			password: pw
		};
		Model.ApiConnector.sendSettings(settings, callback);
	};

	/**
	 * Replace the server settings with the user-modifed set
	 * @param {String} pw password required by server
	 * @param {String} settingsStr
	 * @param {function} callback executed on retrieval
	 */
	this.commitAdvancedSettings = function(pw, settingsStr, callback) {
		var settings = JSON.parse(settingsStr);
		settings.password = pw;
		Model.ApiConnector.sendSettings(settings, callback);
	};

	/** Load the server-stored settings purely for display */
	this.getAdvancedSettings = function(callback) {
		Model.ApiConnector.getSettings(callback, function(settings){});
	};

	/** Get the weather feed */
	this.getWeather = function(updateUI) {
		Model.ApiConnector.getLocalWeather(updateUI, localWeatherLocation);
	};

	/**
	 * Check whether the settings have been loaded so are ready to modify
	 * @returns {Boolean} true when the settings have been loaded and processed
	 */
	this.isReady = function() {
		return settingsLoaded;
	};

	this.getWeatherPlace = function() {
		return localWeatherLocation;
	};
	this.setWeatherPlace = function(place) {
		localWeatherLocation = place;
	};

	this.getHiveName = function() {
		return hiveName;
	};
	this.setHiveName = function(name) {
		hiveName = name;
	};

	this.getUpdateRate = function() {
		return updateRate;
	};
};
