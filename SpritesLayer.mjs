import { Buffer } from "./Buffer.mjs";

class SpritesLayer {
	#id;
	#options;
    #listener;
    #loaded;
    #sprites;
    #buffer;
    #outputImage;

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
        this.#buffer = new Buffer(this.#options.width, this.#options.height);
        this.#outputImage = new Image();
	}

    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
        return  this.#buffer.canvas;
	}

	get options() {
		return this.#options;
	}    

    #renderSprites() {
        const that = this;

        this.#buffer.clear();
        //this.#buffer.context.fillStyle =  "rgba(255, 255, 0, 1)";
        //this.#buffer.context.fillRect(0,0, this.#options.width, this.#options.height);

        Object.keys(this.#sprites).forEach(id => {
            //if (that.#sprites[id].sprite.isAnimating()) {
                const data = that.#sprites[id].sprite.data;
                this.#buffer.context.drawImage(data, that.#sprites[id].x, that.#sprites[id].y);
            //}
        });



        requestAnimationFrame(this.#renderSprites.bind(this));
    }

    addSprite(id, x, y, sprite) {
        if (typeof this.#sprites[id] !== 'undefined') {
            return false;
        }
        this.#sprites[id] = {
            x: x,
            y: y,
            sprite: sprite
        };
        
        if (!this.#loaded && typeof this.#listener === 'function') {
            this.#listener(this);
            requestAnimationFrame(this.#renderSprites.bind(this))
        }

        this.#loaded = true;

        return true;
    }


}

export { SpritesLayer };