var http = require('http');

exports.getFromURL = function(host, path, handleResponse, resp) {
	var options = {
		hostname: host,
		path: path
	};

	var req = http.request(options, function(res) {
		console.log('External GET status: ' + res.statusCode);
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

	req.end();
}
