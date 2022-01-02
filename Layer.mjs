import { ImageLayer } from './ImageLayer.mjs';
import { VideoLayer } from './VideoLayer.mjs';
import { TextLayer } from './TextLayer.mjs';
import { SpritesLayer } from './SpritesLayer.mjs';
import { AnimationLayer } from './AnimationLayer.mjs';
import { CanvasLayer } from './CanvasLayer.mjs';
import { Buffer } from './Buffer.mjs';

/**
 * Provide a Layer for the DMD
 */
class Layer {
	#content;
	#layerId;
	#options;
	#loadedListener;
	#updatedListener;
	#outputBuffer;
	#renderBuffer;
	#width;
	#height;
	#renderQueue;
	#defaultRenderQueue;
	#renderers;
	#opacity;
	#renderNextFrame;

	constructor(_width, _height, _options, _loadedListener, _updatedListener, _renderers) {

		var defaultOptions = {
			type : '',
			visible : true,
			renderers : [],
			groups: []
		};

		this.#width = _width;
		this.#height = _height;
		this.#loadedListener = _loadedListener;
		this.#updatedListener = _updatedListener;
		this.#defaultRenderQueue = [];
		this.#renderQueue = [];
		this.#renderers = _renderers;
		this.#opacity = 1;


		this.#options = Object.assign(defaultOptions, _options);

		this.#layerId = 'layer_' + this.#options.type + '_' + this.#options.name;

		this.#options = Object.assign({ name : this.#layerId, width : _width, height : _height }, this.#options);

		if (typeof this.#options.groups === 'string') {
			try {
				this.#options.groups = this.#options.groups.replace(/\s*/gi,'').split(/[ ,;]/);
			} catch(e) {
				console.log("Incorrect list of group provided", e);
			}
		}

		// Add default group
		if (!this.#options.groups.includes('default')) {
			this.#options.groups.push('default');
		}

		//console.log(`${this.#options.name}[groups] = ${this.#options.groups}`);

		if (!Array.isArray(this.#options.renderers)) {
			this.#options.renderers = [this.#options.renderers];
		}

		// Empty method to automatically end rendering when layer is hidden
		this.#renderNextFrame = function(){console.log('End of rendering :' + this.#layerId)};


		this.#outputBuffer = new Buffer(_width, _height);
		this.#renderBuffer = new Buffer(_width, _height);

		this.#renderBuffer.context.imageSmoothingEnabled = false;
		this.#outputBuffer.context.imageSmoothingEnabled = false;
		//}

		//console.log(this.#options.renderers);

		// Build default render queue to save some time in renderFrame
		// Since this should not change after creation
		for (var i = 0 ; i < this.#options.renderers.length ; i++) {
			if (typeof this.#renderers[this.#options.renderers[i]] !== 'undefined') {
				this.#defaultRenderQueue.push(this.#renderers[this.#options.renderers[i]]);
			} else {
				console.log(`Renderer ${this.#options.renderers[i]} is not in the list of available renderers`);
			}
		}

		if (typeof this.#options.opacity === 'number') {
			this.setOpacity(this.#options.opacity);
		}


		switch(this.#options.type) {

			case 'image':
				this.#content = new ImageLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this));
				this.#content.load(this.#options.src);
				break;
			case 'video':
				this.#content = new VideoLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this), this.#videoOnPlay.bind(this), this.#videoOnPause.bind(this));
				this.#content.load(this.#options.src, this.#options.mimeType);
				break;
			case 'text':
				this.#content = new TextLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this), this.#layerUpdated.bind(this));
				break;
			case 'sprite':
				this.#content = new SpritesLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this));
				break;
			case 'animation':
				this.#content = new AnimationLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this), this.#videoOnPlay.bind(this), this.#videoOnPause.bind(this));
				break;
			case 'canvas':
				this.#content = new CanvasLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this));
				break;
			default:
				throw new Error(`Unknown Layer type : ${this.#options.type}`);
		}

		//console.log(this.#content);

		//console.log(`${this.#layerId}`, this);
		//PubSub.publish('layer.created', this);
	}

	#requestAnimationFrame() {
		requestAnimationFrame(this.#renderFrame.bind(this));
	}

	#renderFrame() {
		const that = this;

		// clone renderers array;
		this.#renderQueue = [...this.#defaultRenderQueue] || [];

		// If opacity is below 1 add opacity renderer
		if (this.#opacity < 1) {
			this.#renderQueue.push(this.#renderers['opacity']);
		}

		// Get initial data from layer content
		var frameImageData = this.#content.context.getImageData(0, 0, this.#width, this.#height);

		// start renderers queue processing
		this.#processRenderQueue(frameImageData);
	}

	#processRenderQueue(frameImageData) {
		var that = this;

		// if there is a renderer in the queue then run render pass with this renderer
		if (this.#renderQueue.length) {
			var renderer = this.#renderQueue.shift(); // pop renderer from render queue
			
			//console.log(`render pass for ${this.#layerId}`, renderer);
			//console.log(frameImageData.data);

			// render content with current renderer then process next renderer in queue
			renderer.renderFrame(frameImageData.data).then(outputData => {
				//console.log('here');
				that.#processRenderQueue(outputData);
			});
		// no more renderer in queue then draw final image and start queue process again	
		} else {

			// Put final layer data in the output buffer
			that.#outputBuffer.clear();

			//console.log(frameImageData.data);

			createImageBitmap(frameImageData).then( bitmap => {
				that.#outputBuffer.context.drawImage(bitmap, 0, 0);
				// request next frame rendering
				that.#renderNextFrame();
			});
		}
	}

