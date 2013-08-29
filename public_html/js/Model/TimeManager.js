/**
 * Time manager for the Dashboard and Updater
 * @namespace Model
 */
Model.TimeManager = new function() {

	/** Number of missed data updates after which the data is declared old */
	var OLD_DATA_THRESHOLD = 10;

	/** System time (better than browser) */
	var sysTime = 0;

	/** Last data update time */
	this.currTime = 0;

	/**
	 * Get difference in milliseconds between current time and argument
	 * @param {integer} unixTime argument
	 * @returns {integer} difference
	 */
	this.diffTime = function(unixTime) {
		var d = sysTime || new Date().getTime();
		return d - unixTime;
	};

	/**
	 * Get time of last update in pretty format
	 * @returns {String} pretty date
	 */
	this.updated_ago = function() {
		return Util.prettyTimeAgo( this.diffTime(this.currTime) );
	};

	/**
	 * Synchronise the system clock
	 * @param {Bool} doFullUpdate if yes, synch with a time server, else just increment
	 */
	this.syncTime = function(doFullUpdate) {
		if(!doFullUpdate) {
			sysTime += 1000; //increment casually
			return;
		}
		Model.ApiConnector.getTime(function(time) {
			sysTime = time;
		});
	};

	/**
	 * Gets the status of the data feed - old/frozen or not
	 * @returns {Boolean} true if old
	 */
	this.isOld = function() {
		return this.diffTime(this.currTime) >
			OLD_DATA_THRESHOLD * Model.SettingsManager.getUpdateRate() * 1000;
	};
};
