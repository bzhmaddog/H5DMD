import { BaseLayer } from "./BaseLayer.js"
import { LayerType } from "./BaseLayer.js"
import { ILayerRendererDictionary } from "../renderers/LayerRenderer.js"
import { Options } from "../Options.js"


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

        // Default options for Canvas layers
        const defaultOptions =  new Options({ top : 0, left : 0, keepAspectRatio : true})
        const layerOptions = Object.assign({}, defaultOptions, options)

        super(id, LayerType.Canvas, width, height, layerOptions, renderers, loadedListener, updatedListener)

        setTimeout(this._layerLoaded.bind(this), 1)
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param {ImageBitmap} img 
     * @param {object} _options
     */
    drawImage(img: ImageBitmap, _options: Options) {
        var defaultOptions = new Options({
            width : img.width,
            height : img.height,
            resize : false // TODO
        })

        var options: Options = this._buildOptions(new Options(_options), defaultOptions)

        this._contentBuffer.context.drawImage(
            img,
            options.get('left'),
            options.get('top'),
            options.get('width'),
            options.get('height')
        )

        this._layerUpdated()
    }

    private _buildOptions(_options: Options, _defaultOptions: Options): Options {

        var options: Options = Object.assign(this._options, _defaultOptions, _options)

        var isMissingDimension = (_options.get('width') === undefined || _options.get('height') === undefined)
        var isMissingAllDimensions = (_options.get('width') === undefined && _options.get('height') === undefined)

        if (typeof options.get('left') === 'string' && options.get('left').at(-1) === '%') {
            var xv = parseInt(options.get('left').replace('%',''), 10)
            options.set('left', Math.floor((xv * this.width) / 100))
        }

        if (typeof options.get('top') === 'string' && options.get('top').at(-1) === '%') {
            var yv = parseInt(options.get('top').replace('%',''), 10)
            options.set('top', Math.floor((yv * this.height) / 100))
        }

        if (typeof options.get('width') === 'string' && options.get('width').at(-1) === '%') {
            var wv = parseInt(options.get('width').replace('%',''), 10)
            options.set('width', Math.floor((wv * this.width) / 100))  // % of the dmd Width
        }

        if (typeof options.get('height') === 'string' && options.get('height').at(-1) === '%') {
            var hv = parseInt(options.get('height').replace('%',''), 10)
            options.set('height', Math.floor((hv * this.height) / 100)) // % of the dmd Height
        }

        // If provided only one of width or height and keeping ratio is required then calculate the missing dimension
        if (options.get('keepAspectRatio') && isMissingDimension && !isMissingAllDimensions) {
            if (typeof _options.get('width') === 'undefined') {
                options.set('width', Math.floor(options.get('height') * _defaultOptions.get('width') / _defaultOptions.get('height')))
            } else if (typeof _options.get('height') === 'undefined') {
                options.set('height', Math.floor(options.get('width') * _defaultOptions.get('height') / _defaultOptions.get('width')))
            }
        }

        if (typeof options.get('align') === 'string') {
            switch(options.get('align')) {
                case 'left':
                    if (typeof _options.get('left') !== 'undefined' && options.get('left') !== 0) {
                        console.warn(`CanvasLayer[${this.id}].drawImage() : align: 'left' is overriding left:${_options.get('left')}`)
                    }
                    options.set('left', 0)
                case 'center':
                    var alignCenter = this.width / 2 - options.get('width') / 2
                    if (typeof _options.get('left') !== 'undefined' && options.get('left') !== alignCenter) {
                        console.warn(`CanvasLayer[${this.id}].drawImage() : align: 'center' is overriding left:${_options.get('left')}`)
                    }
                    options.set('left', alignCenter)
                    break
                case 'right':
                    var alignRight = this.width - options.get('width')
                    if (typeof _options.get('left') !== 'undefined' && options.get('left') !== alignRight) {
                        console.warn(`CanvasLayer[${this.id}].drawImage() : align: 'right' is overriding left:${_options.get('left')}`)
                    }
                    options.set('left', alignRight)
                    break
                default:
                    console.warn(`CanvasLaye[${this.id}].drawImage(): Incorrect value align:'${options.get('align')}'`)
            }
        }

        if (typeof options.get('vAlign') === 'string') {
            switch(options.get('vAlign')) {
                case 'top':
                    if (typeof _options.get('top') !== 'undefined' && options.get('top') !== 0) {
                        console.warn(`CanvasLayer[${this.id}].drawImage() : vAlign: 'top' is overriding top:${_options.get('top')}`)
                    }
                    options.set('top', 0) 
                    break
                case 'middle':
                    var alignMiddle = this.height / 2 - options.get('height') / 2
                    if (typeof _options.get('top') !== 'undefined' && options.get('top') !== alignMiddle) {
                        console.warn(`CanvasLayer[${this.id}].drawImage() : vAlign: 'middle' is overriding top:${_options.get('top')}`)
                    }
                    options.set('top', alignMiddle)
                    break
                case 'bottom':
                    var alignBottom = this.height - options.get('height')
                    if (typeof _options.get('top') !== 'undefined' && options.get('top') !== alignBottom) {
                        console.warn(`CanvasLayer[${this.id}].drawImage() : vAlign: 'bottom' is overriding top:${_options.get('top')}`)
                    }
                    options.set('top', alignBottom)
                    break
                default:
                    console.warn(`CanvasLayer[${this.id}].drawImage(): Incorrect value vAlign:'${options.get('vAlign')}'`)
            }

        }

        return options
    }

}

export { CanvasLayer }