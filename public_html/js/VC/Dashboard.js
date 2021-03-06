/**
 * Controller for the Dashboard View
 * @namespace ViewController
 */
VC.Dashboard = function() {

	/** Unicode values for the three possible channel trend indicators */
	var trendArrowUnicodes = {
		level: '&#x25ac;',
		down: '&#x25bc;',
		up: '&#x25b2;'
	};

	/** Dash status - active (data feed alive), or inactive (frozen feed) */
	var isInactive = false;
	/** Class for the activity LED */
	var LedClass = 'success';

	/** Refresh the UI elements of the Dash */
	this.refresh = function() {
		updateSensorBlocks();
		updateLastMotion();
		updateCamera();
		updateTime();

		this.updateAlarms();
		this.updateAgo();
	};

	/** Update the Dash by retriveing last ~3hrs data points from the API */
	this.getRecentHistory = function() {
		Model.ApiConnector.getRecentDataValues("3h", function(feed) {
			Model.DataFeed.saveDataFeed(feed, "now");
			updateLastMotion();
			VC.Graphs.replot();
		});
	};

	/** Set the active/inactive status of the Dash */
	this.setStatus = function() {
		if(Model.TimeManager.isOld()) {
			if(!isInactive) {
				deactivate();
			}
		} else if(isInactive) {
			activate();
		}
	};

	/** Turn the LED status indicator to amber */
	this.flashTime = function() {
		$('#updated-led').toggleClass('badge-'+LedClass + ' badge-warning');
	};

	/** Get status for the Alarms area and refresh it */
	this.updateAlarms = function() {
		$.each(Model.AlarmManager.getAlarmStati(), function(key, value) {
			$("#alarms [data-label='" + key + "'] img").attr('src', getLED(value));
		});
	};

	/** Update the time of last data element */
	this.updateAgo = function() {
		$('#updated-ago').html( Model.TimeManager.updated_ago() );
	};

	/** Update the local weather report area */
	this.updateWeather = function(wx) {
		$('#weather-place').html( wx.place );
		$('#weather-weather').html( wx.weather + ", " + Model.SensorManager.convert(wx.temp, "temp1") );
		$('#weather-time').html($.format.date((wx.time) * 1000, "HH:mm"));
	};

	/** Bind event listeners to any interactive Dash elements */
	this.bindEvents = function() {
		$('#unit_EU').click(function() {
			Model.SensorManager.setMetric();
			updateSensorBlocks();
		});
		$('#unit_US').click(function() {
			Model.SensorManager.setImperial();
			updateSensorBlocks();
		});
	};

	/** Dynamically generate an Alarm for the alarms area */
	this.generateAlarm = function(alarm) {
		var sensorInfo = Model.SensorManager.getSensor(alarm.sensor);
		if(sensorInfo === undefined) {
			console.log("Cannot generate alarm for unknown sensor");
			return;
		}
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

	/** Dynamically generate an Sensor (channel) block for the sensors area */
	this.generateSensorBlock = function(sensor) {
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

		//append sensorBlock to DOM
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

	/** Update the special "time of last disturbance" element */
	function updateLastMotion() {
		$('#sensor-trend-motion').html( Model.SensorManager.getLastMotion() );
	};

	/** Deactive the Dashboard (frozen data feed) */
	function deactivate() {
		$('#updated-led').removeClass('badge-success');
		$('#updated-led').addClass('.badge-important');
		isInactive = true;
		LedClass = 'important';
		return true;
	};
	/** Re-activate the Dash (live data feed resumed from frozen) */
	 function activate() {
		$('#updated-led').removeClass('.badge-important');
		$('#updated-led').addClass('.badge-success');
		isInactive = false;
		LedClass = 'success';
		return;
	};

	/** Update the Sensor clocks area */
	function updateSensorBlocks() {
		$.each(Model.SensorManager.getSensorData(), function(key, val) {
			$("#sensor-value-" + key).html(val.value);
			var e = $("#sensor-trend-" + key);
			if(val.trend !== undefined) {
				e.attr("class", "trend-arrow arrow-" + val.trend);
				e.html( trendArrowUnicodes[val.trend] );
			}
		});
	};

	/**
	 * Get the correct LED for an Alarm
	 * @param {Bool} isBad true if the alarm is active (threshold breached)
	 */
	function getLED(isBad) {
		var colour = isBad ? "Red" : "Green";
		return 'img/LED_' +colour+'.png';
	}

	/** Update the camera area */
	function updateCamera() {
		$('#camera').attr('src', Model.ApiConnector.getHiveCam());
	};
	
	/** Update thedata feed time element */
	function updateTime() {
		$('#updated-date').html($.format.date(Model.TimeManager.currTime, "HH:mm:ss, ddd dd MMMM yyyy"));
	};
};
