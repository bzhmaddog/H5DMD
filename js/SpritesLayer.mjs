import { BaseLayer } from "./BaseLayer.mjs";
import { Sprite } from "./Sprite.mjs";

class SpritesLayer extends BaseLayer {
    #sprites;
    #runningSprites;
    #renderNextFrame;

	constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener) {
		var defaultOptions = {
            loop : false,
            autoplay : false,
            mimeType : 'video/webm'
        };

        super(_id, _width, _height, Object.assign(defaultOptions, _options), _renderers, _loadedListener, _updatedListener);

        this._setType('sprites');

        this.#sprites = {};
        this.#runningSprites = 0;
        this.#renderNextFrame = function(){};
        setTimeout(this._layerLoaded.bind(this), 1);
	}

    /**
     * Render frame with all sprites data
     */
    #renderFrame() {
        const that = this;

        this._contentBuffer.clear();
        
        Object.keys(this.#sprites).forEach(id => {
            if (this.#sprites[id].visible) {
                this._contentBuffer.context.drawImage(
                    that.#sprites[id].sprite.data,
                    that.#sprites[id].x,
                    that.#sprites[id].y
                );
            }
        });

        this.#renderNextFrame(); // if needed
    }

    /**
     * Request rendering of next frame
     */
    #requestRenderNextFrame() {
        requestAnimationFrame(this.#renderFrame.bind(this));        
    }

    /**
     * Create a sprite and add it to the layer
     * @param {string} id 
     * @param {string} src 
     * @param {number} hFrameOffset  (horizontal distance between frames)
     * @param {number} vFrameOffset  (vertical distance between frames)
     * @param {array<string>} animations 
     * @param {number} x (horizontal position on layer)
     * @param {number} y (vertical position on layer)
     */
    createSprite(id, src, hFrameOffset, vFrameOffset, animations, x, y) {
        var that = this;

        return new Promise( (resolve,reject) => {
            if (typeof this.#sprites[id] === 'undefined') {
                if (animations.length) {
                    new Sprite(id, src, hFrameOffset, vFrameOffset).then(sprite => {

                        for(var i = 0 ; i < animations.length ; i++) {
                            sprite.addAnimation(...animations[i]);
                        }

                        that.addSprite(id, sprite, x, y);
                        resolve();
                    });
                } else {
                    reject(`No animations provided for sprite ${id}`);
                }
            } else {
                reject(`Sprite [${id}] already exists`);
            }
        });
    }

    /**
     * Add an existing Sprite object to the layer ad x,y position
     * @param {string} id 
     * @param {Sprite} sprite 
     * @param {number} _x 
     * @param {number} _y
     * @param {boolean} v
     * @returns {boolean} true if sprite was assed false otherwise
     */
    addSprite(id, sprite, _x, _y, v) {
        var isVisible = true;

        if (typeof sprite === 'object' && sprite.constructor !== Sprite) {
            console.error("Provided sprite is not a Sprite object");
            return false;
        }

        if (typeof this.#sprites[id] !== 'undefined') {
            console.error('Already exists : ' + id);
            return false;
        }

        if (typeof v !== 'undefined') {
            isVisible = !!v;
        }

        var x = _x || 0;
        var y = _y || 0;

        if (typeof _x === 'string' && _x.at(-1) === '%') {
            var vx = parseFloat(_x.replace('%',''), 10);
            x = Math.floor((vx * this.width) / 100);
        }

        if (typeof _y === 'string' && _y.at(-1) === '%') {
            var vy = parseFloat(_y.replace('%',''), 10);
            y = Math.floor((vy * this.height) / 100);
        }


        this.#sprites[id] = {
            x : x,
            y : y,
            sprite : sprite,
            visible : isVisible
        };

        // set sprite listener to this layer
        sprite.setEndOfQueueListener(this.#onQueueEnded.bind(this));

        this._layerUpdated();

        return true;
    }

    /**
     * End of quest listener
     * @param {string} id : sprite queue which ended
     */
    #onQueueEnded(id) {
        this.#runningSprites--;

        // If not more sprite is running then no need to keep rendering new frames
        if (this.#runningSprites <= 0) {
            this.#runningSprites = 0;
            this.#renderNextFrame = function(){};
            this._stopRendering();
        }
    }

    /*getSprite(id) {
        if (typeof this.#sprites[id] !== 'undefined') {
            return this.#sprites[id].sprite;
        } else {
            throw new Error(`No sprite named : ${id} found in layer [#{this.#id}]`);
        }
    }*/

    /**
     * Change sprite position to x,y
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     */
    moveSprite(id, x, y) {
        if (typeof this.#sprites[id] !== 'undefined') {
            this.#sprites[id].x = x;
            this.#sprites[id].x = y;
        } else {
            console.error(`Layer[${this.getId()}] : sprite [${id}] does not exist`);
        }
    }

    /**
     * Change sprite visibility
     * @param {string} id 
     * @param {boolean} v 
     */
    setSpriteVisibility(id, v) {
        if (typeof this.#sprites[id] !== 'undefined') {
            this.#sprites[id].visible = !!v;
        } else {
            console.error(`Layer[${this.getId()}] : sprite [${id}] does not exist`);
        }
    }
    
    /**
     * Run sprite current animation
     * @param {string} id 
     */
    run(id) {
        if (typeof this.#sprites[id] !== 'undefined') {

            this._startRendering();

            if (!this.#sprites[id].sprite.isAnimating()) {
                this.#runningSprites++;
                this.#sprites[id].sprite.run();

                if (this.#runningSprites === 1) {
                    this.#renderNextFrame = this.#requestRenderNextFrame;
                    this.#requestRenderNextFrame();
                }
            }
        } else {
            console.error(`Layer[${this.getId()}] : sprite [${id}] does not exist`);
        }
    }

    /**
     * Stop sprite current animation
     * @param {string} id 
     */
    stop(id) {
        if (typeof this.#sprites[id] !== 'undefined') {
            if (this.#sprites[id].sprite.isAnimating()) {
                this.#runningSprites--;
                this.#sprites[id].sprite.stop();
            }
        } else {
            console.error(`Layer[${this.getId()}] : sprite [${id}] does not exist`);
        }

        // Stop rendering if no sprite running
        if (this.#runningSprites <= 0) {
            this.#runningSprites = 0;
            this.#renderNextFrame = function(){};
        }
    }

    /**
     * Add sequence of animations to sprite queue
     * @param {string} id 
     * @param {array} queue 
     * @param {boolean} loop 
     */
    enqueueSequence(id, queue, loop) {
        if (typeof this.#sprites[id] !== 'undefined') {
            this.#sprites[id].sprite.enqueueSequence(queue, loop);
        } else {
            console.error(`Layer[${this.getId()}] : sprite [${id}] does not exist`);
        }
    }


}

export { SpritesLayer };