Model.SettingsManager = new function() {

	//Constants
	this.UPDATE_RATE_HISTORY = 1500; // in secs
	this.UPDATE_RATE_WEATHER = 900; // in secs

	//Configured by server settings file
	var updateRate;
	var localWeatherLocation;
	var hiveName;

	var settingsLoaded = false;

	this.loadSettings = function(callback) {
		Model.ApiConnector.getSettings(callback, function(settings) {
			updateRate = settings.updateRate;
			localWeatherLocation = settings.wxplace;
			hiveName = settings.hiveName;
			settingsLoaded = true;
		});
	};

	this.commitSettings = function(pw, callback) {
		var settings = {
			wxplace: localWeatherLocation,
			hiveName: hiveName,
			alarms: Model.AlarmManager.getAlarmsForSetings(),
			password: pw
		};
		Model.ApiConnector.sendSettings(settings, callback);
	};

	this.commitAdvancedSettings = function(pw, settingsStr, callback) {
		var settings = JSON.parse(settingsStr);
		settings.password = pw;
		Model.ApiConnector.sendSettings(settings, callback);
	};

	this.getAdvancedSettings = function(callback) {
		Model.ApiConnector.getSettings(callback, function(settings){});
	};

	this.getWeather = function(updateUI) {
		Model.ApiConnector.getLocalWeather(updateUI, localWeatherLocation);
	};

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
