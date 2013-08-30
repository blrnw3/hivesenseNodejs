/**
 * View-Controller Namespace declaration
 */
var VC = new function() {

	 /*
	 * Application-level constants and UI control logic
	 * (for permanent, non-View-specific components of the UI)
	 */
	 this.View = function() {

		/** Distinct Views (pages/tabs) of the Application */
		var pages = [ "settings", "home", "graphs", "history", "about" ];

		/**
		 * Change active View
		 * @param {String} target tab to switch to
		 */
		function switchPage(target) {
			for(var i = 0; i < pages.length; i++) {
				if(pages[i] === target) {
					$("#"+target).show(0);
					$("#li-"+target).attr("class", "active");
				} else {
					$("#"+pages[i]).hide(0);
					$("#li-"+pages[i]).attr("class", "");
				}
			}

			VC.Graphs.replot();
		};

		/** Bind general UI event handlers */
		function bindEvents() {
			console.log("binding events");

			(new VC.Dashboard).bindEvents();
			VC.Settings.bindEvents();

			//View switching
			for(var i = 0; i < pages.length; i++) {
				//Use closure to bind loop var (i) to each listener, i.e. keep i in scope for the clickListener function
				//Source: http://stackoverflow.com/questions/13227360/javascript-attach-events-in-loop?lq=1
				(function(i) {
					$("#li-"+pages[i]).click( function() {
						switchPage(pages[i]);
					});
				}(i));
			}

		};

		/** Load general UI */
		this.loadUI = function() {
			bindEvents();
		};
	 };

};
