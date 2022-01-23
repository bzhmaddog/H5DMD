import { BaseLayer } from './BaseLayer.mjs';

class CanvasLayer extends BaseLayer {

    #globalOptions;

    constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener) {

        super(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener);

        this._setType('canvas');

        this.#globalOptions = {
            top : 0,
            left : 0,
            keepAspectRatio : true
        };

        // Delay onLayerUpdated a bit otherwise #content is undefined in Layer.mjs
        setTimeout(this._layerLoaded.bind(this), 1);
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param {object or string} img 
     * @param {object} _options
     */
    drawImage(img, _options) {
        var that = this;

        if (typeof img === 'undefined') {
            throw new TypeError("Missing image");
        } else if (typeof img === 'string') {
            this._loadImage(img).then(blob => {
                createImageBitmap(blob).then( bitmap => {

                    var defaultOptions = {
                        width : bitmap.width,
                        height : bitmap.height
                    };

                    var options = that.#buildOptions(_options, defaultOptions);

                    that._contentBuffer.context.drawImage(bitmap, options.left, options.top, options.width, options.height);
                    that._layerUpdated();
                });
            });
        } else if (img.constructor === HTMLImageElement) {

            var defaultOptions = {
                width : img.width,
                height : img.height
            };

            var options = that.#buildOptions(_options, defaultOptions);

            this._contentBuffer.context.drawImage(img, options.left, options.top, options.width , options.height);
            this._layerUpdated();
        } else {
            throw new Error("Image must be a string or an HTMLImageElement")
        }
    }

    #buildOptions(_options, _defaultOptions) {
        var options = Object.assign(this.#globalOptions, _defaultOptions, _options);
        var isMissingDimension = (typeof _options.width === 'undefined' || typeof _options.height === 'undefined');
        var isMissingAllDimensions = (typeof _options.width === 'undefined' && typeof _options.height === 'undefined')

        if (typeof options.left === 'string' && options.left.at(-1) === '%') {
            var xv = parseInt(options.left.replace('%',''), 10);
            options.left = (xv * this.width) / 100;
        }

        if (typeof options.top === 'string' && options.top.at(-1) === '%') {
            var yv = parseInt(options.top.replace('%',''), 10);
            options.top = (yv * this.height) / 100;
        }

        if (typeof options.width === 'string' && options.width.at(-1) === '%') {
            var wv = parseInt(options.width.replace('%',''), 10);
            options.width = (wv * this.width) / 100;  // % of the dmd Width
        }

        if (typeof options.height === 'string' && options.height.at(-1) === '%') {
            var hv = parseInt(options.height.replace('%',''), 10);
            options.height = (hv * this.height) / 100; // % of the dmd Height
        }

        // If provided only one of width or height and keeping ratio is required then calculate the missing dimension
        if (options.keepAspectRatio && isMissingDimension && !isMissingAllDimensions) {
            if (typeof _options.width === 'undefined') {
                options.width = Math.floor(options.height * _defaultOptions.width / _defaultOptions.height);
            } else if (typeof _options.height === 'undefined') {
                options.height = Math.floor(options.width * _defaultOptions.height / _defaultOptions.width);
            }
        }

        if (typeof options.align === 'string') {
            switch(options.align) {
                case 'left':
                    if (typeof _options.left !== 'undefined' && options.left !== 0) {
                        console.warn(`CanvasLayer[${this.getId()}].drawImage() : align: 'left' is overriding left:${_options.left}`)
                    }
                    options.left = 0;
                case 'center':
                    var alignCenter = this.width / 2 - options.width / 2;
                    if (typeof _options.left !== 'undefined' && options.left !== alignCenter) {
                        console.warn(`CanvasLayer[${this.getId()}].drawImage() : align: 'center' is overriding left:${_options.left}`)
                    }
                    options.left = alignCenter;
                    break;
                case 'right':
                    var alignRight = this.width - options.width;
                    if (typeof _options.left !== 'undefined' && options.left !== alignRight) {
                        console.warn(`CanvasLayer[${this.getId()}].drawImage() : align: 'right' is overriding left:${_options.left}`)
                    }
                    options.left = alignRight;
                    break;
                default:
                    console.warn(`CanvasLaye[${this.getId()}].drawImage(): Incorrect value align:'${options.align}'`);
            }
        }

        if (typeof options.vAlign === 'string') {
            switch(options.vAlign) {
                case 'top':
                    if (typeof _options.top !== 'undefined' && options.top !== 0) {
                        console.warn(`CanvasLayer[${this.getId()}].drawImage() : vAlign: 'top' is overriding top:${_options.top}`)
                    }
                    options.top = 0;                    
                    break;
                case 'middle':
                    console.log(_options);
                    var alignMiddle = this.height / 2 - options.height / 2;
                    if (typeof _options.top !== 'undefined' && options.top !== alignMiddle) {
                        console.warn(`CanvasLayer[${this.getId()}].drawImage() : vAlign: 'middle' is overriding top:${_options.top}`)
                    }
                    options.top = alignMiddle;                    
                    break;
                case 'bottom':
                    var alignBottom = this.height - options.height;
                    if (typeof _options.top !== 'undefined' && options.top !== alignBottom) {
                        console.warn(`CanvasLayer[${this.getId()}].drawImage() : vAlign: 'bottom' is overriding top:${_options.top}`)
                    }
                    options.top = alignBottom;
                    break;
                default:
                    console.warn(`CanvasLaye[${this.getId()}].drawImage(): Incorrect value vAlign:'${options.vAlign}'`)
            }

        }


        //console.log(this.getId(), options);

        return options;
    }
}

export { CanvasLayer };