class Font {
    #name;
    #url;
    #fontFace;

    constructor(name, url) {
        this.#name = name;
        this.#url = url;
        this.#fontFace = new FontFace(name, 'url(' + url + ')');
    }

    get name() {
        return this.#name;
    }

    get url() {
        return this.#url;
    }

    get fontFace() {
        return this.#fontFace;
    }

    load() {
        return this.#fontFace.load();
    }
}

export { Font };