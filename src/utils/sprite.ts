import {OffscreenBuffer} from "./offscreenBuffer"
import {ISpriteAnimation} from "../interfaces/iSpriteAnimation";
import {ISpriteSequenceItem} from "../interfaces";

interface IAnimationQueueItem {
    params: ISpriteAnimation,
    loop: number
}

interface IAnimationDictionnary {
    [index: string]: ISpriteAnimation
}


class Sprite {
    private _id: string
    private _buffer: OffscreenBuffer
    private _spriteSheet: ImageBitmap
    private _animations: IAnimationDictionnary
    private _animation: IAnimationQueueItem
    private _isAnimating: boolean
    private _loop: number
    private _queue: IAnimationQueueItem[]
    private _loopSequence: boolean
    private _hFrameOffset: number
    private _vFrameOffset: number
    private _maxHeight: number
    private _maxWidth: number
    private _endOfQueueListener?: (id: string) => void
    private _frameDuration: number
    private _frameIndex: number
    private _startTime?: number

    /**
     *
     * @param id
     * @param spriteSheet
     * @param {number} hFrameOffset Distance between each frame (horizontaly)
     * @param {number} vFrameOffset Distance between each frame (vertically))
     */
    constructor(id: string, spriteSheet: ImageBitmap, hFrameOffset: number, vFrameOffset: number) {
        this._id = id

        this._buffer = new OffscreenBuffer(0, 0)
        this._animations = {} as IAnimationDictionnary
        this._animation = null
        this._isAnimating = false
        this._loop = 1
        this._queue = []
        this._loopSequence = false
        this._maxHeight = 0
        this._maxWidth = 0
        this._frameIndex = 0
        this._frameDuration = 0
        this._hFrameOffset = hFrameOffset
        this._vFrameOffset = vFrameOffset
        this._spriteSheet = spriteSheet
    }

    /**
     *
     * @param {string} id Name of the animation (used to run/stop it)
     * @param animationParams
     */
    addAnimation(
        id: string,
        animationParams: ISpriteAnimation
    ) {

        if (typeof this._animations[id] === 'undefined') {
            this._animations[id] = animationParams

            this._maxHeight = Math.max(this._maxHeight, animationParams.height)
            this._maxWidth = Math.max(this._maxWidth, animationParams.width)
        } else {
            throw new Error(`Animation [${id} already exists in sprite [${this._id}]`)
        }
    }

    /**
     * Main render routine
     */
    private _doAnimation(t: number) {
        const now = t
        const previousFrameIndex = this._frameIndex

        if (this._startTime === null) {
            this._startTime = now
        }

        const delta = now - this._startTime

        // Calculate frame number given delta and duration
        this._frameIndex = Math.floor(delta / this._frameDuration)

        // If loop is 
        if (this._frameIndex >= this._animation.params.nbFrames) {
            this._loop++

            // End of loop then process queue to start next animation in line
            if (this._animation.loop > 0 && this._loop > this._animation.loop) {
                this._processQueue()
                return
            }

            // Start animation back to first frame
            this._frameIndex = 0
            this._startTime = null
        }


        // Only redraw buffer is frame is different
        if (this._frameIndex !== previousFrameIndex) {
            const xOffset = this._frameIndex * (this._animation.params.width + this._hFrameOffset) + this._animation.params.xOffset
            // Shift vertical position so that sprites are aligned at the bottom
            const yPos = this._maxHeight - this._animation.params.height

            //console.log(`${this._frameIndex} / ${xOffset} / ${yPos}`)
   
            this._buffer.clear()
            this._buffer.context.drawImage(this._spriteSheet,  xOffset,  this._animation.params.yOffset, this._animation.params.width, this._animation.params.height, 0, yPos, this._animation.params.width, this._animation.params.height)
        }

        requestAnimationFrame(this._doAnimation.bind(this))
    }

    /**
     * Pop animation from the queue and play it
     */
    private _processQueue() {

        if (this._queue.length > 0) {

            if (this._loopSequence) {

                if (this._queue.length > 1) {
                    this._animation = this._queue.shift()
                    // Put this animation to the bottom of the queue is needed
                    this._queue.push(this._animation)
                } else {
                    this._animation = this._queue[0]
                }

            } else {
                this._animation = this._queue.shift()
            }

            this._frameIndex = this._animation.params.nbFrames // To force rendering of frame 0
            this._startTime = null
            this._frameDuration = this._animation.params.duration / this._animation.params.nbFrames
            this._isAnimating = true
            this._loop = 1


            // Resizing will clear buffer so do it only if needed
            if (this._buffer.width !== this._animation.params.width) {
                this._buffer.width = this._animation.params.width
            }

            // Resizing will clear buffer so do it only if needed
            if (this._buffer.height !== this._maxHeight) {
                this._buffer.height =  this._maxHeight
            }

            requestAnimationFrame(this._doAnimation.bind(this))
        } else {
            this._isAnimating = false
            if (typeof this._endOfQueueListener === 'function') {
                this._endOfQueueListener(this._id)
            }
        }
    }


    /**
     * Play a single animation
     * @param {string} id
     * @param {number} nbLoop
     */
    enqueueSingle(id: string, nbLoop: number) {
        this._queue.push({
            params : this._animations[id],
            loop : (typeof nbLoop === 'number') ? nbLoop : 0
        })
    }



    /**
     *
     * @param seq
     * @param loop
     */
    enqueueSequence(seq: ISpriteSequenceItem[], loop?: boolean) {

      
        // Build array of animation
        // array[0] = animation id
        // array[1] = number of loop
        for (let i = 0; i < seq.length; i++) {
            this._queue.push({
                params: this._animations[seq[i].key],
                loop: Math.max(1, seq[i].nbLoop)
            })
        }

        // Boolean
        this._loopSequence = !!loop

        // Start animation
        //this._processQueue()
    }

    run() {
        this._processQueue()
    }

    /**
     * Stop current animation
     * TODO
     */
    stop() {
        this._isAnimating = false
        this._loopSequence = false
        this._queue = []
    }

    /**
     * Return current image
     */
    get data() {
        return this._buffer.canvas
	}

    /**
     * Get output buffer context
     */
    get context() {
        return this._buffer.context
    }

    /**
     * Get sprite width
     */
    get width() {
        return this._maxWidth
    }

    /**
     * Get sprite height
     */
    get height() {
        return this._maxHeight
    }

    /**
     * Is the sprite currently animating ?
     * @returns boolean
     */
    isAnimating() {
        return this._isAnimating
    }

    /**
     * Set the End of queue listener that will be called when current queue is empty
     * @param {Function} listener 
     */
    setEndOfQueueListener(listener: (id: string) => void) {
        this._endOfQueueListener = listener
    }
}

export { Sprite }