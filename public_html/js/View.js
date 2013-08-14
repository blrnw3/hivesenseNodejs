var View = new function() {

	var trendArrowUnicodes = {
		level: '&#x25ac;',
		down: '&#x25bc;',
		up: '&#x25b2;'
	};

	this.isInactive = false;
	this.LEDclass = 'success';

	this.deactivate = function() {
		$('#updated-led').removeClass('badge-success');
		$('#updated-led').addClass('.badge-important');
		View.isInactive = true;
		View.LEDclass = 'important';
		return true;
	};
	this.activate = function() {
		$('#updated-led').removeClass('.badge-important');
		$('#updated-led').addClass('.badge-success');
		View.isInactive = false;
		View.LEDclass = 'success';
		return;
	};

	this.flashTime = function() {
		$('#updated-led').toggleClass('badge-'+View.LEDclass + ' badge-warning');
	};

	this.updateSensorBlocks = function() {
		$.each(Model.getSensorData(), function(key, val) {
			$("#sensor-value-" + key).html(val.value);
			var e = $("#sensor-trend-" + key);
			if(val.trend !== undefined) {
				e.attr("class", "trend-arrow arrow-" + val.trend);
				e.html( trendArrowUnicodes[val.trend] );
			}
		});
	};

	function getLED(isBad) {
		var colour = isBad ? "Red" : "Green";
		return 'img/LED_' +colour+'.png';
	}

	this.updateAlarms = function() {
		$.each(Model.getAlarmStati(), function(key, value) {
			$("#alarms [data-label='" + key + "'] img").attr('src', getLED(value));
		});
	};

	this.updateCamera = function() {
		$('#camera').attr('src', Model.getHiveCam());
	};
	this.updateTime = function() {
		$('#updated-date').html($.format.date(Model.currTime, "HH:mm:ss UTC, ddd dd MMMM yyyy"));
	};
	this.updateAgo = function() {
		$('#updated-ago').html( Model.updated_ago() );
	};
	this.updateLastMotion = function() {
		$('#sensor-trend-motion').html( Model.getLastMotion() );
	};

	this.updateWeather = function(wx) {
		$('#weather-place').html( wx.place );
		$('#weather-weather').html( wx.weather + ", " + Model.convert(wx.temp, "temp1") );
		$('#weather-time').html($.format.date((wx.time) * 1000, "HH:mm"));
	};

	function switchPage(target) {
		for(var i = 0; i < Model.pages.length; i++) {
			if(Model.pages[i] === target) {
				$("#"+target).show(0);
				$("#li-"+target).attr("class", "active");
			} else {
				$("#"+Model.pages[i]).hide(0);
				$("#li-"+Model.pages[i]).attr("class", "");
			}
		}

		Graphs.replot();
		loadDefaultSettings();
	};

	function loadDefaultSettings() {
		$('#wxPlace').val(Model.localWeatherLocation);
	};

	function saveGeneralSettings() {
		Model.setWeatherLocation( $('#settings-general-wxPlace').val() );
		Model.getLocalWeather(View.updateWeather);

		var hiveNm = $('#settings-general-hive').val();
		Model.setHiveName(hiveNm);
		$('#hive-name').text(hiveNm);
	}

	function setAlarmFields() {
		var alarmLabel = $('#settings-alarm-choose').find(":selected").text();
		var alarm = Model.getAlarm(alarmLabel);
		if(alarm === undefined) {
			return;
		}
		$('#settings-alarm-label').val(alarm.label);
		$('#settings-alarm-threshold select').val(alarm.type);
		$('#settings-alarm-threshold input').val(alarm.value);
		$('#settings-alarm-sensor').val(alarm.sensor);
		$('#settings-alarm-email').val(alarm.email);
		$('#settings-alarm-unit').html(Model.getSensor(alarm.sensor).unit);
	}
	function setAlarmUnit() {
		$('#settings-alarm-unit').html(Model.getSensor($('#settings-alarm-sensor').val()).unit);
	}
	function resetSettingsAlarmFields() {
		$('#settings-alarm-label').val("");
		$($('#settings-alarm-threshold input')[0]).val("");
		$('#settings-alarm-unit').html("");
		$('#settings-alarm-email').val("");
		setAlarmUnit();
	}
	function getVal(str) {
		var num = parseFloat(str);
		return isNaN(num) ? 0 : num;
	}
	function getAlarmFromSettingsFields() {
		return {
			label: $('#settings-alarm-label').val(),
			sensor: $('#settings-alarm-sensor').val(),
			type: $('#settings-alarm-threshold select').val(),
			value: getVal($('#settings-alarm-threshold input').val()),
			email: getVal($('#settings-alarm-email').val())
		};
	}

	function addAlarm(reset) {
		var alarm = getAlarmFromSettingsFields();
		Model.addAlarm(alarm);
		generateAlarm(alarm);
		if(reset) {
			resetSettingsAlarmFields();
		} else {
			$('#settings-alarm-choose option[value="'+alarm.label+'"]').attr("selected","");
			setAlarmFields();
		}
		$("[data-toggle='tooltip']").tooltip();
		View.updateAlarms();
	}
	function deleteAlarm(reset) {
		var oldLabel = $('#settings-alarm-choose').val();
		Model.removeAlarm(oldLabel);
		$('#settings-alarm-choose option[value="'+oldLabel+'"]').remove();
		$('#settings-alarm-choose option:first').attr("selected","");
		if(reset) {
			setAlarmFields();
		}
		$("#alarms [data-label='" + oldLabel + "']").remove();
	}
	function saveAlarm() {
		deleteAlarm(false);
		addAlarm(false);
	}


	function bindEvents() {
		console.log("binding events");

		$('#unit_EU').click(function() {
			Model.isUnitMetric = true;
			View.updateSensorBlocks();
		});
		$('#unit_US').click(function() {
			Model.isUnitMetric = false;
			View.updateSensorBlocks();
		});

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
			Model.commitSettings(password.val(), function(status) {
				console.log(status);
				password.val("");
				if(status === 200) {
					$('#settings-saved').show().delay(2500).fadeOut('slow');
				} else {
					$('#settings-notsaved').show().delay(2500).fadeOut('slow');
				}
			});
		});

		for(var i = 0; i < Model.pages.length; i++) {
			//Use closure to bind loop var (i) to each listener, i.e. keep i in scope for the clickListener function
			//Source: http://stackoverflow.com/questions/13227360/javascript-attach-events-in-loop?lq=1
			(function(i) {
				$("#li-"+Model.pages[i]).click( function() {
					switchPage(Model.pages[i]);
				});
			}(i));
		}

	};

	this.loadUI = function() {
		bindEvents();
	};

	this.setUIusingDynamicOptions = function(settings) {
		//add sensors
		$.each(settings.sensors, function(i, sensor) {
			Model.addSensor(sensor);
			$('#settings-alarm-sensor').append("<option value='"+ sensor.id +"'>" + sensor.label + "</option>");
			$('#historyTables thead tr').append("<th>" + sensor.graphOptions.labelShort + "<br /><span class='subtle'>" + sensor.unit + "</span></th>");
			if(!sensor.isdefault) {
				console.log("Generating custom sensor " + sensor.id);
				generateSensorBlock(sensor);
			}
		});

		//add alarms
		$.each(settings.alarms, function(i, alarm) {
			Model.addAlarm(alarm);
			if(alarm.sensor !== "motion") {
				generateAlarm(alarm);
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

	var date1;
	var date2;
	this.initialiseDatepickers = function() {
		date1 = Tables.datetimeStart;
		date2 = Tables.datetimeEnd;

		var initalD = new Date(date1);
		initalD.setMinutes(0);
		var datepickerOptions = {
			weekStart: 1,
			autoclose: 1,
			todayHighlight: 1,
			initialDate: initalD,
			startView: 2,
			pickerPosition: "bottom-left",
			maxView: 3,
			minView: 1
		};
		var dp_from = $('#dtpicker-from').datetimepicker(datepickerOptions);
		var dp_to = $('#dtpicker-to').datetimepicker(datepickerOptions);
		dp_from.on('changeDate', function(ev) {
			date1 = Date.parse(ev.date) + ev.date.getTimezoneOffset() * 60000;
		});
		dp_to.on('changeDate', function(ev) {
			date2 = Date.parse(ev.date) + ev.date.getTimezoneOffset() * 60000;
		});

		$("#table-load").click(function() {
			var thisBtn = $(this);
			thisBtn.button('loading');
			Model.getHistoricalDataValues(date1, date2, "json", function(feed) {
				var failureGUI = $("#history-failed");
				if(feed === undefined) {
					failureGUI.show();
				} else {
					failureGUI.hide();
					setHistoryTableTitle();
					Tables.create(feed);
				}
				thisBtn.button('reset');
			});
		});

		$("#export button").click(function() {
			var format = $("#export input[type=radio]:checked").val();
			window.open(Model.buildApiUrl("." + format + "?date1=" + date1 + "&date2=" + date2));
		});

		setHistoryTableTitle();
	};
	function setHistoryTableTitle() {
		function format(date) {
			return $.format.date(date, "HH:mm UTC, ddd dd MMMM yyyy");
		}
		$('#history-table-title').html("All available data (appropriately sampled) from<br />" + format(date1) + " to " + format(date2));
	}

	function generateAlarm(alarm) {
		var sensorInfo = Model.getSensor(alarm.sensor);
		var id = "data-label='" + alarm.label+ "' ";
		var title = sensorInfo.label + " &" +
			((alarm.type === "high") ? "g" : "l") +
			"t; " + alarm.value + " " + sensorInfo.unit;

		$("#alarms").append("<tr "+ id +
			"data-toggle='tooltip' title='"+ title +"'>" +
				"<td><img src='img/LED_Blue.png' alt='' /></td>" +
				"<td>"+ alarm.label +"</td>" +
			"</tr>"
		);
		$('#settings-alarm-choose').append("<option value='"+ alarm.label +"'>" + alarm.label + "</option>");
	};

	function generateSensorBlock(sensor) {

		//Add class rules for sensors in HTML style element
		$("#dynamic-style").append('\n\
			.bg-'+ sensor.id + ' {\
				background-image: url(../img/'+ sensor.image + ');\
			}\
			.sensor-'+ sensor.id + ' {\
				border-color: '+ sensor.colour1 + ';\
				background-color: '+ sensor.colour2 + ';\
			}'
		);

		//append sensorBlocks to DOM
		$("#sensors").append('\n\
			<div class="row-fluid">\
					<div class="span6">\
						<div class="row-fluid">\
							<div class="span12 sensor sensor-'+ sensor.id + '">\
								<div class="span5 bg-sensor bg-'+ sensor.id + ' bg-channel" data-toggle="tooltip" title="'+ sensor.label +'">\
									&nbsp;\
								</div>\
								<div class="span7 text-center text-sensor">\
									<div class="high-line subtle">\
										<span id="sensor-value-'+ sensor.id + '" class="sensor-value-text">xx %</span> \
										<span id="sensor-trend-'+ sensor.id + '" class="arrow-none trend-arrow">&#x25ac;</span>\
									</div>\
								</div>\
							</div>\
						</div>\
					</div>\
					<div id="sensor-graph-'+ sensor.id + '" class="span6 sensor-graph-custom"></div>\
				</div>'
		);
	};

};