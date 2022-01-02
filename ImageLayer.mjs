import { Buffer } from "./Buffer.mjs";

class ImageLayer {
    #image;
    #id;
    #loaded;
    #listener;
    #options;
    #outputBuffer;

    constructor(id, _options, _listener) {
        this.#options = Object.assign({}, _options);
        this.#image = new Image();
        this.#id = id;
        this.#loaded = false;
        this.#listener = _listener;
        this.#options = {};
        this.#outputBuffer = new Buffer(_options.width, _options.height);

        this.#image.addEventListener('load', this.#onDataLoaded.bind(this));
    }

    #onDataLoaded() {
        this.#loaded =  true;

        // Draw Loaded image in output canvas
        this.#outputBuffer.clear();
        this.#outputBuffer.context.drawImage(this.#image, 0, 0, this.#outputBuffer.width, this.#outputBuffer.height);

        if (typeof this.#listener === 'function') {
            this.#listener(this);
        }
    }

    load(src) {
        this.#loaded = false;
        this.#image.src = src;
    }

    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

    get data() {
        return this.#outputBuffer.canvas;
    }

    get context() {
        return this.#outputBuffer.context;
    }

	get rawData() {
		return this.#image;
	}

    get options() {
        return this.#options;
    }

}

export { ImageLayer };