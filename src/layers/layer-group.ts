import {Options} from "../utils"
import {Layer, LayerGroupOptions, LayerPosition, AnimationLayerOptions, CanvasLayerOptions, SpritesLayerOptions, TextLayerOptions, VideoLayerOptions} from "../interfaces"
import {BaseLayer, LayerLifecycleListeners} from "./base-layer"
import {AnimationLayer} from "./animation-layer"
import {CanvasLayer} from "./canvas-layer"
import {SpritesLayer} from "./sprites-layer"
import {TextLayer} from "./text-layer"
import {VideoLayer} from "./video-layer"
import {compositeSortedLayers, createLayerInstance, resolveLayerPosition, type LayerDictionary} from "./layer-factory"

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

type LayerListenersByInstance<T extends BaseLayer> =
    LayerLifecycleListeners<T> &
    (T extends VideoLayer ? {
        play?: (layer: VideoLayer) => void | Array<(layer: VideoLayer) => void>
        pause?: (layer: VideoLayer) => void | Array<(layer: VideoLayer) => void>
        stop?: (layer: VideoLayer) => void | Array<(layer: VideoLayer) => void>
    } : unknown) &
    (T extends AnimationLayer ? {
        play?: (layer: AnimationLayer) => void | Array<(layer: AnimationLayer) => void>
        pause?: (layer: AnimationLayer) => void | Array<(layer: AnimationLayer) => void>
        stop?: (layer: AnimationLayer) => void | Array<(layer: AnimationLayer) => void>
    } : unknown)

/**
 * A "virtual" layer that cannot draw content itself. It can be dimensioned, positioned,
 * given renderers, a background color/opacity, and shown/hidden exactly like any other
 * layer, but its content is entirely derived from compositing its children (which may
 * include nested LayerGroups) in zIndex order.
 */
class LayerGroup extends BaseLayer {

    private _children: LayerDictionary = {}
    private _sortedChildren: Layer[] = []
    private _childZIndex: number = 1
    /** Remembers each child's own visibility while the group itself is hidden, so it can be restored on show. */
    private _childVisibilityMemory: Map<string, boolean> = new Map()
    private _recompositeScheduled: boolean = false
    private _destroyed: boolean = false

    constructor(
        id: string,
        width: number,
        height: number,
        options?: Partial<LayerGroupOptions> | Options,
        listeners?: LayerLifecycleListeners<LayerGroup>
    ) {
        super(id, width, height, new Options(options as Record<string, unknown>), listeners as unknown as LayerLifecycleListeners<BaseLayer>)
        // Pass startRenderingLoop:true - a group can't tell whether its children are static
        // (CanvasLayer/TextLayer, which explicitly call _layerUpdated() on every redraw) or
        // continuously self-updating (VideoLayer/AnimationLayer/SpritesLayer, which refresh
        // their own canvas every tick via a private internal loop WITHOUT ever calling
        // _layerUpdated() again after their initial load). Without an unconditional
        // continuous loop of its own, a group containing one of the latter would recomposite
        // exactly once and then freeze. This matches how Dmd's own top-level compositing
        // loop already behaves - it always polls every child's canvas every frame,
        // regardless of whether that child's content is static or continuously changing.
        setTimeout(() => this._layerLoaded(true), 1)
    }

    /**
     * Recomposite every visible+loaded child into _contentBuffer. Called by BaseLayer right
     * before _contentBuffer is read for a render pass, whether that's driven by this
     * group's own continuous renderer loop or by an on-demand _layerUpdated() poke.
     */
    protected _prepareFrame(): void {
        this._contentBuffer.clear()
        compositeSortedLayers(this._sortedChildren, this._children, this._contentBuffer)
    }

    private _sortChildren() {
        this._sortedChildren = this._sortedChildren.sort((a, b) => a.zIndex - b.zIndex)
    }

