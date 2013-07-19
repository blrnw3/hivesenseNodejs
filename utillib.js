var http = require('http');

function getFromURL(host, path, handleResponse, resp) {
	var options = {
		hostname: host,
		path: path
	};

	var req = http.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
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

//http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

//exports.isNumber = isNumber;
exports.getFromURL = getFromURL;