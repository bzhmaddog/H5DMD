class Mode {
    name;
    #modeStarted;
    _fonts;
    _dmd;
    _variables;
    _resources;
    _audioManager;
    #priority;


    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        this.name = null;
        this.#modeStarted = false;
        this._fonts = _fonts;
        this._dmd = _dmd;
        this._variables = _variables;
        this._resources = _resources;
        this._audioManager = _audioManager;
        this.#priority = 0;
    }

    start(priority) {
        this.#modeStarted = true;
        this.#priority = priority;
        console.log(`Starting ${this.name} mode with priority ${priority}`);
    }

    stop() {
        if (!this.#modeStarted) {
            console.log(`${this.name} mode is not started`);
            return;
        }

        console.log(`Stopping ${this.name} mode`);

        this.#modeStarted = false;
    }

    isStarted() {
        return this.#modeStarted;
    }
    
    get name() {
        return this.name;
    }

    get priority() {
        return this.#priority;
    }
}