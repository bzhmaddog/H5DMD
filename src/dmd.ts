import {Easing, OffscreenBuffer, Options} from './utils'
import {DmdRenderer, LayerRenderer} from './renderers'
import {AnimationLayer, BaseLayer, CanvasLayer, LayerType, SpritesLayer, TextLayer, VideoLayer} from './layers'
import {DotShape} from "./enums"
import {ILayerRendererDictionary} from "./interfaces"


export interface ILayerDimensions {
    width?: number,
    height?: number,
    top?: number,
    left?: number,
    hAlign?: string,
    vAlign?: string,
    hOffset?: number,
    vOffset?: number
}

interface ILayerDictionnary {
    [index: string]: BaseLayer
}

export interface ILayer {
    id: string,
    zIndex: number,
    top: number,
    left: number
}

export class Dmd {

    private _outputCanvas: HTMLCanvasElement
    private _xOffset: number
    private _yOffset: number
    private _layers: ILayerDictionnary
    private _sortedLayers: ILayer[]
    private _outputWidth: number
    private _outputHeight: number
    private _frameBuffer: OffscreenBuffer
    private _fpsBox: HTMLDivElement
    private _zIndex: number
    private _renderer: DmdRenderer
    private _isRunning: boolean
    private _fps: number
    private _lastRenderTime: number
    private _layerRenderers: ILayerRendererDictionary
    private _initDone: boolean
    private _backgroundColor: string
    private _renderNextFrame: () => void
    private _renderFPS: () => void

    private _minFPS: number
    private _maxFPS: number

    get _outputContext(): CanvasRenderingContext2D | null {
        return this._outputCanvas.getContext('2d')
    }

    /**
     *
     * @param {HTMLCanvasElement} outputCanvas Dom Element where the Dmd will be drawed
     * @param {number} dotSize Horizontal width of the virtual pixels (ex: 1 dot will be 4 pixels wide)
     * @param {number} dotSpace number of 'black' pixels between each column (vertical lines between dots)
     * @param {number} xOffset // TODO : horizontal shifting
     * @param {number} yOffset  // TODO : vertical shifting
     * @param {string} dotShape // TODO(GPU) : Shape of the dots (can be square or circle)
     * @param {number} backgroundBrightness brightness of the background (below the dots)
     * @param {number} brightness brightness of the dots
     * @param {boolean} showFPS show FPS count or not
     */
    constructor(
        outputCanvas: HTMLCanvasElement | string,
        dotSize: number,
        dotSpace: number,
        xOffset: number,
        yOffset: number,
        dotShape: DotShape,
        backgroundBrightness: number,
        brightness: number,
        showFPS: boolean
    ) {

        if (typeof outputCanvas === 'string') {
            this._outputCanvas = document.getElementById(outputCanvas) as HTMLCanvasElement
        } else {
            this._outputCanvas = outputCanvas
        }

        this._xOffset = xOffset
        this._yOffset = yOffset
        this._outputWidth = Math.floor(this._outputCanvas.width / (dotSize + dotSpace))
        this._outputHeight = Math.floor(this._outputCanvas.height / (dotSize + dotSpace))
        this._frameBuffer = new OffscreenBuffer(this._outputWidth, this._outputHeight, true)
        this._zIndex = 1
        this._layers = {} as ILayerDictionnary
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

        console.log(`Creating a ${this._outputWidth}x${this._outputHeight} DMD on a ${this._outputCanvas.width}x${this._outputCanvas.height} canvas`)

        this._renderer = new DmdRenderer(this._outputWidth, this._outputHeight, this._outputCanvas.width, this._outputCanvas.height, dotSize, dotSpace, dotShape || DotShape.Circle, backgroundBrightness, brightness)

        // Add renderers needed for layers rendering
        this._layerRenderers = {
            //'opacity' : new ChangeAlphaRenderer(this._outputWidth, this._outputHeight), // used by layer with opacity < 1
            //'no-antialiasing' : new RemoveAliasingRenderer(this._outputWidth, this._outputHeight), // used by TextLayer if antialiasing  = false
            //'outline' : new OutlineRenderer(this._outputWidth, this._outputHeight)  // used by TextLayer when outlineWidth > 1
        } as ILayerRendererDictionary

        this._initDone = false

        // IF needed create and show fps div in hte top right corner of the screen
        if (showFPS) {
            // Dom element to ouput fps value
            // TODO : Remove later
            this._fpsBox = document.createElement('div')
            this._fpsBox.style.position = 'absolute'
            this._fpsBox.style.right = '0'
            this._fpsBox.style.top = '0'
            this._fpsBox.style.zIndex = '99999' // WTF is this a string : check if/where we do addition/substraction
            this._fpsBox.style.color = 'red'
            this._fpsBox.style.background = 'rgba(255,255,255,0.5)'
            this._fpsBox.style.padding = '5px'
            this._fpsBox.style.minWidth = '40px'
            this._fpsBox.style.textAlign = 'center'

            document.body.appendChild(this._fpsBox)

            this._renderFPS = this.__renderFPS // Enable fps rendering on top of dmd
        }

        // Reset layers
        this.reset()
    }

