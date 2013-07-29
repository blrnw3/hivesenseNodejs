/**
 /**
 * Graphing Module for HiveSense Web Application
 * Graphing API Source: https://github.com/flot/flot/blob/master/API.md
 * Some code comes from examples published by the API makers.
 */

//var d = [[0, 315.71], [10000000, 345], [20000000, 324]];
//var e = [[0, 215.71], [10000000, 245], [20000000, 224]];

var Graphs = new function() {

	this.replot = function() {
		console.log("Replotting");
		plotDashboardGraph("light");
		plotDashboardGraph("temp");
		plotDashboardGraph("humi");
		generateMainGraph();
	};

	function cleanDataSeries(series) {
		if(series === undefined) {
			return [];
		}
		var cleanData = [];
		for(var i = 0; i < series.length; i++) {
//			if(i > 0 && Math.abs( series[i].value - series[i-1].value ) > spikeThreshold) {
//				series[i] = series[i-1];
//			}
			cleanData[i] = [series[i].at, series[i].value];
		}
		return cleanData;
	}

	var dataStruct = {
		now: {
			format: "%Hz"
		},
		day: {
			format: "%Hz"
		},
		week: {
			format: "%d"
		},
		month: {
			format: "%d"
		}
	};


	var datasets = {
		"temp1": {
			label: "T-in",
			color: "#f32",
			gradient: ["#fdd", "#fff"]
		},
		"temp2": {
			label: "T-out",
			color: "#c74"
		},
		"humi":	{
			label: "Humi",
			color: "#3f2",
			gradient: ["#dfd", "#fff"]
		},
		"light": {
			label: "Light",
			color: "#ff2",
			gradient: ["#ffa", "#dd9"]
		},
		"motion": {
			label: "Moving",
			color: "#23f",
			gradient: ["#ddf", "#fff"]
		}
	};

	var optionsContainerVars;
	this.setup = function() {
		console.log("Setting up graphs");
		optionsContainerVars = $("#graphs-options-variables");
		$.each(datasets, function(key, value) {
			optionsContainerVars.append("<label class='checkbox'><input type='checkbox' name='" + key +
				"' checked /> "+ value.label +"</label>");
		});
		optionsContainerVars.find("input").click(generateMainGraph);
		$("#graphs-options-periods").find("input").click(generateMainGraph);
	};


	this.plotMainGraph = function(data, period) {
		//console.log(data);
		$.each(data, function(key, value) {
			dataStruct[period][key] = cleanDataSeries(value);
		});
	};
	function generateMainGraph() {
		var data = [];
		var period = $("#graphs-options-periods label input[type='radio']:checked").val();

		optionsContainerVars.find("input:checked").each(function() {
			var key = $(this).attr("name");
			if (key && datasets[key]) {
				datasets[key].data = dataStruct[period][key];
				data.push(datasets[key]);
			}
		});

		if(data.length === 0) {
			console.log("no data to plot!");
		}

		$.plot("#sensor-graph-main", data,
			{//options
				xaxis: {
					mode: "time",
					timeformat: dataStruct[period].format,
					minTickSize: [1, 'hour']
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

	this.plotSensorGraph = function(dat, name) {
		dataStruct.now[name] = cleanDataSeries(dat);
		plotDashboardGraph(name);
	};
	//Special case sensor graph
	this.plotTempGraph = function(dat1, dat2) {
		dataStruct.now["temp1"] = cleanDataSeries(dat1);
		dataStruct.now["temp2"] = cleanDataSeries(dat2);
		plotDashboardGraph("temp");
	};

	function plotDashboardGraph(id) {
		var placeholder = "#sensor-graph-" + id;

		var data = [];
		//special case for temperature
		if(id === "temp") {
			data[1] = datasets.temp2;
			data[1].data = dataStruct.now.temp2;
			id = "temp1";
		}
		data[0] = datasets[id];
		data[0].data = dataStruct.now[id];

		$.plot(placeholder,	data,
			{//options
				xaxis: {
					mode: "time", // null or "time"
					timeformat: "%H",
					minTickSize: [1, 'hour']
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

	this.plotGenericGraphShowingAllOptionsOfFlotLibrary = function(dat1, dat2) {

		$.plot("#sensor-graph-temp",
			[//data
				{
					data: cleanDataSeries(dat1),
					color: "#f32",
					label: "T-in",
		//			lines: specific lines options
		//			bars: specific bars options
		//			points: specific points options
		//			xaxis: number
		//			yaxis: number
					clickable: true,
					hoverable: true
		//			shadowSize: number
		//			highlightColor: color or number
				},
				{
					data: cleanDataSeries(dat2),
					color: "#c74",
					label: "T-out"
				}

			],
			{//options
				xaxis: {
		//			show: null or true/false
		//			position: "bottom" or "top" or "left" or "right"
		//			color: null or color spec
		//			font: null or font spec object

					mode: "time", // null or "time"
					timeformat: "%H",
		//			timezone: null, "browser" or timezone (only makes sense for mode: "time")
		//			monthNames: null or array of size 12 of strings
		//			dayNames: null or array of size 7 of strings
		//
		//			min: null or number
		//			max: null or number
		//			autoscaleMargin: null or number
		//
		//			transform: null or fn: number -> number
		//			inverseTransform: null or fn: number -> number
		//
		//			ticks: 4 //null or number or ticks array or (fn: axis -> ticks array)
		//			tickSize: number or array
					minTickSize: [1, 'hour'] // number or array, e.g. [1, "hour"] for time mode
		//			tickFormatter: (fn: number, object -> string) or string
		//			tickDecimals: null or number
		//			tickLength: null or number
		//			alignTicksWithAxis: null or number
		//			tickColor: null or color spec
		//
		//			labelWidth: null or number
		//			labelHeight: null or number
		//			reserveSpace: null or true
				},
				series: {
					points: {
						show: false,
						radius: 3
		//				symbol: "circle" or function
					},
					lines: {
						lineWidth: 2,
						show: true
		//				steps: boolean
					}
					//lines, points, bars: {
						//show: boolean
						//lineWidth: number
						//fill: boolean or number
						//fillColor: null or color/gradient
					//}
		//
		//			lines, bars: {
		//				zero: boolean
		//			}
		//
		//			bars: {
		//				barWidth: number
		//				align: "left", "right" or "center"
		//				horizontal: boolean
		//			}
		//
		//			shadowSize: number
		//			highlightColor: color or number
				},
				legend: {
					show: true,
		//			labelFormatter: null or (fn: string, series object -> string)
		//			labelBoxBorderColor: color
		//			noColumns: number
					position: "nw", //ne,nw,se,sw
		//			margin: number of pixels or [x margin, y margin]
		//			backgroundColor: null or color
					backgroundOpacity: 0.3 //0-1
		//			container: null or jQuery object/DOM element/jQuery expression
		//			sorted: null/false, true, "ascending", "descending", "reverse", or a comparator
				},
				grid: {
		//			show: boolean
		//			aboveData: boolean
		//			color: color
					backgroundColor: { colors: ["#fee", "#eef"] }
		//			margin: number or margin object
		//			labelMargin: number
		//			axisMargin: number
		//			markings: array of markings or (fn: axes -> array of markings)
		//			borderWidth: number or object with "top", "right", "bottom" and "left" properties with different widths
		//			borderColor: color or null or object with "top", "right", "bottom" and "left" properties with different colors
		//			minBorderMargin: number or null
		//			clickable: boolean
		//			hoverable: boolean
		//			autoHighlight: boolean
		//			mouseActiveRadius: number
				},
				interaction: {
					//redrawOverlayInterval: number or -1
				}
			}
		);
	};
};
