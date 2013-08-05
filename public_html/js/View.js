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
		//var upLED = $('#updated-led');
		//upLED.removeClass('badge-'+View.LEDclass);
		$('#updated-led').toggleClass('badge-'+View.LEDclass + ' badge-warning');
	};

	this.updateSensorBlocks = function() {
		$.each(Model.getSensors(), function(key, val) {
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
		$.each(Model.getAlarms(), function(key, value) {
			$(key).attr('src', getLED(value));
		});
	};

	this.updateCamera = function() {
		$('#camera').attr('src', 'feed?hivecam&uid=_' + Model.currTime);
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

	function processSettings_general() {
		Model.saveSetting( "wxplace", $('#wxPlace').val() );
		Model.getLocalWeather(View.updateWeather);

		//Not yet implemented
		console.log($('#settings-general-hive').val());
		console.log($('#settings-general-email').val());
	}
	function processSettings_alarms() {
		var newLabel = $('#settings-alarm-label').val();
		var alarm = {
			label: newLabel,
			sensor: $('#settings-alarm-sensor').val(),
			type: $($('#settings-alarm-threshold select')[0]).val(),
			value: $($('#settings-alarm-threshold input')[0]).val(),
			email: $('#settings-alarm-email').val()
		};
		var oldLabelList = $('#settings-alarm-choose');
		var oldLabel = ($('#settings-alarm-add').attr('class') === 'active') ? undefined : oldLabelList.val();
		console.log("Old label: " + oldLabel);
		Model.setAlarm(alarm, oldLabel);
		var oldLabelOption = $('#settings-alarm-choose option[value="'+ oldLabel +'"]');
		oldLabelOption.val(newLabel);
		oldLabelOption.text(newLabel);
//		Model.saveSetting("alarms", 3);
//		View.updateAlarms();
	}

	function bindEvents() {
		console.log("binding events");

		$('#unit_EU').bind('click', function() {
			Model.isUnitMetric = true;
			View.updateSensorBlocks();
		});
		$('#unit_US').bind('click', function() {
			Model.isUnitMetric = false;
			View.updateSensorBlocks();
		});

		$('#settings-x-y').bind('click', function() {
		});

		$('#settings-alarm-add').bind('click', function() {
			$('#settings-alarm-modify').removeClass('active');
			$(this).addClass('active');
			$('#settings-alarm-choose').hide();
			$('#settings-alarm-label').val("");
			$($('#settings-alarm-threshold input')[0]).val("");
			$('#settings-alarm-unit').html("");
			$('#settings-alarm-email').val("");
		});
		$('#settings-alarm-modify').bind('click', function() {
			$('#settings-alarm-add').removeClass('active');
			$(this).addClass('active');
			$('#settings-alarm-choose').show();
			setAlarmFields();
		});

		function setAlarmFields() {
			var alarmLabel = $('#settings-alarm-choose').find(":selected").text();
			var alarm = Model.getAlarm(alarmLabel);
			$('#settings-alarm-label').val(alarm.label);
			$('#settings-alarm-sensor').val(alarm.sensor);
			$($('#settings-alarm-threshold select')[0]).val(alarm.type);
			$($('#settings-alarm-threshold input')[0]).val(alarm.value);
			$('#settings-alarm-unit').html(Model.getSensor(alarm.sensor).unit);
			$('#settings-alarm-email').val(alarm.email);
		}

		$('#settings-alarm-choose').change(setAlarmFields);

		$('#settings-general-save').bind('click', function() {
			processSettings_general();
			$('#settings-general-saved').show().delay(1500).fadeOut('slow');
		});

		$('#settings-alarm-save').bind('click', function() {
			processSettings_alarms();
			$('#settings-alarm-saved').show().delay(1500).fadeOut('slow');
		});
		$('#settings-alarm-delete').bind('click', function() {
			deleteAlarm();
			$('#settings-alarm-saved').show().delay(1500).fadeOut('slow');
		});

		$('#settings-commit').bind('click', function() {
			var password = $("#settings-password");
			Model.commitSettings(password.val(), function(status) {
				console.log(status);
				password.val("");
				if(status === 200) {
					$('#settings-saved').show().delay(1500).fadeOut('slow');
				} else {
					$('#settings-notsaved').show().delay(1500).fadeOut('slow');
				}
			});
		});

		for(var i = 0; i < Model.pages.length; i++) {
			//Use closure to bind loop var (i) to each listener, i.e. keep i in scope for the clickListener function
			//Source: http://stackoverflow.com/questions/13227360/javascript-attach-events-in-loop?lq=1
			(function(i) {
				$("#li-"+Model.pages[i]).click( function() {
					//console.log(Model.pages[i] + " bado");
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
			$('#historyTables thead tr').append("<th>" + sensor.graphOptions.labelShort + " / " + sensor.unit + "</th>");
			if(!sensor.isdefault) {
				console.log("Generating custom sensor " + sensor.id);
				generateSensorBlock(sensor);
			}
		});

		//add alarms
		$.each(settings.alarms, function(i, alarm) {
			Model.addAlarm(alarm);
			generateAlarm(alarm);
		});

		//application heading
		$('#hive-name').html(settings.hiveName);

		//Nice tooltips
		$("[data-toggle='tooltip']").tooltip();
	};


	function generateAlarm(alarm) {
		if(alarm.sensor === "motion") {
			return;
		}
		var sensorInfo = Model.getSensor(alarm.sensor);
		var id = "alarm-" + alarm.sensor + "-" + alarm.type;
		var title = sensorInfo.label + " &" +
			((alarm.type === "high") ? "g" : "l") +
			"t; " + alarm.value + " " + sensorInfo.unit;
		$("#alarms").append("<tr data-toggle='tooltip' title='"+ title +"'>" +
			"<td><img id='"+ id +"' src='img/LED_Blue.png' alt='' /></td>" +
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