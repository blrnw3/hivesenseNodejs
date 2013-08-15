VC.Tables = new function() {

	this.getRecentHistory = function() {
		Model.ApiConnector.getRecentDataValues("1d", function(feed) {
			Model.DataFeed.saveDataFeed(feed, "day");
			draw(feed);
			initialiseDatepickers();
		});
	};

	var datetimeStart;
	var datetimeEnd;

	function draw(feed) {
		var means = {};
		datetimeEnd = feed.datapoints[0].datetime;
		datetimeStart = feed.datapoints[feed.datapoints.length-1].datetime;

		var sensors = Model.SensorManager.getAllSensors();
		$.each(sensors, function(name) {
			means[name] = 0;
		});

		var table = $("#historyTables tbody");
		$("#historyTables tbody").html("");
		var numPoints = feed.datapoints.length;
		for(var i = numPoints-1; i >= 0; i--) {
			var point = feed.datapoints[i];
			var row = "<td>"+ $.format.date(point.datetime, getAppropriateFormat()) +"</td>";
			$.each(sensors, function(name) {
				var val = point.channels[name];
				if(val === undefined) {
					val = "-";
				}
				row += "<td>"+ val +"</td>";
				means[name] += val * 1.0;
			});
			table.append(
				"<tr>"+ row	+"</tr>"
			);
		};
		var tfoot = "<tr><td>Mean</td>";
		$.each(means, function(i, val) {
			tfoot += "<td>" + (val / numPoints).toFixed(1) + "</td>";
		});
		$("#historyTables tfoot").html("<tr>"+ tfoot +"</tr>");
	}

	function getAppropriateFormat() {
		var timeGap = (datetimeEnd - datetimeStart) / 60000;
		var showSeconds = (Model.SettingsManager.getUpdateRate() < 60) && (timeGap < 300);
		var showDayMonth = (timeGap > 600);
		var showYear =(timeGap > 1440 * 100);

		var format = "HH:mm";
		if(showSeconds) {
			format += ":ss";
		}
		if(showDayMonth) {
			format += " dd MMM";
		}
		if(showYear) {
			format += " yyyy";
		}

		return format;
	}

	function initialiseDatepickers() {
		var initalD = new Date(datetimeStart);
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
			datetimeStart = Date.parse(ev.date) + ev.date.getTimezoneOffset() * 60000;
		});
		dp_to.on('changeDate', function(ev) {
			datetimeEnd = Date.parse(ev.date) + ev.date.getTimezoneOffset() * 60000;
		});

		$("#table-load").click(function() {
			var thisBtn = $(this);
			thisBtn.button('loading');
			Model.ApiConnector.getHistoricalDataValues(datetimeStart, datetimeEnd, "json", function(feed) {
				var failureGUI = $("#history-failed");
				if(feed === undefined) {
					failureGUI.show();
				} else {
					failureGUI.hide();
					setHistoryTableTitle();
					draw(feed);
				}
				thisBtn.button('reset');
			});
		});

		$("#export button").click(function() {
			var format = $("#export input[type=radio]:checked").val();
			window.open(Model.ApiConnector.buildApiUrl("." + format + "?datetimeStart=" + datetimeStart + "&datetimeEnd=" + datetimeEnd));
		});

		setHistoryTableTitle();
	};

	function setHistoryTableTitle() {
		function format(date) {
			return $.format.date(date, "HH:mm UTC, ddd dd MMMM yyyy");
		}
		$('#history-table-title').html("All available data (appropriately sampled) from<br />" + format(datetimeStart) + " to " + format(datetimeEnd));
	}

};
