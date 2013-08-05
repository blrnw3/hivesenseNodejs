var Tables = new function() {

	this.create = function(feed) {
		draw(feed);
	};

	function draw(feed) {
		var sensors = Model.getAllSensors();
		var table = $("#historyTables tbody");
		$.each(feed.datapoints, function(i, point) {
			var row = "<td>"+ $.format.date(point.datetime, "HH:mm") +"</td>";
			$.each(sensors, function(name, sensor) {
				row += "<td>"+ point.channels[name] +"</td>";
			});
			table.append(
				"<tr>"+ row	+"</tr>"
			);
		});
	}

};
