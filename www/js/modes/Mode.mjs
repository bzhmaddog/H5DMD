class Mode {
    #isStarted;
    #priority;
    #isInitialized;
    _audioManager;
    _fonts;
    _dmd;
    _variables;
    _resources;
    name;


    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        this.name = null;
        this.#isStarted = false;
        this._fonts = _fonts;
        this._dmd = _dmd;
        this._variables = _variables;
        this._resources = _resources;
        this._audioManager = _audioManager;
        this.#priority = 0;
        this.#isInitialized = false;
    }

    start(priority) {
        if (this.#isInitialized) {
            this.#isStarted = true;
            this.#priority = priority;
            logger.log(`Starting ${this.name} mode with priority ${priority}`);
            return true;
        } else {
            logger.log(`Mode '${this.name}' is not initialized !`);
            return false;
        }
    }

    stop() {
        if (!this.#isStarted) {
            logger.log(`${this.name} mode is not started`);
            return;
        }

        logger.log(`Stopping ${this.name} mode`);

        this.#isStarted = false;
    }

    update() {
        
    }

    isStarted() {
        return this.#isStarted;
    }

    isInitialized() {
        return this.#isInitialized;
    }

    init() {
        this.#isInitialized = true;
        this.#isStarted = false;
        return true;
    }
    
    get name() {
        return this.name;
    }

    get priority() {
        return this.#priority;
    }
}

export { Mode };