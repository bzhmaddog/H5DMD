import {Easing, type EasingFunction, OffscreenBuffer, Options} from "../utils"
import {ChangeAlphaRenderer, LayerRenderer} from "../renderers"
import {LayerRendererDictionary, RendererEntry} from "../interfaces";

interface RenderQueueItem {
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance: LayerRenderer<any>,
    params?: Record<string, unknown>,
    active: boolean
}

abstract class BaseLayer {

    protected _contentBuffer: OffscreenBuffer

    protected _options: Options

    private _id: string
    private _loaded: boolean = false
    private _outputBuffer: OffscreenBuffer
    private _renderNextFrame: () => void

    private _loadedListener?: (layer: BaseLayer) => void | Promise<void>
    private _updatedListener?: (layer: BaseLayer) => void | Promise<void>
    private _availableRenderers: LayerRendererDictionary
    private _defaultRenderQueue: RenderQueueItem[]
    private _renderQueue: RenderQueueItem[]
    /** Set to true once all renderer init() promises have resolved. */
    private _renderersReady: boolean = false
    /** Prevents starting more than one requestAnimationFrame render loop at a time. */
    private _loopRunning: boolean = false

    constructor(
        id: string,
        width: number,
        height: number,
        options?: Options,
        loadedListener?: (layer: BaseLayer) => void | Promise<void>,
        updatedListener?: (layer: BaseLayer) => void | Promise<void>
    ) {
        this._id = id

        this._contentBuffer = new OffscreenBuffer(width, height, true)
        this._outputBuffer = new OffscreenBuffer(width, height)

        this._loadedListener = loadedListener
        this._updatedListener = updatedListener
        this._defaultRenderQueue = []
        this._renderQueue = []
        this._availableRenderers = {
            'opacity': new ChangeAlphaRenderer(width, height)
        }

        this._options = new Options({visible: true, groups: ['default'], opacity: 1, renderers: []}).merge(options)

        this._renderNextFrame = function() {}

        const rendererEntries: Array<RendererEntry> = this._options.get('renderers') ?? []

        // Register renderer instances into _availableRenderers
        for (const entry of rendererEntries) {
            if ('instance' in entry) {
                // RendererInstanceEntry: use the pre-created instance as-is
                this._availableRenderers[entry.id] = entry.instance
            } else {
                // RendererClassEntry: instantiate with this layer's dimensions so
                // the renderer's buffers always match the frames it will process
                this._availableRenderers[entry.id] = new entry.rendererClass(width, height, entry.params)
            }
        }

        // Collect renderer ids alongside their init promises so we can identify
        // which ones failed if allSettled reports a rejection.
        const rendererIds = Object.keys(this._availableRenderers)
        const rendererPromises = rendererIds.map(rid => this._availableRenderers[rid].init())

        // Use allSettled so a single renderer failure (e.g. the built-in opacity
        // renderer losing a GPU resource race) does not prevent the user-defined
        // renderers from being queued.
        Promise.allSettled(rendererPromises).then(results => {

            // Log any individual failures and remove those renderers so they are
            // not added to the queue in a broken state.
            results.forEach((result, i) => {
                if (result.status === 'rejected') {
                    console.error(`Layer[${id}] : Renderer "${rendererIds[i]}" init failed`, result.reason)
                    delete this._availableRenderers[rendererIds[i]]
                }
            })

            console.log(`Layer[${id}] : Renderers init done`)

            // Build default render queue for successfully initialised renderers
            for (const entry of rendererEntries) {
                if (entry.active !== false && this._availableRenderers[entry.id]) {
                    this._defaultRenderQueue.push({
                        id: entry.id,
                        instance: this._availableRenderers[entry.id],
                        active: true
                    })
                }
            }

            this._renderersReady = true

            // If _layerLoaded already fired (the 1ms setTimeout beat init), kick off
            // the render loop and fire the deferred loaded listener.
            if (this.isLoaded()) {
                if (this.isVisible() && this.haveRenderer()) {
                    this._renderNextFrame = this._requestAnimationFrame
                    this._requestAnimationFrame()
                }
                this._fireLoadedListener()
            }
        })
    }

