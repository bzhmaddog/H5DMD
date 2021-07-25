class ImageLayer {
    #image;
    #id;
    #loaded;
    #listener;
    #options;

    constructor(id, _listener) {
        // TODO : Check if options.src is defined
        this.#image = new Image();
        this.#id = id;
        this.#loaded = false;
        this.#listener = _listener;
        this.#options = {};

        this.#image.addEventListener('load', this.#onDataLoaded.bind(this));
    }

    #onDataLoaded() {
        this.#loaded =  true;
        if (typeof this.#listener === 'function') {
            this.#listener(this)
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
		return this.#image;
	}

    get options() {
        return this.#options;
    }

}

export { ImageLayer };