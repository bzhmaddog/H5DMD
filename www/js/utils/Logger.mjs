class Logger {
    #enabled;

    constructor(enabled) {
        this.#enabled = !!enabled;

        window.logger = this; // Global (acting kinda as singleton)
    }

    log() {
        if (this.#enabled) {
            console.log.apply(console, arguments);
            //console.log(arguments)
        }
    }
}

export { Logger }