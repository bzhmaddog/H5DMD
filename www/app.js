import { App } from './js/App.mjs';
import { Logger } from './js/utils/Logger.mjs';

(function () {
	'use strict';

	new Logger(true);
	
	// When dom is loaded create the objects and bind the events
	document.addEventListener('DOMContentLoaded', function () {

		// Instantiate App
		var app = new App('dmd');

		// Start
		app.start();
	},false);

})();