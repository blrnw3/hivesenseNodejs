//var exec = require("child_process").exec;
var fs = require('fs');
var RESTmodel = require('./RESTmodel');
var utillib = require('./utillib');

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

function test(res) {
	var email = require("./node_modules/emailjs/email");
	var server = email.server.connect({
		user: "lol@gmail.com",
		password: "xxx",
		host: "smtp.gmail.com",
		ssl: true

	});

// send the message and get a callback with an error or details of the message that was sent
	server.send({
		text: "i hope this works",
		from: "you <username@gmail.com>",
		to: "someone <lmao@gmail.com>",
		subject: "testing emailjs"
	}, function(err, message) {
		console.log(err || message);
	});
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end("\nSuccess");
}

function getdata(res, query) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write(JSON.stringify(query));
	res.end("\nSuccess");
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
			temp: wx.current_observation.temp_c
		} : {};
//		console.log("\nIncoming\n");
//		console.log(resultPackage);
//		console.log("\nFinished\n");
		resp.writeHead(200, {'Content-Type': 'application/json'});
		resp.write(JSON.stringify(resultPackage));
		resp.end();
	};
	utillib.getFromURL('api.wunderground.com', '/api/46272bfe75051ab1/conditions/q/UK/' + placeName + '.json', action, res);
}



/// #######  FUNCTIONS FOR DEALING WITH POST/PUT  ####### ///

function postdata(res, query, data) {
	res.writeHead(200, {"Content-Type": "text/plain"});
	if (data === undefined) {
		res.write("forbidden!");
	} else {
		RESTmodel.saveDataPoint(data);
		res.write("success!\n");
	}
	res.end();
}


exports.main = main;
exports.test = test;
exports.index = index;
exports.getdata = getdata;
exports.postdata = postdata;
exports.wxgrab = getWx;
exports.staticServe = staticServe;