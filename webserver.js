var http = require('http');
var url = require('url');
function start(route, handle) {
	var port = process.env.PORT || 1337;
	http.createServer(function(req, res) {
		var path = url.parse(req.url, true);

		if (req.method === "PUT" || req.method === "POST") {
			//request.setEncoding("utf8");
			var allData = new Buffer("");
			req.addListener("data", function(dataChunk) {
				allData = Buffer.concat([allData, dataChunk]);
//				console.log("Received POST data chunk '" + dataChunk + "'.");
			});

			req.addListener("end", function() {
				route(handle, path, res, allData);
			});

		} else {
			route(handle, path, res);
		}

		console.log(path);
		console.log("Request made for " + path.pathname + " with headers: ");
		console.log(req.headers);
		console.log("and method " + req.method);
	}).listen(port);
	console.log("Server started.");
}

exports.boot = start;