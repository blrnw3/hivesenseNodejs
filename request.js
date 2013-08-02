//var exec = require("child_process").exec;
var fs = require('fs');
var RESTmodel = require('./RESTmodel');
var utillib = require('./utillib');
var qs = require("querystring");

function staticServe(res, url, type) {
	fs.readFile("./public_html" + url, function(err, data) {
		if (err) {
			console.log(err);
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end("Error - not found");
			return;
		}
		if (type.startsWith('image')) {
			res.writeHead(200, {'Content-Type': type, 'Content-Length': data.length, 'Cache-Control': 'public; max-age: 203135143', 'Last-Modified: ': ' Wed, 10 Jul 2013 14:58:08 GMT'});
			res.end(data, 'binary');
		} else {
			res.writeHead(200, {'Content-Type': type, 'Content-Length': data.length});
			res.write(data);
			res.end();
		}
	});
}

function main(res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello Bees!\n');
}

function sendEmail(res, query) {
	require('./emailer.js').sendEmail(query.subject, query.message);
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end("Attempt complete.");
}

function getdata(res, query) {
	RESTmodel.setFormat(query.format || 'json');
	if(query.current !== undefined) {
		RESTmodel.getCurrentDataPoint(res);
	} else if(query.recent !== undefined) {
		RESTmodel.getRecentDataPoints(res, query.recent);
	} else if(query.hivecam !== undefined) {
		RESTmodel.getImage(res);
	} else if(query.time !== undefined) {
		RESTmodel.getTime(res);
	} else if(query.settings !== undefined) {
		RESTmodel.getSettings(res);
	}
	else {
		res.writeHead(400, {'Content-Type': 'application/json'});
		var error = {error : "Not a valid query." };
		res.end(JSON.stringify(error));
	}
}

function index(res) {
	fs.readFile('./public_html/index.html', function(err, data) {
		res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
		res.write(data);
		res.end();
	});
}

function getWx(res, query) {
	var placeName = query.place;
	var action = function(resp, result) {
		var wx = JSON.parse(result);
		var resultPackage = (wx.current_observation !== undefined) ? {
			weather: wx.current_observation.weather,
			time: wx.current_observation.observation_epoch,
			temp: wx.current_observation.temp_c,
			place: wx.current_observation.observation_location.city
		} : {};
		resp.writeHead(200, {'Content-Type': 'application/json'});
		resp.write(JSON.stringify(resultPackage));
		resp.end();
//		var x = "3";
//		x.s
	};
	var pn = qs.stringify({q:placeName}).substr(2);
	console.log("QS: " + pn);
	utillib.getFromURL('api.wunderground.com', '/api/46272bfe75051ab1/conditions/q/UK/' + pn + '.json', action, res);
}

/// #######  FUNCTIONS FOR DEALING WITH POST/PUT  ####### ///

function postdata(res, query, data) {
	if (data === undefined) {
		res.writeHead(403, {"Content-Type": "text/plain"});
		res.end("forbidden! Cannot POST null");
	} else {
		if(query.image !== undefined) {
			RESTmodel.saveImage(data, res);
		} else if(query.settings !== undefined) {
			RESTmodel.saveSettings(res, data);
		} else {
			RESTmodel.saveDataPoint(data, res);
		}
	}
}

exports.main = main;
exports.sendEmail = sendEmail;
exports.index = index;
exports.getdata = getdata;
exports.postdata = postdata;
exports.wxgrab = getWx;
exports.staticServe = staticServe;