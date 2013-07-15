var server = require("./server");
var request = require("./request");
var router = require("./router");

var handle = {
	"/" : request.main
};

server.boot(router.route, handle);