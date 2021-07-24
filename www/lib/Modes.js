class Modes {
    #modes;
    #activeMode;

    constructor(_modes) {
        this.#modes = _modes;
        this.#activeMode = undefined; // typeof null === object so break stopActiveMode
    }
    

    get activeMode() {
        return this.#activeMode;
    }

    stopActiveMode() {
        if (typeof this.#activeMode === 'object') {
            this.#activeMode.stop();
        }
    }

    startMode(name, priority) {
        this.stopActiveMode();

        if (typeof this.#modes[name] !== 'undefined') {
            this.#activeMode = this.#modes[name];
            this.#activeMode.start(priority);
        }
    }

}