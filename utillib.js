var http = require('http');


function getFromURL(host, path, handleResponse, resp) {
	var options = {
		hostname: host,
		path: path
	};

	var req = http.request(options, function(res) {
		console.log('External GET status: ' + res.statusCode);
//		console.log('HEADERS: ' + JSON.stringify(res.headers));
		if(res.headers["content-type"].indexOf("application/json") === -1) {
			console.log(res.headers["content-type"]);
			console.log("!ERROR - remote server did not return JSON - ERROR!");
			resp.writeHead(400, {'Content-Type': 'text/plain'});
			resp.end("Bad placename");
			return;
		}
		res.setEncoding('utf8');
		var result = "";
		res.on('data', function(chunk) {
			result += chunk;
		});
		res.on('end', function() {
			handleResponse(resp, result);
		});
	});

	req.on('error', function(e) {
		resp.writeHead(400, {'Content-Type': 'text/plain'});
		resp.end("Bad placename");
	});

	// write data to request body (for POST)
//	req.write('data\n');
//	req.write('data\n');

	req.end();
}

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

//http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

exports.parseDate = function(dateString) {
	if(exports.isNumber(dateString)) {
		return dateString;
	} else {
		return Date.parse(dateString);
	}
}

//exports.isNumber = isNumber;
exports.getFromURL = getFromURL;