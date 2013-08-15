Model.TimeManager = new function() {

	var OLD_DATA_THRESHOLD = 10; // in cycles (missed updates)

	var sysTime = 0;

	this.currTime = 0;

	this.diffTime = function(unixTime) {
		var d = sysTime || new Date().getTime();
		return d - unixTime;
	};

	this.updated_ago = function() {
		return Util.prettyTimeAgo( this.diffTime(this.currTime) );
	};

	this.syncTime = function(doFullUpdate) {
		if(!doFullUpdate) {
			sysTime += 1000; //increment casually
			return;
		}
		Model.ApiConnector.getTime(function(time) {
			sysTime = time;
		});
	};

	this.isOld = function() {
		return this.diffTime(this.currTime) > OLD_DATA_THRESHOLD * Model.SettingsManager.getUpdateRate() * 1000;
	};
};
