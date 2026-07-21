import { LayerRenderer } from '../renderers/layer-renderer'

export interface LayerRendererDictionary {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [index: string]: LayerRenderer<any>
}

/**
 * Renderer entry that provides a pre-created instance.
 */
export interface RendererInstanceEntry {
    /** Unique identifier for this renderer within the layer. */
    id: string
    /** The renderer instance to register. */
    instance: LayerRenderer
    /** Whether the renderer is initially active in the render queue. Default: `true`. */
    active?: boolean
}

/**
 * Renderer entry that provides a class to be instantiated by the layer.
 * The layer passes its own `width` and `height` to the constructor, so
 * the renderer's buffers always match the frame it will process.
 *
 * Prefer the {@link rendererEntry} helper over a raw object literal — it infers
 * `P` from the class so the compiler can catch excess / wrong-type params.
 */
export interface RendererClassEntry<P = unknown> {
    /** Unique identifier for this renderer within the layer. */
    id: string
    /** The renderer class to instantiate. */
    rendererClass: new (width: number, height: number, params?: P) => LayerRenderer
    /** Optional params forwarded to the renderer constructor. */
    params?: P
    /** Whether the renderer is initially active in the render queue. Default: `true`. */
    active?: boolean
}

/**
 * Describes a renderer to register (and optionally activate) on a layer
 * via `options.renderers`. Either provide a pre-created instance
 * ({@link RendererInstanceEntry}) or a class to be instantiated by the layer
 * ({@link RendererClassEntry}).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RendererEntry = RendererInstanceEntry | RendererClassEntry<any>

/**
 * Typed helper for building a {@link RendererClassEntry}.
 * TypeScript infers `P` from `rendererClass` so excess or wrong-typed
 * properties in `params` are caught at compile time — the same way
 * {@link BaseLayer.addRenderer} works.
 *
 * @example
 * renderers: [
 *   rendererEntry('chroma', ChromaKeyRenderer, { color: [0, 0, 0], threshold: 9 })
 * ]
 */
export function rendererEntry<P>(
    id: string,
    rendererClass: new (width: number, height: number, params?: P) => LayerRenderer,
    params?: P,
    active?: boolean,
): RendererClassEntry<P> {
    return { id, rendererClass, params, active }
}
