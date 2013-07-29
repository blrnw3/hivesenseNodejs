var Controller = new function() {
	var count = 0;

	this.boot = function() {
		View.bindEvents();
		Graphs.setup();
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
		if(count % Model.UPDATE_RATE_HISTORY === 0) {
			getHistory();
			Model.syncTime(true);
		} else {
			Model.syncTime(false);
		}

		View.updateAgo();
		count++;

		setTimeout('Controller.runUpdater()', 1000);
	};

	function getNewData() {
		// Get datastream data from API
		View.flashTime();

		Model.getCurrentDataValues(function(syncTime, isNew) {
			if(isNew) {
				View.updateSensorBlocks();
				View.updateAlarms();
				View.updateCamera();
				View.updateTime();
				View.updateAgo();
				count -= syncTime;
			}

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
		var series = {};
		if(jsonFeed.datastreams === undefined) {
			return {};
		}
		for(var i = 0; i < jsonFeed.datastreams.length; i++) {
			var name = Model.APIMappings[jsonFeed.datastreams[i].id];
			series[name] = jsonFeed.datastreams[i].datapoints;
		}
		return series;
	}

	function getRecentHistory() {
		Model.getRecentDataValues("3h", function(feed) {
			var series = buildDataSeries(feed);
			Graphs.plotTempGraph(series['temp1'], series['temp2']);
			Graphs.plotSensorGraph(series['humi'], 'humi');
			Graphs.plotSensorGraph(series['light'], 'light');
			Graphs.plotSensorGraph(series['motion'], 'motion');
			View.updateLastMotion( Model.getLastMotion(series['motion']) );
			View.updateAlarms();
		});
	}

	function getHistory() {
		Model.getRecentDataValues("1d", function(feed) {
			console.log("Feed of past history coming up...");
//			console.log(buildDataSeries(feed));
			Graphs.plotMainGraph(buildDataSeries(feed), "day");
		});
		Model.getRecentDataValues("7d", function(feed) {
			Graphs.plotMainGraph(buildDataSeries(feed), "week");
		});
		Model.getRecentDataValues("1m", function(feed) {
			Graphs.plotMainGraph(buildDataSeries(feed), "month");
		});
	}

};