function route(handle, path, response, sentData) {
	var url = path.pathname;

	if(url.startsWith('/css/')) {
		handle["static-content"](response, url, 'text/css');
	} else if(url.startsWith('/js/')) {
		handle["static-content"](response, url, 'application/javascript');
	} else if(url.startsWith('/img/')) {
		handle["static-content"](response, url, 'image/png');
	} else if (handle.hasOwnProperty(url)) {
		handle[url](response, path.query, sentData);
	} else {
		console.log("No request handler found for " + url);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.end("404 Not found, moron.");

	}
}

exports.route = route;