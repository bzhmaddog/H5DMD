import {BaseLayer} from "./base-layer"
import {Options} from "../utils"
import {VideoLayerOptions} from "../interfaces"

enum VideoState {
	STOPPED,
	PAUSED,
	PLAYING
}

class VideoLayer extends BaseLayer {

    private _video: HTMLVideoElement
	private _onPlayListener?: (layer: VideoLayer) => void
	private _onPauseListener?: (layer: VideoLayer) => void
	private _onStopListener?: (layer: VideoLayer) => void
	private _internalAction: boolean

	private _state: VideoState = VideoState.STOPPED

    constructor(
		id: string,
		width: number,
		height: number,
		options?: Partial<VideoLayerOptions> | Options,
		loadedListener?: (layer: VideoLayer) => void | Promise<void>,
		updatedListener?: (layer: VideoLayer) => void | Promise<void>,
		playListener?: (layer: VideoLayer) => void,
		pauseListener?: (layer: VideoLayer) => void,
		stopListener?: (layer: VideoLayer) => void
    ) {
		const layerOptions = new Options({
			loop: false,
			autoplay: false,
			pauseOnHide: true,
			stopOnHide: false
		}).merge(options)

		super(id, width, height, layerOptions, loadedListener, updatedListener)

		this._onPlayListener = playListener
		this._onPauseListener = pauseListener
		this._onStopListener = stopListener

		if (this._options.get('stopOnHide') === true) {
			this._options.set('pauseOnHide', false)
		}

		// If layer is hidden at creation but autoplay was set to true then hack variable
		// to play the video when the layer is shown
		if (this._options.get('autoplay') === true && this._options.get('visible') === false) {
			this._internalAction = true
		}


		setTimeout(this._layerLoaded.bind(this), 1)
    }

	private _onVideoError(error: Event) {
		console.error(error)
	}

    private _onVideoLoaded() {
		// this.width/this.height, NOT options: 'width'/'height' are optional options
		// (the layer falls back to its container's dimensions), so they may be absent.
		this._contentBuffer.context.drawImage(this._video, 0, 0, this.width, this.height)

		if (this._options.get('autoplay') && this._options.get('visible')) {
			this.play()
		}

		this._layerUpdated()
    }

	private _onVideoPlayed() {
		this._startContentLoop(this.__renderFrame.bind(this))

		if (typeof this._onPlayListener === 'function') {
			this._onPlayListener(this)
		}
	}

	private _onVideoPaused() {
		this._stopContentLoop()
		this._stopRendering()

		if (typeof this._onPauseListener === 'function') {
			this._onPauseListener(this)
		}
	}

	private __renderFrame() {
		this._contentBuffer.clear()
		this._contentBuffer.context.drawImage(this._video, 0, 0, this.width, this.height)
	}

	private _play() {
		// If the layer is not visible do not start playing the video to save resources
		if (!this.isVisible()) {
			console.error(`Layer[${this.id}] is not visible`)
			return
		}

		// Video element not yet set — defer until setVideo() is called
		if (this._video === undefined) {
			this._internalAction = true
			return
		}

		// If video is already playing do nothing
		if (this._state === VideoState.PLAYING) {
			this._logWarning("Video is already being played")
			return
		}

		this._state = VideoState.PLAYING
		this._internalAction = false

		this._startContentLoop(this.__renderFrame.bind(this))
		this._video.play()

		this._startRendering()
	}

	private _pause(isInternal: boolean = false) {
		if (this._video === undefined) {
			this._logWarning("Video is not set")
			return
		}

		if (this._state !== VideoState.PLAYING) {
			this._logWarning("Video is not being played")
			return
		}
		
		this._internalAction = isInternal
		this._state = VideoState.PAUSED
		
		this._video.pause()
		this._stopContentLoop()
	}

	private _stop(isInternal: boolean = false) {
		if (this._video === undefined) {
			this._logWarning("Video is not set")
			return
		}

		if (this._state !== VideoState.PLAYING) {
			this._logWarning("Video was not being played")
		}

		this._internalAction = isInternal

		this._state = VideoState.STOPPED

		this._video.pause()
		this._video.currentTime = 0
		this._stopContentLoop()
	}

	protected _onVisibilityChanged(): void {
		if (!this.isVisible() && this._state === VideoState.PLAYING && (this._options.get('stopOnHide') || this._options.get('pauseOnHide'))) {

			if (this._options.get('stopOnHide')) {
				this._stop(true)
			} else if (this._options.get('pauseOnHide')) {
				this._pause(true)
			}
		}

		if (this.isVisible() && this._state !== VideoState.PLAYING && this._internalAction) {
			this._play()
		}
	}

	/**
	 * Load a media in the video element
	 */
	setVideo(video: HTMLVideoElement) {
		this._video = video
		this._video.loop = this._options.get('loop')

		this._video.addEventListener('play', this._onVideoPlayed.bind(this))
		this._video.addEventListener('pause', this._onVideoPaused.bind(this))

		// Video is already loaded
		this._onVideoLoaded()
	}

	loadVideo(src: string) {
		// create a video element (not attached to the dom)
		this._video = document.createElement('video')

		// set the dimensions
		this._video.width = this._options.get('videoWidth') || this.width
		this._video.height = this._options.get('videoHeight') || this.height
		this._video.loop = this._options.get('loop') || false
		
		// Bind loaded event of the video to publish an event so the client 
		// can do whatever it want (example: play the video) 
		this._video.addEventListener('play', this._onVideoPlayed.bind(this))
		this._video.addEventListener('pause', this._onVideoPaused.bind(this))
		this._video.addEventListener('loadeddata', this._onVideoLoaded.bind(this))
		this._video.addEventListener('error', this._onVideoError.bind(this))
		this._video.src = src
	}


	play() {
		this._play()
	}

	pause() {
		this._pause()
	}

	stop() {
		this._stop()
	}

	isPlaying() {
		return this._state === VideoState.PLAYING
	}


}

export { VideoLayer }