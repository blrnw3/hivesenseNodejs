var fs = require('fs');
var httpWrite = require('/Model/HttpWriter');

var PATH_TO_CAM_DIR = './blobs/hivecam/';
var PATH_TO_CAM = PATH_TO_CAM_DIR + 'camLatest.bmp';

exports.saveImage = function(res, data) {
	console.log("SAVING a binary post of length " + data.length);
	httpWrite.giveSuccess(res);
	fs.writeFile(PATH_TO_CAM, data, 'binary', function(err){
        if (err) throw err;
	});
};

exports.getImage = function(res) {
	fs.readFile(PATH_TO_CAM, function(err, data) {
		if (err) {
			console.log(err);
			httpWrite.giveNoResultError(res);
		} else {
			httpWrite.giveSuccessBinary(res, data);
		}
	});
};


