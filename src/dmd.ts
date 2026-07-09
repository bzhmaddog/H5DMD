import {Easing, OffscreenBuffer, Options, type EasingFunction} from './utils'
import {DmdRenderer, LayerRenderer} from './renderers'
import {AnimationLayer, BaseLayer, CanvasLayer, LayerGroup, SpritesLayer, TextLayer, VideoLayer} from './layers'
import {compositeSortedLayers, createLayerInstance, resolveLayerPosition, type LayerDictionary} from './layers/layer-factory'
import {DotShape} from "./enums"
import {AnimationLayerOptions, CanvasLayerOptions, DmdOptions, Layer, LayerGroupOptions, LayerPosition, LayerRendererDictionary, SpritesLayerOptions, TextLayerOptions, VideoLayerOptions} from "./interfaces"

type LayerAddOptions =
    | Partial<CanvasLayerOptions>
    | Partial<VideoLayerOptions>
    | Partial<AnimationLayerOptions>
    | Partial<SpritesLayerOptions>
    | Partial<TextLayerOptions>
    | Partial<LayerGroupOptions>
    | Options

type LayerOptionsByInstance<T extends BaseLayer> =
    T extends CanvasLayer ? Partial<CanvasLayerOptions> | Options :
    T extends VideoLayer ? Partial<VideoLayerOptions> | Options :
    T extends AnimationLayer ? Partial<AnimationLayerOptions> | Options :
    T extends SpritesLayer ? Partial<SpritesLayerOptions> | Options :
    T extends TextLayer ? Partial<TextLayerOptions> | Options :
    T extends LayerGroup ? Partial<LayerGroupOptions> | Options :
    LayerAddOptions

type LayerPlayListenerByInstance<T extends BaseLayer> =
    T extends VideoLayer ? (layer: VideoLayer) => void :
    T extends AnimationLayer ? (layer: AnimationLayer) => void :
    never

type LayerPauseListenerByInstance<T extends BaseLayer> = LayerPlayListenerByInstance<T>

type LayerStopListenerByInstance<T extends BaseLayer> =
    T extends AnimationLayer ? (layer: AnimationLayer) => void : never

export class Dmd {

    /**
     * H5DMD library version. Single source of truth for the version string
     * (must be bumped together with package.json on release).
     */
    static readonly version: string = '2.1.1'

    private _outputCanvas: HTMLCanvasElement
    private _layers: LayerDictionary
    private _sortedLayers: Layer[]
    private _outputWidth: number
    private _outputHeight: number
    private _frameBuffer: OffscreenBuffer
    private _fpsCanvas?: HTMLCanvasElement
    private _fpsCtx?: CanvasRenderingContext2D
    private _showFPS: boolean
    private _zIndex: number
    private _renderer: DmdRenderer
    private _isRunning: boolean
    private _fps: number
    private _lastRenderTime: number
    private _layerRenderers: LayerRendererDictionary
    private _initDone: boolean
    private _backgroundColor: string
    private _renderNextFrame: () => void
    private _renderFPS: () => void

    private _minFPS: number
    private _maxFPS: number
    private _fpsSamples: number[]

