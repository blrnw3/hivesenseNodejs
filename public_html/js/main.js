/**
 * File: Main.js
 * This script is called first on page load
 *
 * @author Ben Lee-Rodgers
 * @version 1.0, September 2013
 */
$(document).ready(starter);
console.log("Booting application");

//Classless 'booter' function
function starter() {
	Updater.boot();
}
