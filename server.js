var webserver = require("./webserver.js");
var request = require("./request.js");
var router = require("./router.js");
var rm = require("./RESTmodel.js");

var handle = {
	"/" : request.index,
	"/index.html" : request.index,
	"/blr" : request.index,
	"/main" : request.main,
	"/email" : request.sendEmail,
	"/feed" : request.getdata,
	"/posty" : request.postdata,
	"/ext/wxgrab" : request.wxgrab,
	"static-content" : request.staticServe
};

String.prototype.startsWith = function (str){
	return this.substring(0, str.length) === str;
};

webserver.boot(router.route, handle);
rm.setup();

//var sql = require('node-sqlserver');
//var http = require('http')
//var port = process.env.port || 3000;
//var conn_str = "Driver={SQL Server Native Client 10.0};Server=tcp:wq5hjvsuos.database.windows.net,1433;Database=hsNode;Uid=hivesense@wq5hjvsuos;Pwd=UCL2013hs;Encrypt=yes;Connection Timeout=30;";
//
//http.createServer(function (req, res) {
//    sql.query(conn_str, "SELECT * FROM Channel", function (err, results) {
//        if (err) {
//            res.writeHead(500, { 'Content-Type': 'text/plain' });
//            res.write("Got error :-( " + err);
//            res.end();
//            return;
//        }
//        res.writeHead(200, { 'Content-Type': 'text/plain' });
//        for (var i = 0; i < results.length; i++) {
//            res.write("ID: " + results[i].ID + " Name: " + results[i].Name + " Unit: " + results[i].Unit);
//        }
//        res.end("\nDone.");
//    });
//}).listen(port);