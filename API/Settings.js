/**
 * Module: API/Settings.js
 * API resource for manipulating user application settings.
 */

var fs = require('fs');

var util = require('../Model/utillib');
var httpWrite = require('../Model/HttpWriter');

/** Path to physical settings representation */
var settingsFile = "../Storage/settings.json";

/** Password to modify settings */
var authPassword = "livehive";

/**
 * Return all settings
 * @param {Object} res HTTP response
 */
exports.getSettings = function(res) {
	//remove from local cache before returning in case it was changed
	//in the filesystem (locally or by HTTP request)
	delete require.cache[require.resolve(settingsFile)];
	var settings = JSON.stringify(require(settingsFile));
	httpWrite.giveSuccess(res, settings);
};

/**
 * Save setting(s). Exisiting settings are overwritten if a name collision occurs
 * @param {Object} res HTTP response
 * @param {Object} data settings as JSON
 */
exports.saveSettings = function(res, data) {
	var settings = JSON.parse(data);
	console.log(settings);
	if(settings === undefined || settings.password !== authPassword) {
		httpWrite.giveValidationError(res);
	} else {
		delete settings.password; //for security
		var oldSettings = require(settingsFile);
		Object.keys(settings).forEach(function(key) {
			oldSettings[key] = settings[key];
		});
		fs.writeFile("Storage/settings.json",
			JSON.stringify(oldSettings, null, '\t'), function(err) {
				if (err) {
					console.log(err);
					httpWrite.giveFailure(res);
				} else {
					httpWrite.giveSuccess(res);
				}
		 });
		delete require.cache[require.resolve(settingsFile)]; //beat the cache
	}
};
