import {BaseLayer} from './base-layer'
import {OffscreenBuffer, Options, Utils} from '../utils'
import {Colors} from '../enums'
import {RendererClassEntry, RendererEntry, TextLayerOptions} from '../interfaces'
import {OutlineRenderer, RemoveAliasingRenderer} from '../renderers'

class TextLayer extends BaseLayer {

    private _text: string
    private _textBuffer: OffscreenBuffer
    /**
     * Smallest font size (in px) a previous adjustWidth pass has shrunk to, when
     * adjustDirection is 'shrink'. Reset by setFontSize()/setAdjustDirection()/disabling
     * adjustWidth.
     */
    private _minAdjustedFontSize?: number
    /**
     * Largest font size (in px) a previous adjustWidth pass has settled on, when
     * adjustDirection is 'expand'. Reset the same way as _minAdjustedFontSize.
     */
    private _maxAdjustedFontSize?: number
    /** Font size value as originally configured at construction, for resetFontSize(). */
    private _originalFontSize: string | number

    constructor(
        id: string,
        width: number,
        height: number,
        options: Partial<TextLayerOptions> | Options,
        loadedListener?: (layer: TextLayer) => void | Promise<void>,
        updatedListener?: (layer: TextLayer) => void | Promise<void>
    ) {

        const layerOptions = new Options({
            top: 0,
            left: 0,
            color: Colors.White,
            fontSize: '10',
            fontUnit: '%',
            fontFamily: 'Arial',
            fontStyle: 'normal',
            textBaseline: 'top',
            hOffset: 0,
            vOffset: 0,
            strokeWidth: 0,
            strokeColor: Colors.Black,
            adjustWidth: false,
            adjustDirection: 'both',
            outlineWidth: 0,
            outlineColor: Colors.Black,
            antialiasing: true,
            vAlign: 'middle',
            hAlign: 'center'
        }).merge(options)

        // Prepend built-in renderer classes (inactive by default; activated
        // programmatically by _drawText when outlineWidth > 0 / antialiasing = false).
        // Using class entries lets BaseLayer instantiate them with the correct dimensions.
        const userRenderers: Array<RendererEntry> = layerOptions.get('renderers') ?? []
        const builtinRenderers: RendererClassEntry[] = [
            { id: 'no-antialiasing', rendererClass: RemoveAliasingRenderer, active: false },
            { id: 'outline', rendererClass: OutlineRenderer, active: false },
        ]
        layerOptions.set('renderers', [...builtinRenderers, ...userRenderers])

        // Wrap the loaded listener so the text is redrawn once renderers are
        // initialised — the first _drawText() call below happens before GPU init
        // finishes, so outline/anti-aliasing only takes effect on this second pass.
        const onReady = async (layer: TextLayer) => {
            if (this._text !== '') {
                await this._drawText()
                this._layerUpdated()
            }
            await loadedListener?.(layer)
        }

        super(id, width, height, layerOptions, onReady, updatedListener)

        this._textBuffer = new OffscreenBuffer(this.width, this.height)

        this._text = ""

        this._originalFontSize = layerOptions.get('fontSize')

        setTimeout(this._layerLoaded.bind(this), 1)

        //this.#buffer.context.fillStyle = 'transparent'

        if (this._options.has('text')) {

            if (typeof this._options.get('text') !== 'string') {
                throw new TypeError("options.text is not a string")
            }

            if (this._options.get('text') !== "") {
                this._text = this._options.get('text')

                //console.log(this._id, this.#text)
                this._drawText().then(() => {
                    setTimeout(this._layerUpdated.bind(this), 1)
                })
            }
        }
    }

