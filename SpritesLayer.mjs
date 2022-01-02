import { Buffer } from "./Buffer.mjs";
import { Sprite } from "./Sprite.mjs";

class SpritesLayer {
	#id;
	#options;
    #listener;
    #loaded;
    #sprites;
    #outputBuffer;
    #ctx;
    #runningSprites;
    #renderNextFrame;

	constructor(id, _options, _listener) {
		var defaultOptions = {
            loop : false,
            autoplay : false,
            mimeType : 'video/webm'
        };
        this.#loaded = false;
        this.#id = id;
        this.#options = Object.assign(defaultOptions, _options);
        this.#listener = _listener;
        this.#sprites = {};
        this.#outputBuffer = new Buffer(this.#options.width, this.#options.height);
        this.#ctx = this.#outputBuffer.context;
        this.#ctx.imageSmoothingEnabled = false;
        this.#runningSprites = 0;
        this.#renderNextFrame = function(){};
	}

    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
        return  this.#outputBuffer.canvas;
	}

    get context() {
        return this.#outputBuffer.context;
    }

	get options() {
		return this.#options;
	}    

    #renderSprites() {
        const that = this;

        this.#outputBuffer.clear();
        
        Object.keys(this.#sprites).forEach(id => {
            if (this.#sprites[id].visible) {
                const data = that.#sprites[id].sprite.data;
                this.#outputBuffer.context.drawImage(data, that.#sprites[id].x, that.#sprites[id].y);
            }
        });

        this.#renderNextFrame();
    }

    #requestRenderNextFrame() {
        requestAnimationFrame(this.#renderSprites.bind(this));        
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

        if (!this.#loaded && typeof this.#listener === 'function') {
            this.#listener(this);
        }

        this.#loaded = true;

        sprite.setEndOfQueueListener(this.#onQueueEnded.bind(this));
    }

    #onQueueEnded(id) {
        this.#runningSprites--;

        PubSub.publish("sprite.queue.finished", id);

        if (this.#runningSprites <= 0) {
            this.#runningSprites = 0;
            this.#renderNextFrame = function(){};
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