    constructor(canvas: HTMLCanvasElement, options: DmdOptions) {
        const opts = options
        const outputCanvas = canvas
        const dotSize = opts.dotSize
        const dotSpace = opts.dotSpace
        const dotShape = opts.dotShape
        const backgroundBrightness = opts.backgroundBrightness
        const brightness = opts.brightness
        const showFPS = opts.showFPS

        this._outputCanvas = outputCanvas

        this._outputWidth = Math.floor(this._outputCanvas.width / (dotSize + dotSpace))
        this._outputHeight = Math.floor(this._outputCanvas.height / (dotSize + dotSpace))
        this._frameBuffer = new OffscreenBuffer(this._outputWidth, this._outputHeight, true)
        this._zIndex = 1
        this._layers = {} as LayerDictionary
        this._sortedLayers = []
        this._renderFPS = function () {
        } // Does nothing
        this._backgroundColor = `rgba(14, 14, 14, 255)`
        this._isRunning = false
        this._renderNextFrame = function () {
        }

        this._fps = 0
        this._minFPS = 9999
        this._maxFPS = 0
        this._fpsSamples = []
        this._lastRenderTime = 0

        console.log(`Creating a ${this._outputWidth}x${this._outputHeight} DMD on a ${this._outputCanvas.width}x${this._outputCanvas.height} canvas`)

        this._renderer = new DmdRenderer(this._outputWidth, this._outputHeight, this._outputCanvas.width, this._outputCanvas.height, dotSize, dotSpace, dotShape ?? DotShape.Square, backgroundBrightness, brightness, this._outputCanvas)

        if (opts.color !== undefined) {
            const color = opts.color
            let r: number, g: number, b: number
            if (typeof color === 'string') {
                const hex = color.replace('#', '')
                r = parseInt(hex.slice(0, 2), 16) / 255
                g = parseInt(hex.slice(2, 4), 16) / 255
                b = parseInt(hex.slice(4, 6), 16) / 255
            } else {
                ({ r, g, b } = color)
            }
            this._renderer.setMonochrome(true)
            this._renderer.setMonochromeColor(r, g, b)
        }

        if (opts.monoLevels !== undefined) {
            this._renderer.setMonoLevels(opts.monoLevels)
        }

        if (opts.offDotColor !== undefined) {
            const c = opts.offDotColor
            let r: number, g: number, b: number
            if (typeof c === 'string') {
                const hex = c.replace('#', '')
                r = parseInt(hex.slice(0, 2), 16) / 255
                g = parseInt(hex.slice(2, 4), 16) / 255
                b = parseInt(hex.slice(4, 6), 16) / 255
            } else {
                ({ r, g, b } = c)
            }
            this.setOffDotColor(r, g, b)
        }

        // Add renderers needed for layers rendering
        this._layerRenderers = {
            //'opacity' : new ChangeAlphaRenderer(this._outputWidth, this._outputHeight), // used by layer with opacity < 1
            //'no-antialiasing' : new RemoveAliasingRenderer(this._outputWidth, this._outputHeight), // used by TextLayer if antialiasing  = false
            //'outline' : new OutlineRenderer(this._outputWidth, this._outputHeight)  // used by TextLayer when outlineWidth > 1
        } as LayerRendererDictionary

        this._initDone = false

        // If needed create and show the fps div in the top right corner of the screen
        this._showFPS = showFPS
        if (showFPS) {
            this._createFpsOverlay()
        }

        // Reset layers
        this.reset()
    }

    /**
     * Init Dmd renderer
     * @returns Promise
     */
    init(): Promise<void> {
        return this._renderer.init().then(() => {
            this._initDone = true
        })
    }

    /**
     * Start rendering layers
     */
    run() {
        if (!this._initDone) {
            throw new Error("call Dmd.init() first")
        }

        // Already running: nothing to do (avoids starting a second render loop)
        if (this._isRunning) {
            return
        }

        this._isRunning = true
        this._lastRenderTime = window.performance.now()

        // (Re)create the FPS overlay if it was removed by a previous stop()
        if (this._showFPS && !this._fpsCanvas) {
            this._createFpsOverlay()
        }

        this._renderNextFrame = this.requestNextFrame
        this._renderNextFrame()
    }

    /**
     * Stop Dmd rendering
     */
    stop() {
        this._isRunning = false
        this._renderNextFrame = function () {
            console.log("Dmd render stopped")
        }

        // Remove the FPS overlay from the DOM so a discarded Dmd leaves nothing behind
        this._removeFpsOverlay()
    }

