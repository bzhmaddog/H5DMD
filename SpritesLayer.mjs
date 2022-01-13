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

        this.#renderNextFrame();
    }

    #requestRenderNextFrame() {
        requestAnimationFrame(this.#renderFrame.bind(this));        
    }

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

    addSprite(id, sprite, x, y) {
        if (typeof this.#sprites[id] !== 'undefined') {
            console.log('Already exists : ' + id);
            return false;
        }

        this.#sprites[id] = {
            x : x,
            y : y,
            sprite : sprite,
            visible : true
        };

        sprite.setEndOfQueueListener(this.#onQueueEnded.bind(this));

        this._layerUpdated();
    }

    #onQueueEnded(id) {
        this.#runningSprites--;

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

    moveSprite(id,x,y) {
        this.#sprites[id].x = x;
        this.#sprites[id].x = y;
    }

    hideSprite(id) {
        this.#sprites[id].visible = false;
    }
    
    showSprite(id) {
        this.#sprites[id].visible = true;
    }

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
            throw new Error(`No sprite named : ${id} found in layer [#{this.#id}]`);
        }
    }

    stop(id) {
        if (typeof this.#sprites[id] !== 'undefined') {
            if (this.#sprites[id].sprite.isAnimating()) {
                this.#runningSprites--;
                this.#sprites[id].sprite.stop();
            }
        } else {
            throw new Error(`No sprite named : ${id} found in layer [#{this.#id}]`);
        }

        if (this.#runningSprites <= 0) {
            this.#runningSprites = 0;
            this.#renderNextFrame = function(){};
        }
    }

    enqueueSequence(id, queue, loop) {
        if (typeof this.#sprites[id] !== 'undefined') {
            this.#sprites[id].sprite.enqueueSequence(queue, loop);
        } else {
            throw new Error(`No sprite named : ${id} found in layer [#{this.#id}]`);
        }
    }


}

export { SpritesLayer };