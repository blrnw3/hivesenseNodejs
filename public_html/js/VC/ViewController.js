var VC = new function() {
	/*
	 * View-Controller Namespace
	 */

	 /*
	 * Application-level constants and UI control logic
	 */
	 this.View = function() {

		var pages = [ "settings", "home", "graphs", "history", "api", "about" ];

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

		function bindEvents() {
			console.log("binding events");

			(new VC.Dashboard).bindEvents();
			VC.Settings.bindEvents();

			//Page switching
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

		this.loadUI = function() {
			bindEvents();
		};
	 };

};
