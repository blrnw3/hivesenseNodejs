var Controller = new function() {
	var count = 0;

	this.boot = function() {
		View.bindEvents();
		Controller.runUpdater();
	};

	//Needs to be public for the setTimeout to be able to call it
	this.runUpdater = function() {

		if(count % Model.UPDATE_RATE_SENSORS === 0) {
			getNewData();
			getRecentHistory();
		}
		//console.log("Count: " + count);
		if(count % Model.UPDATE_RATE_WEATHER === 0) {
			console.log("wx get pt 1");
			Model.getLocalWeather(View.updateWeather);
		}
		if(count % Model.UPDATE_RATE_HISTORY === 1) {
			getHistory();
		}

		View.updateAgo();
		count++;

		setTimeout('Controller.runUpdater()', 1000);
	};

	//Source of some Xively API: http://xively.github.io/xively-js/tutorial/
	function getNewData() {
		// Get datastream data from Xively
		View.flashTime();

		xively.feed.get(Model.xivelyFeedID, function(feed) {

			//console.log("assigning recent vals");
			for(var i = 0; i < feed.datastreams.length; i++) {
				var name = Model.XivelyMappings[feed.datastreams[i].id];
				if(true || Object.keys(Model.sensorValues).length > 0) {
					Model.sensorValuesRecent[name] = Model.sensorValues[name];
				}
				Model.sensorValues[name] = feed.datastreams[i].current_value;
			}
			Model.sensorValuesRecent["temp3"] = Model.sensorValues['temp3'];
			Model.sensorValues["temp3"] = Model.sensorValues['temp1'] - Model.sensorValues['temp2'];

//			console.log(Model.sensorValuesRecent);
//			console.log(Model.sensorValues);

			Model.currTime = Date.parse(feed.updated);

			View.updateSensorBlocks();
			View.updateAlarms();
			View.updateCamera();
			View.updateTime();
			View.updateAgo();

			//Make UI changes when the data dies or resurects
			if(Model.isOld()) {
				if(!View.isInactive) {
					View.deactivate();
				}
			} else if(View.isInactive) {
				View.activate();
			}

			View.flashTime();
		});

	};

	function buildDataSeries(jsonFeed) {
		var series = [];
		for(var i = 0; i < jsonFeed.datastreams.length; i++) {
			var name = Model.XivelyMappings[jsonFeed.datastreams[i].id];
			series[name] = jsonFeed.datastreams[i].datapoints;
		}
		return series;
	}
	function buildOptionsForDataFeed(interval, duration) {
		var options = {
			limit: 1000,
			interval: interval,
			duration: duration
			//end: new Date().toISOString()
		};
		return options;
	}

	function getRecentHistory() {
		xively.feed.history(Model.xivelyFeedID, buildOptionsForDataFeed(60, '3hours'), function(feed) {
			var series = buildDataSeries(feed);
			Graphs.plotTempGraph(series['temp1'], series['temp2']);
			Graphs.plotHumiGraph(series['humi']);
			Graphs.plotLightGraph(series['light']);
			View.updateLastMotion( Model.getLastMotion(series['motion']) );
		});
	}

	function getHistory() {
		xively.feed.history(Model.xivelyFeedID, buildOptionsForDataFeed(900, '2days'), function(feed) {
			console.log("Feed of past history coming up...");
//			console.log(buildDataSeries(feed));
			Graphs.plotMainGraph(buildDataSeries(feed));
		});
	}

};