//var exec = require("child_process").exec;
var fs = require('fs');
var RESTmodel = require('./RESTmodel');

function main(res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello Bees!\n');
}

function test(res) {
	fs.readFile('./res/test.html', function(err, data) {
		res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
		res.write(data);
		res.end();
	});
}

function getdata(res, query) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write(JSON.stringify(query));
	res.end("\nSuccess");
}

function postdata(res, query, data) {
	res.writeHead(200, {"Content-Type": "text/plain"});
	if(data === undefined) {
		res.write("forbidden!");
	} else {
		RESTmodel.saveDataPoint(data);
		res.write("success!");
	}
	res.end();
}

exports.main = main;
exports.test = test;
exports.getdata = getdata;
exports.postdata = postdata;