    /**
     * Batches child-update notifications within the same tick into a single recomposite,
     * so N children settling at once (e.g. on initial load) doesn't trigger N full
     * recomposites. Continuously-updating children (e.g. a video) still recomposite every
     * tick, since each animation frame is its own separate task.
     */
    private _scheduleRecomposite() {
        if (this._destroyed || this._recompositeScheduled) return
        this._recompositeScheduled = true
        queueMicrotask(() => {
            this._recompositeScheduled = false
            if (!this._destroyed) this._layerUpdated()
        })
    }

    /**
     * Add a nested {@link LayerGroup} as a child of this group. The dedicated entry point
     * for groups - see {@link Dmd.addLayerGroup} for why groups take no listeners.
     * @param {string} id
     * @param options group options (dimensions, position, background, renderers, ...)
     */
    addLayerGroup(id: string, options?: Partial<LayerGroupOptions> | Options): LayerGroup {
        return this._addChildLayer(LayerGroup, id, options as LayerOptionsByInstance<LayerGroup>)
    }

    /**
     * @deprecated Adding a LayerGroup through addLayer is deprecated and will be removed
     * in the next major version - use {@link addLayerGroup} instead.
     */
    addLayer(
        layerClass: typeof LayerGroup,
        id: string,
        options?: Partial<LayerGroupOptions> | Options,
        listeners?: LayerListenersByInstance<LayerGroup>,
    ): LayerGroup
    /**
     * Add a child layer to this group. Mirrors {@link Dmd.addLayer} — same factory, same
     * position-resolution logic, but relative to this group's own width/height rather than
     * the Dmd's.
     */
    addLayer<T extends BaseLayer>(
        layerClass: new (...args: never[]) => T,
        id: string,
        options?: LayerOptionsByInstance<T>,
        listeners?: LayerListenersByInstance<T>,
    ): T
    addLayer<T extends BaseLayer>(
        layerClass: new (...args: never[]) => T,
        id: string,
        options?: LayerOptionsByInstance<T>,
        listeners?: LayerListenersByInstance<T>,
    ): T {
        if ((layerClass as unknown) === LayerGroup) {
            console.warn(`LayerGroup[${this.id}].addLayer(LayerGroup, '${id}', ...) is deprecated and will be removed in the next major version - use addLayerGroup('${id}', options) instead`)
        }
        return this._addChildLayer(layerClass, id, options, listeners)
    }

    private _addChildLayer<T extends BaseLayer>(
        layerClass: new (...args: never[]) => T,
        id: string,
        options?: LayerOptionsByInstance<T>,
        listeners?: LayerListenersByInstance<T>,
    ): T {
        if (typeof this._children[id] !== 'undefined') {
            throw new Error(`Layer [${id}] already exists`)
        }

        const opts = new Options((options ?? {}) as Record<string, unknown>)

        const layerWidth = opts.get('width') || this.width
        const layerHeight = opts.get('height') || this.height

        const pos: LayerPosition = opts.get('position') || {}
        const {top: layerTop, left: layerLeft} = resolveLayerPosition(id, pos, layerWidth, layerHeight, this.width, this.height, this._sortedChildren, this._children)

        const lifecycle = listeners as unknown as LayerLifecycleListeners<BaseLayer> | undefined
        const media = listeners as unknown as {
            play?: ((layer: BaseLayer) => void) | Array<(layer: BaseLayer) => void>
            pause?: ((layer: BaseLayer) => void) | Array<(layer: BaseLayer) => void>
            stop?: ((layer: BaseLayer) => void) | Array<(layer: BaseLayer) => void>
        } | undefined

        const asArray = <TListener>(value?: TListener | Array<TListener>): Array<TListener> =>
            value === undefined ? [] : (Array.isArray(value) ? value : [value])

        const composeAsync = (value?: ((layer: BaseLayer) => void | Promise<void>) | Array<(layer: BaseLayer) => void | Promise<void>>) => {
            const listenersArray = asArray(value)
            if (listenersArray.length === 0) return undefined
            return async (layer: BaseLayer): Promise<void> => {
                for (const listener of listenersArray) {
                    await listener(layer)
                }
            }
        }

        const composeSync = (value?: ((layer: BaseLayer) => void) | Array<(layer: BaseLayer) => void>) => {
            const listenersArray = asArray(value)
            if (listenersArray.length === 0) return undefined
            return (layer: BaseLayer): void => {
                listenersArray.forEach(listener => listener(layer))
            }
        }

        const layer = createLayerInstance(
            layerClass,
            id,
            layerWidth,
            layerHeight,
            opts,
            composeAsync(lifecycle?.loaded as ((layer: BaseLayer) => void | Promise<void>) | Array<(layer: BaseLayer) => void | Promise<void>> | undefined),
            composeAsync(lifecycle?.updated as ((layer: BaseLayer) => void | Promise<void>) | Array<(layer: BaseLayer) => void | Promise<void>> | undefined),
            composeSync(media?.play),
            composeSync(media?.pause),
            composeSync(media?.stop)
        )
        // Register recomposite hooks as separate listeners so no wrapper closures are needed.
        layer.on('loaded', () => this._scheduleRecomposite())
        layer.on('updated', () => this._scheduleRecomposite())

        // If the group is currently hidden, a newly added child must start hidden too, so
        // it doesn't render/decode for a frame before the visibility cascade catches it.
        if (!this.isVisible()) {
            this._childVisibilityMemory.set(id, layer.isVisible())
            layer.setVisibility(false)
        }

        this._children[id] = layer as BaseLayer

        let zIndex = this._childZIndex

        if (opts.has('zIndex')) {
            zIndex = opts.get('zIndex')
        } else {
            this._childZIndex++
        }

        this._sortedChildren.push({id, zIndex, top: layerTop, left: layerLeft})
        this._sortChildren()

        return layer as unknown as T
    }

