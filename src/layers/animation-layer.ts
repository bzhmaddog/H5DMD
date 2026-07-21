import {BaseLayer, LayerLifecycleListeners} from "./base-layer"
import {Options} from "../utils"
import {AnimationLayerOptions} from "../interfaces"

type AnimationLayerListeners = LayerLifecycleListeners<AnimationLayer> & {
    play?: ((layer: AnimationLayer) => void) | Array<(layer: AnimationLayer) => void>
    pause?: ((layer: AnimationLayer) => void) | Array<(layer: AnimationLayer) => void>
    stop?: ((layer: AnimationLayer) => void) | Array<(layer: AnimationLayer) => void>
}

class AnimationLayer extends BaseLayer {

    private _playListeners: Array<(layer: AnimationLayer) => void> = []
    private _pauseListeners: Array<(layer: AnimationLayer) => void> = []
    private _stopListeners: Array<(layer: AnimationLayer) => void> = []
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
        options?: Partial<AnimationLayerOptions> | Options,
        listeners?: AnimationLayerListeners
    ) {

        const layerOptions = new Options({loop: false, autoplay: false, duration: 1000}).merge(options)
        const normalized = AnimationLayer._normalizeListeners(listeners)

        super(id, width, height, layerOptions, {
            loaded: normalized.loaded,
            updated: normalized.updated,
        })

        this._playListeners = normalized.play
        this._pauseListeners = normalized.pause
        this._stopListeners = normalized.stop

        this._images = []
        this._isPlaying = false
        this._isPaused = false
        this._frameIndex = 0
        this._loop = layerOptions.get('loop')

        setTimeout(this._layerLoaded.bind(this), 1)
    }

    private static _toArray<T>(value?: T | T[]): T[] {
        if (typeof value === 'undefined') return []
        return Array.isArray(value) ? value : [value]
    }

    private static _normalizeListeners(listeners?: AnimationLayerListeners): {
        loaded: Array<(layer: AnimationLayer) => void | Promise<void>>,
        updated: Array<(layer: AnimationLayer) => void | Promise<void>>,
        play: Array<(layer: AnimationLayer) => void>,
        pause: Array<(layer: AnimationLayer) => void>,
        stop: Array<(layer: AnimationLayer) => void>,
    } {
        return {
            loaded: AnimationLayer._toArray(listeners?.loaded),
            updated: AnimationLayer._toArray(listeners?.updated),
            play: AnimationLayer._toArray(listeners?.play),
            pause: AnimationLayer._toArray(listeners?.pause),
            stop: AnimationLayer._toArray(listeners?.stop),
        }
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
    }

    private _drawImage() {
        this._contentBuffer.clear()
        this._contentBuffer.context.drawImage(this._images[this._frameIndex], 0, 0, this.width, this.height)
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

            this._startContentLoop(this.__renderFrame.bind(this))

            this._startRendering()

            for (const fn of this._playListeners) fn(this)
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
            this._stopContentLoop()
            this._stopRendering()

            for (const fn of this._stopListeners) fn(this)
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
                this._stopContentLoop()
                for (const fn of this._pauseListeners) fn(this)
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

        if (prevFrame < 0) {
            prevFrame = this._images.length - 1
        }

        this._frameIndex = prevFrame
        requestAnimationFrame(this._drawImage.bind(this))
        this._layerUpdated()
    }


    on(event: 'loaded' | 'updated', handler: (layer: BaseLayer) => void | Promise<void>): this
    on(event: 'play' | 'pause' | 'stop', handler: (layer: BaseLayer) => void): this
    on(event: 'loaded' | 'updated' | 'play' | 'pause' | 'stop', handler: (layer: BaseLayer) => void | Promise<void>): this {
        if (event === 'play') { this._playListeners.push(handler as (layer: AnimationLayer) => void); return this }
        if (event === 'pause') { this._pauseListeners.push(handler as (layer: AnimationLayer) => void); return this }
        if (event === 'stop') { this._stopListeners.push(handler as (layer: AnimationLayer) => void); return this }
        return super.on(event as 'loaded' | 'updated', handler)
    }

    off(event: 'loaded' | 'updated', handler: (layer: BaseLayer) => void | Promise<void>): this
    off(event: 'play' | 'pause' | 'stop', handler: (layer: BaseLayer) => void): this
    off(event: 'loaded' | 'updated' | 'play' | 'pause' | 'stop', handler: (layer: BaseLayer) => void | Promise<void>): this {
        if (event === 'play') { this._playListeners = this._playListeners.filter(h => h !== handler); return this }
        if (event === 'pause') { this._pauseListeners = this._pauseListeners.filter(h => h !== handler); return this }
        if (event === 'stop') { this._stopListeners = this._stopListeners.filter(h => h !== handler); return this }
        return super.off(event as 'loaded' | 'updated', handler)
    }

    protected _onVisibilityChanged(): void {
        if (!this.isVisible() && this._isPlaying) {
            this.pause()
        } else if (this.isVisible() && this._isPaused) {
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