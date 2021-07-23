/**
 * Message handler : Parse the message received by the server and publish events to be captured by the client
 * @param s {Object} a WebSocket connection
 */
class WSS {
	#server;
	
	setServer(s, onMessage) {
		this.#server = s;
		// Bind the onMessage event to our procesing method
		this.#server.onmessage = onMessage;
	}

	/**
	 * Send a message to the server
	 * @param messageType {string} type of message
	 * @param data {object} Data to send in the message
	 */
	sendMessage(messageType, data) {
		// Websocket only allow strings or binary data so we have to serialize our data before seding them
		this.#server.send(JSON.stringify({
			type : messageType,
			data : data
		}));
	}
}