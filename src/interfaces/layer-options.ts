import type {RendererEntry} from './layer-renderer-dictionary'

/**
 * Positioning of a layer within its container (the Dmd, or a parent LayerGroup).
 */
export interface LayerPosition {
    /** Top position in pixels. Default: `0`. */
    top?: number
    /** Left position in pixels. Default: `0`. */
    left?: number
    /**
     * Horizontal alignment within the container. `'constraint'` opts into aligning against
     * a sibling instead - see the `*To*Of` fields below.
     */
    hAlign?: 'left' | 'center' | 'right' | 'constraint'
    /**
     * Vertical alignment within the container. `'constraint'` opts into aligning against a
     * sibling instead - see the `*To*Of` fields below.
     */
    vAlign?: 'top' | 'middle' | 'bottom' | 'constraint'
    /** Horizontal pixel offset (added after alignment). Default: `0`. */
    hOffset?: number
    /** Vertical pixel offset (added after alignment). Default: `0`. */
    vOffset?: number

    /**
     * Only read when `hAlign` is `'constraint'`. Exactly one of the six `*To*Of` fields
     * below should be set; its value is either a sibling layer's id (a layer already added
     * to the same container - the Dmd, or the same parent LayerGroup) or the literal
     * `'parent'` for the container itself. If the referenced id doesn't exist, falls back
     * to `'parent'` and logs a console warning.
     *
     * My left edge aligns to the target's left edge.
     */
    leftToLeftOf?: string
    /** My left edge aligns to the target's right edge. */
    leftToRightOf?: string
    /** My left edge aligns to the target's horizontal center. */
    leftToCenterOf?: string
    /** My right edge aligns to the target's left edge. */
    rightToLeftOf?: string
    /** My right edge aligns to the target's right edge. */
    rightToRightOf?: string
    /** My right edge aligns to the target's horizontal center. */
    rightToCenterOf?: string

    /**
     * Only read when `vAlign` is `'constraint'`. Exactly one of the six `*To*Of` fields
     * below should be set; same target semantics as the horizontal fields above.
     *
     * My top edge aligns to the target's top edge.
     */
    topToTopOf?: string
    /** My top edge aligns to the target's bottom edge. */
    topToBottomOf?: string
    /** My top edge aligns to the target's vertical center. */
    topToCenterOf?: string
    /** My bottom edge aligns to the target's top edge. */
    bottomToTopOf?: string
    /** My bottom edge aligns to the target's bottom edge. */
    bottomToBottomOf?: string
    /** My bottom edge aligns to the target's vertical center. */
    bottomToCenterOf?: string
}

/**
 * Options accepted by BaseLayer and all its subclasses.
 * Required properties are always initialised with defaults by the layer constructor.
 */
export interface BaseLayerOptions {
    /** Layer canvas width in pixels. Defaults to DMD width. */
    width?: number
    /** Layer canvas height in pixels. Defaults to DMD height. */
    height?: number
    /** Layer position within the DMD frame. */
    position?: LayerPosition
    /** Whether the layer is visible. Default: `true`. */
    visible: boolean
    /** Layer opacity between 0 (transparent) and 1 (opaque). Default: `1`. */
    opacity: number
    /**
     * Renderers to register (and optionally activate) on this layer.
     * Each entry is either a {@link RendererInstanceEntry} (pre-created instance)
     * or a {@link RendererClassEntry} (class instantiated by the layer with the
     * correct dimensions). Set `active: false` to register without activating.
     * Default: `[]`.
     */
    renderers: Array<RendererEntry>
    /** Background fill color drawn behind the layer content. Transparent if omitted. */
    backgroundColor?: string
    /** Background fill opacity 0–1. Default: `1`. */
    backgroundOpacity?: number
    /** Border stroke color drawn around the layer edge. No border if omitted. */
    borderColor?: string
    /** Border stroke width in pixels. Default: `0`. */
    borderWidth?: number
}

/**
 * Options for {@link AnimationLayer}.
 * Required properties are always initialised with defaults by the AnimationLayer constructor.
 */
export interface AnimationLayerOptions extends BaseLayerOptions {
    /** Whether the animation loops. Default: `false`. */
    loop: boolean
    /** Whether the animation starts playing immediately. Default: `false`. */
    autoplay: boolean
    /** Total animation duration in milliseconds. Default: `1000`. */
    duration: number
}

/**
 * Options for {@link VideoLayer}.
 * Required properties are always initialised with defaults by the VideoLayer constructor.
 */
export interface VideoLayerOptions extends BaseLayerOptions {
    /** Whether the video loops. Default: `false`. */
    loop: boolean
    /** Whether the video starts playing immediately. Default: `false`. */
    autoplay: boolean
    /** Pause playback when the layer is hidden. Default: `true`. */
    pauseOnHide: boolean
    /** Stop playback when the layer is hidden (overrides `pauseOnHide`). Default: `false`. */
    stopOnHide: boolean
    /** Video source URL. */
    src?: string
    /** Video element width in pixels (defaults to layer width). */
    videoWidth?: number
    /** Video element height in pixels (defaults to layer height). */
    videoHeight?: number
}

