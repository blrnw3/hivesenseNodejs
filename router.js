function route(handle, path, response) {
	if (handle.hasOwnProperty(path)) {
		handle[path](response);
	} else {
		console.log("No request handler found for " + path);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.end("404 Not found, moron.");

	}
}

exports.route = route;