//var sql = require('node-sqlserver');

function saveDataPoint(data) {
	var channels = data.split("\n");
	console.log(channels);
//	var conn_str = "Driver={SQL Server Native Client 10.0};Server=tcp:wq5hjvsuos.database.windows.net,1433;Database=hsNode;Uid=hivesense@wq5hjvsuos;Pwd={your_password_here};Encrypt=yes;Connection Timeout=30;";
//	sql.query(conn_str, "SELECT * FROM Channel", function (err, results) {
//		if(err) {
//			return
//		}
//
//	});
}

exports.saveDataPoint = saveDataPoint;

