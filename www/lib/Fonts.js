class Fonts {
    #fonts;
    
    constructor(_fonts) {
        this.#fonts = {};

        if (typeof _fonts === 'object') {
            this.load(_fonts);
        }
    }

    load(_fonts) {
        _fonts.forEach(font => {
            this.#fonts[font.key] = new FontFace(font.name, 'url(' + font.url + ')');
        });        
    }

	getFont(key) {
        if (typeof this.#fonts[key] !== 'undefined') {
		    return this.#fonts[key];
        }
	}
}