/**
 * Module: Server.js
 * This script is called automatically on Node server boot.
 * It must remain in the site root.
 * 
 * @author Ben Lee-Rodgers
 * @version 1.0, September 2013
 */
var webserver = require("./Model/webserver.js");
var router = require("./Controller/router.js");

//Add some useful string methods not natively available
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
