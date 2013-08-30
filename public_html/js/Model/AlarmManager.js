/**
 * Manages the Alarms for the Dashboard
 * @namespace Model
 */
Model.AlarmManager = new function() {

	/** Alarms objects as defined by the Settings */
	var alarms = {};

	/**
	 * Get the status of all the alarms (active or not)
	 * @returns {Object} Alarm stati
	 */
	this.getAlarmStati = function() {
		var currentSensorValues = Model.SensorManager.getCurrentSensorValues();
		result = {};
		$.each(alarms, function(i, alarm) {
			if(alarm.type === "high") {
				result[alarm.label] = currentSensorValues[alarm.sensor] > alarm.value;
			} else {
				result[alarm.label] = currentSensorValues[alarm.sensor] < alarm.value;
			}
			result["Disturbance"] = (Model.SensorManager.getLastMoveTime() / 1000) < 3600 ||
				currentSensorValues["motion"] == 1;
		});
		return result;
	};

	/**
	 * Gets an Alarm object
	 * @param {string} label id of the alarm
	 * @returns {Object} Alarm
	 */
	this.getAlarm = function(label) {
		return alarms[label];
	};
	/**
	 * Adds an alarm to the set
	 * @param {Object} Alarm to add
	 */
	this.addAlarm = function(alarm) {
		alarms[alarm.label] = alarm;
	};
	/**
	 * Removes an alarm from the set
	 * @param {String} label alarm id
	 */
	this.removeAlarm = function(label) {
		delete alarms[label];
	};

	/**
	 * Converts the stored alarms into the correct settings API representation (keyless)
	 * @returns {Object} Alarms array
	 */
	this.getAlarmsForSetings = function() {
		return $.map(alarms, function (value) {
					return value;
				});
	};

};
