import {Options, type OffscreenBuffer} from "../utils"
import type {Layer, LayerPosition} from "../interfaces"
import {BaseLayer} from "./base-layer"
import {AnimationLayer} from "./animation-layer"
import {CanvasLayer} from "./canvas-layer"
import {SpritesLayer} from "./sprites-layer"
import {TextLayer} from "./text-layer"
import {VideoLayer} from "./video-layer"
import {LayerGroup} from "./layer-group"

/**
 * id -> layer instance map. Shared shape between {@link Dmd} and {@link LayerGroup},
 * both of which own a flat set of direct children.
 */
export interface LayerDictionary {
    [index: string]: BaseLayer
}

const H_CONSTRAINT_KEYS = ['leftToLeftOf', 'leftToRightOf', 'leftToCenterOf', 'rightToLeftOf', 'rightToRightOf', 'rightToCenterOf'] as const
const V_CONSTRAINT_KEYS = ['topToTopOf', 'topToBottomOf', 'topToCenterOf', 'bottomToTopOf', 'bottomToBottomOf', 'bottomToCenterOf'] as const

interface TargetBox {
    left: number
    top: number
    width: number
    height: number
}

/**
 * Resolve a `*To*Of` field's target reference ('parent', or a sibling id) to its box.
 * Falls back to the container's own box (i.e. 'parent') with a console warning if the
 * referenced id isn't found among the already-added siblings in `sortedLayers`/`layers`.
 */
function resolveTargetBox(
    id: string,
    targetRef: string,
    containerWidth: number,
    containerHeight: number,
    sortedLayers: Layer[],
    layers: LayerDictionary
): TargetBox {
    const parentBox: TargetBox = {left: 0, top: 0, width: containerWidth, height: containerHeight}

    if (targetRef === 'parent') {
        return parentBox
    }

    const record = sortedLayers.find(l => l.id === targetRef)
    const sibling = layers[targetRef]

    if (record && sibling) {
        return {left: record.left, top: record.top, width: sibling.width, height: sibling.height}
    }

    console.warn(`Layer[${id}] : alignment target "${targetRef}" does not exist - falling back to 'parent'`)
    return parentBox
}

/**
 * Resolve a layer's absolute top/left within its container from a {@link LayerPosition}.
 * Pure function extracted from Dmd's original inline alignment math so it can be reused
 * by any container (Dmd itself, or a LayerGroup positioning its own children).
 *
 * `hAlign`/`vAlign` of `'constraint'` aligns against a sibling (or `'parent'`, the
 * container itself) instead of the container, via the position's `*To*Of` fields - see
 * {@link LayerPosition}. `sortedLayers`/`layers` are the container's own existing direct
 * children (the same two collections {@link compositeSortedLayers} takes), used to look up
 * a referenced sibling's recorded position and live dimensions.
 *
 * @param id id of the layer being positioned (only used in the "unknown target" warning)
 * @param position container-relative position/alignment options
 * @param layerWidth width of the layer being positioned
 * @param layerHeight height of the layer being positioned
 * @param containerWidth width of the container the layer is being added to
 * @param containerHeight height of the container the layer is being added to
 * @param sortedLayers the container's already-added children, in zIndex order
 * @param layers the container's already-added children, by id
 */
