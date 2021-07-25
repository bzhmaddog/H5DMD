class VideoLayer {
	#loaded;
	#video;
	#id;
	#options;
	#listener;

	/**
 	 * Create an object that contains a video element and some utility methods
 	 * @param id {string} id of the object
	 * @param width {integer} The width of the video
 	 * @param height {integer} The height of the video
 	 */
	constructor(id, _options, _listener) {
		var defaultOptions = {
								loop : false,
								autoplay : false,
								mimeType : 'video/webm'
							};
		this.#loaded = false;
		this.#id = id;
		this.#options = Object.assign(defaultOptions, _options);
		this.#listener = _listener;

		// Create a video element
		this.#video = document.createElement('video'); // create a video element (not attached to the dom
		
		// set the dimensions
		this.#video.width = this.#options.width;
		this.#video.height = this.#options.height;
		this.#video.loop = this.#options.loop;
		
		// Bind loaded event of the video to publish an event so the client 
		// can do whatever it want (example: play the video) 
		this.#video.addEventListener('loadeddata', this.#onDataLoaded.bind(this));
	}

    #onDataLoaded() {
        this.#loaded =  true;
        if (typeof this.#listener === 'function') {
            this.#listener(this)
        }
    }


	/**
	 * Load a media in the video element
	 */
	load(src, mimeType) {
		this.#video.type = mimeType;
		this.#video.src = src; // load the video
	}

	get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
		return this.#video;
	}

	get options() {
		return this.#options;
	}
}

export { VideoLayer };