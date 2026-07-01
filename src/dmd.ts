import {Easing, OffscreenBuffer, Options, type EasingFunction} from './utils'
import {DmdRenderer, LayerRenderer} from './renderers'
import {AnimationLayer, BaseLayer, CanvasLayer, LayerType, SpritesLayer, TextLayer, VideoLayer} from './layers'
import {DotShape} from "./enums"
import {Layer, LayerDimensions, LayerRendererDictionary} from "./interfaces"


interface LayerDictionary {
    [index: string]: BaseLayer
}

export class Dmd {

    /**
     * H5DMD library version. Single source of truth for the version string
     * (must be bumped together with package.json on release).
     */
    static readonly version: string = '1.2.1'

    private _outputCanvas: HTMLCanvasElement
    private _layers: LayerDictionary
    private _sortedLayers: Layer[]
    private _outputWidth: number
    private _outputHeight: number
    private _frameBuffer: OffscreenBuffer
    private _fpsBox?: HTMLDivElement
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

    /**
     *
     * @param {HTMLCanvasElement} outputCanvas DOM element where the Dmd will be rendered
     * @param {number} dotSize Horizontal width of the virtual pixels (ex: 1 dot will be 4 pixels wide)
     * @param {number} dotSpace number of 'black' pixels between each column (vertical lines between dots)
     * @param {string} dotShape Shape of the dots (square, circle or diamond)
     * @param {number} backgroundBrightness brightness of the background (below the dots)
     * @param {number} brightness brightness of the dots
     * @param {boolean} showFPS show FPS count or not
     */
    constructor(
        outputCanvas: HTMLCanvasElement,
        dotSize: number,
        dotSpace: number,
        dotShape: DotShape,
        backgroundBrightness: number,
        brightness: number,
        showFPS: boolean
    ) {

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
            this._createFpsBox()
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

        // (Re)create the FPS box if it was removed by a previous stop()
        if (this._showFPS && !this._fpsBox) {
            this._createFpsBox()
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

        // Remove the FPS box from the DOM so a discarded Dmd leaves nothing behind
        this._removeFpsBox()
    }

    /**
     * Render output Dmd
     */
    private renderDMD() {
        // Fill rectangle with background color
        this._frameBuffer.context.fillStyle = this._backgroundColor
        this._frameBuffer.context.fillRect(0, 0, this._outputWidth, this._outputHeight)

        // Draw each visible layer on top of previous one to create the final screen
        this._sortedLayers.forEach(l => {
            const layer = this._layers[l.id]

            if (layer.isVisible() && layer.isLoaded()) {
                this._frameBuffer.context.drawImage(layer.canvas, l.left, l.top)
            }
        })

        // Get data from the merged layers content
        const frameImageData = this._frameBuffer.context.getImageData(0, 0, this._frameBuffer.width, this._frameBuffer.height)

        // Generate Dmd frame
        this._renderer.renderFrame(frameImageData).then(() => {

            const now = performance.now()
            const delta = (now - this._lastRenderTime)
            this._lastRenderTime = now

            // Smoothed FPS : rolling average of frame time over the last frames.
            // Using ONE smoothed value for the live readout AND for min/max keeps
            // them consistent (min <= FPS <= max always holds) and stops the number
            // flickering frame-to-frame.
            this._fpsSamples.push(delta)
            if (this._fpsSamples.length > 60) {
                this._fpsSamples.shift()
            }
            const meanDelta = this._fpsSamples.reduce((sum, d) => sum + d, 0) / this._fpsSamples.length
            this._fps = Math.round(1000 / meanDelta)

            // Track min/max on the same smoothed value, once the window has filled
            // enough to represent steady-state (ignores the slow warmup frames).
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
     * Create the on-screen FPS box and enable FPS rendering.
     */
    private _createFpsBox() {
        // Dom element to output fps value
        this._fpsBox = document.createElement('div')
        this._fpsBox.style.position = 'absolute'
        this._fpsBox.style.right = '8px'
        this._fpsBox.style.top = '8px'
        this._fpsBox.style.zIndex = '99999' // zIndex is typed as string; verify no numeric operations depend on it
        this._fpsBox.style.color = '#00ff66'
        this._fpsBox.style.background = 'rgba(0, 0, 0, 0.8)'
        this._fpsBox.style.padding = '6px 10px'
        this._fpsBox.style.minWidth = '132px'
        this._fpsBox.style.textAlign = 'left'
        this._fpsBox.style.font = '12px/1.5 "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'
        this._fpsBox.style.borderRadius = '4px'
        this._fpsBox.style.whiteSpace = 'pre'
        this._fpsBox.style.pointerEvents = 'none'
        this._fpsBox.style.userSelect = 'none'

        document.body.appendChild(this._fpsBox)

        this._renderFPS = this.__renderFPS // Enable fps rendering on top of dmd
    }

    /**
     * Remove the on-screen FPS box from the DOM and disable FPS rendering.
     */
    private _removeFpsBox() {
        if (this._fpsBox) {
            this._fpsBox.remove()
            this._fpsBox = undefined
        }

        this._renderFPS = function () {
        } // Does nothing
    }

    /**
     * Update FPS output div with current fps value
     */
    private __renderFPS() {
        const pad = (n: number) => String(n).padStart(3, ' ')
        const seeded = this._fpsSamples.length >= 30
        const min = seeded ? pad(this._minFPS) : '  -'
        const max = seeded ? pad(this._maxFPS) : '  -'
        this._fpsBox!.textContent =
            `FPS ${pad(this._fps)}\n` +
            `min ${min}   max ${max}`
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

    addCanvasLayer(
        id: string,
        layerDimensions: LayerDimensions,
        options: Options,
        renderers?: LayerRendererDictionary,
        layerLoadedListener?: (layer: CanvasLayer) => void,
        layerUpdatedListener?: (layer: CanvasLayer) => void,
    ): CanvasLayer {
        return this._addLayer<CanvasLayer>(
            LayerType.Canvas,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener
        )
    }

    addVideoLayer(
        id: string,
        layerDimensions: LayerDimensions,
        options: Options,
        renderers?: LayerRendererDictionary,
        layerLoadedListener?: (layer: VideoLayer) => void,
        layerUpdatedListener?: (layer: VideoLayer) => void,
        layerOnPlayListener?: (layer: VideoLayer) => void,
        layerOnPauseListener?: (layer: VideoLayer) => void
        // Why no _layerOnStopListener ?
    ): VideoLayer {
        return this._addLayer<VideoLayer>(
            LayerType.Video,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
            layerOnPlayListener,
            layerOnPauseListener
        )
    }

    addAnimationLayer(
        id: string,
        layerDimensions: LayerDimensions,
        options: Options,
        renderers?: LayerRendererDictionary,
        layerLoadedListener?: (layer: AnimationLayer) => void,
        layerUpdatedListener?: (layer: AnimationLayer) => void,
        layerOnPlayListener?: (layer: AnimationLayer) => void,
        layerOnPauseListener?: (layer: AnimationLayer) => void,
        layerOnStopListener?: (layer: AnimationLayer) => void
    ): AnimationLayer {
        return this._addLayer<AnimationLayer>(
            LayerType.Animation,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
            layerOnPlayListener,
            layerOnPauseListener,
            layerOnStopListener
        )
    }

    addSpritesLayer(
        id: string,
        layerDimensions: LayerDimensions,
        options: Options,
        renderers?: LayerRendererDictionary,
        layerLoadedListener?: (layer: SpritesLayer) => void,
        layerUpdatedListener?: (layer: SpritesLayer) => void,
    ): SpritesLayer {
        return this._addLayer<SpritesLayer>(
            LayerType.Sprites,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
        )
    }


    addTextLayer(
        id: string,
        layerDimensions: LayerDimensions,
        options: Options,
        renderers?: LayerRendererDictionary,
        layerLoadedListener?: (layer: TextLayer) => void,
        layerUpdatedListener?: (layer: TextLayer) => void,
    ): TextLayer {
        return this._addLayer<TextLayer>(
            LayerType.Text,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
        )
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
     * Show/hid group of layers
     * @param {string} name
     * @param {boolean} state
     */
    setLayerGroupVisibility(name: string, state: boolean) {
        Object.keys(this._layers).forEach(key => {
            if (this._layers[key].groups.includes(name)) {
                this._layers[key].setVisibility(!!state)
            }
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
     * Create a new layer object and add it to the list of layers
     * @param {LayerType} type : mandatory
     * @param {string} id : mandatory
     * @param {LayerDimensions} _layerDimensions : optional
     * @param {object} _options
     * @param {LayerRendererDictionary} _layerRenderers : optional
     * @param {function} _layerLoadedListener : optional
     * @param {function} _layerUpdatedListener : optional
     * @param {function} _layerOnPlayListener : optional
     * @param {function} _layerOnPauseListener : optional
     * @param {function} _layerOnStopListener : optional
     * @see BaseLayer for available options
     * @return layer
     */
    private _addLayer<T extends BaseLayer>(
        type: LayerType,
        id: string,
        _layerDimensions: LayerDimensions,
        _options: Options,
        _layerRenderers?: LayerRendererDictionary,
        _layerLoadedListener?: (layer: T) => void,
        _layerUpdatedListener?: (layer: T) => void,
        _layerOnPlayListener?: (layer: T) => void,
        _layerOnPauseListener?: (layer: T) => void,
        _layerOnStopListener?: (layer: T) => void,
    ): T {

        if (typeof this._layers[id] !== 'undefined') {
            throw new Error(`Layer [${id}] already exists`);
        }

        // This method is called by child layer creator which can be called from javascript directly so
        // make sure we have an Options object from now on
        const options = new Options(_options)
        const layerWidth = _layerDimensions.width || this._outputWidth
        const layerHeight = _layerDimensions.height || this._outputHeight

        let layerTop = _layerDimensions.top || 0
        let layerLeft = _layerDimensions.left || 0

        if (typeof _layerDimensions.hAlign === 'string') {
            switch (_layerDimensions.hAlign) {
                case "left":
                    layerLeft = _layerDimensions.hOffset || 0
                    break
                case "center":
                    layerLeft = (this._outputWidth - layerWidth) / 2 + (_layerDimensions.hOffset || 0) - 1
                    break
                case "right":
                    layerLeft = this._outputWidth - layerWidth + (_layerDimensions.hOffset || 0) - 1
            }
        }

        if (typeof _layerDimensions.vAlign === 'string') {
            switch (_layerDimensions.vAlign) {
                case 'top':
                    layerTop = _layerDimensions.vOffset || 0
                    break
                case 'middle':
                    layerTop = (this._outputHeight - layerHeight) / 2 + (_layerDimensions.vOffset || 0) - 1
                    break
                case 'bottom':
                    layerTop = this._outputHeight - layerHeight + (_layerDimensions.vOffset || 0) - 1
            }
        }


        // Cast typed callbacks to (layer: BaseLayer) for the layer constructors
        const onLoaded  = _layerLoadedListener  as ((layer: BaseLayer) => void) | undefined
        const onUpdated = _layerUpdatedListener as ((layer: BaseLayer) => void) | undefined
        const onPlay    = _layerOnPlayListener  as ((layer: BaseLayer) => void) | undefined
        const onPause   = _layerOnPauseListener as ((layer: BaseLayer) => void) | undefined
        const onStop    = _layerOnStopListener  as ((layer: BaseLayer) => void) | undefined

        let layer

        switch (type) {
            case LayerType.Canvas:
                layer = new CanvasLayer(id, layerWidth, layerHeight, options, _layerRenderers, onLoaded, onUpdated)
                break
            case LayerType.Video:
                layer = new VideoLayer(id, layerWidth, layerHeight, options, _layerRenderers, onLoaded, onUpdated, onPlay, onPause)
                break
            case LayerType.Animation:
                layer = new AnimationLayer(id, layerWidth, layerHeight, options, _layerRenderers, onLoaded, onUpdated, onPlay, onPause, onStop)
                break
            case LayerType.Sprites:
                layer = new SpritesLayer(id, layerWidth, layerHeight, options, _layerRenderers, onLoaded, onUpdated)
                break
            case LayerType.Text:
                layer = new TextLayer(id, layerWidth, layerHeight, options, _layerRenderers, onLoaded, onUpdated)
                break
            default:
                throw new TypeError(`Invalid layer type : ${type}`)
        }

        this._layers[id] = layer as BaseLayer // use getType() to retrieve the type later

        let zIndex = this._zIndex

        if (options.has('zIndex')) {
            zIndex = options.get('zIndex')
        } else {
            this._zIndex++
        }

        // Add new layer to sorted array
        this._sortedLayers.push({id: id, zIndex: zIndex, top: layerTop, left: layerLeft})

        // Sort by zIndex inc
        this.sortLayers()

        return layer as unknown as T

    }
}