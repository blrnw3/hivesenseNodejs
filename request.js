var exec = require("child_process").exec;
var fs = require('fs');

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

exports.main = main;
exports.test = test;