import {BaseLayer} from "./base-layer"
import {SpritesLayerOptions, SpriteAnimationItem, SpriteSequenceItem} from "../interfaces"
import {Options, Sprite} from "../utils"

interface ISpriteItem {
    x : number,
    y : number,
    sprite : Sprite,
    visible : boolean
}

interface ISpriteDictionary {
    [index: string] : ISpriteItem 
}

class SpritesLayer extends BaseLayer {

    private _sprites: ISpriteDictionary
    private _runningSprites: number

	constructor(
        id: string,
        width: number,
        height: number,
        options?: Partial<SpritesLayerOptions> | Options,
        loadedListener?: (layer: SpritesLayer) => void | Promise<void>,
        updatedListener?: (layer: SpritesLayer) => void | Promise<void>
    ) {
        const layerOptions = new Options({loop: false, autoplay: false}).merge(options)

        super(id, width, height, layerOptions, loadedListener, updatedListener)

        this._sprites = {} as ISpriteDictionary
        this._runningSprites = 0

        setTimeout(this._layerLoaded.bind(this), 1)
	}

    /**
     * Render frame with all sprites data
     */
    private __renderFrame() {

        this._contentBuffer.clear()
        
        Object.keys(this._sprites).forEach(id => {
            const sprite = this._sprites[id]

            if (sprite.visible) {
                this._contentBuffer.context.drawImage(
                    sprite.sprite.data,
                    sprite.x,
                    sprite.y
                )
            }
        })
    }

    /**
     * Create a sprite and add it to the layer
     * @param {string} id
     * @param spriteSheet
     * @param {number} hFrameOffset  (horizontal distance between frames)
     * @param {number} vFrameOffset  (vertical distance between frames)
     * @param {array<string>} animations
     * @param x horizontal position on the layer: pixels (`12`) or a percentage string (`'50%'`)
     * @param y vertical position on the layer: pixels (`12`) or a percentage string (`'50%'`)
     */
    createSprite(
        id: string,
        spriteSheet: ImageBitmap,
        hFrameOffset: number,
        vFrameOffset: number,
        animations: SpriteAnimationItem[],
        x: number | string,
        y: number | string
    ): Promise<Sprite> {

        return new Promise<Sprite>( (resolve, reject) => {
            if (typeof this._sprites[id] === 'undefined') {
                if (animations.length) {
                    const sprite = new Sprite(id, spriteSheet, hFrameOffset, vFrameOffset)

                    for (let i = 0; i < animations.length; i++) {
                        sprite.addAnimation(animations[i].key, animations[i].animationParams)
                    }

                    this.addSprite(id, sprite, x, y)

                    resolve(sprite)
                } else {
                    reject(`No animations provided for sprite ${id}`)
                }
            } else {
                reject(`Sprite [${id}] already exists`)
            }
        })
    }

    /**
     * Resolve a sprite coordinate to whole pixels on one axis.
     *
     * A number is a pixel position and is used as-is; a `'50%'` string is a fraction of the
     * layer's size on that axis. Percentages are why these coordinates ever had to be strings
     * - a plain pixel position no longer does.
     *
     * @param value pixels (`12`) or a percentage string (`'50%'`)
     * @param extent the layer's width or height, whichever axis `value` is on
     */
    private _resolveCoordinate(value: number | string, extent: number): number {
        if (typeof value === 'number') {
            return Math.floor(value)
        }

        if (value.at(-1) === '%') {
            return Math.floor((parseFloat(value.replace('%', '')) * extent) / 100)
        }

        return parseInt(value, 10)
    }

    /**
     * Add an existing Sprite object to the layer ad x,y position
     * @param {string} id
     * @param {Sprite} sprite
     * @param _x horizontal position: pixels (`12`) or a percentage string (`'50%'`)
     * @param _y vertical position: pixels (`12`) or a percentage string (`'50%'`)
     * @param {boolean} v
     * @returns {boolean} true if sprite was assed false otherwise
     */
    addSprite(id: string, sprite: Sprite, _x: number | string, _y: number | string, v?: boolean) {
        let isVisible = true

        if (typeof sprite === 'object' && sprite.constructor !== Sprite) {
            console.error("Provided sprite is not a Sprite object")
            return false
        }

        if (typeof this._sprites[id] !== 'undefined') {
            console.error('Already exists : ' + id)
            return false
        }

        if (typeof v !== 'undefined') {
            isVisible = !!v
        }

        const x = this._resolveCoordinate(_x, this.width)
        const y = this._resolveCoordinate(_y, this.height)

        this._sprites[id] = {
            x : x,
            y : y,
            sprite : sprite,
            visible : isVisible
        }

        // set sprite listener to this layer
        sprite.setEndOfQueueListener(this._onQueueEnded.bind(this))

        this._layerUpdated()

        return true
    }

    /**
     * End of queue listener
     */
    private _onQueueEnded() {
        this._runningSprites--

        // If not more sprite is running then no need to keep rendering new frames
        if (this._runningSprites <= 0) {
            this._runningSprites = 0
            this._stopContentLoop()
            this._stopRendering()
        }
    }

    /*getSprite(id) {
        if (typeof this._sprites[id] !== 'undefined') {
            return this._sprites[id].sprite
        } else {
            throw new Error(`No sprite named : ${id} found in layer [#{this._id}]`)
        }
    }*/

    /**
     * Change sprite position to x,y
     * @param {string} id 
     * @param {string} x 
     * @param {string} y 
     */
    /*moveSprite(id: string, x: string, y: string) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].x = x
            this._sprites[id].x = y
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`)
        }
    }*/

    /**
     * Change sprite visibility
     * @param {string} id 
     * @param {boolean} v 
     */
    setSpriteVisibility(id:string, v: boolean) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].visible = v
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`)
        }
    }
    
    /**
     * Run sprite current animation
     * @param {string} id 
     */
    run(id: string) {
        if (typeof this._sprites[id] !== 'undefined') {

            this._startRendering()

            if (!this._sprites[id].sprite.isAnimating()) {
                this._runningSprites++
                this._sprites[id].sprite.run()

                if (this._runningSprites === 1) {
                    this._startContentLoop(this.__renderFrame.bind(this))
                }
            }
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`)
        }
    }

    /**
     * Stop sprite current animation
     * @param {string} id
     */
    stop(id: string) {
        if (typeof this._sprites[id] !== 'undefined') {
            if (this._sprites[id].sprite.isAnimating()) {
                this._runningSprites--
                this._sprites[id].sprite.stop()
            }
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`)
        }

        // Stop rendering if no sprite running
        if (this._runningSprites <= 0) {
            this._runningSprites = 0
            this._stopContentLoop()
            this._stopRendering()
        }
    }

    /**
     * This layer's render loop is driven by run()/stop(), not by having
     * renderers, so BaseLayer.setVisibility(true) alone would leave the loop
     * stopped and the output frozen when the layer is shown while sprites are
     * running (they keep animating while hidden). Resume compositing on show.
     */
    protected _onVisibilityChanged(): void {
        if (this.isVisible() && this._runningSprites > 0) {
            this._startRendering()
        }
    }

    /**
     * Add sequence of animations to sprite queue
     * @param {string} id 
     * @param {array} queue 
     * @param {boolean} loop 
     */
    enqueueSequence(id: string, queue: SpriteSequenceItem[], loop: boolean) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].sprite.enqueueSequence(queue, loop)
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`)
        }
    }

}

export { SpritesLayer }