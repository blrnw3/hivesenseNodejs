var http = require('http');
var url = require('url');
function start(route, handle) {
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
				//request.setEncoding("utf8");
				//console.log(req.headers);
				var auth = req.headers["x-hivesensesecurekey"];
				if(auth !== 'blr2013ucl') {
					console.log("UNAUTHORISED!");
					res.writeHead(401, {"Content-Type": "text/plain"});
					res.end("forbidden! Could not authorise connection - faulty securekey header " + auth);
				} else {
					var allData = new Buffer("");
					req.addListener("data", function(dataChunk) {
						allData = Buffer.concat([allData, dataChunk]);
		//				console.log("Received POST data chunk '" + dataChunk + "'.");
					});

					req.addListener("end", function() {
						route(handle, path, res, allData);
					});
				}

			} else {
				route(handle, path, res);
			}

			//console.log(path);
			//console.log(req.headers);
			//console.log("and method " + );
		}
	).listen(port);
	console.log("Server started.");
}

exports.boot = start;