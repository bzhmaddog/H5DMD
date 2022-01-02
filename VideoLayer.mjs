import { Buffer } from "./Buffer.mjs";

class VideoLayer {
	#loaded;
	#video;
	#id;
	#options;
	#listener;
	#outputBuffer;
	#renderNextFrame;
	#isPlaying;
	#onPlayListener;
	#onPauseListener;

	/**
 	 * Create an object that contains a video element and some utility methods
 	 * @param id {string} id of the object
	 * @param width {integer} The width of the video
 	 * @param height {integer} The height of the video
 	 */
	constructor(id, _options, _listener, _onPlayListener, _onPauseListener) {
		var defaultOptions = {
								loop : false,
								autoplay : false,
								mimeType : 'video/webm'
							};
		this.#loaded = false;
		this.#id = id;
		this.#options = Object.assign(defaultOptions, _options);
		this.#listener = _listener;
		this.#onPlayListener = _onPlayListener;
		this.#onPauseListener = _onPauseListener;

		this.#outputBuffer = new Buffer(this.#options.width, this.#options.height);

		// Create a video element
		this.#video = document.createElement('video'); // create a video element (not attached to the dom
		
		// set the dimensions
		this.#video.width = this.#options.width;
		this.#video.height = this.#options.height;
		this.#video.loop = this.#options.loop;

		this.#isPlaying = false;
		
		this.#renderNextFrame = function(){};

		// Bind loaded event of the video to publish an event so the client 
		// can do whatever it want (example: play the video) 
		this.#video.addEventListener('loadeddata', this.#onDataLoaded.bind(this));
		this.#video.addEventListener('play', this.#onVideoPlayed.bind(this));
		this.#video.addEventListener('pause', this.#onVideoPaused.bind(this));
	}

    #onDataLoaded() {
        this.#loaded =  true;

		this.#outputBuffer.context.drawImage(this.#video,0 , 0, this.#options.width, this.#options.height);


        if (typeof this.#listener === 'function') {
            this.#listener(this)
        }
    }

	#onVideoPlayed() {
		if (typeof this.#onPlayListener === 'function')	 {
			this.#onPlayListener();
		}
	}

	#onVideoPaused() {
		if (typeof this.#onPauseListener === 'function')	 {
			this.#onPauseListener();
		}
	}

	#renderFrame() {
		this.#outputBuffer.context.drawImage(this.#video, 0, 0, this.#options.width, this.#options.height);
		this.#renderNextFrame();
	}

	#requestRenderNextFrame() {
		requestAnimationFrame(this.#renderFrame.bind(this));
	}


	/**
	 * Load a media in the video element
	 */
	load(src, mimeType) {
		this.#video.type = mimeType;
		this.#video.src = src; // load the video
	}

	play() {
		if (this.#isPlaying) {
			return;
		}
		this.#isPlaying = true;
		this.#renderNextFrame = this.#requestRenderNextFrame;
		this.#requestRenderNextFrame();
		this.#video.play();
	}

	stop(reset) {
		this.#isPlaying = false;
		this.#video.pause();

		if (!!reset) {
			this.#video.currentTime = 0
		}

		this.#renderNextFrame = function(){};
	}

	get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
		return this.#outputBuffer.canvas;
	}

	get context() {
		return this.#outputBuffer.context;
	}

	get video() {
		return this.#video;
	}

	get options() {
		return this.#options;
	}
}

export { VideoLayer };