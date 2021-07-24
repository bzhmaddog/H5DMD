class Variables {
    #variables;

    constructor() {
        this.#variables = {};
    }


    get(k, d) {
        return this.#variables[k] || d;
    }

    set(k, v) {
        this.#variables[k] = v;
    }
}