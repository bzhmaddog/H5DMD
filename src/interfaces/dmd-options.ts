import { DotShape } from '../enums'
import { RgbColor } from './rgb-color'

export interface DmdOptions {
    outputCanvas: HTMLCanvasElement
    dotSize: number
    dotSpace: number
    dotShape: DotShape
    backgroundBrightness: number
    brightness: number
    showFPS: boolean
    /** If provided, enables monochrome mode with this tint color.
     *  Accepts an `RgbColor` object, a CSS hex string, or a `Colors` enum value. */
    color?: RgbColor | string
    /** Number of monochrome brightness levels. One of 4, 8, 16. Defaults to 16. */
    monoLevels?: 4 | 8 | 16
    /** Off-dot (background) color. Accepts an `RgbColor` object, a CSS hex string, or a `Colors` enum value. */
    offDotColor?: RgbColor | string
}
