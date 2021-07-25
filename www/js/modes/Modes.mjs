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
            console.log(`Added mode [${name}]`, mode);
        } else {
            console.log(`Mode ${name} already exists`);
        }
    }

    stopActiveMode() {
        if (typeof this.#activeMode === 'object') {
            this.#activeMode.stop();
        }
    }

    startMode(name, priority) {
        this.stopActiveMode();

        console.log('here');

        if (typeof this.#modes[name] !== 'undefined') {
            this.#activeMode = this.#modes[name];
            this.#activeMode.start(priority);
        } else {
            console.log(`Mode [${name}] does not exists`);
        }
    }

}

export { Modes };