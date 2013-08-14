
var defaultType = "application/json";


exports.giveSuccess = function(res, data, type) {
	if(data === undefined) {
		data = JSON.stringify({ response: 'Complete' });
	}
	if(type === undefined) {
		type = defaultType;
	}
	res.writeHead(200, {'Content-Type': type, 'Content-Length': data.length, 'Cache-Control': 'public; max-age: 30'});
	res.write(data);
	res.end();
};
exports.giveSuccessBinary = function(res, data) {
	res.writeHead(200, {'Content-Type': 'image/bmp', 'Content-Length': data.length, 'Cache-Control': 'public; max-age: 30'});
	res.end(data, 'binary');
};

exports.giveStaticSuccess = function(res, data, type) {
	//Strongly encourage caching of static content
	var headersStatic = {
		'Cache-Control': 'public; max-age: 500000',
		'Last-Modified:': 'Wed, 14 Aug 2013 14:38:08 GMT',
		'Content-Type': type,
		'Content-Length': data.length
	};
	res.writeHead(200, headersStatic);
	if(type.startsWith('image')) {
		res.write(data, 'binary');
	} else {
		res.write(data);
	}
	res.end();
};

exports.giveRequestError = function(res) {
	clientError(res, 'Bad request. Check input against API docs before retrying', 400);
};
exports.giveValidationError = function(res) {
	clientError(res, 'Invalid password. Do not attempt again unless authorised', 401);
};
exports.giveForbiddenError = function(res) {
	clientError(res, 'Forbidden! Cannot POST null', 403);
};
exports.giveSecurityError = function(res) {
	clientError(res, 'Forbidden! Connection unauthorised due to bad secureKey header', 403);
};
exports.giveNoResultError = function(res) {
	clientError(res, 'No valid results available. Try another query', 404);
};
exports.giveNoResourceError = function(res) {
	clientError(res, 'No resource exists here.', 404);
};
exports.giveCustomError = function(res, message, type) {
	clientError(res, message, type);
};

exports.giveFailure = function(res) {
	res.writeHead(500, {'Content-Type': defaultType });
	res.end(JSON.stringify({ error: 'Could not handle request at this time. Try again later' }));
};

function clientError(res, message, type) {
	res.writeHead(type, {'Content-Type': defaultType });
	res.end(JSON.stringify({ error: message }));
}