    /**
     * Add a renderer to this layer. It's constructed with the layer's own width/height,
     * so callers pass only the class and its config - never dimensions.
     *
     * @example
     *   const shaky = await layer.addRenderer('shaky', ShakyRenderer, { mode: 'decay' })
     *   shaky.triggerShake()
     *
     * @param id             unique id for this renderer within the layer
     * @param rendererClass  the renderer class (not an instance)
     * @param params         optional config forwarded to the renderer constructor
     * @param active         if true (default) the renderer is added to the render queue
     * @returns the constructed, initialised renderer instance
     */
    async addRenderer<T extends LayerRenderer, P = unknown>(
        id: string,
        rendererClass: new (width: number, height: number, params?: P) => T,
        params?: P,
        active: boolean = true
    ): Promise<T> {
        if (this._availableRenderers[id]) {
            throw new Error(`Renderer with id "${id}" already exists in the list of available renderers`)
        }

        // Build with THIS layer's dimensions so the renderer's buffers and shader index
        // math always match the frames it will be handed - this is what lets callers
        // skip passing width/height.
        const renderer = new rendererClass(this.width, this.height, params)
        this._availableRenderers[id] = renderer

        // Renderers set up their GPU device asynchronously and no-op until init()
        // resolves, so wire into the queue only once it can actually run.
        try {
            await renderer.init()
        } catch (err) {
            // Roll back so a failed init doesn't leave a dead renderer registered.
            delete this._availableRenderers[id]
            throw err
        }

        if (active) {
            // Default queue, NOT _renderQueue: _renderFrame rebuilds _renderQueue from
            // _defaultRenderQueue each frame, so a transient push would vanish next tick.
            this._defaultRenderQueue.push({ id, instance: renderer, active: true })
            // The layer may not have been looping if it had no renderers before.
            if (this.isVisible()) {
                this._renderNextFrame = this._requestAnimationFrame
                this._requestAnimationFrame()
            }
        } else {
            // Register in queue as inactive so activateRenderer() can find it
            // at its original insertion position.
            this._defaultRenderQueue.push({ id, instance: renderer, active: false })
        }

        return renderer
    }

    /**
     * Remove a renderer from this layer. If it was in the render queue, it will be removed from there too.
     * @param id Renderer id to remove. If not found, this is a no-op.
     */
    removeRenderer(id: string) {
        if (this._availableRenderers[id]) {
            delete this._availableRenderers[id]
            this._defaultRenderQueue = this._defaultRenderQueue.filter(r => r.id !== id)
            this._renderQueue = this._renderQueue.filter(r => r.id !== id)
        }
    }

    /**
     * Pause a renderer without destroying it. The instance is kept and can be
     * re-enabled with {@link activateRenderer}. Order in the queue is preserved.
     * @param id Renderer id to deactivate. No-op if not found or already inactive.
     */
    deactivateRenderer(id: string) {
        const item = this._defaultRenderQueue.find(r => r.id === id)
        if (item) item.active = false
    }

    /**
     * Re-enable a previously deactivated renderer, restoring it at its original
     * position in the queue. The renderer must have been registered via the
     * constructor `renderers` dict or {@link addRenderer}.
     * @param id Renderer id to activate.
     * @throws if the renderer is not registered on this layer.
     */
    activateRenderer(id: string) {
        if (!this._availableRenderers[id]) {
            throw new Error(`Renderer "${id}" is not registered on layer "${this._id}"`)
        }
        const item = this._defaultRenderQueue.find(r => r.id === id)
        if (item) {
            item.active = true
        } else {
            // Renderer was registered with active:false — append it now
            this._defaultRenderQueue.push({ id, instance: this._availableRenderers[id], active: true })
        }
        if (this.isVisible()) {
            this._renderNextFrame = this._requestAnimationFrame
            this._requestAnimationFrame()
        }
    }

    /**
     * Returns true if the renderer is registered and currently active.
     */
    isRendererActive(id: string): boolean {
        return this._defaultRenderQueue.some(r => r.id === id && r.active)
    }

    /**
     * Request rendering of layer frame
     */
    private _requestAnimationFrame() {
        if (this._loopRunning) return
        this._loopRunning = true
        requestAnimationFrame(this._renderFrame.bind(this))
    }

