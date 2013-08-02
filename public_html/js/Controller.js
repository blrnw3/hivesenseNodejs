var Controller = new function() {
	var count = 0;

	this.boot = function() {
		Model.getSettings(function(settings) {
			View.setUIusingDynamicOptions(settings);
			Graphs.setup();
		});
		View.loadUI();
		Controller.runUpdater();
	};

	//Needs to be public for the setTimeout to be able to call it
	this.runUpdater = function() {

		if(Model.isReady()) {
			if(count % Model.UPDATE_RATE_SENSORS === 0) {
				getNewData();
			}

			//console.log("Count: " + count);
			if(count % Model.UPDATE_RATE_WEATHER === 0) {
				//console.log("wx get pt 1");
				Model.getLocalWeather(View.updateWeather);
			}
			if(count % Model.UPDATE_RATE_HISTORY === 0) {
				getRecentHistory();
			}

			View.updateAgo();
			count++;
		}
		if(count % 1000 === 0) {
			Model.syncTime(true);
		}else {
			Model.syncTime(false);
		}

		setTimeout('Controller.runUpdater()', 1000);
	};

	function getNewData() {
		// Get datastream data from API
//		console.log("Flashing badge start");
		View.flashTime();

		Model.getCurrentDataValues(function(syncTime, isNew) {
			if(isNew) {
				View.updateSensorBlocks();
				View.updateLastMotion();
				View.updateAlarms();
				View.updateCamera();
				View.updateTime();
				View.updateAgo();

				Graphs.replot();

				count += syncTime;
			}

			//Make UI changes when the data dies or resurects
			if(Model.isOld()) {
				if(!View.isInactive) {
					View.deactivate();
				}
			} else if(View.isInactive) {
				View.activate();
			}

//			console.log("Flashing badge end");
			View.flashTime();
		});

	};

	function getRecentHistory() {
		Model.getRecentDataValues("3h", function(feed) {
			Graphs.saveDataFeed(feed, "now");
			View.updateLastMotion();
			Graphs.replot();
		});
		Model.getRecentDataValues("1d", function(feed) {
			Graphs.saveDataFeed(feed, "day");
		});
		Model.getRecentDataValues("7d", function(feed) {
			Graphs.saveDataFeed(feed, "week");
		});
		Model.getRecentDataValues("1m", function(feed) {
			Graphs.saveDataFeed(feed, "month");
		});
	}

	function getHistory() {
	}

};