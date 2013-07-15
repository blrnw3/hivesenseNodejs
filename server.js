var http = require('http');
var url = require('url');
function start(route, handle) {
	var port = process.env.PORT || 1337;
	http.createServer(function(req, res) {
		var path = url.parse(req.url);

		route(handle, path.pathname, res);

		console.log("Request made for " + path.pathname + " with headers: ");
		console.log(req.headers);
		console.log("and method " + req.method);
	}).listen(port);
	console.log("Server started.");
}

exports.boot = start;