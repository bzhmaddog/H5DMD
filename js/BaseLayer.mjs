import { Buffer } from './Buffer.mjs';

/**
 * Abstract Layer for the DMD
 */
class BaseLayer {

    //Protected
    _id;
    _options;
    _contentBuffer;
    
    // Private
    #type;
    #loadedListener;
    #updatedListener;
    #availableRenderers;
    #defaultRenderQueue;
    #renderQueue;
    #opacity;
    #groups;
    #visible;
    #renderNextFrame;
    #outputBuffer;
    #loaded;
    #rendererParams;

    constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener) {

        if (this.constructor === BaseLayer) {
            throw new TypeError('Abstract class "BaseLayer" cannot be instantiated directly');
        }

        var defaultOptions = {
            visible : true,
            renderers: [],
            antialiasing : true,
            aaTreshold : 254,
        };

        this._id = _id;
        this.#loadedListener = _loadedListener;
        this.#updatedListener = _updatedListener;
        this.#defaultRenderQueue = [];
        this.#renderQueue = [];
        this.#availableRenderers = Object.assign({}, _renderers);
        this.#opacity = 1;
        this.#loaded = false;
        this.#rendererParams = {};
        this.#groups = ['default'];


        this._options = Object.assign(defaultOptions, _options);
        this._options.aaTreshold = Math.min(this._options.aaTreshold, 254);

        if (!Array.isArray(this._options.renderers)) {
            throw new TypeError("options.renderers should be an array");
        }

        if (typeof this._options.groups === 'string') {
            try {
                this.#groups = this.#groups.concat(this._options.groups.replace(/\s*/gi, '').split(/[ ,;]/));
            } catch (e) {
                throw new Error("Incorrect list of group provided", e);
            }
        } else if (Array.isArray(this._options.groups)) {
            this.#groups = this.#groups.concat(this._options.groups);
        }

        this.#visible = this._options.visible;        

        // Empty method to automatically end rendering when layer is hidden
        this.#renderNextFrame = function() { console.log(`Layer [${this._id}] : Rendering ended`) };


        this._contentBuffer = new Buffer(_width, _height);
        this.#outputBuffer = new Buffer(_width, _height);

        // NOT WORKING
        this._contentBuffer.context.imageSmoothingEnabled = this._options.antialiasing;
        this.#outputBuffer.context.imageSmoothingEnabled = this._options.antialiasing;

        
        // Build default render queue to save some time in renderFrame
        // Since this should not change after creation
        for (var i = 0; i < this._options.renderers.length; i++) {
            if (typeof this.#availableRenderers[this._options.renderers[i]] !== 'undefined') {
                this.#defaultRenderQueue.push({
                    id : this._options.renderers[i],
                    instance : this.#availableRenderers[this._options.renderers[i]]
                });
            } else {
                console.log(`Renderer ${this._options.renderers[i]} is not in the list of available renderers`);
            }
        }

        // Match antialiasing remomving renderer params to the value in options
        this.setRendererParams('no-antialiasing', [this._options.aaTreshold]);


        // set opacity from options if needed
        if (typeof this._options.opacity === 'number') {
            var opacity = Math.max(0, Math.min(Number.parseFloat(this._options.opacity), 1));
            this.#opacity = Math.round(opacity * 1e3) / 1e3;

            // set opacity renderer param value
            this.setRendererParams('opacity', [this.#opacity]);
        }
    }

    /**
     * get render parameters for specified renderer key
     * @param {string} id 
     * @returns 
     */
    getRendererParams(id) {
        if (typeof this.#rendererParams[id] !== 'undefined') {
            return this.#rendererParams[id];
        } else {
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
        this.#rendererParams[id] = value;
    }

    /**
     * Request rendering of layer frame
     */
    #requestAnimationFrame() {
        requestAnimationFrame(this.#renderFrame.bind(this));
    }

    /**
     * Start rendering process
     */
    #renderFrame() {
        const that = this;

        // clone renderers array;
        this.#renderQueue = [...this.#defaultRenderQueue] || [];

        // If opacity is below 1 add opacity renderer
        if (this.#opacity < 1) {
            this.#renderQueue.push({
                id : 'opacity',
                instance : this.#availableRenderers['opacity']
            });
        }

        // Get initial data from layer content
        var frameImageData = this._contentBuffer.context.getImageData(0, 0, this.#outputBuffer.width, this.#outputBuffer.height);

        // start renderers queue processing
        this.#processRenderQueue(frameImageData);
    }

    /**
     * Process image data provided through current renderer in queue and call it self recursively until no more renderer in queue
     * @param {ImageData} frameImageData 
     * @returns {ImageData} result data of the renderer
     */
    #processRenderQueue(frameImageData) {
        var that = this;

        // if there is a renderer in the queue then run render pass with this renderer
        if (this.#renderQueue.length) {
            var renderer = this.#renderQueue.shift(); // pop renderer from render queue

            // First param is always the image data
            var params = [frameImageData.data];

            // Merge renderer params with array of params specific to this renderer if any
            if (this.getRendererParams(renderer.id) !== null) {
                params = params.concat(this.getRendererParams(renderer.id));
            } 

            //console.log(this._id, params);
            
            // Apply 'filter' to provided content with current renderer then process next renderer in queue
            renderer.instance.renderFrame.apply(renderer.instance, params).then(outputData => {
                that.#processRenderQueue(outputData);
            });
        // no more renderer in queue then draw final image and start queue process again	
        } else {

            // Erase current output buffer content
            that.#outputBuffer.clear();

            // Put final frame data into output buffer and start process again (if needed)
            createImageBitmap(frameImageData).then(bitmap => {
                // Put final layer data in the output buffer
                that.#outputBuffer.context.drawImage(bitmap, 0, 0);
                // request next frame rendering
                that.#renderNextFrame();
            });
        }
    }

    /**
     * Layer is loaded : Start rendering and call the callback if needed
     * @param {boolean} startRenderingLoop 
     */
    _layerLoaded(startRenderingLoop) {
        var that = this;

        this.#loaded = true;

        console.log(`Layer [${this._id}] : Loaded`);

        // If no renderer in the queue then just render the frame data once
        if (this.#defaultRenderQueue.length === 0 && this.#opacity === 1) {
            // Put content data in output buffer
            var frameImageData = this._contentBuffer.context.getImageData(0, 0, this.#outputBuffer.width, this.#outputBuffer.height);

            this.#outputBuffer.clear();
            createImageBitmap(frameImageData).then(bitmap => {
                that.#outputBuffer.context.drawImage(bitmap, 0, 0);
            });
        }

        // start rendering visible layers which have renderers
		if (this.isVisible() && (this.haveRenderer() || !!startRenderingLoop)) {
			this.#renderNextFrame = this.#requestAnimationFrame;
			this.#requestAnimationFrame();
		}

        // Call callback if there is one
        if (typeof this.#loadedListener === 'function') {
            this.#loadedListener(this);
        }
    }

    /**
     * Layer was updated
     */
    _layerUpdated() {

        console.log(`Layer [${this._id}] : Updated`);

        // Re-render frame
        // Todo check if needed because when rendering is started the next frame should be automatically rendered
        this.#renderFrame();

        // Callback parent if available
        if (typeof this.#updatedListener === 'function') {
            this.#updatedListener(this);
        }
    }

    /**
     * Stop rendering of the layer
     */
    _stopRendering() {
        this.#renderNextFrame = function() {console.log(`Rendering stopped : ${this._id}`)}
    }

    /**
     * Start rendering of the layer
     */
    _startRendering() {
        console.log(`Layer [${this._id}] : Start rendering`);

        this.#renderNextFrame = this.#requestAnimationFrame;
        this.#requestAnimationFrame();
    }

    /**
     * Fetch an image from remote server
     * @param {string} src 
     * @returns 
     */
    async _loadImage(src) {
        let response = await fetch(src);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            return await response.blob();
        }        
    }

    /**
     * Fetch image from server with an index used to determine position
     * @param {string} src 
     * @param {number} index
     * @returns 
     */
     async _loadImageSynced(src, index) {
        let response = await fetch(src);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            return { 
                blob : response.blob(),
                index : index
            }
        }        
    }

    /**
     * Return visibility state of the layer
     * @returns boolean
     */
    isVisible() {
        return this.#visible;
    }

    /**
     * Set visibility state of the layer
     * @param {boolean} state 
     */
    setVisibility(state) {

        // State didn't change do nothing
        if (!!state === this.#visible) {
            return;
        }

        this.#visible = !!state;

        // If layer become visible and have renderers then start the rendering loop
        if (this.#visible && this.haveRenderer()) {
            this.#renderNextFrame = this.#requestAnimationFrame;
            this.#requestAnimationFrame();
            // Otherwise stop the rendering loop
        } else {
            this.#renderNextFrame = function() { console.log('End of rendering :' + this._id) };
        }
    }

    /**
     * Toggle layer visibility and return the new state
     * @returns boolean
     */
    toggleVisibility() {
        this.#visible = !this.#visible;
        return this.#visible;
    }

    /**
     * Return the type of the layer
     * @returns string
     */
    getType() {
        return this.#type;
    }

    /**
     * Return layer id
     * @returns string
     */
    getId() {
        return this._id;
    }

    /**
     * Return requested renderer instance
     * @param {string} id 
     * @returns object
     */
    _getRendererInstance(id) {
        if (typeof this.#availableRenderers[id] !== 'undefined') {
           return  this.#availableRenderers[id];
        } else {
            throw new Error("This renderer is not available");
        }
    }

    /**
     * Return if the layer have renderer in the queue
     * @returns boolean
     */
    haveRenderer() {
        return this.#defaultRenderQueue.length > 0;
    }

    /**
     * Set layer opacity (0 -> 1)
     * @param {float} o 
     */
    setOpacity(o) {
        var opacity = Math.max(0, Math.min(Number.parseFloat(o), 1));
        this.#opacity = Math.round(opacity * 1e3) / 1e3;

        // set opacity renderer param value
        this.setRendererParams('opacity', [this.#opacity]);

        console.log(`Layer [${this._id}] : Opacity changed to ${this.#opacity}`);

        // Layer need to be redrawn
        this._layerUpdated();
    }

    /**
     * Clear buffers
     */
    clear() {
        this._contentBuffer.clear();
        this.#outputBuffer.clear();
    }

    /**
     * Redraw layer
     */
    /*redraw() {
        this.#requestAnimationFrame();
    }*/

    /**
     * Return loading state of the layer
     * @returns boolean
     */
    isLoaded() {
		return this.#loaded;
	}

    /**
     * Set layer type 
     * @param {*} t 
     */
    _setType(t) {
        this.#type = t;
    }

    /**
     * Enable/Disable antialiasing
     * TODO : Fix not working as expected
     * @param {*} enabled 
     */
    _setAntialiasing(enabled) {
        this.#outputBuffer.context.imageSmoothingEnabled = enabled;
    }

    /**
     * Get current image data
     */
    get imageData() {
        return this.#outputBuffer.context.getImageData(0,0, this.#outputBuffer.width, this.#outputBuffer.height);
    }

    /**
     * Get output canvas
     */
    get canvas() {
        return this.#outputBuffer.canvas;
    }

    /**
     * Get content canvas (whith any filter)
     */
    get originalCanvas() {
        return this._contentBuffer.canvas;
    }

    /**
     * Get output canvas context
     */
    get context() {
        return this.#outputBuffer.context;
    }

    /**
     * Get layer options
     */
    get options() {
        return this._options;
    }
    
    /**
     * Get layer width
     */
    get width() {
        return this.#outputBuffer.width;
    }

    /**
     * Get layer height
     */
    get height() {
        return this.#outputBuffer.height;
    }

    /**
     * Get groups the layer belong to
     */
    get groups() {
        return this.#groups;
    }

    /**
     * Destroy layer (for now it just mean stopping rendering)
     */
    destroy() {
        this.#renderNextFrame = function() { console.log(`Destroying layer : ${this._id}`) };
    }
}

export { BaseLayer };