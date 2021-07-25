class Mode {
    name;
    #modeStarted;
    #fonts;
    #dmd;
    #variables;
    #resources;
    #audioManager;
    #priority;


    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        this.name = null;
        this.#modeStarted = false;
        this.#fonts = _fonts;
        this.#dmd = _dmd;
        this.#variables = _variables;
        this.#resources = _resources;
        this.#audioManager = _audioManager;
        this.#priority = 0;
    }

    start(priority) {
        this.#modeStarted = true;
        this.#priority = priority;
        console.log(`Starting ${this.name} mode with priority ${priority}`);
    }

    stop() {
        if (!this.#modeStarted) {
            console.log(`${this._name} mode is not started`);
            return;
        }

        console.log(`Stopping ${this._name} mode`);

        this.#modeStarted = false;
    }

    isStarted() {
        return this.#modeStarted;
    }
    
    get name() {
        return this.name;
    }
}