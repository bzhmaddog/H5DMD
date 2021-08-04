import { Font } from './Font.mjs';

class Fonts {
    #fonts;
    
    constructor() {
        this.#fonts = {};
    }

    add(key, name, url) {
        if (typeof this.#fonts[name] === 'undefined') {
            this.#fonts[key] = new Font(name, url);
            //logger.log("Added font", this.#fonts[key]);
        } else {
            logger.log(`Font '${this.#fonts[key]}' already exists`);
        }

        return this.#fonts[key];
    }

    remove(key) {
        if (typeof this.#fonts[key] === 'object') {
            delete this.#fonts[key];
            logger.log(`Removed font : ${key}`);
        } else {
            logger.log(`Font '${key}' was not found`);
        }
    }

	getFont(key) {
        if (typeof this.#fonts[key] !== 'undefined') {
		    return this.#fonts[key];
        }
	}
}

export { Fonts };