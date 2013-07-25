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
		if(count % Model.UPDATE_RATE_WEATHER === 1) {
			console.log("wx get pt 1");
			Model.getLocalWeather(View.updateWeather);
		}
		if(count % Model.UPDATE_RATE_HISTORY === 5) {
			getHistory();
		}

		View.updateAgo();
		count++;

		setTimeout('Controller.runUpdater()', 1000);
	};

	function getNewData() {
		// Get datastream data from API
		View.flashTime();

//		xively.feed.get(Model.xivelyFeedID, function(feed) {
		Model.getCurrentDataValues(function() {
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

	function getRecentHistory() {
		Model.getRecentDataValues("3h", function(feed) {
			var series = buildDataSeries(feed);
			Graphs.plotTempGraph(series['temp1'], series['temp2']);
			Graphs.plotHumiGraph(series['humi']);
			Graphs.plotLightGraph(series['light']);
			View.updateLastMotion( Model.getLastMotion(series['motion']) );
		});
	}

	function getHistory() {
		Model.getRecentDataValues("1d", function(feed) {
			console.log("Feed of past history coming up...");
//			console.log(buildDataSeries(feed));
			Graphs.plotMainGraph(buildDataSeries(feed));
		});
	}

};