import { Buffer } from './Buffer.mjs';
import { Text } from './Text.mjs';
import { Colors } from './Colors.mjs';

class CanvasLayer {
    #id;
    #loaded;
    #options;
    #buffer;
    #ctx;
    #updatedListener;
    #cachedUrls;
    #cachedData;

    constructor(id, _options, _updatedListener) {
        this.#id = id,
        this.#loaded = false;
        this.#options = Object.assign({}, _options);
        this.#buffer = new Buffer(this.#options.width, this.#options.height);
        this.#ctx = this.#buffer.context;
        this.#ctx.imageSmoothingEnabled = false;
        this.#updatedListener = _updatedListener;
        this.#cachedData = [];
        this.#cachedUrls = [];

        this.#buffer.context.imageSmoothingEnabled = false;

        // Delay onLayerUpdated a bit otherwise #content is undefined in Layer.mjs
        setTimeout(this.#onLayerUpdated.bind(this), 1);
    }

    /**
     * notify creator if needed
     */
    #onLayerUpdated() {
        this.#loaded =  true;
        if (typeof this.#updatedListener === 'function') {
            this.#updatedListener(this);
        }
    }

    /**
     * Fetch image from server
     * @param {string} src 
     * @returns 
     */
    async #loadImage(src) {
        let response = await fetch(src);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            return await response.blob();
        }        
    }

    // Clear canvas buffer
    clear() {
        this.#buffer.clear();
    }

    /**
     * Clear images cache
     */
    clearCache() {
        this.#cachedUrls = [];
        this.#cachedData = [];
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param {object or string} img 
     * @param {number} x
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    drawImage(img, x, y, w, h) {

        if (typeof img === 'string') {

          //  console.log(img);
            if (!this.#cachedUrls.includes(img)) {
            
                this.#loadImage(img).then(response => {
                    response.then( blob => {
                        createImageBitmap(blob).then( bitmap => {
                           this.#ctx.drawImage(bitmap, x, y, w || bitmap.width, h || bitmap.height);
                           this.#cachedUrls.push(img);
                           this.#cachedData.push(bitmap);
                        });
                    });
                });
            } else {
                var bitmap = this.#cachedData[this.#cachedUrls.indexOf(img)];
                this.#ctx.drawImage(bitmap, x, y, w || bitmap.width , h || bitmap.height);
                this.#onLayerUpdated();
            }
        } else {
            this.#ctx.drawImage(img, x, y, w || img.width, h || img.height);
            this.#onLayerUpdated();
        }
    }


    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
        return this.#buffer.canvas;
	}

    get context() {
        return this.#buffer.context;
    }

	get options() {
		return this.#options;
	}

}

export { CanvasLayer };