    /**
     * Render output Dmd
     */
    private renderDMD() {
        // Fill rectangle with background color
        this._frameBuffer.context.fillStyle = this._backgroundColor
        this._frameBuffer.context.fillRect(0, 0, this._outputWidth, this._outputHeight)

        // Draw each visible layer on top of previous one to create the final screen
        compositeSortedLayers(this._sortedLayers, this._layers, this._frameBuffer)

        // Get data from the merged layers content
        const frameImageData = this._frameBuffer.context.getImageData(0, 0, this._frameBuffer.width, this._frameBuffer.height)

        // Generate Dmd frame
        this._renderer.renderFrame(frameImageData).then(() => {

            const now = performance.now()
            const delta = (now - this._lastRenderTime)
            this._lastRenderTime = now

            // Smoothed FPS : rolling average of frame time over the last frames.
            this._fpsSamples.push(delta)
            if (this._fpsSamples.length > 60) {
                this._fpsSamples.shift()
            }
            const meanDelta = this._fpsSamples.reduce((sum, d) => sum + d, 0) / this._fpsSamples.length
            this._fps = Math.round(1000 / meanDelta)

            // Track min/max once the window has enough samples for steady-state.
            if (this._fpsSamples.length >= 30) {
                if (this._fps < this._minFPS) {
                    this._minFPS = this._fps
                }

                if (this._fps > this._maxFPS) {
                    this._maxFPS = this._fps
                }
            }

            // Render FPS box if needed
            this._renderFPS()

            this._renderNextFrame()
        })
    }

    /**
     * Create the on-screen FPS canvas overlay and enable FPS rendering.
     */
    private _createFpsOverlay() {
        this._fpsCanvas = document.createElement('canvas')
        this._fpsCanvas.width = this._outputCanvas.width
        this._fpsCanvas.height = this._outputCanvas.height
        this._fpsCanvas.style.position = 'absolute'
        this._fpsCanvas.style.top = this._outputCanvas.offsetTop + 'px'
        this._fpsCanvas.style.left = this._outputCanvas.offsetLeft + 'px'
        this._fpsCanvas.style.pointerEvents = 'none'
        this._fpsCanvas.style.zIndex = '99999'

        this._fpsCtx = this._fpsCanvas.getContext('2d')!
        const parent = this._outputCanvas.parentElement ?? document.body
        parent.appendChild(this._fpsCanvas)

        this._renderFPS = this.__renderFPS
    }

    /**
     * Remove the FPS overlay from the DOM and disable FPS rendering.
     */
    private _removeFpsOverlay() {
        if (this._fpsCanvas) {
            this._fpsCanvas.remove()
            this._fpsCanvas = undefined
            this._fpsCtx = undefined
        }

        this._renderFPS = function () {
        } // Does nothing
    }

    /**
     * Draw FPS values on the overlay canvas
     */
    private __renderFPS() {
        const ctx = this._fpsCtx!
        const w = this._fpsCanvas!.width
        const pad = (n: number) => String(n).padStart(3, ' ')
        const seeded = this._fpsSamples.length >= 30
        const min = seeded ? pad(this._minFPS) : '  -'
        const max = seeded ? pad(this._maxFPS) : '  -'
        const text1 = `FPS ${pad(this._fps)}`
        const text2 = `min ${min}  max ${max}`

        ctx.clearRect(0, 0, w, this._fpsCanvas!.height)

        ctx.font = '12px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'
        ctx.textAlign = 'right'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(w - 142, 4, 138, 36)
        ctx.fillStyle = '#00ff66'
        ctx.fillText(text1, w - 12, 20)
        ctx.fillText(text2, w - 12, 34)
    }

    /**
     * Request next Frame rendering cycle
     */
    private requestNextFrame() {
        requestAnimationFrame(this.renderDMD.bind(this))
    }

    private sortLayers() {
        this._sortedLayers = this._sortedLayers.sort((a, b) => a.zIndex - b.zIndex)
    }


    /**
     * Fade dmd brightness out
     * @param {number} duration in ms
     * @returns {Promise<void>}
     */
    fadeOut(duration: number): Promise<void> {
        const start = window.performance.now()

        const startBrightness = this._renderer.brightness

        return new Promise(resolve => {
            const renderer = this._renderer

            const cb = function () {
                const delta = window.performance.now() - start
                const b = startBrightness - Easing.easeOutSine(delta, 0, startBrightness, duration)
                renderer.setBrightness(b)

                if (renderer.brightness <= 0 || delta > duration) {
                    renderer.setBrightness(0)
                    resolve()
                } else {
                    requestAnimationFrame(cb)
                }
            }
            cb()
        })
    }

