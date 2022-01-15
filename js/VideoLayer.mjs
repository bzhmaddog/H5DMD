import { BaseLayer } from "./BaseLayer.mjs";

class VideoLayer extends BaseLayer {

	#video;
	#isPlaying;
	#renderNextFrame;
	#onPlayListener;
	#onPauseListener;

	/**
 	 * Create an object that contains a video element and some utility methods
 	 * @param id {string} id of the object
	 * @param width {integer} The width of the video
 	 * @param height {integer} The height of the video
 	 */
	//constructor(id, _options, _listener, _onPlayListener, _onPauseListener) {
	constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener, _playListener, _pauseListener) {

		var options = Object.assign({loop : false, autoplay : false, width: _width, height: _height}, _options);

		super(_id, _width, _height, options, _renderers, _loadedListener, _updatedListener);

		this.#onPlayListener = _playListener;
		this.#onPauseListener = _pauseListener;

		// Create a video element
		this.#video = document.createElement('video'); // create a video element (not attached to the dom
		
		// set the dimensions
		this.#video.width = options.width;
		this.#video.height = options.height;
		this.#video.loop = options.loop;

		this.#isPlaying = false;
		
		this.#renderNextFrame = function(){};

		// Bind loaded event of the video to publish an event so the client 
		// can do whatever it want (example: play the video) 
		this.#video.addEventListener('loadeddata', this.#onVideoLoaded.bind(this));
		this.#video.addEventListener('play', this.#onVideoPlayed.bind(this));
		this.#video.addEventListener('pause', this.#onVideoPaused.bind(this));

		if (typeof options.src === 'string') {
			this.load(options.src);
		}
	}

    #onVideoLoaded() {

		this._contentBuffer.context.drawImage(this.#video,0 , 0, this._options.width, this._options.height);

		if (this._options.autoplay) {
			this.play();
		}

		this._layerLoaded();
    }

	#onVideoPlayed() {
		this.#renderNextFrame = this.#requestRenderNextFrame;
		this.#requestRenderNextFrame();

		if (typeof this.#onPlayListener === 'function') {
			this.#onPlayListener();
		}
	}

	#onVideoPaused() {
		this.#renderNextFrame = function(){console.log('End of video rendering')};
		this._stopRendering();

		if (typeof this.#onPauseListener === 'function') {
			this.#onPauseListener();
		}
	}

	#renderFrame() {
		this._contentBuffer.clear();
		this._contentBuffer.context.drawImage(this.#video, 0, 0, this._options.width, this._options.height);
		this.#renderNextFrame();
	}

	#requestRenderNextFrame() {
		requestAnimationFrame(this.#renderFrame.bind(this));
	}


	/**
	 * Load a media in the video element
	 */
	load(src, mimeType) {
		//this.#video.type = mimeType;
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

		this._startRendering();
	}

	stop(reset) {
		this.#isPlaying = false;
		this.#video.pause();

		if (!!reset) {
			this.#video.currentTime = 0
		}

		this.#renderNextFrame = function(){"End of video rendering"};
	}

	isPlaying() {
		return this.#isPlaying;
	}

}

export { VideoLayer };