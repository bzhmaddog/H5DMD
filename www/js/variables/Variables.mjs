class Variables {
    #variables;

    constructor(namespaces) {
        this.#variables = {};

        namespaces.forEach(n => {
            this.#variables[n] = {};
        });
    }


    get(p, k, d) {
        return this.#variables[p][k] || d;
    }

    set(p, k, v) {
        this.#variables[p][k] = v;
    }
}

export { Variables };