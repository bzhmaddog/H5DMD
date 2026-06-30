import {BaseLayer, LayerType} from "./base-layer"
import {LayerRendererDictionary} from "../interfaces"
import {Options} from "../utils"

/**
 * Interface to describe the values returned by computeDimensions method
 */
interface IDimensions {
    top : number,
    left : number,
    width : number,
    height : number
}

/**
 * Drawing operations available inside a setDrawFunction callback.
 */
interface DrawContext {
    /** Fill the entire layer with a color (supports alpha). */
    fillColor(color: string): void
    /** Draw a filled rectangle. */
    drawRect(x: number, y: number, w: number, h: number, color: string): void
    /** Draw a line. */
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth?: number): void
    /** Fill with a linear gradient. */
    fillGradient(colors: string[], direction?: 'horizontal' | 'vertical'): void
    /** Draw a rectangle filled with a linear gradient. */
    drawGradientRect(x: number, y: number, w: number, h: number, colors: string[], direction?: 'horizontal' | 'vertical'): void
    /** Draw a bitmap with optional positioning/sizing options. */
    drawBitmap(img: ImageBitmap, options?: Options): void
    /** Access the raw 2D context for advanced operations. */
    //readonly ctx: OffscreenCanvasRenderingContext2D
    /** Layer width. */
    readonly width: number
    /** Layer height. */
    readonly height: number
}

/**
 * Draw function callback signature for setDrawFunction.
 */
type DrawFunction = (draw: DrawContext) => void

/**
 * A layer which content is a canvas
 */
class CanvasLayer extends BaseLayer {

    private _drawFunction?: DrawFunction

    constructor(
        id: string,
        width: number,
        height: number,
        options?: Options,
        renderers?: LayerRendererDictionary,
        loadedListener?: (layer: CanvasLayer) => void,
        updatedListener?: (layer: CanvasLayer) => void
    ) {
        super(id, LayerType.Canvas, width, height, options, renderers, loadedListener, updatedListener)
        setTimeout(this._layerLoaded.bind(this), 1)
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param img bitmap object
     * @param _options options
     */
    drawBitmap(img: ImageBitmap, _options?: Options) {

        const bitmapOptions = new Options({
            top : 0,
            left : 0,
            hOffset : 0,
            vOffset : 0,
            fit : true,
            keepAspectRatio : true
        }).merge(_options)

        // Compute final dimensions and position
        const dimensions = this._computeDimensions(bitmapOptions, img.width, img.height) // new Options(_options) to handle drawBitmap calls from Javascript

        this._contentBuffer.context.drawImage(img, dimensions.left, dimensions.top, dimensions.width, dimensions.height)

        this._layerUpdated()
    }

    /**
     * Compute final dimensions and position
     * @param _options bitmap options
     * @param width default width
     * @param height default height
     * @returns a IDimensions object
     */
    private _computeDimensions(_options: Options, width: number, height: number ): IDimensions {
        let t = 0
        let l = 0
        let w = width
        let h = height

        // If required to fit image then ignore provided width and height
        if (_options.get('fit') === true) {

            if (_options.get('keepAspectRatio') === true) {
                const ratio = width / height

                if (ratio === 1) { // W == H
                    const v = Math.min(this.width, this.height) // use smallest value
                    w = v
                    h = v
                } else if (ratio > 1) { // W > H
                    w = this.width
                    h = Math.round(w * height / width)
                } else { // H > W
                    h = this.height
                    width = Math.round(h * width / height)
                }

            // resize image to layer dimensions
            } else {
                w = this.width
                h = this.height
            }

        // If one of the dimension is provided
        } else {

            const isMissingDimension = (_options.get('width') === undefined || _options.get('height') === undefined)
            const isMissingAllDimensions = (_options.get('width') === undefined && _options.get('height') === undefined)


            if (typeof _options.get('width') === 'number') {
                w = _options.get('width')
            } else if  (typeof _options.get('width') === 'string' && _options.get('width').at(-1) === '%') {
                const wv = parseInt(_options.get('width').replace('%', ''), 10)
                w = Math.floor((wv * this.width) / 100)  // % of the dmd Width
            }

            if (typeof _options.get('height') === 'number') {
                h = _options.get('height')
            } else if (typeof _options.get('height') === 'string' && _options.get('height').at(-1) === '%') {
                const hv = parseInt(_options.get('height').replace('%', ''), 10)
                h =  Math.floor((hv * this.height) / 100) // % of the dmd Height
            }

            // If provided only one of width or height and keeping ratio is required then calculate the missing dimension
            if (_options.get('keepAspectRatio') && isMissingDimension && !isMissingAllDimensions) {
                if (typeof _options.get('width') === 'undefined') {
                    w = Math.round(_options.get('height') * width / height)
                } else if (typeof _options.get('height') === 'undefined') {
                    h =  Math.round(_options.get('width') * height / width)
                }
            }
        }

        if (typeof _options.get('left') === 'string' && _options.get('left').at(-1) === '%') {
            const xv = parseInt(_options.get('left').replace('%', ''), 10)
            l = Math.round((xv * this.width) / 100)
        }

        if (typeof _options.get('top') === 'string' && _options.get('top').at(-1) === '%') {
            const yv = parseInt(_options.get('top').replace('%', ''), 10)
            t = Math.round((yv * this.height) / 100)
        }

        if (typeof _options.get('hAlign') === 'string') {
            switch(_options.get('hAlign')) {
                case 'left':
                    l = 0 + _options.get('hOffset')
                    break;
                case 'center':
                    l = this.width / 2 - w / 2  + _options.get('hOffset')
                    break
                case 'right':
                    l = this.width - w  + _options.get('hOffset')
                    break
                default:
                    console.warn(`CanvasLaye[${this.id}].drawImage(): Incorrect value align:'${_options.get('align')}'`)
            }
        }

        if (typeof _options.get('vAlign') === 'string') {
            switch(_options.get('vAlign')) {
                case 'top':
                    t = 0 + _options.get('vOffset')
                    break
                case 'middle':
                    t = this.height / 2 - h / 2 + _options.get('vOffset')
                    break
                case 'bottom':
                    t = this.height - h + _options.get('vOffset')
                    break
                default:
                    console.warn(`CanvasLayer[${this.id}].drawImage(): Incorrect value vAlign:'${_options.get('vAlign')}'`)
            }

        }

        return {
            top : t,
            left : l,
            width : w,
            height : h
        } as IDimensions
    }

    /**
     * Fill the entire layer with a color (supports alpha).
     * The fill composites on top of existing content (actions are cumulative).
     * @param {string} color CSS color string (e.g. '#FF0000', '#FFFFFF80', 'rgba(255,255,255,0.5)')
     */
    fillColor(color: string) {
        this._contentBuffer.context.fillStyle = color
        this._contentBuffer.context.fillRect(0, 0, this.width, this.height)
        this._layerUpdated()
    }

    /**
     * Clear the entire layer to transparent, removing all content.
     */
    clear() {
        this._contentBuffer.context.clearRect(0, 0, this.width, this.height)
        this._layerUpdated()
    }

    /**
     * Draw a filled rectangle on top of existing content.
     * @param {number} x Left position
     * @param {number} y Top position
     * @param {number} w Width
     * @param {number} h Height
     * @param {string} color CSS color string
     */
    drawRect(x: number, y: number, w: number, h: number, color: string) {
        this._contentBuffer.context.fillStyle = color
        this._contentBuffer.context.fillRect(x, y, w, h)
        this._layerUpdated()
    }

    /**
     * Draw a line on top of existing content.
     * @param {number} x1 Start X
     * @param {number} y1 Start Y
     * @param {number} x2 End X
     * @param {number} y2 End Y
     * @param {string} color CSS color string
     * @param {number} lineWidth Line width in pixels (default 1)
     */
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth: number = 1) {
        const ctx = this._contentBuffer.context
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        this._layerUpdated()
    }

