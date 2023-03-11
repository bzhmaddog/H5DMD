import { BaseLayer, LayerType } from "./BaseLayer.js";
import { Sprite } from "../Sprite.js";
class SpritesLayer extends BaseLayer {
    constructor(id, width, height, options, renderers, loadedListener, updatedListener) {
        super(id, LayerType.Sprites, width, height, renderers, loadedListener, updatedListener);
        var defaultOptions = {
            loop: false,
            autoplay: false
        };
        Object.assign(this._options, defaultOptions, options);
        this._sprites = {};
        this._runningSprites = 0;
        this.__renderNextFrame = function () { };
        setTimeout(this._layerLoaded.bind(this), 1);
    }
    /**
     * Render frame with all sprites data
     */
    __renderFrame() {
        const that = this;
        this._contentBuffer.clear();
        Object.keys(this._sprites).forEach(id => {
            if (this._sprites[id].visible) {
                this._contentBuffer.context.drawImage(that._sprites[id].sprite.data, that._sprites[id].x, that._sprites[id].y);
            }
        });
        this.__renderNextFrame(); // if needed
    }
    /**
     * Request rendering of next frame
     */
    _requestRenderNextFrame() {
        requestAnimationFrame(this.__renderFrame.bind(this));
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
    createSprite(id, src, hFrameOffset, vFrameOffset, animations, x, y) {
        const that = this;
        return new Promise((resolve, reject) => {
            if (typeof this._sprites[id] === 'undefined') {
                if (animations.length) {
                    var sprite = new Sprite(id, hFrameOffset, vFrameOffset);
                    sprite.loadSpritesheet(src).then(() => {
                        for (var i = 0; i < animations.length; i++) {
                            const args = animations[i];
                            sprite.addAnimation(...args);
                        }
                        that.addSprite(id, sprite, x, y);
                        resolve();
                    });
                }
                else {
                    reject(`No animations provided for sprite ${id}`);
                }
            }
            else {
                reject(`Sprite [${id}] already exists`);
            }
        });
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
    addSprite(id, sprite, _x, _y, v) {
        var isVisible = true;
        if (typeof sprite === 'object' && sprite.constructor !== Sprite) {
            console.error("Provided sprite is not a Sprite object");
            return false;
        }
        if (typeof this._sprites[id] !== 'undefined') {
            console.error('Already exists : ' + id);
            return false;
        }
        if (typeof v !== 'undefined') {
            isVisible = !!v;
        }
        var x = _x || 0;
        var y = _y || 0;
        if (_x.at(-1) === '%') {
            var vx = parseFloat(_x.replace('%', ''));
            x = Math.floor((vx * this.width) / 100);
        }
        else {
            x = parseInt(_x, 10);
        }
        if (_y.at(-1) === '%') {
            var vy = parseFloat(_y.replace('%', ''));
            y = Math.floor((vy * this.height) / 100);
        }
        else {
            y = parseInt(_y, 10);
        }
        this._sprites[id] = {
            x: x,
            y: y,
            sprite: sprite,
            visible: isVisible
        };
        // set sprite listener to this layer
        sprite.setEndOfQueueListener(this._onQueueEnded.bind(this));
        this._layerUpdated();
        return true;
    }
    /**
     * End of quest listener
     * @param {string} id : sprite queue which ended
     */
    _onQueueEnded(id) {
        this._runningSprites--;
        // If not more sprite is running then no need to keep rendering new frames
        if (this._runningSprites <= 0) {
            this._runningSprites = 0;
            this.__renderNextFrame = function () { };
            this._stopRendering();
        }
    }
    /*getSprite(id) {
        if (typeof this._sprites[id] !== 'undefined') {
            return this._sprites[id].sprite;
        } else {
            throw new Error(`No sprite named : ${id} found in layer [#{this._id}]`);
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
            this._sprites[id].x = x;
            this._sprites[id].x = y;
        } else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`);
        }
    }*/
    /**
     * Change sprite visibility
     * @param {string} id
     * @param {boolean} v
     */
    setSpriteVisibility(id, v) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].visible = v;
        }
        else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`);
        }
    }
    /**
     * Run sprite current animation
     * @param {string} id
     */
    run(id) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._startRendering();
            if (!this._sprites[id].sprite.isAnimating()) {
                this._runningSprites++;
                this._sprites[id].sprite.run();
                if (this._runningSprites === 1) {
                    this.__renderNextFrame = this._requestRenderNextFrame;
                    this._requestRenderNextFrame();
                }
            }
        }
        else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`);
        }
    }
    /**
     * Stop sprite current animation
     * @param {string} id
     */
    stop(id) {
        if (typeof this._sprites[id] !== 'undefined') {
            if (this._sprites[id].sprite.isAnimating()) {
                this._runningSprites--;
                this._sprites[id].sprite.stop();
            }
        }
        else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`);
        }
        // Stop rendering if no sprite running
        if (this._runningSprites <= 0) {
            this._runningSprites = 0;
            this.__renderNextFrame = function () { };
        }
    }
    /**
     * Add sequence of animations to sprite queue
     * @param {string} id
     * @param {array} queue
     * @param {boolean} loop
     */
    enqueueSequence(id, queue, loop) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].sprite.enqueueSequence(queue, loop);
        }
        else {
            console.error(`Layer[${this.id}] : sprite [${id}] does not exist`);
        }
    }
}
export { SpritesLayer };
//# sourceMappingURL=SpritesLayer.js.map