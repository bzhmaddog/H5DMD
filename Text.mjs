class Text {
    #text;
    #options;
    #listener;

    constructor(text, options, listener) {
        this.#listener = listener;
        this.#text = text || "";
        this.#options = options;
    }

    setText(text) {
        if (text !== this.#text) {
            this.#text = text;

            if (typeof this.#listener === 'function') {
                this.#listener();
            }
        }
    }

    getText() {
        return this.#text;
    }

    getOptions() {
        return this.#options;
    }
}

export { Text };