    /**
     * Fill the entire layer with a linear gradient on top of existing content.
     * @param {string[]} colors Array of CSS color stops (at least 2)
     * @param {'horizontal' | 'vertical'} direction Gradient direction (default 'horizontal')
     */
    fillGradient(colors: string[], direction: 'horizontal' | 'vertical' = 'horizontal') {
        this.drawGradientRect(0, 0, this.width, this.height, colors, direction)
    }

    /**
     * Draw a rectangle filled with a linear gradient on top of existing content.
     * @param {number} x Left position
     * @param {number} y Top position
     * @param {number} w Width
     * @param {number} h Height
     * @param {string[]} colors Array of CSS color stops (at least 2)
     * @param {'horizontal' | 'vertical'} direction Gradient direction (default 'horizontal')
     */
    drawGradientRect(x: number, y: number, w: number, h: number, colors: string[], direction: 'horizontal' | 'vertical' = 'horizontal') {
        const ctx = this._contentBuffer.context
        const gradient = direction === 'vertical'
            ? ctx.createLinearGradient(x, y, x, y + h)
            : ctx.createLinearGradient(x, y, x + w, y)

        colors.forEach((c, i) => {
            gradient.addColorStop(i / (colors.length - 1), c)
        })

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, w, h)
        this._layerUpdated()
    }

    /**
     * Register a draw function that will be called on every draw().
     * The callback receives a DrawContext with the available operations.
     * Call draw() whenever external state changes.
     * Pass undefined to unregister.
     * @param {DrawFunction | undefined} fn Draw callback or undefined to clear
     */
    setDrawFunction(fn: DrawFunction | undefined) {
        this._drawFunction = fn
    }

    /**
     * Clear the layer and re-execute the registered draw function.
     * Call this whenever the external state driving the draw function changes.
     */
    draw() {
        this._contentBuffer.context.clearRect(0, 0, this.width, this.height)
        if (this._drawFunction) {
            const drawCtx: DrawContext = {
                fillColor: (color: string) => this.fillColor(color),
                drawRect: (x: number, y: number, w: number, h: number, color: string) => this.drawRect(x, y, w, h, color),
                drawLine: (x1: number, y1: number, x2: number, y2: number, color: string, lineWidth?: number) => this.drawLine(x1, y1, x2, y2, color, lineWidth),
                fillGradient: (colors: string[], direction?: 'horizontal' | 'vertical') => this.fillGradient(colors, direction),
                drawGradientRect: (x: number, y: number, w: number, h: number, colors: string[], direction?: 'horizontal' | 'vertical') => this.drawGradientRect(x, y, w, h, colors, direction),
                drawBitmap: (img: ImageBitmap, options?: Options) => this.drawBitmap(img, options),
                //ctx: this._contentBuffer.context,
                width: this.width,
                height: this.height
            }
            this._drawFunction(drawCtx)
        }
        this._layerUpdated()
    }

}

export { CanvasLayer, type DrawFunction }