import type {RendererEntry} from './layer-renderer-dictionary'

/**
 * Positioning of a layer within the DMD frame.
 */
export interface LayerPosition {
    /** Top position in pixels. Default: `0`. */
    top?: number
    /** Left position in pixels. Default: `0`. */
    left?: number
    /** Horizontal alignment within the DMD. */
    hAlign?: 'left' | 'center' | 'right'
    /** Vertical alignment within the DMD. */
    vAlign?: 'top' | 'middle' | 'bottom'
    /** Horizontal pixel offset (added after alignment). Default: `0`. */
    hOffset?: number
    /** Vertical pixel offset (added after alignment). Default: `0`. */
    vOffset?: number
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
    /** Groups this layer belongs to. Default: `['default']`. */
    groups: string[]
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
