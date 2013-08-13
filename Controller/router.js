var httpWrite = require('/Model/HttpWriter');

var API = {
	static: require('/API/Static'),
	settings: require('/API/Settings'),
	image: require('/API/Image'),
	dataPt: require('/API/DataPoint'),
	external: require('/API/External')
};

var Request = new function() {

	this.dataPtJson = function(res, query, data) {
		dataPt(res, query, data, 'json');
	};
	this.dataPtCsv = function(res, query, data) {
		dataPt(res, query, data, 'csv');
	};
	this.dataPtXml = function(res, query, data) {
		dataPt(res, query, data, 'xml');
	};
	function dataPt(res, query, data, type) {
		if(data === undefined) {
			//PUT request
			API.dataPt.saveDataPoint(res, data);
		} else {
			//GET request
			API.dataPt.setFormat(type);
			if(query.current !== undefined) {
				API.dataPt.getCurrentDataPoint(res);
			} else if(query.recent !== undefined) {
				API.dataPt.getRecentDataPoints(res, query);
			} else if(query.date2 !== undefined || query.date1) {
				API.dataPt.getHistoricalDataPoints(res, query);
			} else if(query.time !== undefined) {
				API.dataPt.getTime(res);
			}
			else {
				httpWrite.giveRequestError(res);
			}
		}
	}

	this.image = function(res, query, data) {
		if(data === undefined) {
			API.image.saveImage(res, data);
		} else {
			API.image.getImage(res);
		}
	};

	this.wxgrab = function(res, query, data) {
		API.external.getWx(res, query);
	};

	this.settings = function(res, query, data) {
		if(data === undefined) {
			API.settings.saveSettings(res, data);
		} else {
			API.settings.getSettings(res);
		}
	};
};

//Valid URLs for dynamic API content
var dynamicHandlers = {
	"/feed" : Request.dataPtJson,
	"/feed.json" : Request.dataPtJson,
	"/feed.csv" : Request.dataPtCsv,
	"/feed.xml" : Request.dataPtXml,
	"/image" : Request.image,
	"/ext/wx" : Request.wxgrab,
	"/settings" : Request.settings
};

exports.route = function(path, response, sentData) {
	var url = path.pathname;

	//dynamic content handlers
	if (dynamicHandlers.hasOwnProperty(url)) {
		dynamicHandlers[url](response, path.query, sentData);
	}
	//static content handlers
	else if(url.startsWith('/css/')) {
		API.static.staticServe(response, url, 'text/css');
	} else if(url.startsWith('/js/')) {
		API.static.staticServe(response, url, 'application/javascript');
	} else if(url.startsWith('/img/')) {
		API.static.staticServe(response, url, 'image/png');
	} else if(url === '/') {
		API.static.staticServe(response, "/index.html", 'text/html');
	}
	//No handler found
	else {
		console.log("No request handler found for " + url);
		httpWrite.giveNoResourceError(response);
	}
};
