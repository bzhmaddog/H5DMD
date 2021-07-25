import { App } from './lib/App.mjs';

(function () {
	'use strict';
	
	// When dom is loaded create the objects and bind the events
	document.addEventListener('DOMContentLoaded', function () {

		// Instantiate App
		var app = new App('dmd');

		// Start
		app.start();
	},false);

})();