    /**
     * Remove a child layer from this group.
     * @param {string} id
     */
    removeLayer(id: string) {
        if (typeof this._children[id] !== 'undefined') {
            this._children[id].destroy()
            delete this._children[id]
            this._sortedChildren = this._sortedChildren.filter(l => l.id !== id)
            this._childVisibilityMemory.delete(id)
            this._scheduleRecomposite()
        }
    }

    /**
     * Move a child layer to a new position in this group's rendering order.
     * @param {string} id child layer id to move
     * @param {number} toIndex target index (0 = bottom)
     */
    moveLayer(id: string, toIndex: number) {
        const fromIndex = this._sortedChildren.findIndex(l => l.id === id)
        if (fromIndex === -1) return
        const [moved] = this._sortedChildren.splice(fromIndex, 1)
        this._sortedChildren.splice(toIndex, 0, moved)
        this._sortedChildren.forEach((l, i) => { l.zIndex = i })
        this._scheduleRecomposite()
    }

    /**
     * Get a child layer by id.
     * @param {string} id
     */
    getLayer(id: string): BaseLayer | null {
        return typeof this._children[id] !== 'undefined' ? this._children[id] : null
    }

    /**
     * Show/hide this group. Cascades to every child (recursing into nested groups via
     * their own override): hiding remembers each child's current visibility then forces
     * it off; showing restores each child's remembered visibility.
     */
    setVisibility(isVisible: boolean) {
        const wasVisible = this.isVisible()
        super.setVisibility(isVisible)

        if (isVisible === wasVisible) return

        if (!isVisible) {
            Object.values(this._children).forEach(child => {
                this._childVisibilityMemory.set(child.id, child.isVisible())
                child.setVisibility(false)
            })
            // super.setVisibility() only stops the loop when !haveRenderer(), which is the
            // common case for a group - stop explicitly so hiding a renderer-less group
            // actually halts its continuous recomposite loop too.
            this._stopRendering()
        } else {
            Object.values(this._children).forEach(child => {
                const restore = this._childVisibilityMemory.get(child.id) ?? true
                child.setVisibility(restore)
            })
            this._childVisibilityMemory.clear()
            // Mirror the constructor's startRenderingLoop:true - always resume the
            // continuous recompositing loop on show, regardless of haveRenderer().
            this._startRendering()
        }
    }

    /**
     * Destroy this group and cascade destroy() to every child (recursing into nested groups).
     */
    destroy() {
        this._destroyed = true
        Object.values(this._children).forEach(child => child.destroy())
        super.destroy()
    }
}

export {LayerGroup}
