class Modes {
    #modes;
    #activeMode;

    constructor() {
        this.#modes = {};
        this.#activeMode = undefined; // typeof null === object so break stopActiveMode
    }
    

    get activeMode() {
        return this.#activeMode;
    }

    add(name, mode) {
        if (!this.#modes.hasOwnProperty(name)) {
            this.#modes[name] = mode;
            //logger.log(`Added mode [${name}]`, mode);
        } else {
            logger.log(`Mode ${name} already exists`);
        }
    }

    stopActiveMode() {
        if (typeof this.#activeMode === 'object') {
            this.#activeMode.stop();
        }
    }

    startMode(name, priority) {
        //this.stopActiveMode();

        if (typeof this.#modes[name] !== 'undefined') {
            this.#activeMode = this.#modes[name];
            this.#activeMode.start(priority);
        } else {
            logger.log(`Mode [${name}] does not exists`);
        }
    }

    stopMode(name) {
        if (typeof this.#modes[name] !== 'undefined') {
            this.#modes[name].stop();
        }
    }

    getMode(key) {
        return this.#modes[key] || undefined;
    }

    initAll() {
        var that = this;
        Object.keys(this.#modes).forEach(key => {
            that.#modes[key].init();
        });

        //console.log(that.#modes);
    }

}

export { Modes };