    /**
     * Draw text onto canvas
     * @param _options 
     */
    private _drawText(_options?: Options) {

        // merge passed options with default options set during layer creation
        const options = new Options(this._options).merge(_options)

        return new Promise<void>(resolve => {

            //console.log(this._id, this.#text)

            //if (options.antialiasing === false) {
            this._textBuffer.context.imageSmoothingEnabled = options.get('antialiasing')
            this._setAntialiasing(options.get('antialiasing'))
            //}


            if (options.get('outlineWidth') > 0) {
                options.set('strokeWidth', 0)
            }

            this._textBuffer.clear()

            /*if (typeof options.text === 'undefined' || options.text === '') {
                throw new Error("Cannot draw empty text")
            }*/

            let left = options.get('left')
            let top = options.get('top')
            let m


            // fillText doesn't at 0 font pb ?
            /*if (options.strokeWidth === 0) {
                left--
            }*/

            this._textBuffer.context.textBaseline = options.get('textBaseline')
            this._textBuffer.context.fillStyle = options.get('color')

            /*if (typeof options.letterSpacing === 'number') {
                //console.log(options.letterSpacing)
                this.#textBuffer.canvas.style.letterSpacing = options.letterSpacing + options.fontUnit
                this.#textBuffer.context.textAlign = 'center'
            }*/


            let fontSize = options.get('fontSize')
            let fontUnit = options.get('fontUnit')

            // Convert % fontSize to pixels so it maps to an actual fraction of the layer
            // height. Everything here is done in INK-HEIGHT units (px of real rendered glyph
            // ink) until the final divide, because font size and ink height are NOT the same
            // number - a given font renders its ink at only some fraction of its font-size em
            // box, and that fraction is font-specific.
            //
            // 1. targetInk: the ink height we want. Start from the requested % of the layer
            //    height, capped at the full layer height (so a >100% request can't overflow),
            //    then reserve the outline: it expands the glyph by outlineW on every edge, so
            //    the total inked footprint is (ink + 2×outlineW). Subtracting 2×outlineW here
            //    makes glyph+outline together span the requested % - and at 100% exactly fill
            //    the layer - instead of the outline pushing the footprint past it. Everything
            //    is in ink-height units (NOT font size - clamping the font size directly, as an
            //    earlier version did, mixes the two units and caps the result far too low).
            // 2. glyphHeightRatio: ink height per 1px of font size for THIS exact string,
            //    measured via actualBoundingBoxAscent/Descent (the real ink span of these
            //    specific glyphs, not the font's abstract design box, which sits inside more
            //    padding than any real text uses). Ties "100%" to what actually gets drawn.
            //    Falls back to the old 80%-of-em approximation if bounding box metrics aren't
            //    available (e.g. jsdom/canvas-mock in tests, or ancient browsers).
            // 3. fontSize = targetInk / ratio: the font size whose ink equals targetInk.
            if (fontUnit === '%') {
                fontUnit = 'px'
                const outlineW = options.get('outlineWidth') ?? 0
                const targetInk = Math.max(1, Math.min((fontSize * this.height) / 100, this.height) - outlineW * 2)

                const referenceSize = 100
                this._textBuffer.context.font = options.get('fontStyle') + ' ' + referenceSize + 'px ' + options.get('fontFamily')
                const refMetrics = this._textBuffer.context.measureText(this._text)
                const measuredInkHeight = refMetrics.actualBoundingBoxAscent + refMetrics.actualBoundingBoxDescent
                const glyphHeightRatio = measuredInkHeight > 0 ? measuredInkHeight / referenceSize : 0.8

                fontSize = targetInk / glyphHeightRatio
            }


            // Adjust the font size so the text does not overflow the layer width.
            // adjustWidth shrinks the font if the text is too wide; the fontSize
            // from the slider is always the starting (maximum) size.
            if (options.get('adjustWidth')) {
                const minFontSize = 1
                const direction = options.get('adjustDirection') ?? 'both'

                // Only reserve the outline's horizontal expansion (outlineW on each edge),
                // mirroring the vertical reservation the height calc above already makes. A
                // flat safety margin was used here before, but on small layers it was a large
                // fraction of the width and shrank text whose real footprint fit - now that the
                // height calc yields a correctly-sized (larger) font, the glyph advance lands
                // close enough to the edge that the flat margin triggered a spurious shrink.
                const outlineW = options.get('outlineWidth') ?? 0
                const availableWidth = this.width - outlineW * 2

                // 'shrink': never start above a size a previous, wider text already shrank
                // to - otherwise a later, narrower text would let the font grow back.
                if (direction === 'shrink' && this._minAdjustedFontSize !== undefined && fontSize > this._minAdjustedFontSize) {
                    fontSize = this._minAdjustedFontSize
                }

                this._textBuffer.context.font = options.get('fontStyle') + ' ' + fontSize + fontUnit + ' ' + options.get('fontFamily')
                m = this._textBuffer.context.measureText(this._text)

                while (m.width > availableWidth && fontSize > minFontSize) {
                    fontSize -= 1
                    this._textBuffer.context.font = options.get('fontStyle') + ' ' + fontSize + fontUnit + ' ' + options.get('fontFamily')
                    m = this._textBuffer.context.measureText(this._text)
                }

                // 'expand': never end up below a size a previous text already settled on -
                // accepts the text may now overflow rather than shrinking back down.
                if (direction === 'expand' && this._maxAdjustedFontSize !== undefined && fontSize < this._maxAdjustedFontSize) {
                    fontSize = this._maxAdjustedFontSize
                    this._textBuffer.context.font = options.get('fontStyle') + ' ' + fontSize + fontUnit + ' ' + options.get('fontFamily')
                    m = this._textBuffer.context.measureText(this._text)
                }

                if (direction === 'shrink') {
                    this._minAdjustedFontSize = fontSize
                } else if (direction === 'expand') {
                    this._maxAdjustedFontSize = this._maxAdjustedFontSize === undefined ? fontSize : Math.max(this._maxAdjustedFontSize, fontSize)
                }
            } else {
                this._textBuffer.context.font = options.get('fontStyle') + " " + fontSize + fontUnit + ' ' + options.get('fontFamily')
                m = this._textBuffer.context.measureText(this._text)
            }

            // Real ascent/descent of the text as actually drawn (whatever font size/family
            // it ended up at above), relative to the y anchor point implied by the configured
            // textBaseline - e.g. with the default 'top' baseline, ascent is how far the ink's
            // top sits below that anchor (usually > 0, since 'top' aligns to the top of the
            // em square, not the glyph ink) and descent is how far the ink's bottom sits below
            // it. ink-top = y - ascent, ink-bottom = y + descent, for whatever y ends up passed
            // to fillText/strokeText - true regardless of textBaseline, which only changes what
            // "y" means. Used below to align actual glyph ink to the layer's edges/center,
            // instead of the em-square (which includes internal font leading above/below the
            // ink and so, uncompensated, leaves the text short of the requested top/bottom/height).
            const ascent = m.actualBoundingBoxAscent
            const descent = m.actualBoundingBoxDescent


            // Convert % to pixels/dots
            if (typeof options.get('left') === 'string' && options.get('left').at(-1) === '%') {
                const vl = parseFloat(options.get('left').replace('%', ''))
                left = Math.floor((vl * this.width) / 100)
            }

            // Convert % to pixels/dots
            if (typeof options.get('top') === 'string' && options.get('top').at(-1) === '%') {
                const vt = parseFloat(options.get('top').replace('%', ''))
                top = Math.floor((vt * this.height) / 100)
            }

            if (typeof options.get('hAlign') === 'string') {
                // Reserve room for the outline's horizontal expansion so it isn't clipped by
                // the canvas edge - without this, text placed flush against either edge (the
                // common case for 'left'/'right', and for 'right' whenever the text is wide
                // enough to overflow the layer) has its outline (and, for some fonts, the
                // glyph ink itself past what measureText() reports) cut off at that edge.
                const outlineMargin = options.get('outlineWidth') ?? 0

                switch (options.get('hAlign')) {
                    case 'left':
                        left = outlineMargin
                        break
                    case 'center':
                        left = (this.width / 2) - (m.width / 2)
                        break
                    case 'right':
                        left = this.width - m.width - outlineMargin
                }
            }

            if (typeof options.get('vAlign') === 'string') {
                switch (options.get('vAlign')) {
                    case 'top':
                        top = ascent
                        break
                    case 'middle':
                        top = (this.height / 2) + (ascent - descent) / 2
                        break
                    case 'bottom':
                        top = this.height - descent
                        break
                }
            }

            let hOffset = options.get('hOffset')
            const vOffset = options.get('vOffset')

            // convert % in pixels
            if (typeof options.get('hOffset') === 'string' && options.get('hOffset').at(-1) === '%') {
                const vh = parseFloat(options.get('hOffset').replace('%', ''))
                //hOffset = ((vh * m.width) / 100)
                hOffset = Math.floor((vh * this.width) / 100)
            }

            // convert % in pixels
            if (typeof options.get('vOffset') === 'string' && options.get('vOffset').at(-1) === '%') {
                const vv = parseFloat(options.get('vOffset').replace('%', ''))
                //hOffset = ((vv * textHeight) / 100)
                hOffset = Math.floor((vv * this.height) / 100)
            }

            // % in offset are relative of the width/height of the text

            // Add offsets
            left += hOffset
            top += vOffset

            if (options.get('strokeWidth') > 0) {
                this._textBuffer.context.strokeStyle = options.get('strokeColor')
                this._textBuffer.context.lineWidth = options.get('strokeWidth')
                this._textBuffer.context.strokeText(this._text, left, top)
            }

            this._textBuffer.context.fillText(this._text, left, top)

            //console.log(this.getId(),this.#textBuffer.context.getImageData(0,0, this.width, this.height).data)
            const frameImageData = this._textBuffer.context.getImageData(0, 0, this.width, this.height)

            // If outlined text then pixelate first then render outline
            if (options.get('outlineWidth') > 0) {

                if (this._options.get('antialiasing')) {

                    this._getRendererInstance('outline').renderFrame(
                        frameImageData,
                        {
                            innerColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF'),
                            outerColor: Utils.hexRGBToHexRGBA(this._options.get('outlineColor').replace('#', ''), 'FF'),
                            width: this._options.get('outlineWidth')
                        }
                    ).then((outputData: ImageData) => {
                        createImageBitmap(outputData).then(bitmap => {
                            this._contentBuffer.clear()
                            this._contentBuffer.context.drawImage(bitmap, 0, 0)
                            resolve()
                        })
                    })


                } else {

                    this._getRendererInstance('no-antialiasing').renderFrame(
                        frameImageData,
                        {
                            threshold: 255,
                            baseColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF')
                        }
                    ).then((aaData: ImageData) => {
                        this._getRendererInstance('outline').renderFrame(
                            aaData,
                            {
                                innerColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF'),
                                outerColor: Utils.hexRGBToHexRGBA(this._options.get('outlineColor').replace('#', ''), 'FF'),
                                width: this._options.get('outlineWidth')
                            }
                        ).then((outputData: ImageData) => {
                            createImageBitmap(outputData).then(bitmap => {
                                this._contentBuffer.clear()
                                this._contentBuffer.context.drawImage(bitmap, 0, 0)
                                resolve()
                            })
                        })
                    })
                }


            // otherwise just render the text as is
            } else {

                if (this._options.get('antialiasing')) {

                    this._contentBuffer.clear()
                    this._contentBuffer.context.drawImage(this._textBuffer.canvas, 0, 0)
                    resolve()

                } else {

                    this._getRendererInstance('no-antialiasing').renderFrame(
                        frameImageData,
                        {
                            threshold: 255,
                            baseColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF')
                        }
                    ).then((aaData: ImageData) => {
                        createImageBitmap(aaData).then(bitmap => {
                            this._contentBuffer.clear()
                            this._contentBuffer.context.drawImage(bitmap, 0, 0)
                            resolve()
                        })
                    })
                }
            }
        })
    }