/**
 * Options for {@link CanvasLayer}.
 */
export type CanvasLayerOptions = BaseLayerOptions

/**
 * Options for {@link LayerGroup}. A group cannot draw content itself, so it accepts
 * exactly the same options as any other layer (dimensions, position, visibility, opacity,
 * renderers, background, border) with no additions.
 */
export type LayerGroupOptions = BaseLayerOptions

/**
 * Options for the {@link CanvasLayer.drawBitmap} method.
 * Required properties are initialised with defaults inside `drawBitmap`.
 */
export interface BitmapOptions {
    /** Top position in pixels or as a percentage string (e.g. `'50%'`). Default: `0`. */
    top: number | string
    /** Left position in pixels or as a percentage string (e.g. `'50%'`). Default: `0`. */
    left: number | string
    /** Horizontal pixel offset. Default: `0`. */
    hOffset: number
    /** Vertical pixel offset. Default: `0`. */
    vOffset: number
    /**
     * Fit mode. `'contain'` scales the image to fit within the available area (default).
     * `'cover'` scales to fill the available area, cropping overflow.
     * `'none'` disables scaling and draws at the original bitmap size.
     * Default: `'contain'`.
     */
    fit: 'contain' | 'cover' | 'none'
    /** Preserve the image aspect ratio when fitting. Default: `true`. */
    keepAspectRatio: boolean
    /** Target width in pixels or as a percentage string (used when `fit` is `'none'`). */
    width?: number | string
    /** Target height in pixels or as a percentage string (used when `fit` is `'none'`). */
    height?: number | string
    /** Horizontal alignment. */
    hAlign?: 'left' | 'center' | 'right'
    /** Vertical alignment. */
    vAlign?: 'top' | 'middle' | 'bottom'
    /** Margin on all sides in pixels or as a percentage string. Default: `0`. */
    margin?: number | string
    /** Top margin, overrides `margin`. */
    marginTop?: number | string
    /** Right/end margin, overrides `margin`. */
    marginEnd?: number | string
    /** Bottom margin, overrides `margin`. */
    marginBottom?: number | string
    /** Left/start margin, overrides `margin`. */
    marginStart?: number | string
}

/**
 * Options for {@link TextLayer}.
 * Required properties are always initialised with defaults by the TextLayer constructor.
 */
export interface TextLayerOptions extends BaseLayerOptions {
    /** Top position in pixels or as a percentage string (e.g. `'50%'`). Default: `0`. */
    top: number | string
    /** Left position in pixels or as a percentage string (e.g. `'50%'`). Default: `0`. */
    left: number | string
    /** Text fill colour. Default: `Colors.White`. */
    color: string
    /** Font size value. Default: `'10'`. */
    fontSize: string | number
    /** Font size unit (e.g. `'%'`, `'px'`). Default: `'%'`. */
    fontUnit: string
    /** Font family name. Default: `'Arial'`. */
    fontFamily: string
    /** Font style (e.g. `'normal'`, `'italic'`). Default: `'normal'`. */
    fontStyle: string
    /** Canvas text baseline. Default: `'top'`. */
    textBaseline: CanvasTextBaseline
    /** Horizontal pixel offset. Default: `0`. */
    hOffset: number
    /** Vertical pixel offset. Default: `0`. */
    vOffset: number
    /** Stroke width in pixels. Default: `0`. */
    strokeWidth: number
    /** Stroke colour. Default: `Colors.Black`. */
    strokeColor: string
    /** Shrink font until text fits the layer width. Default: `false`. */
    adjustWidth: boolean
    /**
     * Controls how the adjustWidth-computed size can change across setText() calls:
     * - `'both'`: recompute freely each time - size can grow or shrink between calls.
     * - `'shrink'`: size only ever shrinks across calls - a later, narrower text won't
     *   grow it back above a previous, wider text's shrunk size.
     * - `'expand'`: size only ever grows across calls - a later, wider text won't shrink
     *   it below a previous size (may overflow instead).
     * Default: `'both'`.
     */
    adjustDirection?: 'shrink' | 'expand' | 'both'
    /** Outline width in pixels. Default: `0`. */
    outlineWidth: number
    /** Outline colour. Default: `Colors.Black`. */
    outlineColor: string
    /** Enable sub-pixel antialiasing. Default: `true`. */
    antialiasing: boolean
    /** Text content. */
    text?: string
    /** Horizontal alignment. */
    hAlign?: 'left' | 'center' | 'right'
    /** Vertical alignment. */
    vAlign?: 'top' | 'middle' | 'bottom'
}

/**
 * Options for {@link SpritesLayer}.
 * Required properties are always initialised with defaults by the SpritesLayer constructor.
 */
export interface SpritesLayerOptions extends BaseLayerOptions {
    /** Whether sprite animations loop. Default: `false`. */
    loop: boolean
    /** Whether playback starts immediately. Default: `false`. */
    autoplay: boolean
}