	#videoOnPlay() {
		this.#renderNextFrame = this.#requestAnimationFrame;
		this.#requestAnimationFrame();
	}

	#videoOnPause() {
		this.#renderNextFrame = function(){};
	}

	#layerLoaded() {
		var that = this;

		var startRender = false;

		PubSub.publish('layer.loaded', this);
		// Autoplay video and animation if needed
		if ( (this.#options.type === 'video' || this.#options.type === 'animation') && this.#content.options.autoplay && this.#content.isLoaded) {
			this.#content.play();
			startRender = true;
		}

		if (this.#defaultRenderQueue.length === 0 && this.#opacity === 1) {
			// Put content data in output buffer
			var frameImageData = this.#content.context.getImageData(0, 0, this.#width, this.#height);
		
			this.#outputBuffer.clear();
			createImageBitmap(frameImageData).then( bitmap => {
				that.#outputBuffer.context.drawImage(bitmap, 0, 0);
			});
		}

		// start rendering visible layers which have renderers
		if (this.isVisible() && (this.haveRenderer() || startRender)) {
			this.#renderNextFrame = this.#requestAnimationFrame;
			this.#requestAnimationFrame();
		}

		if (typeof this.#loadedListener === 'function') {
			this.#loadedListener(this);
		}
	}

	#layerUpdated() {
		this.#requestAnimationFrame();
		
		if (typeof this.#updatedListener === 'function') {
			this.#updatedListener(this);
		}
	}
	
	isVisible() {
		return this.#options.visible;
	}

	setVisibility(state) {

		// State didn't change do nothing
		if (!!state === this.#options.visible) {
			return;
		}

		this.#options.visible = !!state;

		// If layer become visible and have renderers then start the rendering loop
		if (this.#options.visible && this.haveRenderer()) {
			this.#renderNextFrame = this.#requestAnimationFrame;
			this.#requestAnimationFrame();
		// Otherwise stop the rendering loop
		} else {
			this.#renderNextFrame = function() {console.log('End of rendering :' + this.#layerId)};
		}

		PubSub.publish('layer.visibilityChanged', this);
	}

	getType() {
		return this.#options.type;
	}

	getName() {
		return this.#options.name;
	}

	toggleVisibility() {
		this.#options.visible = !this.#options.visible;
	}

	get content() {
		return this.#content;
	}

	get data() {
		return this.#outputBuffer.canvas;
	}

	get context() {
		return this.#outputBuffer.context;
	}

	get rawData() {
		return this.#content.data;
	}

	get options() {
		return this.#options;
	}

	haveRenderer() {
		return this.#defaultRenderQueue.length > 0 || (this.#opacity > 0 && this.#opacity < 1);
	}

	getId() {
		return this.#layerId;
	}

	setOpacity(o) {
		var opacity = Math.max(0, Math.min(Number.parseFloat(o), 1));
        this.#opacity = Math.round(opacity * 1e3) / 1e3;
		this.#renderers['opacity'].setOpacity(this.#opacity);
	}

	destroy() {
		this.#renderNextFrame = function(){console.log(`Destroying layer : ${this.#layerId}`)};
	}

}

export { Layer };