    /**
     * Start rendering process
     */
    private _renderFrame() {
        this._loopRunning = false

        // Clone only active renderers into the working queue for this frame
        this._renderQueue = this._defaultRenderQueue.filter(r => r.active)

        // If opacity is below 1 add opacity renderer as the last in the queue
        if (this._options.get('opacity') < 1) {
            this._renderQueue.push({
                id : 'opacity',
                instance : this._availableRenderers['opacity'],
                params: { opacity: parseFloat(this._options.get('opacity')) },
                active: true
            })
        }

        // Get initial data from layer content
        const frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height)

        // start renderers queue processing
        this._processRenderQueue(frameImageData)
    }

    /**
     * Process image data provided through current renderer in queue and call it self recursively until no more renderer in queue
     * @param {ImageData} frameImageData 
     * @returns {ImageData} result data of the renderer
     */
    private _processRenderQueue(frameImageData: ImageData) {

        // if there is a renderer in the queue then run render pass with this renderer
        if (this._renderQueue.length) {
            const renderer = this._renderQueue.shift() // pop renderer from render queue

            // Apply 'filter' to provided content with current renderer then process next renderer in queue
            renderer?.instance.renderFrame(frameImageData, renderer.params).then((outputData: ImageData) => {
                this._processRenderQueue(outputData)
            }).catch(err => {
                console.error(`Layer[${this._id}] : Renderer "${renderer?.id}" failed`, err)
                // Restart loop so a single GPU error doesn't permanently stop rendering
                this._requestAnimationFrame()
            })
        // no more renderer in queue then draw final image and start queue process again	
        } else {

            // Erase current output buffer content
            this._outputBuffer.clear()

            // Put final frame data into output buffer and start process again (if needed)
            createImageBitmap(frameImageData).then(bitmap => {
                // Background behind content
                const bgColor: string | undefined = this._options.get('backgroundColor')
                if (bgColor) {
                    const bgOpacity: number = this._options.get('backgroundOpacity') ?? 1
                    this._outputBuffer.context.globalAlpha = bgOpacity
                    this._outputBuffer.context.fillStyle = bgColor
                    this._outputBuffer.context.fillRect(0, 0, this._outputBuffer.width, this._outputBuffer.height)
                    this._outputBuffer.context.globalAlpha = 1
                }
                // Put final layer data in the output buffer
                this._outputBuffer.context.drawImage(bitmap, 0, 0)
                bitmap.close()
                // Border over content
                const borderColor: string | undefined = this._options.get('borderColor')
                const borderWidth: number = this._options.get('borderWidth') ?? 0
                if (borderColor && borderWidth > 0) {
                    this._outputBuffer.context.strokeStyle = borderColor
                    this._outputBuffer.context.lineWidth = borderWidth
                    this._outputBuffer.context.strokeRect(borderWidth / 2, borderWidth / 2, this._outputBuffer.width - borderWidth, this._outputBuffer.height - borderWidth)
                }
                // request next frame rendering
                this._renderNextFrame()
            })
        }
    }

    /**
     * Layer is loaded : Start rendering and call the callback if needed
     * @param {boolean} startRenderingLoop 
     */
    protected _layerLoaded(startRenderingLoop: boolean = false) {

        this._loaded = true

        console.log(`Layer [${this._id}] : Loaded`)

        // If no renderer in the queue then just render the frame data once
        if (this._defaultRenderQueue.length === 0 && this._options.get('opacity') === 1) {
            // Put content data in output buffer
            const frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height)

            this._outputBuffer.clear()
            createImageBitmap(frameImageData).then(bitmap => {
                const bgColor: string | undefined = this._options.get('backgroundColor')
                if (bgColor) {
                    const bgOpacity: number = this._options.get('backgroundOpacity') ?? 1
                    this._outputBuffer.context.globalAlpha = bgOpacity
                    this._outputBuffer.context.fillStyle = bgColor
                    this._outputBuffer.context.fillRect(0, 0, this._outputBuffer.width, this._outputBuffer.height)
                    this._outputBuffer.context.globalAlpha = 1
                }
                this._outputBuffer.context.drawImage(bitmap, 0, 0)
                bitmap.close()
                const borderColor: string | undefined = this._options.get('borderColor')
                const borderWidth: number = this._options.get('borderWidth') ?? 0
                if (borderColor && borderWidth > 0) {
                    this._outputBuffer.context.strokeStyle = borderColor
                    this._outputBuffer.context.lineWidth = borderWidth
                    this._outputBuffer.context.strokeRect(borderWidth / 2, borderWidth / 2, this._outputBuffer.width - borderWidth, this._outputBuffer.height - borderWidth)
                }
            })
        }

        // start rendering visible layers which have renderers
		if (this.isVisible() && (this.haveRenderer() || !!startRenderingLoop)) {
			this._renderNextFrame = this._requestAnimationFrame
			this._requestAnimationFrame()
		}

        // Fire the loaded callback only once renderers are also ready.
        // If renderer init hasn't resolved yet, the callback is deferred to
        // Promise.all.then() via _fireLoadedListener().
        if (this._renderersReady) {
            this._fireLoadedListener()
        }
    }

    /**
     * Fires the loaded listener exactly once, after both content and all renderer
     * init() calls are complete. Called from _layerLoaded (if renderers are already
     * ready) or from the Promise.all.then() callback (if _layerLoaded fired first).
     */
    private _fireLoadedListener() {
        if (typeof this._loadedListener === 'function') {
            this._loadedListener(this)
        }
    }

    /**
     * Enable/Disable antialiasing
     * TODO : Fix not working as expected
     * @param {boolean} enabled 
     */
    protected _setAntialiasing(enabled: boolean) {
        this._outputBuffer.context.imageSmoothingEnabled = enabled
    }
    
    /**
     * Return requested renderer instance
     * @param {string} id 
     * @returns object
     */
    protected _getRendererInstance(id: string) {
        if (typeof this._availableRenderers[id] !== 'undefined') {
            return  this._availableRenderers[id]
        } else {
            throw new Error("This renderer is not available")
        }
    }
    
    protected _logDebug(msg: string) {
        console.log(`Layer[${this.id}] : ` + msg)
    }

    protected _logWarning(msg: string) {
        console.warn(`Layer[${this.id}] : ` + msg)
    }

    protected _logError(msg: string) {
        console.error(`Layer[${this.id}] : ` + msg)
    }
    

    /**
     * Layer was updated
     */
    protected _layerUpdated() {

        console.log(`Layer [${this._id}] : Updated => ${this.haveRenderer()}`)

        // Re-render frame if needed
        if (!this.haveRenderer()) {
            this._renderFrame()
        }

        // Callback parent if available
        if (typeof this._updatedListener === 'function') {
            this._updatedListener(this)
        }
    }

    /**
     * Stop rendering of the layer
     */
    protected _stopRendering() {
        this._renderNextFrame = function() {console.log(`Layer [${this._id}] : Rendering stopped`)}
    }

    /**
     * Start rendering of the layer
     */
    protected _startRendering() {
        console.log(`Layer [${this._id}] : Start rendering`)

        this._renderNextFrame = this._requestAnimationFrame
        this._requestAnimationFrame()
    }

    /**
     * Return if the layer have renderer in the queue
     * @returns boolean
     */
    /** Set the background fill color for this layer and trigger a redraw. Pass `undefined` to clear. */
    setBackgroundColor(color: string | undefined) {
        this._options.set('backgroundColor', color)
        if (this.isVisible() && !this.haveRenderer()) this._renderFrame()
    }
    get backgroundColor(): string | undefined { return this._options.get('backgroundColor') }

    /** Set the background fill opacity (0–1) and trigger a redraw. */
    setBackgroundOpacity(opacity: number) {
        this._options.set('backgroundOpacity', Math.max(0, Math.min(1, opacity)))
        if (this.isVisible() && !this.haveRenderer()) this._renderFrame()
    }
    get backgroundOpacity(): number { return this._options.get('backgroundOpacity') ?? 1 }

    /** Set the border stroke color and trigger a redraw. */
    setBorderColor(color: string) {
        this._options.set('borderColor', color)
        if (this.isVisible() && !this.haveRenderer()) this._renderFrame()
    }
    get borderColor(): string | undefined { return this._options.get('borderColor') }

    /** Set the border stroke width in pixels and trigger a redraw. */
    setBorderWidth(width: number) {
        this._options.set('borderWidth', width)
        if (this.isVisible() && !this.haveRenderer()) this._renderFrame()
    }
    get borderWidth(): number { return this._options.get('borderWidth') ?? 0 }

    haveRenderer() {
        return this._defaultRenderQueue.some(r => r.active)
    }

    setVisibility(isVisible: boolean) {
        if (isVisible === this.isVisible()) {
            return
        }

        this._options.set('visible', isVisible) 

        // If layer become visible and have renderers then start the rendering loop
        if (isVisible && this.haveRenderer()) {
            this._renderNextFrame = this._requestAnimationFrame
            this._requestAnimationFrame()
        // Otherwise stop the rendering loop
        } else {
            this._renderNextFrame = function() { console.log(`Layer [${this._id}] : Stop rendering`) }
        }
    }

    /* Toggle layer visibility and return the new state
    * @returns boolean
    */
    toggleVisibility() {
        const v = this._options.get('visible')
        this.setVisibility(!v)
        return !v
    }

    /**
     * Set the layer opacity.
     * @param {number} opacity value between 0 (transparent) and 1 (opaque)
     */
    setOpacity(opacity: number) {
        const o = Math.max(0, Math.min(opacity, 1))
        this._options.set('opacity', o)

        // Layers that already run a continuous render loop (those with renderers)
        // pick up the new opacity on their next frame. Otherwise render a single
        // frame now so the change is applied immediately.
        if (this.isVisible() && !this.haveRenderer()) {
            this._renderFrame()
        }
    }

    /**
     * Current layer opacity (0 to 1)
     */
    get opacity(): number {
        return this._options.get('opacity')
    }

    /**
     * Animate layer opacity from its current value to 1 (fully opaque).
     * @param {number} duration fade duration in ms
     * @param {EasingFunction} easing easing function (defaults to easeOutSine)
     * @returns {Promise<void>} resolves when the fade completes
     */
    fadeIn(duration: number, easing: EasingFunction = Easing.easeOutSine): Promise<void> {
        const start = window.performance.now()
        const startOpacity = this.opacity

        return new Promise(resolve => {
            const step = () => {
                const delta = window.performance.now() - start
                const o = easing(delta, startOpacity, 1 - startOpacity, duration)
                this.setOpacity(o)

                if (this.opacity >= 1 || delta > duration) {
                    this.setOpacity(1)
                    resolve()
                } else {
                    requestAnimationFrame(step)
                }
            }
            step()
        })
    }

    /**
     * Animate layer opacity from its current value to 0 (fully transparent).
     * @param {number} duration fade duration in ms
     * @param {EasingFunction} easing easing function (defaults to easeOutSine)
     * @returns {Promise<void>} resolves when the fade completes
     */
    fadeOut(duration: number, easing: EasingFunction = Easing.easeOutSine): Promise<void> {
        const start = window.performance.now()
        const startOpacity = this.opacity

        return new Promise(resolve => {
            const step = () => {
                const delta = window.performance.now() - start
                const o = startOpacity - easing(delta, 0, startOpacity, duration)
                this.setOpacity(o)

                if (this.opacity <= 0 || delta > duration) {
                    this.setOpacity(0)
                    resolve()
                } else {
                    requestAnimationFrame(step)
                }
            }
            step()
        })
    }


    isVisible(): boolean {
        return this._options.get('visible')
    }

    isLoaded(): boolean {
        return this._loaded
    }

    destroy() {
        this._renderNextFrame = function() { console.log(`Destroying layer : ${this._id}`) }
    }

    get id(): string {
        return this._id
    }

    /**
     * Get layer width
     */
    get width(): number {
        return this._outputBuffer.width
    }

    /**
     * Get layer height
     */
    get height(): number {
        return this._outputBuffer.height
    }

    /**
     * Get output canvas
     */
    get canvas(): HTMLCanvasElement {
        return this._outputBuffer.canvas
    }

    get groups(): string[] {
        return this._options.get('groups') || ['default']
    }

    get options(): Options {
        return this._options
    }

}

export { BaseLayer }