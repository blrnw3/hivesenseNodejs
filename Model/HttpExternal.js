/**
 * Module: Model/HttpExternal.js
 * Makes HTTP requests to external web servers
 */

var http = require('http');
var httpWrite = require('../Model/HttpWriter');

/**
 * Make a GET request to an external server and process the reposnse
 * @param {string} host base URL for host
 * @param {string} path rest of URL
 * @param {type} handleResponse response handler
 * @param {Object} resp HTTP response
 */
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
		//Handle the returned data
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
