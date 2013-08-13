var qs = require("querystring");
var utillib = require('/Model/utillib');

exports.getWx = function(res, query) {
	var placeName = query.place;
	var action = function(resp, result) {
		var wx = JSON.parse(result);
		var resultPackage = (wx.current_observation !== undefined) ? {
			weather: wx.current_observation.weather,
			time: wx.current_observation.observation_epoch,
			temp: wx.current_observation.temp_c,
			place: wx.current_observation.observation_location.city
		} : {};
		resp.writeHead(200, {'Content-Type': 'application/json'});
		resp.write(JSON.stringify(resultPackage));
		resp.end();
	};
	var pn = qs.stringify({q:placeName}).substr(2);
	console.log("QS: " + pn);
	utillib.getFromURL('api.wunderground.com', '/api/46272bfe75051ab1/conditions/q/UK/' + pn + '.json', action, res);
};
