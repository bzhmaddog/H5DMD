import { BaseLayer, LayerType } from "./BaseLayer.js";
import { Options } from "../Options.js";
import { IRendererDictionary } from "../renderers/Renderer.js";

class VideoLayer extends BaseLayer {

    private _video: HTMLVideoElement;
	private _isPlaying: boolean;
	private _onPlayListener?: Function;
	private _onPauseListener?: Function;
	private _onStopListener?: Function;
    private __renderNextFrame: Function;

    constructor(
		id: string,
		width: number,
		height: number,
		options: Options,
		renderers?: IRendererDictionary,
		loadedListener?: Function,
		updatedListener?: Function,
		playListener?: Function,
		pauseListener?: Function,
		stopListener?: Function
    ) {
        super(id, LayerType.Video, width, height, renderers, loadedListener, updatedListener);

        var defaultOptions = new Options({loop : false, autoplay : false});

        Object.assign(this._options, defaultOptions, options);

		this._onPlayListener = playListener;
		this._onPauseListener = pauseListener;
		this._onStopListener = stopListener;

		// Create a video element
		this._video = document.createElement('video'); // create a video element (not attached to the dom)
		
		// set the dimensions
		this._video.width = options.get('width', width);
		this._video.height = options.get('height', height);
		this._video.loop = options.get('loop', false);

		this._isPlaying = false;
		
		this.__renderNextFrame = function(){};

		// Bind loaded event of the video to publish an event so the client 
		// can do whatever it want (example: play the video) 
		this._video.addEventListener('loadeddata', this._onVideoLoaded.bind(this));
		this._video.addEventListener('play', this._onVideoPlayed.bind(this));
		this._video.addEventListener('pause', this._onVideoPaused.bind(this));

		if (typeof options.get('src') === 'string') {
			this.load(options.get('src'));
		}
    }

    private _onVideoLoaded() {
        console.log("autoplay = ", this._options.get('autoplay', false));

		this._contentBuffer.context.drawImage(this._video,0 , 0, this._options.get('width'), this._options.get('height'));

		if (this._options.get('autoplay', false)) {
			this.play();
		}

		this._layerLoaded();
    }

	private _onVideoPlayed() {
		this.__renderNextFrame = this._requestRenderNextFrame;
		this._requestRenderNextFrame();

		if (typeof this._onPlayListener === 'function') {
			this._onPlayListener();
		}
	}

	private _onVideoPaused() {
		this.__renderNextFrame = function(){console.log('End of video rendering')};
		this._stopRendering();

		if (typeof this._onPauseListener === 'function') {
			this._onPauseListener();
		}
	}

	private __renderFrame() {
		this._contentBuffer.clear();
		this._contentBuffer.context.drawImage(this._video, 0, 0, this._options.get('width'), this._options.get('height'));
		this.__renderNextFrame();
	}

	private _requestRenderNextFrame() {
		requestAnimationFrame(this.__renderFrame.bind(this));
	}


	/**
	 * Load a media in the video element
	 */
	load(src: string, mimeType?: string) {
		//this.#video.type = mimeType;
		this._video.src = src; // load the video
	}

	play() {
		if (this._isPlaying) {
			return;
		}
		this._isPlaying = true;
		this.__renderNextFrame = this._requestRenderNextFrame;
		this._requestRenderNextFrame();
		this._video.play();

		this._startRendering();
	}

	stop(reset: boolean = false) {
		this._isPlaying = false;
		this._video.pause();

		if (reset) {
			this._video.currentTime = 0
		}

		this.__renderNextFrame = function(){"End of video rendering"};
	}

	isPlaying() {
		return this._isPlaying;
	}


}

export { VideoLayer }