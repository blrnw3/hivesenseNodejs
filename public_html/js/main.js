$(document).ready(starter);
console.log("I am ready");

// Closure pattern for using private members (others exist:
// http://enterprisejquery.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/),
// but this is my favourite (good for devs coming from classical OOP languages):
// http://stackoverflow.com/questions/881515/javascript-namespace-declaration
var JavaScriptOOPdemo = new function() {
	this.publicFn = function() {
		console.log("I am private");
	};
	var privateFn = function() {
		console.log("I am private");
	};
	var privateVar = 5;
	this.publicVar = 45;
};


//var db = new WindowsAzure.MobileServiceClient(
//    "https://hivesense.azure-mobile.net/",
//    "vIrGaIHVxHZICXFUHBzaPhAonCdrgx46"
//);

//Classless 'booter' function
function starter() {
	Controller.boot();
}