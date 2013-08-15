Model.AlarmManager = new function() {
	var alarms = {};

	this.getAlarmStati = function() {
		var currentSensorValues = Model.SensorManager.getCurrentSensorValues();
		result = {};
		$.each(alarms, function(i, alarm) {
			if(alarm.type === "high") {
				result[alarm.label] = currentSensorValues[alarm.sensor] > alarm.value;
			} else {
				result[alarm.label] = currentSensorValues[alarm.sensor] < alarm.value;
			}
			result["Disturbance"] = (Model.SensorManager.getLastMoveTime() / 1000) < 3600 || currentSensorValues["motion"] == 1;
		});
		return result;
	};

	this.getAlarm = function(label) {
		return alarms[label];
	};
	this.addAlarm = function(alarm) {
		alarms[alarm.label] = alarm;
	};
	this.removeAlarm = function(label) {
		delete alarms[label];
	};

	this.getAlarmsForSetings = function() {
		return $.map(alarms, function (value) {
					return value;
				});
	};

};
