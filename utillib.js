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
		resp.writeHead(200, {'Content-Type': 'text/plain'});
		resp.end("");
	});

	// write data to request body (for POST)
//	req.write('data\n');
//	req.write('data\n');

	req.end();
}

exports.getFromURL = getFromURL;