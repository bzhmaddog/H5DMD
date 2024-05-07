import {BaseLayer, LayerType} from "./baseLayer"
import {ILayerRendererDictionary} from "@interfaces/iLayerRendererDictionnary"
import {Sprite} from "@utils/sprite"
import {Options} from "@utils/options";

interface ISpriteItem {
    x : number,
    y : number,
    sprite : Sprite,
    visible : boolean
}

interface ISpriteDictionnary {
    [index: string] : ISpriteItem 
}

class SpritesLayer extends BaseLayer {

    private _sprites: ISpriteDictionnary
    private _runningSprites: number
    private __renderNextFrame: () => void
    
	constructor(
        id: string,
        width: number,
        height: number,
        options?: Options,
        renderers?: ILayerRendererDictionary,
        loadedListener?: (layer: SpritesLayer) => void,
        updatedListener?: (layer: SpritesLayer) => void
    ) {
        const layerOptions = new Options({loop: false, autoplay: false}).merge(options)

        super(id, LayerType.Sprites, width, height, layerOptions, renderers, loadedListener, updatedListener)

        this._sprites = {} as ISpriteDictionnary
        this._runningSprites = 0
        this.__renderNextFrame = function(){}

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

        this.__renderNextFrame() // if needed
    }

    /**
     * Request rendering of next frame
     */
    private _requestRenderNextFrame() {
        requestAnimationFrame(this.__renderFrame.bind(this))
    }

    /**
     * Create a sprite and add it to the layer
     * @param {string} id 
     * @param {string} src 
     * @param {number} hFrameOffset  (horizontal distance between frames)
     * @param {number} vFrameOffset  (vertical distance between frames)
     * @param {array<string>} animations 
     * @param {string} x (horizontal position on layer)
     * @param {string} y (vertical position on layer)
     */
    createSprite(
        id: string,
        spriteSheet: ImageBitmap,
        hFrameOffset: number,
        vFrameOffset: number,
        animations: [],
        x: string,
        y: string
    ): Promise<Sprite> {

        return new Promise<Sprite>( (resolve, reject) => {
            if (typeof this._sprites[id] === 'undefined') {
                if (animations.length) {
                    const sprite = new Sprite(id, spriteSheet, hFrameOffset, vFrameOffset)

                    for (let i = 0; i < animations.length; i++) {
                        const args: [string, number, number, number, number, number, number] = animations[i]
                        sprite.addAnimation(...args)
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
     * Add an existing Sprite object to the layer ad x,y position
     * @param {string} id 
     * @param {Sprite} sprite 
     * @param {string} _x 
     * @param {string} _y
     * @param {boolean} v
     * @returns {boolean} true if sprite was assed false otherwise
     */
    addSprite(id: string, sprite: Sprite, _x: string, _y: string, v?: boolean) {
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

        let x = _x || 0
        let y = _y || 0

        if (_x.at(-1) === '%') {
            const vx = parseFloat(_x.replace('%', ''))
            x = Math.floor((vx * this.width) / 100)
        } else {
            x = parseInt(_x, 10)
        }

        if (_y.at(-1) === '%') {
            const vy = parseFloat(_y.replace('%', ''))
            y = Math.floor((vy * this.height) / 100)
        } else {
            y = parseInt(_y, 10)
        }


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
            this.__renderNextFrame = function(){}
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
                    this.__renderNextFrame = this._requestRenderNextFrame
                    this._requestRenderNextFrame()
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
            this.__renderNextFrame = function(){}
        }
    }

    /**
     * Add sequence of animations to sprite queue
     * @param {string} id 
     * @param {array} queue 
     * @param {boolean} loop 
     */
    enqueueSequence(id: string, queue: [], loop: boolean) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].sprite.enqueueSequence(queue, loop)
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`)
        }
    }

}

export { SpritesLayer }