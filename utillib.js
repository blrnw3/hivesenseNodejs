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
		var flats = [];
		csv += "year, month, day, hour, minute, second,";
		for(var i = 0; i < obj.datastreams.length; i++) {
			csv += obj.datastreams[i].id + ",";
			for(var j = 0; j < obj.datastreams[i].datapoints.length; j++) {
				if(flats[j] === undefined) {
					flats[j] = [];
				}
				flats[j][i] = [obj.datastreams[i].datapoints[j].value, obj.datastreams[i].datapoints[j].at];
			}
		}
		csv += "\n";
		for(var i = 0; i < flats.length; i++) {
				var d = new Date(flats[i][0][1]);
				csv += d.getUTCFullYear() + "," + (d.getUTCMonth()+1) + "," + d.getUTCDate() + ","
				 + d.getUTCHours() + "," + d.getUTCMinutes() + "," + d.getUTCSeconds() + ",";
			for(var j = 0; j < flats[i].length; j++) {
				csv += flats[i][j][0] + ",";
			}
			csv += "\n";
		}
	}
	return csv;
};

//http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

//exports.isNumber = isNumber;
exports.getFromURL = getFromURL;