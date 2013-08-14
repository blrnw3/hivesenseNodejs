var fs = require('fs');

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

		if(alarm.email > 0 && currentValue !== undefined) {
			if(alarm.type === "low" && currentValue < alarm.value ||
				alarm.type === "high" && currentValue > alarm.value) {

					triggerAlarm(alarm, currentValue, sensors[alarm.sensor]);
			}
		}
	}
};

function triggerAlarm(alarm, value, sensor) {
	var alarmID = alarm.label;
	var type = (alarm.type === "high") ? "above" : "below";
	var subject = "Warning from " + alarm.hivename + " - " + alarmID;
	var message = "A threshold for data channel '" + sensor.label + "' has been breached." +
		"\nCurrent value of " + value + " is " + type + " the threshold of " + alarm.value + " " +
		sensor.unit + "\nTake action now to save your bees.";

	var breachesFile = "../Storage/alarmBreaches.json";

	delete require.cache[require.resolve(breachesFile)];
	var allBreaches = require(breachesFile);
	var breach = allBreaches.breaches[alarmID];

	var currTime = new Date().getTime();

	var hasChanged = false;
	if(breach === undefined) {
		breach = {latest: 0};
		hasChanged = true;
	}
	if(currTime - breach.latest > alarm.email * 3600000) {
		breach.latest = currTime;
		sendAlert(subject, message);
		hasChanged = true;
	}

	if(hasChanged) {
		allBreaches.breaches[alarmID] = breach;
		fs.writeFileSync("Storage/alarmBreaches.json", JSON.stringify(allBreaches, null, '\t'));
	}

}

function sendAlert(subject, message) {
	console.log("email being sent due to threshold breach");
	require('./emailer.js').sendEmail(subject, message);
}
