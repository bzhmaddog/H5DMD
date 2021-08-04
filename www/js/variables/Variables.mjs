class Variables {
    #variables;

    constructor(namespaces) {
        this.#variables = {};

        namespaces.forEach(n => {
            this.#variables[n] = {};
        });
    }


    get(p, k, d) {
        return JSON.parse(JSON.stringify(this.#variables[p][k] || d)); // return cloned object/array
    }

    set(p, k, v) {
        var before = undefined;
        var after = JSON.parse(JSON.stringify(v));

        if (typeof this.#variables[p][k] !== 'undefined') {
            before = JSON.parse(JSON.stringify(this.#variables[p][k]));
        }

        // Only send event if value changed
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            PubSub.publish(`variable.${p}.${k}.changed`, {
                before : before,
                after : after
            });
        }

        this.#variables[p][k] = v;

    }

    debug() {
        logger.log(this.#variables);
    }
}

export { Variables };