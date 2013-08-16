var azure = require('azure');

var TABLE_NAME_DATA = 'DataPoint';

//Only works if environment variables are set:
//For local dev: in powershell type $env:EMULATED=1 and load up Azure Storage Emulator (part of Azure SDK)
//For production: go to Azure web site management portal->configure->app settings and input the following:
//AZURE_STORAGE_ACCOUNT: [Table Service account name]
//AZURE_STORAGE_ACCESS_KEY: [Primary access key for this account]
var tblService = azure.createTableService();

//System properties of each row in the database (need to be ignored when looping for actual sensor values)
var systemProperties = ["Timestamp", "PartitionKey", "RowKey", "DateTime", "Period", "_"];

//Used to order results by most recent
var offset = 9999999999999;

tblService.createTableIfNotExists(TABLE_NAME_DATA, function(error) {
	if (error) {
		console.log(error);
	}
});

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

	//Coerce Azure Table Service to order results by most recently added
	dataPt.PartitionKey = (offset - dt).toString();
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

exports.retieveCurrentDataPt = function(result, onFinish, res) {
	var query = azure.TableQuery
		.select()
		.from(TABLE_NAME_DATA)
		.top(1);
	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
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

exports.retieveRecentDataPts = function(result, queryOptions, onFinish, res) {
	var query = getBasicRangeQuery(queryOptions.resIndex);
	var numToget = queryOptions.number;
	console.log("Attempting to retrieve top " + numToget + " queries");

	var fullQuery = query.top(numToget);
	queryPastData( fullQuery, queryOptions, result, onFinish, res );
};

exports.retieveHistoricalDataPts = function(result, queryOptions, onFinish, res) {
	var query = getBasicRangeQuery(queryOptions.resIndex);
	var fullQuery = query.and("PartitionKey lt ?", (offset - queryOptions.lower).toString())
						.and("PartitionKey gt ?", (offset - queryOptions.upper).toString());
	queryPastData( fullQuery, queryOptions, result, onFinish, res );
};

function queryPastData(query, queryProperties, result, onFinish, res) {
	var dataPoints = [];

	var allowedNumberOfPointsToSkip = 30;
	//Period in ms for a gap in the data to be considered excessive
	var dataJumpExcessive = 60000 * allowedNumberOfPointsToSkip * queryProperties.resolution;

	tblService.queryEntities(query, function(error, entities) {
		if (!error) {
			var numResults = entities.length;
			if(numResults === 0) {
				onFinish(false, error, res);
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

function getBasicRangeQuery(index) {
	console.log("Getting basic query for periodGap " + index);
	return azure.TableQuery
				.select()
				.from(TABLE_NAME_DATA)
				.where("Period gt ?", index-1);
}
