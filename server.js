var webserver = require("./webserver.js");
var request = require("./request.js");
var router = require("./router.js");

var handle = {
	"/" : request.main
};

webserver.boot(router.route, handle);