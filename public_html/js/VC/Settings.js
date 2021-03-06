/**
 * Controller for the user-modifiable settings
 * @namespace ViewContoller
 */
VC.Settings = new function() {

	//Generate the dashboard (dynamically, from pre-set setings)
	var dash = new VC.Dashboard();

	/** Dynamically load the settings view by loading settings from the API */
	this.initialise = function() {
		Model.SettingsManager.loadSettings(function(settings) {
			setUIusingDynamicOptions(settings);
			Model.DataFeed.initialise();
			VC.Graphs.setup();
		});
	};

	/** Save the basic settings to the server */
	function saveGeneralSettings() {
		Model.SettingsManager.setWeatherPlace( $('#settings-general-wxPlace').val() );
		Model.SettingsManager.getWeather(dash.updateWeather);

		var hiveNm = $('#settings-general-hive').val();
		Model.SettingsManager.setHiveName(hiveNm);
		$('#hive-name').text(hiveNm);
	}

	/** Set the alarm settings area */
	function setAlarmFields() {
		var alarmLabel = $('#settings-alarm-choose').find(":selected").text();
		var alarm = Model.AlarmManager.getAlarm(alarmLabel);
		if(alarm === undefined) {
			return;
		}
		$('#settings-alarm-label').val(alarm.label);
		$('#settings-alarm-threshold select').val(alarm.type);
		$('#settings-alarm-threshold input').val(alarm.value);
		$('#settings-alarm-sensor').val(alarm.sensor);
		$('#settings-alarm-email').val(alarm.email);
		$('#settings-alarm-unit').html(Model.SensorManager.getSensor(alarm.sensor).unit);
	}
	/** Set the unit field of the alarm settings area */
	function setAlarmUnit() {
		$('#settings-alarm-unit').html(Model.SensorManager.getSensor($('#settings-alarm-sensor').val()).unit);
	}
	/** Reset the alarm settings area */
	function resetSettingsAlarmFields() {
		$('#settings-alarm-label').val("");
		$($('#settings-alarm-threshold input')[0]).val("");
		$('#settings-alarm-unit').html("");
		$('#settings-alarm-email').val("");
		setAlarmUnit();
	}
	/** Get a numeric value from a @param str string. Return 0 if not a number */
	function getVal(str) {
		var num = parseFloat(str);
		return isNaN(num) ? 0 : num;
	}
	/** Get an alarm object from the alarm settings area fields */
	function getAlarmFromSettingsFields() {
		return {
			label: $('#settings-alarm-label').val(),
			sensor: $('#settings-alarm-sensor').val(),
			type: $('#settings-alarm-threshold select').val(),
			value: getVal($('#settings-alarm-threshold input').val()),
			email: getVal($('#settings-alarm-email').val())
		};
	}

	/** Add an alarm to the settings area,
	 * resetting all alarm fields if @param {Bool} reset is true */
	function addAlarm(reset) {
		var alarm = getAlarmFromSettingsFields();
		Model.AlarmManager.addAlarm(alarm);
		dash.generateAlarm(alarm);
		if(reset) {
			resetSettingsAlarmFields();
		} else {
			$('#settings-alarm-choose option[value="'+alarm.label+'"]').attr("selected","");
			setAlarmFields();
		}
		$("[data-toggle='tooltip']").tooltip();
		dash.updateAlarms();
	}
	/** Delete an alarm from the settings area,
	 * resetting all alarm fields if @param {Bool} reset is true */
	function deleteAlarm(reset) {
		var oldLabel = $('#settings-alarm-choose').val();
		Model.AlarmManager.removeAlarm(oldLabel);
		$('#settings-alarm-choose option[value="'+oldLabel+'"]').remove();
		$('#settings-alarm-choose option:first').attr("selected","");
		if(reset) {
			setAlarmFields();
		}
		$("#alarms [data-label='" + oldLabel + "']").remove();
	}


	/** Bind event listeners to UI 'form' elements */
	this.bindEvents = function() {
		function toggleAlarmSettingUI() {
			$('#settings-alarm-choose').toggle();
			$('#settings-alarm-save').toggle();
			$('#settings-alarm-addy').toggle();
			$('#settings-alarm-delete').toggle();
			$('#settings-alarm-modify').toggleClass('active');
			$('#settings-alarm-add').toggleClass('active');
		}

		function showAlarmChangeSuccess() {
			console.log("showing btn click event - alarm settings success");
			$('#settings-alarm-saved').show().delay(1200).fadeOut('slow');
		}

		function saveAlarm() {
			deleteAlarm(false);
			addAlarm(false);
		}

		$('#settings-alarm-add').click(function() {
			toggleAlarmSettingUI();
			resetSettingsAlarmFields();
		});
		$('#settings-alarm-modify').click(function() {
			toggleAlarmSettingUI();
			setAlarmFields();
		});

		$('#settings-alarm-choose').change(setAlarmFields);
		$('#settings-alarm-sensor').change(setAlarmUnit);

		$('#settings-general-save').click(function() {
			saveGeneralSettings();
			$('#settings-general-saved').show().delay(1200).fadeOut('slow');
		});

		$('#settings-alarm-save').click(function() {
			saveAlarm();
			showAlarmChangeSuccess();
		});
		$('#settings-alarm-delete').click(function() {
			deleteAlarm(true);
			showAlarmChangeSuccess();
		});
		$('#settings-alarm-addy').click(function() {
			addAlarm(true);
			showAlarmChangeSuccess();
		});

		$('#settings-commit').click(function() {
			var password = $("#settings-password");
			Model.SettingsManager.commitSettings(password.val(), function(status) {
				password.val("");
				if(status === 200) {
					$('#settings-saved').show().delay(2500).fadeOut('slow');
				} else {
					$('#settings-notsaved').show().delay(2500).fadeOut('slow');
				}
			});
		});

		$("#settings-advanced-reveal").click(function() {
			$(this).text("Reload JSON");
			$("#settings-advanced").show();
			$("#settings-advanced-full").val("Loading...");
			Model.SettingsManager.getAdvancedSettings(function(settings) {
				$("#settings-advanced-full").val(JSON.stringify(settings, null, '\t'));
			});
		});

		$('#settings-advanced-commit').click(function() {
			var password = $("#settings-advanced-password");
			var settings = $("#settings-advanced-full").val();
			if(Util.isJson(settings)) {
				Model.SettingsManager.commitAdvancedSettings(password.val(), settings, function(status) {
					password.val("");
					if(status === 200) {
						$('#settings-advanced-saved').show().delay(2500).fadeOut('slow');
					} else {
						$('#settings-advanced-notsaved').show().delay(2500).fadeOut('slow');
					}
				});
			} else {
				$('#settings-advanced-notjson').show().delay(2500).fadeOut('slow');
			}
		});


	};

	/** Dynamically set the settings view based on API @param {object} settings */
	function setUIusingDynamicOptions(settings) {
		//add sensors
		$.each(settings.sensors, function(i, sensor) {
			Model.SensorManager.addSensor(sensor);
			$('#settings-alarm-sensor').append("<option value='"+ sensor.id +"'>" + sensor.label + "</option>");
			$('#historyTables thead tr').append("<th>" + sensor.graphOptions.labelShort + "<br /><span class='subtle'>" + sensor.unit + "</span></th>");
			if(!sensor.isdefault) {
				console.log("Generating custom sensor " + sensor.id);
				dash.generateSensorBlock(sensor);
			}
		});

		//add alarms
		$.each(settings.alarms, function(i, alarm) {
			Model.AlarmManager.addAlarm(alarm);
			if(alarm.sensor !== "motion") {
				dash.generateAlarm(alarm);
			}
		});
		setAlarmFields();

		//application heading
		$('#hive-name').text(settings.hiveName);

		//General settings fields
		$('#settings-general-hive').val(settings.hiveName);
		$('#settings-general-wxPlace').val(settings.wxplace);

		//Nice tooltips
		$("[data-toggle='tooltip']").tooltip();
	};

};
