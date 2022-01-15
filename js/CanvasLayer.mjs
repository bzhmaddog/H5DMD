import { BaseLayer } from './BaseLayer.mjs';

class CanvasLayer extends BaseLayer {

    constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener) {

        super(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener);

        this._setType('canvas');

        // Delay onLayerUpdated a bit otherwise #content is undefined in Layer.mjs
        setTimeout(this._layerLoaded.bind(this), 1);
    }

    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param {object or string} img 
     * @param {number} x
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    drawImage(img, x, y, w, h) {
        var that = this;

        if (typeof img === 'undefined') {
            throw new TypeError("Missing image");
        } else if (typeof img === 'string') {
            this._loadImage(img).then(blob => {
                createImageBitmap(blob).then( bitmap => {
                    that._contentBuffer.context.drawImage(bitmap, x || 0, y || 0, w || that.width, h || that.height);
                    that._layerUpdated();
                });
            });
        } else {
            this._contentBuffer.context.drawImage(img, x || 0, y || 0, w || that.width , h || that.height);
            this._layerUpdated();
        }
    }
}

export { CanvasLayer };