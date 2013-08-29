/**
 * Module: Services/AlarmWatcher.js
 * Service for monitoring sensor channels for threshold breaches so alarms can be raised
 */

var fs = require('fs');

/**
 * Checks a current data point against the alarm settings for any breaches.
 * An alarm is raised if there is a breach.
 * Old (buffered) data points are not checked
 * @param {Oject} currentData current data point
 * @returns {undefined}
 */
exports.checkForBreaches = function(currentData) {
	var sensors = {};
	var settings = require("../Storage/settings.json");

	var alarms = settings.alarms;
	var rawSensors = settings.sensors;

	for(var i = 0; i < rawSensors.length; i++) {
		sensors[rawSensors[i].id] = rawSensors[i];
	}

	for(var i = 0; i < alarms.length; i++) {
		var alarm = alarms[i];
		alarm.hivename = settings.hiveName;
		var currentValue = currentData[alarm.sensor];

		//Determine whether to raise an alarm
		if(alarm.email > 0 && currentValue !== undefined) {
			if(alarm.type === "low" && currentValue < alarm.value ||
				alarm.type === "high" && currentValue > alarm.value) {

				 triggerAlarm(alarm, currentValue, sensors[alarm.sensor]);
			}
		}
	}
};

/**
 * Raises an alarm by sending an email
 * @param {Object} alarm details of alarm from the settings
 * @param {number} value current breaching value
 * @param {Object} sensor Channel associated with the alarm
 */
function triggerAlarm(alarm, value, sensor) {
	var alarmID = alarm.label;
	var type = (alarm.type === "high") ? "above" : "below";
	var subject = "Warning from " + alarm.hivename + " - " + alarmID;
	var message = "A threshold for data channel '" + sensor.label + "' has been breached." +
		"\nCurrent value of " + value + " is " + type + " the threshold of " + alarm.value + " " +
		sensor.unit + "\nTake action now to save your bees.";

	//Store record of breaches so the alarm is not raised too frequently
	var breachesFile = "../Storage/alarmBreaches.json";

	delete require.cache[require.resolve(breachesFile)];
	var allBreaches = require(breachesFile);
	var breach = allBreaches.breaches[alarmID];

	var currTime = new Date().getTime();

	var hasChanged = false;
	if(breach === undefined) {
		//First time this alarm has been triggered
		breach = {latest: 0};
		hasChanged = true;
	}
	if(currTime - breach.latest > alarm.email * 3600000) {
		//Alarm not triggered for a while
		breach.latest = currTime;
		sendAlert(subject, message);
		hasChanged = true;
	}

	if(hasChanged) {
		allBreaches.breaches[alarmID] = breach;
		fs.writeFileSync("Storage/alarmBreaches.json", JSON.stringify(allBreaches, null, '\t'));
	}

}

/** Physically send the email */
function sendAlert(subject, message) {
	console.log("email being sent due to threshold breach");
	require('./emailer.js').sendEmail(subject, message);
}
