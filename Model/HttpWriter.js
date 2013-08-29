/**
 * Module: HttpWriter.js
 * Handler for writing HTTP responses
 */

/** Default response MIME type */
var defaultType = "application/json";

/**
 * Write a success response for dynamic text-based data (e.g. JSON)
 * @param {Object} res HTTP response stream
 * @param {Object} data
 * @param {string} type HTTP Content-Type
 */
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

/**
 * Write a success response for dynamic binary data (e.g. camera image)
 * @param {Object} res HTTP response stream
 * @param {type} data
 */
exports.giveSuccessBinary = function(res, data) {
	res.writeHead(200, {'Content-Type': 'image/bmp', 'Content-Length': data.length, 'Cache-Control': 'public; max-age: 30'});
	res.end(data, 'binary');
};

/**
 * Write a success response for static content (e.g. HTML)
 * @param {Object} res HTTP response stream
 * @param {type} data
 * @param {string} type HTTP Content-Type
 */
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

/**
 * Write a client failure response for a malformed request
 * @param {Object} res HTTP response stream
 */
exports.giveRequestError = function(res) {
	clientError(res, 'Bad request. Check input against API docs before retrying', 400);
};
/**
 * Write a client failure response for an unauthorised request (password)
 * @param {Object} res HTTP response stream
 */
exports.giveValidationError = function(res) {
	clientError(res, 'Invalid password. Do not attempt again unless authorised', 401);
};
/**
 * Write a client failure response for a PUT/POST request with no body
 * @param {Object} res HTTP response stream
 */
exports.giveForbiddenError = function(res) {
	clientError(res, 'Forbidden! Cannot POST null', 403);
};
/**
 * Write a client failure response for an unauthorised request (header)
 * @param {Object} res HTTP response stream
 */
exports.giveSecurityError = function(res) {
	clientError(res, 'Forbidden! Connection unauthorised due to bad secureKey header', 403);
};
/**
 * Write a client failure response for a request for no data
 * @param {Object} res HTTP response stream
 */
exports.giveNoResultError = function(res) {
	clientError(res, 'No valid results available. Try another query', 404);
};
/**
 * Write a client failure response for a non-existing resource
 * @param {type} res HTTP response stream
 */
exports.giveNoResourceError = function(res) {
	clientError(res, 'No resource exists here.', 404);
};
/**
 * Write a custom client failure response
 * @param {Object} res HTTP response stream
 * @param {string} message failure message
 * @param {number} type HTTP error code
 */
exports.giveCustomError = function(res, message, type) {
	clientError(res, message, type);
};

/**
 * Write an internal server failure response
 * @param {Object} res HTTP response stream
 */
exports.giveFailure = function(res) {
	res.writeHead(500, {'Content-Type': defaultType });
	res.end(JSON.stringify({ error: 'Could not handle request at this time. Try again later' }));
};

/**
 * Write a client error HTTP response
 * @param {Object} res HTTP response stream
 * @param {string} message failure message
 * @param {number} type HTTP error code
 */
function clientError(res, message, type) {
	res.writeHead(type, {'Content-Type': defaultType });
	res.end(JSON.stringify({ error: message }));
}
