/**
 * Module: API/Image.js
 * API resource for manipulating camera images from the hive
 */

var fs = require('fs');
var httpWrite = require('../Model/HttpWriter');

/** Path to camera image storage directory */
var PATH_TO_CAM_DIR = 'Storage/blobs/hivecam/';
/** Path to current camera image */
var PATH_TO_CAM = PATH_TO_CAM_DIR + 'camLatest.bmp';

/**
 * Save the current camera image. Overwrites previous.
 * @param {Object} res HTTP response
 * @param {type} data image
 */
exports.saveImage = function(res, data) {
	console.log("SAVING a binary post of length " + data.length);
	httpWrite.giveSuccess(res);
	fs.writeFile(PATH_TO_CAM, data, 'binary', function(err){
        if (err) {
			console.log(err);
		}
	});
};

/**
 * Get the current camera image.
 * @param {Object} res HTTP response
 */
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
