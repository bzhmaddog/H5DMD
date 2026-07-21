// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OptionsObject = Record<string, any>

/**
 * Improve Map by adding a merge feature and optional compile-time key/value typing.
 *
 * @template T Shape of the options object. When omitted the class behaves like
 *             the original untyped `Options`.
 */
class Options<T extends OptionsObject = OptionsObject> extends Map {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(o?: Options<any> | OptionsObject) {
        super()

        if (o) {
            this._merge(o, this)
        }
    }

    /**
     * Merge provided Options or object into current Options without altering current instance
     * @returns a new Options object
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    merge(o?: Options<any> | OptionsObject): Options<T> {
        const newOptions = new Options<T>(this)

        if (o) {
            this._merge(o, newOptions)
        }

        return newOptions
    }

    /**
     * Retrieve a typed value by key.
     */
    get<K extends keyof T & string>(key: K): T[K] {
        return super.get(key) as T[K]
    }

    /**
     * Store a typed value by key.
     */
    set<K extends keyof T & string>(key: K, value: T[K]): this {
        return super.set(key, value)
    }

    /**
     * Merge input into specified output.
     * Uses the raw Map setter to avoid the typed-override constraint.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _merge(input: Options<any> | OptionsObject, output: Map<string, any>) {
        if (input instanceof Options) {
            for (const [k, v] of input.entries()) {
                output.set(k, this._cloneValue(v))
            }
        } else if (input instanceof Map) {
            const obj = Object.fromEntries(input)

            Object.keys(obj).forEach(key => {
                output.set(key, this._cloneValue(obj[key]))
            })
        } else if (typeof input === 'object') {
            Object.keys(input).forEach(key => {
                output.set(key, this._cloneValue(input[key]))
            })
        }
    }

    /**
     * Copy a value before storing it so merged Options never share a mutable
     * reference (e.g. an array) with their source.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _cloneValue(value: any) {
        return Array.isArray(value) ? value.slice() : value
    }
}

export { Options, OptionsObject }
