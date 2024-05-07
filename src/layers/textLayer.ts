import {BaseLayer, LayerType} from './baseLayer'
import {OffscreenBuffer} from '@utils/offscreenBuffer'
import {Colors} from '@enums/colors'
import {ILayerRendererDictionary} from '@interfaces/iLayerRendererDictionnary'
import {Utils} from '@utils/utils'
import {Options} from '@utils/options'
import {RemoveAliasingRenderer} from '@renderers/removeAliasingRenderer'
import {OutlineRenderer} from '@renderers/outlineRenderer'

class TextLayer extends BaseLayer {

    private _text: string
    private _textBuffer: OffscreenBuffer

    constructor(
        id: string,
        width: number,
        height: number,
        options: Options,
        renderers?: ILayerRendererDictionary,
        loadedListener?: (layer: TextLayer) => void,
        updatedListener?: (layer: TextLayer) => void
    ) {

        const layerOptions = new Options({
            top: 0,
            left: 0,
            color: Colors.White,
            fontSize: '10',
            fontUnit: '%',
            fontFamily: 'Arial',
            fontStyle: 'normal',
            textBaseline: 'top',
            hOffset: 0,
            vOffset: 0,
            strokeWidth: 0,
            strokeColor: Colors.Black,
            adjustWidth: false,
            outlineWidth: 0,
            outlineColor: Colors.Black,
            antialiasing: true
        }).merge(options)


        const layerRenderers = Object.assign({
			'no-antialiasing' : new RemoveAliasingRenderer(width, height), // used by TextLayer if antialiasing  = false
			'outline' : new OutlineRenderer(width, height)  // used by TextLayer when outlineWidth > 1
        }, renderers) as ILayerRendererDictionary

        super(id, LayerType.Text, width, height, layerOptions, layerRenderers, loadedListener, updatedListener)

        this._textBuffer = new OffscreenBuffer(this.width, this.height)

        this._text = ""

        //this._contentBuffer.imageSmoothingEnabled = this._options.antialiasing

        //this.#ctx.imageSmoothingEnabled = false

        setTimeout(this._layerLoaded.bind(this), 1)

        //this.#buffer.context.fillStyle = 'transparent'

        if (this._options.has('text')) {

            if (typeof this._options.get('text') !== 'string') {
                throw new TypeError("options.text is not a string")
            }

            if (this._options.get('text') !== "") {
                this._text = this._options.get('text')

                //console.log(this._id, this.#text)
                this._drawText().then(() => {
                    setTimeout(this._layerUpdated.bind(this), 1)
                })
            }
        }
    }

