/**
 * Module: API/External.js
 * API resource for retrieving data from external services
 */

var qs = require("querystring");

var httpWrite = require('../Model/HttpWriter');
var httpExternal = require('../Model/HttpExternal');

/**
 * Get the current weather for a name place, from an external API
 * @param {Object} res HTTP response
 * @param {Object} query location query
 */
exports.getWx = function(res, query) {
	var placeName = query.place;
	if(placeName === undefined || placeName.length <= 1) {
		httpWrite.giveRequestError(res);
		return;
	}
	var action = function(resp, result) {
		var wx = JSON.parse(result);
		var resultPackage = (wx.current_observation !== undefined) ? {
			weather: wx.current_observation.weather,
			time: wx.current_observation.observation_epoch,
			temp: wx.current_observation.temp_c,
			place: wx.current_observation.observation_location.city
		} : {};
		httpWrite.giveSuccess(res, JSON.stringify(resultPackage));
	};
	var pn = qs.stringify({q:placeName}).substr(2);

	httpExternal.getFromURL('api.wunderground.com',
		'/api/46272bfe75051ab1/conditions/q/UK/' + pn + '.json', action, res);
};
