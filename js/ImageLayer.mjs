import { CanvasLayer } from './CanvasLayer.mjs';

// TODO: Consider merging with CanvasLayer
class ImageLayer extends CanvasLayer {

    constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener) {
        super(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener);

        this._setType('image');

        if (typeof _options.src === 'undefined') {
            throw new TypeError("Missing src property in options object");
        } else {
            this.drawImage(_options.src, 0, 0, _width, _height);
        }
    }
}

export { ImageLayer };