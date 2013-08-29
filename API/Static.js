/**
 * Module: API/Static.js
 * Resource for serving static content for the web application.
 */

var fs = require('fs');
var httpWrite = require('../Model/HttpWriter');

/**
 * Deliver static content (CSS, HTML, JS etc.)
 * @param {onject} res HTTP response
 * @param {string} url path to content
 * @param {string} type HTTP content-type
 * @returns {undefined}
 */
exports.staticServe = function(res, url, type) {
	fs.readFile("./public_html" + url, function(err, data) {
		if (err) {
			httpWrite.giveNoResourceError(res);
			return;
		}
		httpWrite.giveStaticSuccess(res, data, type);
	});
};
