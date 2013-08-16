var Updater = new function() {
	var count = 0;

	var tables = new VC.Tables();
	var dash = new VC.Dashboard();
	var UI = new VC.View();

	this.boot = function() {
		VC.Settings.initialise();
		UI.loadUI();
		Updater.runUpdater();
	};

	//Needs to be public for the setTimeout to be able to call it
	this.runUpdater = function() {
		if(Model.SettingsManager.isReady()) {
			if(count % Model.SettingsManager.getUpdateRate() === 0) {
				getNewData();
			}
			if(count % Model.SettingsManager.UPDATE_RATE_WEATHER === 0) {
				Model.SettingsManager.getWeather(dash.updateWeather);
			}
			if(count % Model.SettingsManager.UPDATE_RATE_HISTORY === 0) {
				dash.getRecentHistory();
				tables.populate();
				VC.Graphs.getRecentHistory();
			}
			dash.updateAgo();
			count++;
		}
		if(count % 1000 === 0) {
			Model.TimeManager.syncTime(true);
		}else {
			Model.TimeManager.syncTime(false);
		}

		setTimeout('Updater.runUpdater()', 1000);
	};

	function getNewData() {
		// Get datastream data from API
		dash.flashTime();

		Model.SensorManager.getCurrentDataValues(function(syncTime, isNew) {
			if(isNew) {
				dash.refresh();
				VC.Graphs.replot();
				count += syncTime;
			}
			//Make UI changes when the data dies or resurects
			dash.setStatus();
			dash.flashTime();
		});
	};
};