    /**
     * Set layer text
     * @param {string} text 
     * @param {object} options (if options is not an object drawText will use this._options)
     */
    setText(text: string, options?: Options) {

        if (typeof text !== 'string') {
            throw new TypeError("text is not a string")
        }

        if (typeof text !== 'undefined' && text !== "" && text !== this._text) {
            this._text = text
            this._drawText(options).then(() => {
                this._layerUpdated()
            })
        }
    }

    /**
     * Current layer text
     */
    get text(): string {
        return this._text
    }

    /**
     * Set the outline width in pixels and redraw.
     * Set to `0` to disable the outline.
     */
    setOutlineWidth(width: number) {
        this._options.set('outlineWidth', width)
        this._drawText().then(() => this._layerUpdated())
    }

    /** Current outline width in pixels. */
    get outlineWidth(): number {
        return this._options.get('outlineWidth') ?? 0
    }

    /**
     * Set the outline colour and redraw.
     * @param {string} color CSS color string (e.g. '#FF0000')
     */
    setOutlineColor(color: string) {
        this._options.set('outlineColor', color)
        this._drawText().then(() => this._layerUpdated())
    }

    /** Current outline colour as a CSS hex string (e.g. `'#FF0000'`). */
    get outlineColor(): string {
        return this._options.get('outlineColor') ?? '#000000'
    }

