var Updater = new function() {
	var count = 0;

	this.boot = function() {
		VC.Settings.initialise();
		VC.View.loadUI();
		Updater.runUpdater();
	};

	//Needs to be public for the setTimeout to be able to call it
	this.runUpdater = function() {
		if(Model.SettingsManager.isReady()) {
			if(count % Model.SettingsManager.getUpdateRate() === 0) {
				getNewData();
			}
			if(count % Model.SettingsManager.UPDATE_RATE_WEATHER === 0) {
				Model.SettingsManager.getWeather(VC.Dashboard.updateWeather);
			}
			if(count % Model.SettingsManager.UPDATE_RATE_HISTORY === 0) {
				VC.Dashboard.getRecentHistory();
				VC.Tables.getRecentHistory();
				VC.Graphs.getRecentHistory();
			}
			VC.Dashboard.updateAgo();
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
		VC.Dashboard.flashTime();

		Model.SensorManager.getCurrentDataValues(function(syncTime, isNew) {
			if(isNew) {
				VC.Dashboard.refresh();
				VC.Graphs.replot();
				count += syncTime;
			}
			//Make UI changes when the data dies or resurects
			VC.Dashboard.setStatus();
			VC.Dashboard.flashTime();
		});
	};
};
