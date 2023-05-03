import { BaseLayer } from "./BaseLayer.js"
import { LayerType } from "./BaseLayer.js"
import { ILayerRendererDictionary } from "../renderers/LayerRenderer.js"
import { Options } from "../Options.js"

/**
 * Interface to describe the values returned by computeDimensions method
 */
interface IDimensions {
    top : number,
    left : number,
    width : number,
    height : number
}

/**
 * A layer which content is a canvas
 */
class CanvasLayer extends BaseLayer {

    constructor(
        id: string,
        width: number,
        height: number,
        options?: Options,
        renderers?: ILayerRendererDictionary,
        loadedListener?: Function,
        updatedListener?: Function
    ) {
        super(id, LayerType.Canvas, width, height, options, renderers, loadedListener, updatedListener)
        setTimeout(this._layerLoaded.bind(this), 1)
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param img bitmap object
     * @param _options options
     */
    drawBitmap(img: ImageBitmap, _options?: Options) {

        const defaultOptions = new Options({
            top : 0,
            left : 0,
            hOffset : 0,
            vOffset : 0,
            fit : true,
            keepAspectRatio : true
        })

        const bitmapOptions = Object.assign(defaultOptions, new Options(_options))

        // Compute final dimensions and position
        const dimensions = this._computeDimensions(bitmapOptions, img.width, img.height) // new Options(_options) to handle drawBitmap calls from Javascript

        this._contentBuffer.context.drawImage(img, dimensions.left, dimensions.top, dimensions.width, dimensions.height)

        this._layerUpdated()
    }

    /**
     * Compute final dimensions and position
     * @param _options bitmap options
     * @param width default width
     * @param height default height
     * @returns a IDimensions object
     */
    private _computeDimensions(_options: Options, width: number, height: number ): IDimensions {
        var t = 0
        var l = 0
        var w = width
        var h = height

        // If required to fit image then ignore provided width and height
        if (_options.get('fit') === true) {

            if (_options.get('keepAspectRatio') === true) {
                let ratio = width / height

                if (ratio === 1) { // W == H
                    let v = Math.min(this.width, this.height) // use smallest value
                    w = v
                    h = v
                } else if (ratio > 1) { // W > H
                    w = this.width
                    h = Math.round(w * height / width)
                } else { // H > W
                    h = this.height
                    width = Math.round(h * width / height)
                }

            // resize image to layer dimensions
            } else {
                w = this.width
                h = this.height
            }

        // If one of the dimension is provided
        } else {

            var isMissingDimension = (_options.get('width') === undefined || _options.get('height') === undefined)
            var isMissingAllDimensions = (_options.get('width') === undefined && _options.get('height') === undefined)


            if (typeof _options.get('width') === 'number') {
                w = _options.get('width')
            } else if  (typeof _options.get('width') === 'string' && _options.get('width').at(-1) === '%') {
                var wv = parseInt(_options.get('width').replace('%',''), 10)
                w = Math.floor((wv * this.width) / 100)  // % of the dmd Width
            }

            if (typeof _options.get('height') === 'number') {
                h = _options.get('height')
            } else if (typeof _options.get('height') === 'string' && _options.get('height').at(-1) === '%') {
                var hv = parseInt(_options.get('height').replace('%',''), 10)
                h =  Math.floor((hv * this.height) / 100) // % of the dmd Height
            }

            // If provided only one of width or height and keeping ratio is required then calculate the missing dimension
            if (_options.get('keepAspectRatio') && isMissingDimension && !isMissingAllDimensions) {
                if (typeof _options.get('width') === 'undefined') {
                    w = Math.round(_options.get('height') * width / height)
                } else if (typeof _options.get('height') === 'undefined') {
                    h =  Math.round(_options.get('width') * height / width)
                }
            }
        }

        if (typeof _options.get('left') === 'string' && _options.get('left').at(-1) === '%') {
            var xv = parseInt(_options.get('left').replace('%',''), 10)
            l = Math.round((xv * this.width) / 100)
        }

        if (typeof _options.get('top') === 'string' && _options.get('top').at(-1) === '%') {
            var yv = parseInt(_options.get('top').replace('%',''), 10)
            t = Math.round((yv * this.height) / 100)
        }

        if (typeof _options.get('hAlign') === 'string') {
            switch(_options.get('hAlign')) {
                case 'left':
                    l = 0 + _options.get('hOffset')
                case 'center':
                    l = this.width / 2 - w / 2  + _options.get('hOffset')
                    break
                case 'right':
                    l = this.width - w  + _options.get('hOffset')
                    break
                default:
                    console.warn(`CanvasLaye[${this.id}].drawImage(): Incorrect value align:'${_options.get('align')}'`)
            }
        }

        if (typeof _options.get('vAlign') === 'string') {
            switch(_options.get('vAlign')) {
                case 'top':
                    t = 0 + _options.get('vOffset')
                    break
                case 'middle':
                    t = this.height / 2 - h / 2 + _options.get('vOffset')
                    break
                case 'bottom':
                    t = this.height - h + _options.get('vOffset')
                    break
                default:
                    console.warn(`CanvasLayer[${this.id}].drawImage(): Incorrect value vAlign:'${_options.get('vAlign')}'`)
            }

        }

        return {
            top : t,
            left : l,
            width : w,
            height : h
        } as IDimensions
    }

}

export { CanvasLayer }