    /** Set the background fill color and redraw. Pass `undefined` to clear. */
    override setBackgroundColor(color: string | undefined) {
        this._options.set('backgroundColor', color)
        this._drawText().then(() => this._layerUpdated())
    }

    /** Set the border stroke color and redraw. */
    override setBorderColor(color: string) {
        this._options.set('borderColor', color)
        this._drawText().then(() => this._layerUpdated())
    }

    /** Set the border stroke width in pixels and redraw. */
    override setBorderWidth(width: number) {
        this._options.set('borderWidth', width)
        this._drawText().then(() => this._layerUpdated())
    }

    /**
     * Set the font family and redraw.
     * @param {string} family CSS font-family string (e.g. 'Arial', 'monospace')
     */
    setFontFamily(family: string) {
        this._options.set('fontFamily', family)
        this._drawText().then(() => this._layerUpdated())
    }

    /**
     * Current font family.
     */
    get fontFamily(): string {
        return this._options.get('fontFamily')
    }

    /**
     * Set the font size and redraw.
     * @param {number} size Font size value (interpreted according to the layer's fontUnit).
     */
    setFontSize(size: number) {
        this._options.set('fontSize', size)
        // An explicit resize becomes the new baseline resetFontSize() returns to, and
        // declares a new ceiling/floor - forget any adjustWidth memory.
        this._originalFontSize = size
        this._minAdjustedFontSize = undefined
        this._maxAdjustedFontSize = undefined
        this._drawText().then(() => this._layerUpdated())
    }

