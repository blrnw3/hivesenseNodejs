var fs = require('fs');
var httpWrite = require('/Model/HttpWriter');

exports.staticServe = function(res, url, type) {
	fs.readFile("./public_html" + url, function(err, data) {
		if (err) {
			httpWrite.giveNoResourceError(res);
			return;
		}
		httpWrite.giveStaticSuccess(res, data, type);
	});
};
