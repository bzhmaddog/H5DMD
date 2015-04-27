(function () {
	'use strict';
	
	var server,
		dmd,
		messagesHandler;

	// When dom is loaded create the objects and bind the events
	document.addEventListener('DOMContentLoaded', function () {

		// Create a new DMD where each pixel will be 5x5
		// pixels will be spaced by 3 pixels horizontaly and verticaly
		// the original medias size will be 128x64
		// and the final DMD size will be 1024x511
		// pixel shape will be circle (can be circle or square at the moment)
		dmd = new DMD(128, 64, 1024, 511, 5, 5, 3, 3, 'circle', document.getElementById('dmd'));
		
		// DMD.addLayer is expecting separated arguments
		// Need to find a better way to do this
		PubSub.subscribe('layer.add', function (ev, data) {
			dmd.addLayer(data.name, 128, 64,  data.type, data.src, data.mimeType, data.transparent, data.visible, data.extra);
		});

		PubSub.subscribe('layer.remove', function (ev, data) {
			dmd.removeLayer(data.name);
		});


		PubSub.subscribe('layer.show', function (ev, data) {
			dmd.showLayer(data.name);
		});

		PubSub.subscribe('layer.hide', function (ev, data) {
			dmd.hideLayer(data.name);
		});


		// Subscribe to layer.loaded event
		PubSub.subscribe('layer.loaded', function (ev, data){
			// everytime a layer is loaded send back a confirmation to the server
			messagesHandler.sendMessage('layer.loaded', data);
		});


		// Subscribe to layer.removed event
		PubSub.subscribe('layer.removed', function (ev, data){
			// everytime a layer is loaded send back a confirmation to the server
			messagesHandler.sendMessage('layer.removed', data);
		});


		// Connect to the server via a websocket
		server = new WebSocket('ws://127.0.0.1:1337', ['soap', 'xmpp']);
		
		// Create a message Handler
		messagesHandler = new WS.messagesHandler(server);
		
		// Bind error event to display it on the DMD
		server.onerror = function (error) {
		  console.log('WebSocket Error ' + error);
		};
		
	
	},false);


function pingServer() {
	try {
		server.send('ping');
	} catch (ee) {
		console.log('hello');
	}
}

})();