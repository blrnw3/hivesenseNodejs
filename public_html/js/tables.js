var Tables = new function() {

	this.create = function(feed) {
		draw(feed);
	};

	this.datetimeStart;
	this.datetimeEnd;

	function draw(feed) {
		Tables.datetimeEnd = feed.datapoints[0].datetime;
		Tables.datetimeStart = feed.datapoints[feed.datapoints.length-1].datetime;

		var sensors = Model.getAllSensors();
		var table = $("#historyTables tbody");
		$("#historyTables tbody").html("");
		$.each(feed.datapoints, function(i, point) {
			var row = "<td>"+ $.format.date(point.datetime, getAppropriateFormat()) +"</td>";
			$.each(sensors, function(name, sensor) {
				row += "<td>"+ point.channels[name] +"</td>";
			});
			table.append(
				"<tr>"+ row	+"</tr>"
			);
		});
	}

	function getAppropriateFormat() {
		var timeGap = (Tables.datetimeEnd - Tables.datetimeStart) / 60000;
		var showSeconds = (Model.UPDATE_RATE_SENSORS < 60) && (timeGap < 300);
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

};
