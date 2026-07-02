import {BaseLayer} from "./base-layer"
import {BitmapOptions, CanvasLayerOptions, LayerRendererDictionary} from "../interfaces"
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
    drawBitmap(img: ImageBitmap, options?: Partial<BitmapOptions>): void
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
        options?: Partial<CanvasLayerOptions> | Options,
        renderers?: LayerRendererDictionary,
        loadedListener?: (layer: CanvasLayer) => void,
        updatedListener?: (layer: CanvasLayer) => void
    ) {
        super(id, width, height, new Options(options as Record<string, unknown>), renderers, loadedListener, updatedListener)
        setTimeout(this._layerLoaded.bind(this), 1)
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param img bitmap object
     * @param _options options
     */
    drawBitmap(img: ImageBitmap, _options?: Partial<BitmapOptions>) {

        const bitmapOptions = new Options<BitmapOptions>({
            top : 0,
            left : 0,
            hOffset : 0,
            vOffset : 0,
            fit : 'contain',
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
    private _computeDimensions(_options: Options<BitmapOptions>, width: number, height: number ): IDimensions {
        let t = 0
        let l = 0
        let w = width
        let h = height

        // Resolve margins once up front
        const mTop    = this._resolveMargin(_options.get('marginTop')    ?? _options.get('margin'), this.height)
        const mBottom = this._resolveMargin(_options.get('marginBottom') ?? _options.get('margin'), this.height)
        const mStart  = this._resolveMargin(_options.get('marginStart')  ?? _options.get('margin'), this.width)
        const mEnd    = this._resolveMargin(_options.get('marginEnd')    ?? _options.get('margin'), this.width)
        const availW  = this.width  - mStart - mEnd
        const availH  = this.height - mTop   - mBottom

        const fitOption = _options.get('fit')
        const isFit = fitOption === 'contain' || fitOption === 'cover'

        if (isFit) {
            // Warn if width/height are set — they are ignored in fit mode
            if (_options.get('width') !== undefined || _options.get('height') !== undefined) {
                console.warn(`CanvasLayer[${this.id}].drawBitmap(): 'width'/'height' are ignored when 'fit' is 'contain' or 'cover'. Use margins to constrain the available area.`)
            }

            if (_options.get('keepAspectRatio') === true) {
                const scaleX = availW / width
                const scaleY = availH / height
                // 'contain' (or true): scale down to fit; 'cover': scale up to fill
                const scale = fitOption === 'cover'
                    ? Math.max(scaleX, scaleY)
                    : Math.min(scaleX, scaleY)
                w = Math.round(width  * scale)
                h = Math.round(height * scale)
            } else {
                w = availW
                h = availH
            }

        // fit: 'none' — explicit dimensions
        } else {

            const optWidth  = _options.get('width')
            const optHeight = _options.get('height')
            const isMissingDimension    = (optWidth === undefined || optHeight === undefined)
            const isMissingAllDimensions = (optWidth === undefined && optHeight === undefined)

            if (typeof optWidth === 'number') {
                w = optWidth
            } else if (typeof optWidth === 'string' && optWidth.at(-1) === '%') {
                w = Math.floor((parseInt(optWidth, 10) * this.width) / 100)
            }

            if (typeof optHeight === 'number') {
                h = optHeight
            } else if (typeof optHeight === 'string' && optHeight.at(-1) === '%') {
                h = Math.floor((parseInt(optHeight, 10) * this.height) / 100)
            }

            // If only one dimension provided and ratio must be preserved, compute the other
            if (_options.get('keepAspectRatio') && isMissingDimension && !isMissingAllDimensions) {
                if (optWidth === undefined) {
                    w = Math.round((optHeight as number) * width / height)
                } else if (optHeight === undefined) {
                    h = Math.round((optWidth as number) * height / width)
                }
            }

            // Clamp to available area (margins still constrain even without fit)
            w = Math.min(w, availW)
            h = Math.min(h, availH)
        }

        // Resolve absolute top/left (margins offset the origin)
        const optLeft = _options.get('left')
        const optTop  = _options.get('top')

        if (typeof optLeft === 'number') {
            l = mStart + optLeft
        } else if (typeof optLeft === 'string' && optLeft.at(-1) === '%') {
            l = mStart + Math.round((parseInt(optLeft, 10) * this.width) / 100)
        }

        if (typeof optTop === 'number') {
            t = mTop + optTop
        } else if (typeof optTop === 'string' && optTop.at(-1) === '%') {
            t = mTop + Math.round((parseInt(optTop, 10) * this.height) / 100)
        }

        // Alignment operates within the inset area
        if (typeof _options.get('hAlign') === 'string') {
            switch (_options.get('hAlign')) {
                case 'left':
                    l = mStart + _options.get('hOffset')
                    break
                case 'center':
                    l = mStart + availW / 2 - w / 2 + _options.get('hOffset')
                    break
                case 'right':
                    l = mStart + availW - w + _options.get('hOffset')
                    break
                default:
                    console.warn(`CanvasLayer[${this.id}].drawBitmap(): Incorrect value hAlign:'${_options.get('hAlign')}'`)
            }
        }

        if (typeof _options.get('vAlign') === 'string') {
            switch (_options.get('vAlign')) {
                case 'top':
                    t = mTop + _options.get('vOffset')
                    break
                case 'middle':
                    t = mTop + availH / 2 - h / 2 + _options.get('vOffset')
                    break
                case 'bottom':
                    t = mTop + availH - h + _options.get('vOffset')
                    break
                default:
                    console.warn(`CanvasLayer[${this.id}].drawBitmap(): Incorrect value vAlign:'${_options.get('vAlign')}'`)
            }
        }

        return { top: t, left: l, width: w, height: h } as IDimensions
    }

    /**
     * Resolve a margin value (pixels or percentage string) to pixels.
     */
    private _resolveMargin(value: number | string | undefined, reference: number): number {
        if (value === undefined) return 0
        if (typeof value === 'number') return value
        if (typeof value === 'string' && value.at(-1) === '%') {
            return Math.floor((parseInt(value, 10) * reference) / 100)
        }
        return 0
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
                drawBitmap: (img: ImageBitmap, options?: Partial<BitmapOptions>) => this.drawBitmap(img, options),
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