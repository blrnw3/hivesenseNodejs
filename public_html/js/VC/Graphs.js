/**
 * Controller for the Graphs View
 * Graphing API Source: https://github.com/flot/flot/blob/master/API.md
 * Some code is derived from examples published by the authors of this API.
 * @namespace ViewController
 */
VC.Graphs = new function() {

	/** Data structure for storing the graph data */
	var datasets = {};
	/** Names of all the active Channels */
	var sensorNames = [];
	/** DOM object for the options area of the Graphs View */
	var optionsContainerVars;

	/**  */
	this.setup = function() {
		optionsContainerVars = $("#graphs-options-variables");
		//get Channel graph settings
		$.each(Model.SensorManager.getAllSensors(), function(key, value) {
			value = value.graphOptions;
			datasets[key] = {
				label: value.labelShort,
				color: value.colourGraph,
				gradient: [value.colourGd1, value.colourGd2]
			};
			sensorNames.push(key);
			optionsContainerVars.append("<label class='checkbox'><input type='checkbox' name='" +
				key + "' checked /> "+ value.labelShort +"</label>");
		});

		optionsContainerVars.find("input").click(generateMainGraph);
		$("#graphs-options-periods").find("input").click(generateMainGraph);
	};

	/** Replot all graphs */
	this.replot = function() {
		plotDashboardGraph("temp");
		plotDashboardGraph("motion");
		$.each(Model.SensorManager.getAllSensors(), function(key, val) {
			if(!val.isdefault) {
				plotDashboardGraph(key);
			}
		});
		generateMainGraph();
	};

	/** Retrieve inital data feeds for the graphs */
	this.getRecentHistory = function() {
		Model.ApiConnector.getRecentDataValues("7d", function(feed) {
			Model.DataFeed.saveDataFeed(feed, "week");
		});
		Model.ApiConnector.getRecentDataValues("1m", function(feed) {
			Model.DataFeed.saveDataFeed(feed, "month");
		});
	};

	/** Plots the main graph */
	function generateMainGraph() {
		var data = [];
		var period = $("#graphs-options-periods label input[type='radio']:checked").val();

		var dataSeries = Model.DataFeed.getPeriod(period);

		optionsContainerVars.find("input:checked").each(function() {
			var key = $(this).attr("name");
			if (key && datasets[key]) {
				datasets[key].data = dataSeries[key];
				data.push(datasets[key]);
			}
		});

		if(data.length === 0) {
			console.log("no data to plot (!) for " + period);
		}

		var timeFormat;
		switch(period) {
			case "now":
				timeFormat = "%H:%M";
				break;
			case "day":
				timeFormat = "%Hz %a";
				break;
			case "week":
				timeFormat = "%Hz %a %d";
				break;
			case "month":
				timeFormat = "%Hz %d %b ";
				break;
		}

		$.plot("#sensor-graph-main", data,
			{//options (see flot API)
				xaxis: {
					mode: "time",
					timezone: "browser",
					timeformat: timeFormat
//					minTickSize: [1, 'hour']
				},
				series: {
					points: {
						show: false,
						radius: 3
					},
					lines: {
						lineWidth: 2,
						show: true
					}
				},
				legend: {
					show: true,
					position: "nw",
					backgroundOpacity: 0.4
				},
				grid: {
					backgroundColor: { colors: ["#fee", "#eef"] }
				}
			}
		);
	};

	/** Plots a graph on the Dashboard for a given Channel @param id */
	function plotDashboardGraph(id) {
		var placeholder = "#sensor-graph-" + id;

		var data = [];
		//special case for temperature
		if(id === "temp") {
			data[1] = datasets.temp2;
			data[1].data = Model.DataFeed.getCurrentSeries("temp2");
			id = "temp1";
		}

		var ymin = (id === "motion") ? 0 : null;

		var feed = Model.DataFeed.getCurrentSeries(id);

		data[0] = datasets[id];
		data[0].data = feed;

		$.plot(placeholder,	data,
			{ //options (see flot API)
				xaxis: {
					mode: "time",
					timezone: "browser",
					format: "%H:%M"
				},
				yaxis: {
					min: ymin
				},
				series: {
					points: {
						show: false,
						radius: 3
					},
					lines: {
						lineWidth: 2,
						show: true
					}
				},
				legend: {
					show: true,
					position: "nw", //ne,nw,se,sw
					backgroundOpacity: 0.3 //0-1
				},
				grid: {
					backgroundColor: { colors: datasets[id].gradient },
					borderColor: "#a99"
				}
			}
		);
	};

};