    /**
     * Init Dmd renderer
     * @returns Promise
     */
    init(): Promise<void> {
        return new Promise(resolve => {
            this._renderer.init().then(() => {
                this._initDone = true
                resolve()
            })
        })
    }

    /**
     * Start rendering layers
     */
    run() {
        if (!this._initDone) {
            throw new Error("call Dmd.init() first")
        }

        this._isRunning = true
        this._lastRenderTime = window.performance.now()
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
    }

    /**
     * Render output Dmd
     */
    private renderDMD() {
        // Fill rectangle with background color
        this._frameBuffer.context.fillStyle = this._backgroundColor
        this._frameBuffer.context.fillRect(0, 0, this._outputWidth, this._outputHeight)


        //const before:number = performance.now()

        // Draw each visible layer on top of previous one to create the final screen
        this._sortedLayers.forEach(l => {
            //if (this._layers.hasOwnProperty(l.id)) {
            const layer = this._layers[l.id]

            if (layer.isVisible() && layer.isLoaded()) {

                //if (layer.layerType === LayerType.Text && layer.id === 'ball-value') {
                //if (layer.layerType === LayerType.Text && layer.id === 'ball-text') {
                //if (layer.layerType === LayerType.Text && layer.id === 'attract-credits') {
                //if (layer.layerType === LayerType.Text) {
                //console.log(l)
                //this._frameBuffer.context.fillStyle = "#FF0000FF"
                //this._frameBuffer.context.fillRect(l.left, l.top, layer.width, layer.height)
                /*this._frameBuffer.context.strokeStyle = "#FF0000"
                this._frameBuffer.context.beginPath()
                this._frameBuffer.context.rect(l.left, l.top, layer.width, layer.height)
                this._frameBuffer.context.stroke()*/
                //}
                // Draw layer content into a buffer
                this._frameBuffer.context.drawImage(layer.canvas, l.left, l.top)
            }
            //}
        })

        //const after: number = performance.now() - before

        //console.log('render time = ', after)


        // Get data from the merged layers content
        const frameImageData = this._frameBuffer.context.getImageData(0, 0, this._frameBuffer.width, this._frameBuffer.height)

        // Generate Dmd frame
        this._renderer.renderFrame(frameImageData).then((dmdImageData: ImageData) => {

            createImageBitmap(dmdImageData).then(bitmap => {


                // Clear target canvas
                this._outputContext.clearRect(0, 0, this._outputCanvas.width, this._outputCanvas.height)

                // Render final Dmd image onto target canvas
                this._outputContext.drawImage(bitmap, 0, 0)

                const now = performance.now()
                const delta = (now - this._lastRenderTime)
                this._lastRenderTime = now

                // Calculate FPS
                this._fps = Math.floor(Math.round((1000 / delta) * 1e2) / 1e2)

                if (this._fps < this._minFPS) {
                    this._minFPS = this._fps
                }

                if (this._fps > this._maxFPS) {
                    this._maxFPS = this._fps
                }

                // Render FPS box if needed
                this._renderFPS()


                this._renderNextFrame()
            })

        })
    }

    /**
     * Update FPS output div with current fps value
     */
    private __renderFPS() {
        this._fpsBox.innerHTML = `${this._minFPS} / ${this._fps} / ${this._maxFPS}`
    }

    /**
     * Request next Frame rendering cycle
     */
    private requestNextFrame() {
        requestAnimationFrame(this.renderDMD.bind(this))
    }

    private sortLayers() {
        this._sortedLayers = this._sortedLayers.sort((a, b) => (a.zIndex > b.zIndex) ? 1 : -1)
    }


    /**
     * Fase dmd brightness out
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
                    setTimeout(cb, 1)
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
                const b = Easing.easeOutSine(delta, startBrightness, 1, duration)

                renderer.setBrightness(b)

                if (renderer.brightness >= 1 || delta > duration) {
                    renderer.setBrightness(1)
                    resolve()
                } else {
                    setTimeout(cb, 1)
                }
            }
            cb()
        })
    }

    /**
     * Set Dmd opacity betwewn 0 and 255
     * @param {number} b
     */
    setBrightness(b: number) {
        // Pass brightness to the renderer
        this._renderer.setBrightness(b)
    }

