var WS = (WS || {});

/**
 * Message handler : Parse the message received by the server and publish events to be captured by the client
 * @param s {Object} a WebSocket connection
 */
WS.messagesHandler = function (s) {
	'use strict';
	
	var server = s;

	/**
	 * Process a received message
	 * @param e {object} a websocket event
	 */
	function processMessage(e) {
		var message = JSON.parse(e.data);

		switch(message.type) {
			case 'addLayer' :
				PubSub.publish('layer.add', message.data);
				break;
			case 'removeLayer':
				PubSub.publish('layer.remove', message.data);
			break;
			case 'showLayer':
				PubSub.publish('layer.show', message.data);
			break;
			case 'hideLayer':
				PubSub.publish('layer.hide', message.data);
			break;

			/*case 'loadVideo' :
				PubSub.publish('video.load', message.data);
				break;
			case 'playVideo' :
				//video.play();
				PubSub.publish('video.play');
				break;
			case 'pauseVideo' :
				//video.pause();
				PubSub.publish('video.pause');
				break;
			case 'stopVideo' :
				//video.stop();
				PubSub.publish('video.stop');
				break;*/
		}
		
	}
	
	/**
	 * Send a message to the server
	 * @param messageType {string} type of message
	 * @param data {object} Data to send in the message
	 */
	function sendMessage(messageType, data) {
		// Websocket only allow strings or binary data so we have to serialize our data before seding them
		server.send(JSON.stringify({
			type : messageType,
			data : data
		}));
	}

	// Bind the onMessage event to our procesing method
	server.onmessage = processMessage;

	// Return a public method to let the client code be able to send messages to the server
	return {
		sendMessage : sendMessage
	}
};