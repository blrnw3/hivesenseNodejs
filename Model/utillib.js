/**
 * Converts a JSON data point representation into a CSV one
 * @param {object} obj JSON data point(s)
 * @param {bool} isSimple If one data point only
 * @returns {String} CSV representation
 */
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

/**
 * Checks that input is a number
 * Source: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
 * @param {string} n number to check
 * @returns true if finite and numeric
 */
exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

/**
 * Parses a javascript timestamp into numeric (Unix-style) format
 * @param {string} dateString
 * @returns Unix timestamp (in milliseconds), or NaN on failure
 */
exports.parseDate = function(dateString) {
	if(exports.isNumber(dateString)) {
		return dateString;
	} else {
		return Date.parse(dateString);
	}
};