    /**
     * Fade Dmd brightness in
     * @param {number} duration in ms
     * @returns {Promise<void>}
     */
    fadeIn(duration: number): Promise<void> {
        const start = window.performance.now()

        const startBrightness = this._renderer.brightness


        return new Promise(resolve => {
            const renderer = this._renderer

            const cb = function () {

                const delta = window.performance.now() - start
                const b = Easing.easeOutSine(delta, startBrightness, 1 - startBrightness, duration)

                renderer.setBrightness(b)

                if (renderer.brightness >= 1 || delta > duration) {
                    renderer.setBrightness(1)
                    resolve()
                } else {
                    requestAnimationFrame(cb)
                }
            }
            cb()
        })
    }

    /**
     * Set Dmd opacity between 0 and 255
     * @param {number} b
     */
    setBrightness(b: number) {
        // Pass brightness to the renderer
        this._renderer.setBrightness(b)
    }

    addLayer<T extends BaseLayer>(
        layerClass: new (...args: never[]) => T,
        id: string,
        options?: LayerOptionsByInstance<T>,
        layerLoadedListener?: (layer: T) => void | Promise<void>,
        layerUpdatedListener?: (layer: T) => void | Promise<void>,
        layerOnPlayListener?: LayerPlayListenerByInstance<T>,
        layerOnPauseListener?: LayerPauseListenerByInstance<T>,
        layerOnStopListener?: LayerStopListenerByInstance<T>,
    ): T {
        if (typeof this._layers[id] !== 'undefined') {
            throw new Error(`Layer [${id}] already exists`);
        }

        // Make sure we have an Options object from now on
        const opts = new Options((options ?? {}) as Record<string, unknown>)

        const layerWidth = opts.get('width') || this._outputWidth
        const layerHeight = opts.get('height') || this._outputHeight

        const pos: LayerPosition = opts.get('position') || {}
        const {top: layerTop, left: layerLeft} = resolveLayerPosition(id, pos, layerWidth, layerHeight, this._outputWidth, this._outputHeight, this._sortedLayers, this._layers)

        // Cast typed callbacks to (layer: BaseLayer) for the layer constructors
        const onLoaded  = layerLoadedListener  as unknown as ((layer: BaseLayer) => void | Promise<void>) | undefined
        const onUpdated = layerUpdatedListener as unknown as ((layer: BaseLayer) => void | Promise<void>) | undefined
        const onPlay    = layerOnPlayListener  as unknown as ((layer: BaseLayer) => void) | undefined
        const onPause   = layerOnPauseListener as unknown as ((layer: BaseLayer) => void) | undefined
        const onStop    = layerOnStopListener  as unknown as ((layer: BaseLayer) => void) | undefined

        const layer = createLayerInstance(layerClass, id, layerWidth, layerHeight, opts, onLoaded, onUpdated, onPlay, onPause, onStop)

        this._layers[id] = layer as BaseLayer

        let zIndex = this._zIndex

        if (opts.has('zIndex')) {
            zIndex = opts.get('zIndex')
        } else {
            this._zIndex++
        }

        // Add new layer to sorted array
        this._sortedLayers.push({id: id, zIndex: zIndex, top: layerTop, left: layerLeft})

        // Sort by zIndex inc
        this.sortLayers()

        return layer as unknown as T
    }

    /**
     * Remove specified layer
     * @param {string} id
     */
    removeLayer(id: string) {

        if (typeof this._layers[id] !== 'undefined') {

            this._layers[id].destroy() // Force stop rendering since delete does seems to GC

            // Remove Layer object from array
            delete this._layers[id]

            // Sort layers without deleted layer
            this._sortedLayers = this._sortedLayers.filter(l => {
                return l.id !== id
            })

            console.log(`Removing layer : ${id}`)
        } else {
            console.log('This layer does not exist')
        }
    }

