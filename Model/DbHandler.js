/**
 * Module: Model/DbHandler.js
 * Handler for querying the database
 */

var azure = require('azure');

/** Name of the data point table */
var TABLE_NAME_DATA = 'DataPoint';

/*
 * Connect to the Azure Table Service.
 * Only works if environment variables are set:
 * http://www.windowsazure.com/en-us/develop/nodejs/how-to-guides/table-services/#setup-connection-string
 */
var tblService = azure.createTableService();

/** Azure system properties of every row in the database
 * (need to be ignored when looping through actual sensor values) */
var systemProperties = ["Timestamp", "PartitionKey", "RowKey", "DateTime", "Period", "_"];

/** Datetime offset - used to order results by most recent */
var offset = 9999999999999;

tblService.createTableIfNotExists(TABLE_NAME_DATA, function(error) {
	if (error) {
		console.log(error);
	}
});

/**
 * Insert a single data point into the table
 * @param {Object} dataPt
 * @param {Object} dates
 */
exports.insertDataPoint = function(dataPt, dates) {
	var d = dates.dateObj;
	var dt = dates.date;

	var period = 0;
	//Aid filtering rows in the table by time
	if (d.getUTCMinutes() % 5 === 0)
		period = 1;
	if (d.getUTCMinutes() % 20 === 0)
		period = 2;
	if (d.getUTCMinutes() === 0) {
		period = 3;
		if (d.getUTCHours() % 3 === 0)
			period = 4;
		if (d.getUTCHours() === 12)
			period = 5;
	}

	//Coerce Azure to order results by most recently added
	dataPt.PartitionKey = (offset - dt).toString();
	//Required by Azure but not needed here so set arbitrary value
	dataPt.RowKey = "0";
	 //convenience entry for quicker retrieval of historical data
	dataPt.Period = period;

	tblService.insertEntity(TABLE_NAME_DATA, dataPt, function(error) {
		if (error) {
			console.log(error);
		} else {
			console.log(" inserted at " + new Date().getUTCSeconds());
		}
	});
};

/**
 * Get most recent data point from table
 * @param {Object} result JSON shell to store the result
 * @param {function} onFinish callback to execute on query return
 * @param {Object} res HTTP response
 */
exports.retieveCurrentDataPt = function(result, onFinish, res) {
	var query = azure.TableQuery
		.select()
		.from(TABLE_NAME_DATA)
		.top(1);
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			if(entities.length === 0) {
				onFinish(true, { "datastreams": [] }, res);
				return;
			}
			var dataPt = entities[0];
			result.updated = new Date(dataPt.DateTime).toUTCString();

			//Eliminate redundant properties
			for(var i = 0; i < systemProperties.length; i++) {
				delete dataPt[systemProperties[i]];
			}

			var dataPtOut = [];
			var i = 0;
			Object.keys(dataPt).forEach(function(key) {
				dataPtOut[i] = {
					id: key,
					current_value: dataPt[key]
				};
				i++;
			});
			result.datastreams = dataPtOut;
			onFinish(true, result, res);
		} else {
			onFinish(false, error, res);

		}
	});
};

/**
 * Get most recent set of data points from table
 * @param {Object} result JSON shell to store the result
 * @param {type} queryOptions query properties
 * @param {function} onFinish callback to execute on query return
 * @param {Object} res HTTP response
 */
exports.retieveRecentDataPts = function(result, queryOptions, onFinish, res) {
	var query = getBasicRangeQuery(queryOptions.resIndex);
	var numToget = queryOptions.number;
	console.log("Attempting to retrieve top " + numToget + " queries");

	var fullQuery = query.top(numToget);
	queryPastData( fullQuery, queryOptions, result, onFinish, res );
};

/**
 * Get historical data points from table
 * @param {Object} result JSON shell to store the result
 * @param {type} queryOptions query properties
 * @param {function} onFinish callback to execute on query return
 * @param {Object} res HTTP response
 */
exports.retieveHistoricalDataPts = function(result, queryOptions, onFinish, res) {
	var query = getBasicRangeQuery(queryOptions.resIndex);
	var fullQuery = query.and("PartitionKey lt ?", (offset - queryOptions.lower).toString())
						.and("PartitionKey gt ?", (offset - queryOptions.upper).toString());
	queryPastData( fullQuery, queryOptions, result, onFinish, res );
};

/**
 * Executes query for multiple past data points
 * @param {Object} query Azure Table Service query
 * @param {Object} result JSON shell to store the result
 * @param {type} queryProperties query properties
 * @param {function} onFinish callback to execute on query return
 * @param {Object} res HTTP response
 */
function queryPastData(query, queryProperties, result, onFinish, res) {
	var dataPoints = [];

	var allowedNumberOfPointsToSkip = 30;
	//Period in ms for a gap in the data to be considered excessive
	var dataJumpExcessive = 60000 * allowedNumberOfPointsToSkip * queryProperties.resolution;

	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			var numResults = entities.length;
			if(numResults === 0) {
				onFinish(true, { "datapoints": [] }, res);
				return;
			}

			console.log("RETURNING "+ numResults +" DATAPOINTS FROM AZT");
			var updated = entities[0].DateTime;

			var validCnt = -1;
			for (var i = 0; i < numResults; i++) {
				var dataPt = entities[i];

				validCnt++;
				if(i < numResults-1) {
					var timeDiff = dataPt.DateTime - entities[i+1].DateTime;
					if(!queryProperties.skippable && timeDiff > dataJumpExcessive) {
						console.log("Time gap too big at " + timeDiff + ", cnt " + i);
						i = numResults;
					}
					if(timeDiff < 60000 && queryProperties.resolution > 1) {
						validCnt--;
						continue;
					}
				}

				dataPoints[validCnt] = {
					datetime : dataPt.DateTime,
					channels: {}
				};

				//Eliminate redundant properties
				for (var j = 0; j < systemProperties.length; j++) {
					delete dataPt[systemProperties[j]];
				}

				Object.keys(dataPt).forEach(function(key) {
					dataPoints[validCnt].channels[key] = dataPt[key];
				});

			}
			console.log((validCnt+1) + " results returned out of " + numResults);

			result.datapoints = dataPoints;
			result.updated = new Date(updated).toUTCString();

			onFinish(true, result, res);
		} else {
			onFinish(false, error, res);
		}
	});
}

/**
 * Produces a partial query for a set of data points of a
 *  specified sampling interval from the database table
 * @param {number} index integer of minimum sampling interval index to return
 * @returns {Object} Partial Azure Table Service query
 */
function getBasicRangeQuery(index) {
	console.log("Getting basic query for periodGap " + index);
	return azure.TableQuery
				.select()
				.from(TABLE_NAME_DATA)
				.where("Period gt ?", index-1);
}