    /**
     * Reset the font size back to the value originally configured when this layer was
     * created, undoing any setFontSize() calls and any adjustWidth shrink/grow memory, then
     * redraw.
     */
    resetFontSize() {
        this._options.set('fontSize', this._originalFontSize)
        this._minAdjustedFontSize = undefined
        this._maxAdjustedFontSize = undefined
        this._drawText().then(() => this._layerUpdated())
    }

    /**
     * Current font size value (in the layer's fontUnit).
     */
    get fontSize(): number {
        return parseFloat(this._options.get('fontSize'))
    }

    /**
     * Set the text fill color and redraw the current text.
     * @param {string} color CSS color string (e.g. '#FF0000' or a Colors value)
     */
    setTextColor(color: string) {        if (typeof color !== 'string') {
            throw new TypeError("color is not a string")
        }

        this._options.set('color', color)
        this._drawText().then(() => {
            this._layerUpdated()
        })
    }

    /**
     * Enable or disable automatic font shrinking so the text fits the layer width, then redraw.
     * @param {boolean} enabled
     */
    setAdjustWidth(enabled: boolean) {
        if (typeof enabled !== 'boolean') {
            throw new TypeError("enabled is not a boolean")
        }

        this._options.set('adjustWidth', enabled)
        if (!enabled) {
            // Shrink/grow memory only applies while adjustWidth is active - clear it so a
            // later re-enable starts fresh instead of being capped by a stale size.
            this._minAdjustedFontSize = undefined
            this._maxAdjustedFontSize = undefined
        }
        this._drawText().then(() => {
            this._layerUpdated()
        })
    }

    /**
     * Set how the adjustWidth-computed font size can change across setText() calls, then
     * redraw. See {@link TextLayerOptions.adjustDirection} for the meaning of each value.
     * Resets any previously remembered shrink/grow size.
     * @param {'shrink' | 'expand' | 'both'} direction
     */
    setAdjustDirection(direction: 'shrink' | 'expand' | 'both') {
        this._options.set('adjustDirection', direction)
        this._minAdjustedFontSize = undefined
        this._maxAdjustedFontSize = undefined
        this._drawText().then(() => {
            this._layerUpdated()
        })
    }

    /**
     * Current adjustWidth direction mode.
     */
    get adjustDirection(): 'shrink' | 'expand' | 'both' {
        return this._options.get('adjustDirection') ?? 'both'
    }

    /**
     * Whether automatic font shrinking to fit the layer width is enabled.
     */
    get adjustWidth(): boolean {
        return this._options.get('adjustWidth')
    }

    setVisibility(isVisible: boolean): void {
        super.setVisibility(isVisible)
    }
}

export { TextLayer }