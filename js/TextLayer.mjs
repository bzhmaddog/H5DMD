import { BaseLayer } from './BaseLayer.mjs';
import { Buffer } from './Buffer.mjs';
import { Colors } from './Colors.mjs';
import { Utils } from './Utils.mjs';

class TextLayer extends BaseLayer {

    #text;
    #textBuffer;

    constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener) {

        //console.log(_renderers);

        var defaultOptions = {
            top : 0,
            left: 0,
            color: Colors.white,
            align : 'left',
            fontSize : '12',
            fontFamily : 'Arial',
            fontStyle : 'normal',
            textBaseline : 'top',
            xOffset : 0,
            yOffset : 0,
            strokeWidth : 0,
            strokeColor : Colors.black,
            adjustWidth : false,
            outlineWidth : 0,
            outlineColor : Colors.black,
            antialiasing : true
        };
      
        super(_id, _width, _height, Object.assign(defaultOptions,_options), _renderers, _loadedListener, _updatedListener);

        var that = this;

        this.#textBuffer = new Buffer(this.width, this.height);

        this._setType('text');

        this.#text = "";


        //this._contentBuffer.imageSmoothingEnabled = this._options.antialiasing;

        //this.#ctx.imageSmoothingEnabled = false;

        //console.log(_renderers);

        if (typeof _renderers['no-antialiasing'] === 'undefined' || typeof _renderers['outline'] === 'undefined') {
            throw new Error("'Remove aliasing' or 'outline' filter not found");
        }

        setTimeout(this._layerLoaded.bind(this), 1);

        //this.#buffer.context.fillStyle = 'transparent';

        if (typeof this._options.text !== 'undefined') {

            if (typeof this._options.text !== 'string') {
                throw new TypeError("options.text is not a string");
            }

            if (this._options.text !== "") {
                this.#text = this._options.text;

                //console.log(this._id, this.#text);
                this.#drawText().then( () => {
                    setTimeout(that._layerUpdated.bind(that), 1);
                });
            }/* else {
                setTimeout(this._layerUpdated.bind(this), 1);
            }*/
        }/* else {
            setTimeout(this._layerLoaded.bind(this), 1);
        }*/

        // Delay onDataLoaded a bit otherwise #content is undefined in Layer.mjs
        //setTimeout(this.#onDataLoaded.bind(this), 1);
    }

    /**
     * Draw text onto canvas
     * @param {object} _options 
     * @returns 
     */
    #drawText(_options) {
        var that = this;

        // merge passed options with default options set during layer creation
        var options = Object.assign(this._options, _options);

        //console.log(options);

        return new Promise( resolve => {

            //console.log(this._id, this.#text);

            //if (options.antialiasing === false) {
            this.#textBuffer.context.imageSmoothingEnabled = options.antialiasing;
            this._setAntialiasing(options.antialiasing);
            //}

            if (options.outlineWidth > 0) {
                options.strokeWidth = 0;
            }

            this.#textBuffer.clear();

            /*if (typeof options.text === 'undefined' || options.text === '') {
                throw new Error("Cannot draw empty text");
            }*/

            var left = options.left;
            var top = options.top;
            var m;


            // fillText doesn't at 0 font pb ?
            /*if (options.strokeWidth === 0) {
                left--;
            }*/

            this.#textBuffer.context.textBaseline = options.textBaseline;
            this.#textBuffer.context.fillStyle = options.color;

            if (typeof options.letterSpacing === 'number') {
                //console.log(options.letterSpacing)
                this.#textBuffer.canvas.style.letterSpacing = options.letterSpacing + 'px';                
                this.#textBuffer.context.textAlign = 'center';
            }


            if (options.adjustWidth) {
                var textOk = false;

                while(!textOk) {
                    this.#textBuffer.context.font = options.fontStyle + " " + options.fontSize + 'px ' + options.fontFamily;
                    m = this.#textBuffer.context.measureText(this.#text);
    
                    if (m.width > this.width - 5) {
                        options.fontSize--;
                    } else {
                        textOk = true;
                    }
                }
                
            } else {
                this.#textBuffer.context.font = options.fontStyle + " " + options.fontSize + 'px ' + options.fontFamily;
                m = this.#textBuffer.context.measureText(this.#text);       
            }

            if (options.align === 'center') {
                left = (this.width/2) - (m.width / 2);
            } else if (options.align === 'right') {
                left = this.width - m.width;
            }

            if (typeof options.vAlign !== 'undefined') {
                // https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
                // Approximation of line height since api doesn't provide native method
                var textHeight = this.#textBuffer.context.measureText('M').width;

                switch(options.vAlign) {
                    case 'top':
                        top = 0;
                        break;
                    case 'middle':
                        top = (this.height/2) - (textHeight / 2);
                        break;
                    case 'bottom':
                        top = this.height - textHeight;
                        break;
                }
            }

            // Add offsets
            left += options.xOffset;
            top += options.yOffset;

            // Add stroke width and height
            //left += options.strokeWidth;

            //console.log(left);
            //console.log(top);

            //top -= options.strokeWidth;
            //top -= 5;

            //this.#ctx.imageSmoothingEnabled = false;

            //this._startRendering();

            if (options.strokeWidth > 0) {
                this.#textBuffer.context.strokeStyle = options.strokeColor;
                this.#textBuffer.context.lineWidth = options.strokeWidth;
                this.#textBuffer.context.strokeText(this.#text, left, top);
            }

            this.#textBuffer.context.fillText(this.#text, left, top);

            //console.log(this.getId(),this.#textBuffer.context.getImageData(0,0, this.width, this.height).data);
            var frameImageData = this.#textBuffer.context.getImageData(0, 0, this.width, this.height);


            var aaParams = [frameImageData.data];
            
            aaParams = aaParams.concat(this.getRendererParams('no-antialiasing'));

            aaParams.push(Utils.hexRGBToHexRGBA(this._options.color.replace('#',''), 255));

            //console.log("aaParams = ", aaParams);

            // If outlined text then pixelate first then render outline
            if (options.outlineWidth > 0) {

                if (this._options.antialiasing) {

                    this._getRendererInstance('outline').renderFrame(
                        frameImageData.data,
                        Utils.hexRGBToHexRGBA(this._options.color.replace('#',''), 255),
                        Utils.hexRGBToHexRGBA(this._options.outlineColor.replace('#',''), 'FF'),
                        this._options.outlineWidth
                    ).then(outputData => {
                        createImageBitmap(outputData).then(bitmap => {
                                this._contentBuffer.clear();
                                this._contentBuffer.context.drawImage(bitmap, 0, 0);
                                resolve();
                        });
                    });


                } else {

                    this._getRendererInstance('no-antialiasing').renderFrame.apply(this._getRendererInstance('no-antialiasing'), aaParams).then(aaData => {
                        
                        //console.log(this._options);

                        this._getRendererInstance('outline').renderFrame(
                            aaData.data,
                            Utils.hexRGBToHexRGBA(this._options.color.replace('#',''), 255),
                            Utils.hexRGBToHexRGBA(this._options.outlineColor.replace('#',''), 'FF'),
                            this._options.outlineWidth
                        ).then(outputData => {
                            createImageBitmap(outputData).then(bitmap => {
                                this._contentBuffer.clear();
                                this._contentBuffer.context.drawImage(bitmap, 0, 0);
                                resolve();
                            });
                        });
                    });
                }


            // otherwise just render the text as is;    
            } else {

                if (this._options.antialiasing) {
                    this._contentBuffer.clear();
                    this._contentBuffer.context.drawImage(this.#textBuffer.canvas, 0, 0);
                    resolve();
                } else {

                    this._getRendererInstance('no-antialiasing').renderFrame.apply(this._getRendererInstance('no-antialiasing'), aaParams).then(aaData => {
                        createImageBitmap(aaData).then(bitmap => {
                            this._contentBuffer.clear();
                            this._contentBuffer.context.drawImage(bitmap, 0, 0);
                            resolve();
                        });
                    });
                }
            }
        });
    }

    /**
     * Set layer text
     * @param {string} text 
     * @param {object} options (if options is not an object drawText will use this._options)
     */
    setText(text, options) {
        var that = this;

        if (typeof text !== 'string') {
            throw new TypeError("text is not a string");
        }

        if (typeof text !== 'undefined' && text !== "" && text !== this.#text) {
            this.#text = text;
            this.#drawText(options).then(() => {
                that._layerUpdated();
            });
        }
    }
}

export { TextLayer };