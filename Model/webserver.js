var http = require('http');
var url = require('url');
var HttpWrite = require('./HttpWriter');

exports.boot = function(route) {
	var port = process.env.PORT || 1337;
	http.createServer(
		function(req, res) {
			var path = url.parse(req.url, true);
			if(path.pathname === "/favicon.ico") {
				return;
			}

			var d = new Date();
			console.log(d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() +
				" " + req.method + " request made for " + req.url);

			if (req.method === "PUT" || req.method === "POST") {
				var auth = req.headers["x-hivesensesecurekey"];
				if(auth !== 'blr2013ucl') {
					console.log("UNAUTHORISED!");
					HttpWrite.giveSecurityError(res);
				} else {
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
