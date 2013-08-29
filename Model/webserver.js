/**
 * Module: Webserver.js
 * Boots and runs the web server.
 */

var http = require('http');
var url = require('url');
var HttpWrite = require('./HttpWriter');

/**
 * Initiates the web server so requests can be made and sent.
 * Requests are handled by a URL router
 * Source for creating the web server:
 * http://www.windowsazure.com/en-us/develop/nodejs/tutorials/create-a-website-%28mac%29/
 * @param {object} route URL routing function
 */
exports.boot = function(route) {
	var port = process.env.PORT || 1337; //Azure says so
	http.createServer(
		function(req, res) {
			var path = url.parse(req.url, true);
			if(path.pathname === "/favicon.ico") {
				return;
			}

			var d = new Date();
			console.log(d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() +
				" " + req.method + " request made for " + req.url);

			//Handle PUT/POST request body payload
			if (req.method === "PUT" || req.method === "POST") {
				//validate security header
				var auth = req.headers["x-hivesensesecurekey"];
				if(auth !== 'blr2013ucl') {
					console.log("UNAUTHORISED!");
					HttpWrite.giveSecurityError(res);
				} else {
					//Get the payload
					var allData = new Buffer("");
					req.addListener("data", function(dataChunk) {
						allData = Buffer.concat([allData, dataChunk]);
					});

					req.addListener("end", function() {
						if (allData === undefined) {
							HttpWrite.giveForbiddenError(res);
						}  else {
							route(path, res, allData);
						}
					});
				}

			} else {
				route(path, res);
			}
		}
	).listen(port);
	console.log("Server started.");
};