    addCanvasLayer(
        id: string,
        layerDimensions: ILayerDimensions,
        options: Options,
        renderers?: ILayerRendererDictionary,
        layerLoadedListener?: (layer: BaseLayer) => void,
        layerUpdatedListener?: (layer: BaseLayer) => void,
    ): CanvasLayer {
        return this._addLayer(
            LayerType.Canvas,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener
        ) as CanvasLayer
    }

    addVideoLayer(
        id: string,
        layerDimensions: ILayerDimensions,
        options: Options,
        renderers?: ILayerRendererDictionary,
        layerLoadedListener?: (layer: BaseLayer) => void,
        layerUpdatedListener?: (layer: BaseLayer) => void,
        layerOnPlayListener?: (layer: BaseLayer) => void,
        layerOnPauseListener?: (layer: BaseLayer) => void
        // Why no _layerOnStopListener ?
    ): VideoLayer {
        return this._addLayer(
            LayerType.Video,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
            layerOnPlayListener,
            layerOnPauseListener
        ) as VideoLayer
    }

    addAnimationLayer(
        id: string,
        layerDimensions: ILayerDimensions,
        options: Options,
        renderers?: ILayerRendererDictionary,
        layerLoadedListener?: (layer: BaseLayer) => void,
        layerUpdatedListener?: (layer: BaseLayer) => void,
        layerOnPlayListener?: (layer: BaseLayer) => void,
        layerOnPauseListener?: (layer: BaseLayer) => void,
        layerOnStopListener?: (layer: BaseLayer) => void
    ): AnimationLayer {
        return this._addLayer(
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
        ) as AnimationLayer
    }

    addSpritesLayer(
        id: string,
        layerDimensions: ILayerDimensions,
        options: Options,
        renderers?: ILayerRendererDictionary,
        layerLoadedListener?: (layer: BaseLayer) => void,
        layerUpdatedListener?: (layer: BaseLayer) => void,
    ): SpritesLayer {
        return this._addLayer(
            LayerType.Sprites,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
        ) as SpritesLayer
    }


    addTextLayer(
        id: string,
        layerDimensions: ILayerDimensions,
        options: Options,
        renderers?: ILayerRendererDictionary,
        layerLoadedListener?: (layer: BaseLayer) => void,
        layerUpdatedListener?: (layer: BaseLayer) => void,
    ): TextLayer {
        return this._addLayer(
            LayerType.Text,
            id,
            layerDimensions,
            options,
            renderers,
            layerLoadedListener,
            layerUpdatedListener,
        ) as TextLayer
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
            throw new Error("Renderers must be added before calling Dmd.init()")
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
        this._layers = {} as ILayerDictionnary
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
    getLayer(name: string): BaseLayer {
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
     * Get canvas
     */
    get canvas() {
        return this._outputCanvas
    }

    /**
     * Get canvas context
     */
    get context() {
        return this._outputContext
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
     * @param {ILayerDimensions} _layerDimensions : optional
     * @param {object} _options
     * @param {ILayerRendererDictionary} _layerRenderers : optional
     * @param {function} _layerLoadedListener : optional
     * @param {function} _layerUpdatedListener : optional
     * @param {function} _layerOnPlayListener : optional
     * @param {function} _layerOnPauseListener : optional
     * @param {function} _layerOnStopListener : optional
     * @see BaseLayer for available options
     * @return layer
     */
    private _addLayer(
        type: LayerType,
        id: string,
        _layerDimensions: ILayerDimensions,
        _options: Options,
        _layerRenderers?: ILayerRendererDictionary,
        _layerLoadedListener?: (layer: BaseLayer) => void,
        _layerUpdatedListener?: (layer: BaseLayer) => void,
        _layerOnPlayListener?: (layer: BaseLayer) => void,
        _layerOnPauseListener?: (layer: BaseLayer) => void,
        _layerOnStopListener?: (layer: BaseLayer) => void,
    ) {

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


        let layer

        switch (type) {
            case LayerType.Canvas:
                layer = new CanvasLayer(id, layerWidth, layerHeight, options, _layerRenderers, _layerLoadedListener, _layerUpdatedListener)
                break
            case LayerType.Video:
                layer = new VideoLayer(id, layerWidth, layerHeight, options, _layerRenderers, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener)
                break
            case LayerType.Animation:
                layer = new AnimationLayer(id, layerWidth, layerHeight, options, _layerRenderers, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener)
                break
            case LayerType.Sprites:
                layer = new SpritesLayer(id, layerWidth, layerHeight, options, _layerRenderers, _layerLoadedListener, _layerUpdatedListener)
                break
            case LayerType.Text:
                layer = new TextLayer(id, layerWidth, layerHeight, options, _layerRenderers, _layerLoadedListener, _layerUpdatedListener)
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

        return layer as BaseLayer

    }
}