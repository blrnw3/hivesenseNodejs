var Tables = new function() {

	this.create = function(feed) {
		draw(feed);
	};

	this.datetimeStart;
	this.datetimeEnd;

	function draw(feed) {
		var means = {};
		Tables.datetimeEnd = feed.datapoints[0].datetime;
		Tables.datetimeStart = feed.datapoints[feed.datapoints.length-1].datetime;

		var sensors = Model.getAllSensors();
		$.each(sensors, function(name) {
			means[name] = 0;
		});

		var table = $("#historyTables tbody");
		$("#historyTables tbody").html("");
		var numPoints = feed.datapoints.length;
		for(var i = numPoints-1; i >= 0; i--) {
			var point = feed.datapoints[i];
//			if(point === undefined) {
//				console.log("no point " + i + " exists");
//				continue;
//			}
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
