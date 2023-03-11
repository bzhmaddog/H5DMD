import { OffscreenBuffer } from "../OffscreenBuffer.js";
import { IRendererDictionary, Renderer } from "../renderers/Renderer.js";
import { Options } from "../Options.js";

enum LayerType {
	Image,
	Canvas,
	Text,
	Video,
	Animation,
	Sprites
}

interface IRenderQueueItem {
    id: string,
    instance: Renderer
}

interface IRendererParamDictionary {
	[index: string]: any
}

abstract class BaseLayer {

    protected _contentBuffer: OffscreenBuffer;

    protected _options: Options;
    protected _visibility: Boolean = true;


    private _id: string;
    private _loaded: Boolean = false;
    private _outputBuffer: OffscreenBuffer;
    private _layerType: LayerType;
    private _renderNextFrame: Function;
    private _rendererParams: IRendererParamDictionary;

    private _loadedListener?: Function;
    private _updatedListener?: Function;
    private _availableRenderers: IRendererDictionary;
    private _defaultRenderQueue: IRenderQueueItem[];
    private _renderQueue: IRenderQueueItem[];
    private _opacity: number = 1;
    private _groups: string[];

    constructor(
        id: string,
        layerType: LayerType,
        width: number,
        height: number,
        renderers?: IRendererDictionary,
        loadedListener?: Function,
        updatedListener?: Function
    ) {
        this._outputBuffer = new OffscreenBuffer(width, height)
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

        this._options = new Options({ visible : true });


        this._renderNextFrame = function() { console.log(`Layer [${this._id}] : Rendering ended`) };
    }



    /**
     * get render parameters for specified renderer key
     * @param {string} id 
     * @returns 
     */
    getRendererParams(id: string): any {
        if (typeof this._rendererParams[id] !== 'undefined') {
            return this._rendererParams[id];
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
    setRendererParams(id: string, value: any) {
        //this._rendererParams[id] = value;
    }

    /**
     * Request rendering of layer frame
     */
    private _requestAnimationFrame() {
        requestAnimationFrame(this._renderFrame.bind(this));
    }

    /**
     * Start rendering process
     */
    private _renderFrame() {
        const that = this;

        // clone renderers array;
        this._renderQueue = [...this._defaultRenderQueue] || [];

        // If opacity is below 1 add opacity renderer
        if (this._opacity < 1) {
            this._renderQueue.push({
                id : 'opacity',
                instance : this._availableRenderers['opacity']
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
    private _processRenderQueue(frameImageData: ImageData) {
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
            renderer.instance.renderFrame.apply(renderer.instance, params).then((outputData: ImageData) => {
                that._processRenderQueue(outputData);
            });
        // no more renderer in queue then draw final image and start queue process again	
        } else {

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
    protected _layerLoaded(startRenderingLoop: Boolean = false) {
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
    protected _setAntialiasing(enabled: boolean) {
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
        this._renderNextFrame = function() {console.log(`Rendering stopped : ${this._id}`)}
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
    async _loadImage(src: string) {
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
     async _loadImageSynced(src: string, index: number) {
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
    protected _getRendererInstance(id: string) {
        if (typeof this._availableRenderers[id] !== 'undefined') {
            return  this._availableRenderers[id];
        } else {
            throw new Error("This renderer is not available");
        }
    }
    
    setVisibility(isVisible: Boolean) {
        this._visibility = isVisible;
    }

    isVisible(): Boolean {
        return this._visibility;
    }

    isLoaded(): Boolean {
        return this._loaded;
    }

    destroy() {
        this._renderNextFrame = function() { console.log(`Destroying layer : ${this._id}`) };
    }

    get id(): string {
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
    get canvas(): HTMLCanvasElement {
        return this._outputBuffer.canvas;
    }

    get layerType(): LayerType {
        return this._layerType;
    }

    get groups(): string[] {
        return this._groups;
    }

}

export { BaseLayer, LayerType }