var http = require('http');
var httpWrite = require('../Model/HttpWriter');

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
			httpWrite.giveRequestError(resp);
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
		httpWrite.giveRequestError(resp);
	});

	req.end();
};
