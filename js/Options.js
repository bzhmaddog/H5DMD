/**
 * This class is a quick and dirty replacement for Typescript 'inability' to handle
 * objects with custom properties
 */
class Options extends Object {
    constructor(o) {
        super();
        if (o instanceof Options) {
            Object.assign(this, o.getValues());
        }
        else if (typeof o === 'object') {
            Object.assign(this, o);
        }
    }
    get(property, defaultValue) {
        if (this.hasOwnProperty(property)) {
            return this[property];
        }
        else {
            if (typeof defaultValue !== 'undefined') {
                return defaultValue;
            }
            else {
                return undefined;
            }
        }
    }
    set(property, value) {
        this[property] = value;
    }
    /**
     * Return true if instance have specified property
     * @param {string} properties
     * @returns boolean
     */
    hasProperty(properties) {
        return this.hasOwnProperty(properties);
    }
    getValues() {
        return this;
    }
}
export { Options };
//# sourceMappingURL=Options.js.map