    /**
     * Draw text onto canvas
     * @param _options 
     */
    private _drawText(_options?: Options) {

        // merge passed options with default options set during layer creation
        const options = new Options(this._options).merge(_options)

        return new Promise<void>(resolve => {

            //console.log(this._id, this.#text)

            //if (options.antialiasing === false) {
            this._textBuffer.context.imageSmoothingEnabled = options.get('antialiasing')
            this._setAntialiasing(options.get('antialiasing'))
            //}


            if (options.get('outlineWidth') > 0) {
                options.set('strokeWidth', 0)
            }

            this._textBuffer.clear()

            /*if (typeof options.text === 'undefined' || options.text === '') {
                throw new Error("Cannot draw empty text")
            }*/

            let left = options.get('left')
            let top = options.get('top')
            let m


            // fillText doesn't at 0 font pb ?
            /*if (options.strokeWidth === 0) {
                left--
            }*/

            this._textBuffer.context.textBaseline = options.get('textBaseline')
            this._textBuffer.context.fillStyle = options.get('color')

            /*if (typeof options.letterSpacing === 'number') {
                //console.log(options.letterSpacing)
                this.#textBuffer.canvas.style.letterSpacing = options.letterSpacing + options.fontUnit
                this.#textBuffer.context.textAlign = 'center'
            }*/


            let fontSize = options.get('fontSize')
            let fontUnit = options.get('fontUnit')

            // Approximation of the height in percentage
            // TODO : Check with different fonts
            if (fontUnit === '%') {
                fontUnit = 'px'
                fontSize = (fontSize * this.height) / 80
            }


            // Adjust size of font so that the text fit the screen
            // TODO : Fix that to handle text that are not aligned 
            if (options.get('adjustWidth')) {
                let textOk = false

                while (!textOk) {
                    this._textBuffer.context.font = options.get('fontStyle') + " " + fontSize + fontUnit + ' ' + options.get('fontFamily')
                    m = this._textBuffer.context.measureText(this._text)

                    if (m.width > this.width - 5) {
                        const fs = options.get('fontSize')
                        options.set('fontSize', fs - 1)
                    } else {
                        textOk = true
                    }
                }
            } else {
                this._textBuffer.context.font = options.get('fontStyle') + " " + fontSize + fontUnit + ' ' + options.get('fontFamily')
                m = this._textBuffer.context.measureText(this._text)
            }

            // https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
            // Approximation of line height since api doesn't provide native method
            const textHeight = this._textBuffer.context.measureText('M').width


            // Convert % to pixels/dots
            if (typeof options.get('left') === 'string' && options.get('left').at(-1) === '%') {
                const vl = parseFloat(options.get('left').replace('%', ''))
                //left =  ((vl * this.width) / 100) - (m.width / 2)
                left = Math.floor((vl * this.width) / 100)
            }

            // Convert % to pixels/dots
            if (typeof options.get('top') === 'string' && options.get('top').at(-1) === '%') {
                const vt = parseFloat(options.get('top').replace('%', ''))
                //top = ((vt * this.height) / 100) - (this.#textBuffer.context.measureText('M').width / 2) // m.height not available
                top = Math.floor((vt * this.height) / 100)
            }

            if (typeof options.get('hAlign') === 'string') {
                switch (options.get('hAlign')) {
                    case 'left':
                        left = 0
                        break
                    case 'center':
                        left = (this.width / 2) - (m.width / 2)
                        break
                    case 'right':
                        left = this.width - m.width
                }
            }

            if (typeof options.get('vAlign') === 'string') {
                switch (options.get('vAlign')) {
                    case 'top':
                        top = 0
                        break
                    case 'middle':
                        top = (this.height / 2) - (textHeight / 2)
                        break
                    case 'bottom':
                        top = this.height - textHeight
                        break
                }
            }

            let hOffset = options.get('hOffset')
            const vOffset = options.get('vOffset')

            // convert % in pixels
            if (typeof options.get('hOffset') === 'string' && options.get('hOffset').at(-1) === '%') {
                const vh = parseFloat(options.get('hOffset').replace('%', ''))
                //hOffset = ((vh * m.width) / 100)
                hOffset = Math.floor((vh * this.width) / 100)
            }

            // convert % in pixels
            if (typeof options.get('vOffset') === 'string' && options.get('vOffset').at(-1) === '%') {
                const vv = parseFloat(options.get('vOffset').replace('%', ''))
                //hOffset = ((vv * textHeight) / 100)
                hOffset = Math.floor((vv * this.height) / 100)
            }

            // % in offset are relative of the width/height of the text

            // Add offsets
            left += hOffset
            top += vOffset

            if (options.get('strokeWidth') > 0) {
                this._textBuffer.context.strokeStyle = options.get('strokeColor')
                this._textBuffer.context.lineWidth = options.get('strokeWidth')
                this._textBuffer.context.strokeText(this._text, left, top)
            }

            this._textBuffer.context.fillText(this._text, left, top)

            //console.log(this.getId(),this.#textBuffer.context.getImageData(0,0, this.width, this.height).data)
            const frameImageData = this._textBuffer.context.getImageData(0, 0, this.width, this.height)

            // If outlined text then pixelate first then render outline
            if (options.get('outlineWidth') > 0) {

                if (this._options.get('antialiasing')) {

                    this._getRendererInstance('outline').renderFrame(
                        frameImageData,
                        new Options({
                            innerColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF'),
                            outerColor: Utils.hexRGBToHexRGBA(this._options.get('outlineColor').replace('#', ''), 'FF'),
                            width: this._options.get('outlineWidth') // TODO Check if correct
                        })
                    ).then((outputData: ImageData) => {
                        createImageBitmap(outputData).then(bitmap => {
                            this._contentBuffer.clear()
                            this._contentBuffer.context.drawImage(bitmap, 0, 0)
                            resolve() // outputData
                        })
                    })


                } else {

                    this._getRendererInstance('no-antialiasing').renderFrame(
                        frameImageData,
                        new Options({
                            treshold: 255, // TODO find how param was set before
                            baseColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF')
                        })
                    ).then((aaData: ImageData) => {
                        this._getRendererInstance('outline').renderFrame(
                            aaData,
                            new Options({
                                innerColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF'),
                                outerColor: Utils.hexRGBToHexRGBA(this._options.get('outlineColor').replace('#', ''), 'FF'),
                                width: this._options.get('outlineWidth')
                            })
                        ).then((outputData: ImageData) => {
                            createImageBitmap(outputData).then(bitmap => {
                                this._contentBuffer.clear()
                                this._contentBuffer.context.drawImage(bitmap, 0, 0)
                                resolve() // outputData
                            })
                        })
                    })
                }


                // otherwise just render the text as is
            } else {

                if (this._options.get('antialiasing')) {

                    this._contentBuffer.clear()
                    this._contentBuffer.context.drawImage(this._textBuffer.canvas, 0, 0)
                    resolve()

                } else {

                    this._getRendererInstance('no-antialiasing').renderFrame(
                        frameImageData,
                        new Options({
                            treshold: 255, // TODO: Find how param was set before
                            baseColor: Utils.hexRGBToHexRGBA(this._options.get('color').replace('#', ''), 'FF')
                        })
                    ).then((aaData: ImageData) => {
                        createImageBitmap(aaData).then(bitmap => {
                            this._contentBuffer.clear()
                            this._contentBuffer.context.fillRect(0,0,this.width, this.height)
                            this._contentBuffer.context.drawImage(bitmap, 0, 0)
                            resolve()
                        })
                    })
                }
            }
        })
    }

    /**
     * Set layer text
     * @param {string} text 
     * @param {object} options (if options is not an object drawText will use this._options)
     */
    setText(text: string, options?: Options) {

        if (typeof text !== 'string') {
            throw new TypeError("text is not a string")
        }

        if (typeof text !== 'undefined' && text !== "" && text !== this._text) {
            this._text = text
            this._drawText(options).then(() => {
                this._layerUpdated()
            })
        }
    }

    setVisibility(isVisible: boolean): void {
        super.setVisibility(isVisible)
    }
}

export { TextLayer }