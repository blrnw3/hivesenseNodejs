/*
 * This file is called automatically on Node server boot
 * It must remain in the site root
 */
var webserver = require("./Model/webserver.js");
var router = require("./Controller/router.js");

String.prototype.startsWith = function (str){
	return this.substring(0, str.length) === str;
};
String.prototype.contains = function(it) {
	return this.indexOf(it) !== -1;
};

//Start the web server
console.log("Running node version " + process.version);
console.log("CWD: " + process.cwd());
webserver.boot(router.route);