    /**
     * Move a layer to a new position in the rendering order.
     * @param {string} id layer id to move
     * @param {number} toIndex target index in the sorted array (0 = bottom)
     */
    moveLayer(id: string, toIndex: number) {
        const fromIndex = this._sortedLayers.findIndex(l => l.id === id)
        if (fromIndex === -1) return
        const [moved] = this._sortedLayers.splice(fromIndex, 1)
        this._sortedLayers.splice(toIndex, 0, moved)
        this._sortedLayers.forEach((l, i) => { l.zIndex = i })
    }

    /**
     * Show/Hide specified layer
     * @param {string} id
     * @param {boolean} state
     */
    setLayerVisibility(id: string, state: boolean) {
        if (typeof this._layers[id] !== 'undefined') {
            this._layers[id].setVisibility(!!state)
        }
    }

    /**
     * Fade a layer in (opacity 0 → 1). Makes the layer visible if it isn't already.
     * @param {string} id layer id
     * @param {number} duration fade duration in ms
     * @param {EasingFunction} easing easing function (defaults to easeOutSine)
     * @returns {Promise<void>}
     */
    fadeLayerIn(id: string, duration: number, easing?: EasingFunction): Promise<void> {
        if (typeof this._layers[id] === 'undefined') {
            return Promise.reject(new Error(`Layer [${id}] does not exist`))
        }
        const layer = this._layers[id]
        if (!layer.isVisible()) {
            layer.setOpacity(0)
            layer.setVisibility(true)
        }
        return layer.fadeIn(duration, easing)
    }

    /**
     * Fade a layer out (opacity → 0) then hide it.
     * @param {string} id layer id
     * @param {number} duration fade duration in ms
     * @param {EasingFunction} easing easing function (defaults to easeOutSine)
     * @returns {Promise<void>}
     */
    fadeLayerOut(id: string, duration: number, easing?: EasingFunction): Promise<void> {
        if (typeof this._layers[id] === 'undefined') {
            return Promise.reject(new Error(`Layer [${id}] does not exist`))
        }
        const layer = this._layers[id]
        return layer.fadeOut(duration, easing).then(() => {
            layer.setVisibility(false)
        })
    }

    /**
     * Add a renderer instance to the Dmd
     * TODO : Check if really a renderer class
     * @param {string} id (unique)
     * @param {IRenderer} renderer
     */
    addRenderer(id: string, renderer: LayerRenderer) {

        if (this._isRunning) {
            throw new Error("Renderers must be added before calling Dmd.run()")
        }

        // TODO check if renderer is a renderer class
        if (typeof this._layerRenderers[id] === 'undefined') {
            if (typeof renderer === 'object' && typeof renderer.renderFrame === 'function') {
                this._layerRenderers[id] = renderer
            } else {
                throw new Error("Renderer object might not be a Renderer class")
            }
        } else {
            throw new Error(`A renderer with this id[${id}] already exists`)
        }
    }


    /**
     * Reset Dmd
     */
    reset() {
        //TODO delete all layer first
        this._layers = {} as LayerDictionary
        this._sortedLayers = []
    }

    /**
     * Output some info in the console
     */
    debug() {
        console.log(this._layers)
        console.log(this._sortedLayers)
    }

    /**
     * Get specified layer
     * @param {string} name
     * @returns BaseLayer
     */
    getLayer(name: string): BaseLayer | null {
        if (typeof this._layers[name] !== 'undefined') {
            return this._layers[name]
        } else {
            return null
        }
    }

    /**
     * Get Dmd brightness
     */
    get brightness() {
        return this._renderer.brightness
    }

    /**
     * Change the dot shape at runtime.
     * @param {DotShape} shape
     */
    setDotShape(shape: DotShape) {
        this._renderer.setDotShape(shape)
    }

    /**
     * Get current dot shape
     */
    get dotShape(): DotShape {
        return this._renderer.dotShape
    }

    /**
     * Change the dot size at runtime. Content is rescaled to fill the canvas.
     * @param {number} size
     */
    setDotSize(size: number) {
        this._renderer.setDotSize(size)
    }

