import {BaseLayer, LayerType} from "./baseLayer"
import {Options} from "../utils"
import {ILayerRendererDictionary} from "../interfaces"

class AnimationLayer extends BaseLayer {

    private _onPlayListener?: (layer: AnimationLayer) => void
    private _onPauseListener?: (layer: AnimationLayer) => void
    private _onStopListener?: (layer: AnimationLayer) => void
    private __renderNextFrame: () => void
    private _images: ImageBitmap[]
    private _isPlaying: boolean
    private _isPaused: boolean
    private _loop: boolean
    private _frameIndex: number
    private _startTime: number | null
    private _frameDuration: number

    constructor(
		id: string,
		width: number,
		height: number,
        options?: Options,
		renderers?: ILayerRendererDictionary,
        loadedListener?: (layer: AnimationLayer) => void,
        updatedListener?: (layer: AnimationLayer) => void,
        playListener?: (layer: AnimationLayer) => void,
        pauseListener?: (layer: AnimationLayer) => void,
        stopListener?: (layer: AnimationLayer) => void
    ) {

        const layerOptions = new Options({loop: false, autoplay: false}).merge(options)

        super(id, LayerType.Video, width, height, layerOptions, renderers, loadedListener, updatedListener)

        this._onPlayListener = playListener
        this._onPauseListener = pauseListener
        this._onStopListener = stopListener

        this._images = []
        this._isPlaying = false
        this._isPaused = false
        this._frameIndex = 0
        this._loop = layerOptions.get('loop')
        this.__renderNextFrame = function(){}
        
        setTimeout(this._layerLoaded.bind(this), 1)
    }

    setAnimationData(data: ImageBitmap[]) {
        this._images = data
        this._onImagesLoaded()
    }


    /**
     * Called when all images are finished loading
     */
    private _onImagesLoaded() {

        // calculate how long each frame should be displayed
        this._frameDuration = this._options.get('duration') / this._images.length

        //console.log(`Frame duration = ${this._frameDuration}`)

        //this._contentBuffer.clear()
        this._contentBuffer.context.drawImage(this._images[this._frameIndex], 0, 0, this.width, this.height)

        this._layerUpdated()

		if (this._options.get('autoplay')) {
			this.play()
		}

    }

    /**
     * Render current frame in content buffer
     * @param {number} t 
     * @returns 
     */
    private __renderFrame(t: number) {

        const now = t
        const previousFrameIndex = this._frameIndex

        if (!this._startTime) {
            this._startTime = now
        }

        const position = now - this._startTime

        let frameIndex = Math.floor(position / this._frameDuration)


        // If not looping stop at the last image in the array
        if (!this._loop && frameIndex >= this._images.length) {
            this.stop()
            return
        }

        // Loop back to the first image
        if (frameIndex >= this._images.length) {
            this._startTime = null
            frameIndex = 0
        }

        this._frameIndex = frameIndex

        // If it is the same frame as last call then no need to redraw it
        if (frameIndex !== previousFrameIndex) {
            // Update content buffer with current frame data
            this._drawImage()
        }

        // Render next frame if needed
        this.__renderNextFrame()
    }

    private _drawImage() {
        this._contentBuffer.clear()
        this._contentBuffer.context.drawImage(this._images[this._frameIndex], 0, 0, this.width, this.height)
    }

    /**
     * Request rendering of next frame
     */
    private _requestRenderNextFrame() {
        requestAnimationFrame(this.__renderFrame.bind(this))
    }

    /**
     * Play animation with current images array
     * @param {boolean} loop 
     */
    play(loop?: boolean) {
        if (this.isLoaded() && !this._isPlaying) {
            
            // if loop param provided then set animation loop to value
            if (typeof loop !== 'undefined') {
                this._loop = !!loop
            // Otherwise if animation is not paused reset loop state to initial options
            } else if (!this._isPaused) {
                this._loop = this._options.get('loop')
            }

            this._startTime = null
            this._isPlaying = true
            this._isPaused = false

            this.__renderNextFrame = this._requestRenderNextFrame
            this._requestRenderNextFrame()

            this._startRendering()

            if (typeof this._onPlayListener === 'function') {
                this._onPlayListener(this)
            }
        }
    }

    /**
     * Stop animation (frame index goes back to 0)
     */
    stop() {
        if (this._isPlaying) {
            this._isPlaying = false
            this._isPaused = false
            this._frameIndex = 0
            this.__renderNextFrame = function(){}
            this._stopRendering()

            if (typeof this._onStopListener === 'function') {
                this._onStopListener(this)
            }
        }
    }

    /**
     * Pause animation to current frame index (if started with loop=true otherwise duration will be wrong)
     * TODO : Maybe it is still possible to finish the animation
     */
    pause() {
        if (this._isPlaying) {
            // Only looping animation can be paused
            if (this._loop) {
                this._isPlaying = false
                this._isPaused = true
                this.__renderNextFrame = function(){}
                if (typeof this._onPauseListener === 'function') {
                    this._onPauseListener(this)
                }
            } else {
                console.log("Only looping animation can be paused")
                this.stop()
            }
        }
    }

    /**
     * Resumed a paused animation
     */
    resume() {
        if (this._isPaused) {
            this.play()
        } else {
            console.log("This video is not paused")
        }
    }

    nextFrame() {
        let nextFrame = this._frameIndex + 1

        if (nextFrame >= this._images.length) {
            nextFrame = 0
        }

        this._frameIndex = nextFrame
        requestAnimationFrame(this._drawImage.bind(this))
        this._layerUpdated()
    }

    previousFrame() {
        let prevFrame = this._frameIndex - 1

        if (prevFrame <= 0) {
            prevFrame = this._images.length - 1
        }

        this._frameIndex = prevFrame
        requestAnimationFrame(this._drawImage.bind(this))
        this._layerUpdated()
    }


    /**
     * Override base method to stop/resume animation when changing layer visibility
     */
    setVisibility(visible: boolean) {
        super.setVisibility(visible)

        if (!visible && this._isPlaying) {
            this.pause()
        } else if (visible && this._isPaused) {
            this.resume()
        }
    }

    /**
     * return state of animation
     */
    get isPlaying() {
        return this._isPlaying
    }

    /**
     * return state of animation
     */
    get isPaused() {
        return this._isPaused
    }

}

export { AnimationLayer }