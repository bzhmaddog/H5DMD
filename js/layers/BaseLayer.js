var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { OffscreenBuffer } from "../OffscreenBuffer.js";
import { Options } from "../Options.js";
var LayerType;
(function (LayerType) {
    LayerType[LayerType["Image"] = 0] = "Image";
    LayerType[LayerType["Canvas"] = 1] = "Canvas";
    LayerType[LayerType["Text"] = 2] = "Text";
    LayerType[LayerType["Video"] = 3] = "Video";
    LayerType[LayerType["Animation"] = 4] = "Animation";
    LayerType[LayerType["Sprites"] = 5] = "Sprites";
})(LayerType || (LayerType = {}));
class BaseLayer {
    constructor(id, layerType, width, height, renderers, loadedListener, updatedListener) {
        this._visibility = true;
        this._loaded = false;
        this._opacity = 1;
        this._outputBuffer = new OffscreenBuffer(width, height);
        this._layerType = layerType;
        this._id = id;
        this._contentBuffer = new OffscreenBuffer(width, height, true);
        this._outputBuffer = new OffscreenBuffer(width, height);
        this._loadedListener = loadedListener;
        this._updatedListener = updatedListener;
        this._defaultRenderQueue = [];
        this._renderQueue = [];
        this._availableRenderers = Object.assign({}, renderers);
        this._rendererParams = {};
        this._groups = ['default'];
        this._options = new Options({ visible: true });
        this._renderNextFrame = function () { console.log(`Layer [${this._id}] : Rendering ended`); };
    }
    /**
     * get render parameters for specified renderer key
     * @param {string} id
     * @returns
     */
    getRendererParams(id) {
        if (typeof this._rendererParams[id] !== 'undefined') {
            return this._rendererParams[id];
        }
        else {
            return null;
        }
    }
    /**
     * Set renderer parameters
     * TODO : Improve that by creating Classes provided by renderers themself
     * @param {string} id
     * @param {array} value
     */
    setRendererParams(id, value) {
        //this._rendererParams[id] = value;
    }
    /**
     * Request rendering of layer frame
     */
    _requestAnimationFrame() {
        requestAnimationFrame(this._renderFrame.bind(this));
    }
    /**
     * Start rendering process
     */
    _renderFrame() {
        const that = this;
        // clone renderers array;
        this._renderQueue = [...this._defaultRenderQueue] || [];
        // If opacity is below 1 add opacity renderer
        if (this._opacity < 1) {
            this._renderQueue.push({
                id: 'opacity',
                instance: this._availableRenderers['opacity']
            });
        }
        // Get initial data from layer content
        var frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
        // start renderers queue processing
        this._processRenderQueue(frameImageData);
    }
    /**
     * Process image data provided through current renderer in queue and call it self recursively until no more renderer in queue
     * @param {ImageData} frameImageData
     * @returns {ImageData} result data of the renderer
     */
    _processRenderQueue(frameImageData) {
        var that = this;
        // if there is a renderer in the queue then run render pass with this renderer
        if (this._renderQueue.length) {
            var renderer = this._renderQueue.shift(); // pop renderer from render queue
            // First param is always the image data
            var params = [frameImageData.data];
            // Merge renderer params with array of params specific to this renderer if any
            if (this.getRendererParams(renderer.id) !== null) {
                params = params.concat(this.getRendererParams(renderer.id));
            }
            //console.log(this._id, params);
            // Apply 'filter' to provided content with current renderer then process next renderer in queue
            renderer.instance.renderFrame.apply(renderer.instance, params).then((outputData) => {
                that._processRenderQueue(outputData);
            });
            // no more renderer in queue then draw final image and start queue process again	
        }
        else {
            // Erase current output buffer content
            that._outputBuffer.clear();
            // Put final frame data into output buffer and start process again (if needed)
            createImageBitmap(frameImageData).then(bitmap => {
                // Put final layer data in the output buffer
                that._outputBuffer.context.drawImage(bitmap, 0, 0);
                // request next frame rendering
                that._renderNextFrame();
            });
        }
    }
    /**
     * Layer is loaded : Start rendering and call the callback if needed
     * @param {boolean} startRenderingLoop
     */
    _layerLoaded(startRenderingLoop = false) {
        var that = this;
        this._loaded = true;
        console.log(`Layer [${this._id}] : Loaded`);
        // If no renderer in the queue then just render the frame data once
        if (this._defaultRenderQueue.length === 0 && this._opacity === 1) {
            // Put content data in output buffer
            var frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
            this._outputBuffer.clear();
            createImageBitmap(frameImageData).then(bitmap => {
                that._outputBuffer.context.drawImage(bitmap, 0, 0);
            });
        }
        // start rendering visible layers which have renderers
        if (this.isVisible() && (this.haveRenderer() || !!startRenderingLoop)) {
            this._renderNextFrame = this._requestAnimationFrame;
            this._requestAnimationFrame();
        }
        // Call callback if there is one
        if (typeof this._loadedListener === 'function') {
            this._loadedListener(this);
        }
    }
    /**
     * Enable/Disable antialiasing
     * TODO : Fix not working as expected
     * @param {boolean} enabled
     */
    _setAntialiasing(enabled) {
        this._outputBuffer.context.imageSmoothingEnabled = enabled;
    }
    /**
     * Layer was updated
     */
    _layerUpdated() {
        console.log(`Layer [${this._id}] : Updated`);
        // Re-render frame if needed
        if (!this.haveRenderer()) {
            this._renderFrame();
        }
        // Callback parent if available
        if (typeof this._updatedListener === 'function') {
            this._updatedListener(this);
        }
    }
    /**
     * Stop rendering of the layer
     */
    _stopRendering() {
        this._renderNextFrame = function () { console.log(`Rendering stopped : ${this._id}`); };
    }
    /**
     * Start rendering of the layer
     */
    _startRendering() {
        console.log(`Layer [${this._id}] : Start rendering`);
        this._renderNextFrame = this._requestAnimationFrame;
        this._requestAnimationFrame();
    }
    /**
     * Fetch an image from remote server
     * @param {string} src
     * @returns
     */
    _loadImage(src) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(src);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            else {
                return yield response.blob();
            }
        });
    }
    /**
     * Fetch image from server with an index used to determine position
     * @param {string} src
     * @param {number} index
     * @returns
     */
    _loadImageSynced(src, index) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(src);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            else {
                return {
                    blob: response.blob(),
                    index: index
                };
            }
        });
    }
    /**
     * Return if the layer have renderer in the queue
     * @returns boolean
     */
    haveRenderer() {
        return this._defaultRenderQueue.length > 0;
    }
    /**
     * Return requested renderer instance
     * @param {string} id
     * @returns object
     */
    _getRendererInstance(id) {
        if (typeof this._availableRenderers[id] !== 'undefined') {
            return this._availableRenderers[id];
        }
        else {
            throw new Error("This renderer is not available");
        }
    }
    setVisibility(isVisible) {
        this._visibility = isVisible;
    }
    isVisible() {
        return this._visibility;
    }
    isLoaded() {
        return this._loaded;
    }
    destroy() {
        this._renderNextFrame = function () { console.log(`Destroying layer : ${this._id}`); };
    }
    get id() {
        return this._id;
    }
    /**
     * Get layer width
     */
    get width() {
        return this._outputBuffer.width;
    }
    /**
     * Get layer height
     */
    get height() {
        return this._outputBuffer.height;
    }
    /**
     * Get output canvas
     */
    get canvas() {
        return this._outputBuffer.canvas;
    }
    get layerType() {
        return this._layerType;
    }
    get groups() {
        return this._groups;
    }
}
export { BaseLayer, LayerType };
//# sourceMappingURL=BaseLayer.js.map