    /**
     * Get current dot size
     */
    get dotSize(): number {
        return this._renderer.dotSize
    }

    /**
     * Change the dot spacing at runtime.
     * @param {number} space
     */
    setDotSpace(space: number) {
        this._renderer.setDotSpace(space)
    }

    /**
     * Get current dot spacing
     */
    get dotSpace(): number {
        return this._renderer.dotSpace
    }

    /**
     * Get minimum dot spacing for the current shape
     */
    get minDotSpace(): number {
        return this._renderer.minDotSpace
    }

    /** Perceptual brightness (HSP) of the off-dot background color. */
    get bgHSP(): number {
        return this._renderer.bgHSP
    }

    /** Raw brightness value of the off-dot background (0–255). */
    get bgBrightness(): number {
        return this._renderer.bgBrightness
    }

    /** Set the off-dot color (RGB, each component 0–1). */
    setOffDotColor(r: number, g: number, b: number) {
        this._renderer.setOffDotColor(r, g, b)
        const c = this._renderer.offDotColor
        this._backgroundColor = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, 255)`
    }

    /** Get the current off-dot color (RGB, each component 0–1). */
    get offDotColor(): { r: number, g: number, b: number } {
        return this._renderer.offDotColor
    }

    /**
     * Enable or disable monochrome mode (16 brightness levels, single tint color).
     * @param {boolean} enabled
     */
    setMonochrome(enabled: boolean) {
        this._renderer.setMonochrome(enabled)
    }

    /**
     * Get current monochrome mode state.
     */
    get monochrome(): boolean {
        return this._renderer.monochrome
    }

    /**
     * Set the monochrome tint color (RGB, each component 0–1).
     * @param {number} r Red component (0–1)
     * @param {number} g Green component (0–1)
     * @param {number} b Blue component (0–1)
     */
    setMonochromeColor(r: number, g: number, b: number) {
        this._renderer.setMonochromeColor(r, g, b)
    }

    /**
     * Get the current monochrome tint color.
     */
    get monochromeColor(): { r: number, g: number, b: number } {
        return this._renderer.monochromeColor
    }

    /**
     * Set the number of monochrome brightness levels.
     * @param {number} levels — one of 4, 6, 8, 10, 12, 14, 16
     */
    setMonoLevels(levels: number) {
        this._renderer.setMonoLevels(levels)
    }

    get monoLevels(): number {
        return this._renderer.monoLevels
    }

    /**
     * Get the number of visible dots horizontally at the current dot size.
     */
    get visibleDotsX(): number {
        return this._renderer.visibleDotsX
    }

    /**
     * Get the number of visible dots vertically at the current dot size.
     */
    get visibleDotsY(): number {
        return this._renderer.visibleDotsY
    }

    /**
     * Get the H5DMD library version (delegates to the static {@link Dmd.version}).
     */
    get version(): string {
        return Dmd.version
    }

    /**
     * Get canvas
     */
    get canvas() {
        return this._outputCanvas
    }

    /**
     * Get WebGPU canvas context (available after init)
     */
    get context(): GPUCanvasContext {
        return this._renderer.canvasContext
    }

    /**
     * Return width of the DND (dots)
     */
    get width() {
        return this._outputWidth
    }

    /**
     * Return height of the DND (dots)
     */
    get height() {
        return this._outputHeight
    }

    /**
     * Return width of the canvas (pixels)
     */
    get screenWidth() {
        return this._outputCanvas.width
    }

    /**
     * Return height of the canvas (pixels)
     */
    get screenHeight() {
        return this._outputCanvas.height
    }

    /**
     * Get current fps value
     */
    get fps() {
        return this._fps
    }

    /**
     * Show or hide the FPS overlay at runtime.
     */
    get showFPS(): boolean {
        return this._showFPS
    }

    set showFPS(visible: boolean) {
        this._showFPS = visible
        if (visible && !this._fpsCanvas) {
            this._createFpsOverlay()
        } else if (!visible && this._fpsCanvas) {
            this._removeFpsOverlay()
        }
    }
}