export function resolveLayerPosition(
    id: string,
    position: LayerPosition | undefined,
    layerWidth: number,
    layerHeight: number,
    containerWidth: number,
    containerHeight: number,
    sortedLayers: Layer[],
    layers: LayerDictionary
): { top: number, left: number } {
    const pos = position || {}
    let top = pos.top || 0
    let left = pos.left || 0

    if (typeof pos.hAlign === 'string') {
        switch (pos.hAlign) {
            case "left":
                left = pos.hOffset || 0
                break
            case "center":
                left = (containerWidth - layerWidth) / 2 + (pos.hOffset || 0)
                break
            case "right":
                left = containerWidth - layerWidth + (pos.hOffset || 0)
                break
            case "constraint": {
                const activeKey = H_CONSTRAINT_KEYS.find(k => pos[k] !== undefined)
                if (activeKey) {
                    const target = resolveTargetBox(id, pos[activeKey]!, containerWidth, containerHeight, sortedLayers, layers)
                    switch (activeKey) {
                        case 'leftToLeftOf':
                            left = target.left + (pos.hOffset || 0)
                            break
                        case 'leftToRightOf':
                            left = target.left + target.width + (pos.hOffset || 0)
                            break
                        case 'leftToCenterOf':
                            left = target.left + target.width / 2 + (pos.hOffset || 0)
                            break
                        case 'rightToLeftOf':
                            left = target.left - layerWidth + (pos.hOffset || 0)
                            break
                        case 'rightToRightOf':
                            left = target.left + target.width - layerWidth + (pos.hOffset || 0)
                            break
                        case 'rightToCenterOf':
                            left = target.left + target.width / 2 - layerWidth + (pos.hOffset || 0)
                    }
                }
            }
        }
    }

    if (typeof pos.vAlign === 'string') {
        switch (pos.vAlign) {
            case 'top':
                top = pos.vOffset || 0
                break
            case 'middle':
                top = (containerHeight - layerHeight) / 2 + (pos.vOffset || 0)
                break
            case 'bottom':
                top = containerHeight - layerHeight + (pos.vOffset || 0)
                break
            case 'constraint': {
                const activeKey = V_CONSTRAINT_KEYS.find(k => pos[k] !== undefined)
                if (activeKey) {
                    const target = resolveTargetBox(id, pos[activeKey]!, containerWidth, containerHeight, sortedLayers, layers)
                    switch (activeKey) {
                        case 'topToTopOf':
                            top = target.top + (pos.vOffset || 0)
                            break
                        case 'topToBottomOf':
                            top = target.top + target.height + (pos.vOffset || 0)
                            break
                        case 'topToCenterOf':
                            top = target.top + target.height / 2 + (pos.vOffset || 0)
                            break
                        case 'bottomToTopOf':
                            top = target.top - layerHeight + (pos.vOffset || 0)
                            break
                        case 'bottomToBottomOf':
                            top = target.top + target.height - layerHeight + (pos.vOffset || 0)
                            break
                        case 'bottomToCenterOf':
                            top = target.top + target.height / 2 - layerHeight + (pos.vOffset || 0)
                    }
                }
            }
        }
    }

    return {top, left}
}

/**
 * Construct a concrete {@link BaseLayer} subclass instance. Extracted from Dmd's original
 * inline `cls === XLayer` switch so both Dmd and LayerGroup share the exact same set of
 * supported layer classes (including LayerGroup itself, enabling nested groups).
 */
export function createLayerInstance<T extends BaseLayer>(
    layerClass: new (...args: never[]) => T,
    id: string,
    width: number,
    height: number,
    opts: Options,
    onLoaded?: (layer: BaseLayer) => void | Promise<void>,
    onUpdated?: (layer: BaseLayer) => void | Promise<void>,
    onPlay?: (layer: BaseLayer) => void,
    onPause?: (layer: BaseLayer) => void,
    onStop?: (layer: BaseLayer) => void,
): T {
    const cls = layerClass as unknown
    let layer

    if (cls === CanvasLayer) {
        layer = new CanvasLayer(id, width, height, opts, onLoaded, onUpdated)
    } else if (cls === VideoLayer) {
        layer = new VideoLayer(id, width, height, opts, onLoaded, onUpdated, onPlay, onPause)
    } else if (cls === AnimationLayer) {
        layer = new AnimationLayer(id, width, height, opts, onLoaded, onUpdated, onPlay, onPause, onStop)
    } else if (cls === SpritesLayer) {
        layer = new SpritesLayer(id, width, height, opts, onLoaded, onUpdated)
    } else if (cls === TextLayer) {
        layer = new TextLayer(id, width, height, opts, onLoaded, onUpdated)
    } else if (cls === LayerGroup) {
        layer = new LayerGroup(id, width, height, opts, onLoaded, onUpdated)
    } else {
        throw new TypeError('Unsupported layer class')
    }

    return layer as unknown as T
}

/**
 * Composite every visible+loaded layer in `sortedLayers` (in order — callers are expected
 * to pass a zIndex-sorted array) onto `target`. Extracted from Dmd.renderDMD()'s original
 * inline loop so a LayerGroup can composite its own children into its `_contentBuffer`
 * using the exact same logic Dmd uses to composite its top-level layers.
 */
export function compositeSortedLayers(sortedLayers: Layer[], layers: LayerDictionary, target: OffscreenBuffer): void {
    sortedLayers.forEach(l => {
        const layer = layers[l.id]
        if (layer.isVisible() && layer.isLoaded()) {
            target.context.drawImage(layer.canvas, l.left, l.top)
        }
    })
}
