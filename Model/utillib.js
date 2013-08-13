
exports.jsonToCsv = function(obj, isSimple) {
	var csv = "";
	if(isSimple) {
		csv += "id, value\n";
		for(var i = 0; i < obj.datastreams.length; i++) {
			csv += obj.datastreams[i].id + "," + obj.datastreams[i].current_value + "\n";
		}
		csv += "updated, " + obj.updated;
	} else {
		csv += "year, month, day, hour, minute, second,";

		for(var i = 0; i < obj.datapoints.length; i++) {
			if(i === 0) {
				Object.keys(obj.datapoints[i].channels).forEach(function(key) {
					csv += key + ",";
				});
				csv += "\n";
			}

			var d = new Date(obj.datapoints[i].datetime);
			csv += d.getUTCFullYear() + "," + (d.getUTCMonth()+1) + "," + d.getUTCDate() + ","
				+ d.getUTCHours() + "," + d.getUTCMinutes() + "," + d.getUTCSeconds() + ",";

			Object.keys(obj.datapoints[i].channels).forEach(function(key) {
				csv += obj.datapoints[i].channels[key] + ",";
			});
			csv += "\n";
		}
	}
	return csv;
};

//Source: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

//Parses a javascript timestamp into numeric (unix-style) format
exports.parseDate = function(dateString) {
	if(exports.isNumber(dateString)) {
		return dateString;
	} else {
		return Date.parse(dateString);
	}
};
