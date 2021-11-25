/**
 * Message handler : Parse the message received by the server and publish events to be captured by the client
 * @param s {Object} a WebSocket connection
 */
class WSS {
	#server;
	#isConnected;
	#port;
	#hostname;
	#onOpenListener;
	#onCloseListener;
	#onErrorListener;
	#onMessageListener;

	constructor(hostname, port) {
		this.#isConnected = false;
		this.#hostname = hostname;
		this.#port = port;
	}

	set onOpen(listener) {
		this.#onOpenListener = listener;
	}

	set onClose(listener) {
		this.#onCloseListener = listener;
	}

	set onError(listener) {
		this.#onErrorListener = listener;
	}

	set onMessage(listener) {
		this.#onMessageListener = listener;
	}

	/**
	 * Internal on error handle (forward to listener)
	 * @param event 
	 */
	#onError(event) {
		if (typeof this.#onErrorListener === 'function') {
			this.#onErrorListener(event);
		}
	}

	/**
	 * Internal onopen handle to manage the state of isConnected
	 * @param event 
	 */
	#onOpen(event) {
		this.#isConnected = true;
		
		if (typeof this.#onOpenListener === 'function') {
			this.#onOpenListener(event);
		}
	}

	/**
	 * Internal message handle (forward event to listener only if connected to server)
	 * @param event 
	 */
	#onMessage(event) {
		if (this.#isConnected && typeof this.#onMessageListener === 'function') {

			// Parse message into a command and params
			let data = event.data;
			const parts = data.split('?');
			let cmd = "";
			let params = {};
	
			if (parts.length > 1) {
				const urlSearchParams = new URLSearchParams(parts[1]);
				params = Object.fromEntries(urlSearchParams.entries());
				cmd = parts[0];
			} else {
				cmd = data;
			}

			//console.log(cmd);
	
			this.#onMessageListener(cmd, params, data);
		}
	}

	/**
	 * Internal close event (to manage isConnected state)
	 * @param event
	 */
	#onClose(event) {
		if (typeof this.#onCloseListener === 'function') {
			this.#onCloseListener(event);
		}
		this.#isConnected = false;
	}

	/**
     * Connect to websocket server
     */
	connect() {
		// Connect to the server via a websocket
		this.#server = new WebSocket(`ws://${this.#hostname}:${this.#port}`, ['soap', 'xmpp']);

		this.#server.onerror = this.#onError.bind(this);
		this.#server.onopen = this.#onOpen.bind(this);
		this.#server.onclose = this.#onClose.bind(this);
		this.#server.onmessage = this.#onMessage.bind(this);
	}

	/**
	 * Close websocket server
	 */
	close() {
		this.#server.close();
	}

	/**
	 * Send a message to the server
	 * @param data {string} Data to send in the message
	 */
	send(data) {
		this.#server.send(data);
	}

	isConnected() {
		return this.#isConnected;
	}
}

export { WSS };