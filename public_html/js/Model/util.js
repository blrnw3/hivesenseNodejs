// Utility methods
var Util = new function() {
	/**
	 * Converts a quantity in raw seconds to one in seconds, minutes, hours, or days,
	 * depending on the value, to give a more readable output
	 * @param {type} seconds
	 * @returns {String}
	 */
	this.prettyTimeAgo = function(seconds) {
		seconds = seconds / 1000;
		if(seconds < 100) {
			return Math.round(seconds) + ' s';
		}
		var diff = Math.round( seconds / 60 );
		if(diff < 100) {
			return diff + ' mins';
		} else if(diff < 3000) {
			return Math.round(diff / 60) + ' hours';
		} else {
			return Math.round(diff / 60 / 24) + ' days';
		}
	};

	this.signedNumber = function(num) {
		var sign = (num < 0) ? '' : '+';
		var n = new Number(num);
		return sign + n.toFixed(1);
	};

	/**
	 * Convert from degrees C to degrees F
	 * @param {type} celcius value in degC
	 * @param {type} isAbsolute whether the value is absolute (e.g. difference between two temperatures)
	 * @returns {Number} degF value formatted to 1dp
	 */
	this.CtoFdegrees = function(celcius, isAbsolute) {
		var excess = isAbsolute ? 0 : 32;
		return new Number(celcius * 9 / 5 + excess).toFixed(1);
	};

	this.isJson = function(str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	};

};
