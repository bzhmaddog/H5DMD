import type {RendererEntry} from './layer-renderer-dictionary'

/**
 * Horizontal alignment, shared by every option object that aligns something horizontally:
 * a layer in its container ({@link LayerPosition}), text in a TextLayer
 * ({@link TextLayerOptions}), and a bitmap in a CanvasLayer ({@link DrawBitmapOptions}).
 *
 * `'start'`/`'end'` are the preferred spellings; `'left'`/`'right'` are exact aliases kept
 * so existing code keeps working, and are treated identically everywhere (this library lays
 * out left-to-right only - `'start'` never means "right" the way CSS/canvas would in RTL).
 */
export type HAlign = 'start' | 'center' | 'end' | 'left' | 'right'

/**
 * Vertical alignment - the counterpart of {@link HAlign}. `'start'`/`'center'`/`'end'` are the
 * preferred spellings, with `'top'`/`'middle'`/`'bottom'` kept as exact aliases. Using
 * `'center'` on both axes means the two no longer disagree on what the midpoint is called.
 */
export type VAlign = 'start' | 'center' | 'end' | 'top' | 'middle' | 'bottom'

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
    hAlign?: HAlign | 'constraint'
    /**
     * Vertical alignment within the container. `'constraint'` opts into aligning against a
     * sibling instead - see the `*To*Of` fields below.
     */
    vAlign?: VAlign | 'constraint'
    /** Horizontal pixel offset (added after alignment). Default: `0`. */
    hOffset?: number
    /** Vertical pixel offset (added after alignment). Default: `0`. */
    vOffset?: number

    /**
     * Only read when `hAlign` is `'constraint'`. Exactly one of the nine `*To*Of` fields
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
    /** My horizontal center aligns to the target's left edge. */
    hCenterToLeftOf?: string
    /** My horizontal center aligns to the target's horizontal center. */
    hCenterToCenterOf?: string
    /** My horizontal center aligns to the target's right edge. */
    hCenterToRightOf?: string

    /**
     * Only read when `vAlign` is `'constraint'`. Exactly one of the nine `*To*Of` fields
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
    /** My vertical center aligns to the target's top edge. */
    vCenterToTopOf?: string
    /** My vertical center aligns to the target's vertical center. */
    vCenterToCenterOf?: string
    /** My vertical center aligns to the target's bottom edge. */
    vCenterToBottomOf?: string
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
    /**
     * Resampling used when the bitmap is scaled.
     *
     * Defaults to `false` (nearest-neighbour) because every pixel of a layer becomes one
     * *dot* on the DMD: a smoothed downscale turns edges into intermediate values, which
     * the dot grid renders as washed-out half-lit dots. Nearest-neighbour keeps each dot
     * decisively on or off, which is what reads as "sharp" on a dot display.
     *
     * Pass `true` (or an explicit `'low' | 'medium' | 'high'` quality) to get the browser's
     * smoothed resampling instead — occasionally what you want for a photographic image on
     * a high-resolution DMD, where there are enough dots for the gradients to pay off.
     *
     * Default: `false`.
     */
    smoothing: boolean | 'low' | 'medium' | 'high'
    /** Target width in pixels or as a percentage string (used when `fit` is `'none'`). */
    width?: number | string
    /** Target height in pixels or as a percentage string (used when `fit` is `'none'`). */
    height?: number | string
    /** Horizontal alignment. */
    hAlign?: HAlign
    /** Vertical alignment. */
    vAlign?: VAlign
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
    /**
     * Top position of the text within the layer, in pixels or as a percentage string
     * (e.g. `'50%'`). Overrides {@link vAlign} when set. The value is the y passed to
     * `fillText`, so {@link textBaseline} decides what it anchors (with the default
     * `'top'` baseline, the top of the em square - which sits slightly above the glyph
     * ink). Unset by default, so `vAlign` places the text.
     */
    top?: number | string
    /**
     * Left position of the text within the layer, in pixels or as a percentage string
     * (e.g. `'50%'`). Overrides {@link hAlign} when set. Unset by default, so `hAlign`
     * places the text.
     */
    left?: number | string
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
    /** Horizontal alignment of the text within the layer. Ignored when {@link left} is set. Default: `'center'`. */
    hAlign?: HAlign
    /** Vertical alignment of the text within the layer. Ignored when {@link top} is set. Default: `'middle'`. */
    vAlign?: VAlign
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
