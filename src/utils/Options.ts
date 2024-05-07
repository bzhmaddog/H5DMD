// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OptionsObject = { [key: string]: string | number | boolean | any[] }

/**
 * Improve Map by adding a merge feature
 */
class Options extends Map {

    constructor(o?: Options | OptionsObject) {
        super()

        if (o) {
            this._merge(o, this)
        }
    }

    /**
     * Merge provided Options or object into current Options without altering current instance
     * @returns a new Options object
     */
    merge(o?: Options | OptionsObject): Options {
        const newOptions = new Options(this)

        if (o) {
            this._merge(o, newOptions)
        }

        return newOptions
    }

    /**
     * Merge input into specified output
     */
    private _merge(input: Options | OptionsObject, output: Options) {
        if (input instanceof Options) {
            for (const [k, v] of input.entries()) {
                output.set(k, v)
            }
        } else if (input instanceof Map) {
            const obj = Object.fromEntries(input)

            Object.keys(obj).forEach(key => {
                output.set(key, obj[key])
            })
        } else if (typeof input === 'object') {
            Object.keys(input).forEach(key => {
                output.set(key, input[key])
            })
        }
    }
}

export {Options}