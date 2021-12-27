import { ImageLayer } from './ImageLayer.mjs';
import { VideoLayer } from './VideoLayer.mjs';
import { TextLayer } from './TextLayer.mjs';
import { SpritesLayer } from './SpritesLayer.mjs';
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
	#hasRenderer;
	#outputBuffer;
	#renderBuffer;
	#width;
	#height;
	#renderQueue;
	
	constructor(_width, _height, _options, _loadedListener, _updatedListener) {

		var defaultOptions = {
			type : '',
			transparent : true,
			visible : true,
			opacity : 1,
			renderers : [],
			groups: []
		};

		this.#width = _width;
		this.#height = _height;
		this.#loadedListener = _loadedListener;
		this.#updatedListener = _updatedListener;
		this.#hasRenderer = false;
		this.#renderQueue = [];

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


		// If any renderer have been added to this layer then run rendering loop
		if (Array.isArray(this.#options.renderers) && this.#options.renderers.length > 0) {
			this.#hasRenderer = true;
			this.#outputBuffer = new Buffer(_width, _height);
			this.#renderBuffer = new Buffer(_width, _height);

			this.#renderBuffer.context.imageSmoothingEnabled = false;
			this.#outputBuffer.context.imageSmoothingEnabled = false;

			
			//requestAnimationFrame(this.#render.bind(this));
		}

		//console.log(this.#options.renderers);

		switch(this.#options.type) {

			case 'image':
				this.#content = new ImageLayer(this.#layerId, this.#layerLoaded.bind(this));
				this.#content.load(this.#options.src);
				break;
			case 'video':
				this.#content = new VideoLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this));
				this.#content.load(this.#options.src, this.#options.mimeType);
				break;
			case 'text':
				this.#content = new TextLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this), this.#layerUpdated.bind(this));
				break;
			case 'sprite':
				this.#content = new SpritesLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this));

		}

		PubSub.publish('layer.created', this);
	}

	#renderFrame() {
		const that = this;

		// clone renderers array;
		this.#renderQueue = [...this.#options.renderers];

		// draw raw layer content in tmp buffer
		this.#renderBuffer.clear();
		this.#renderBuffer.context.drawImage(this.#content.data, 0, 0);

		// get buffer data
		var frameImageData = this.#renderBuffer.context.getImageData(0, 0, this.#width, this.#height);

		// start render queue processing
		this.#processRenderQueue(frameImageData);
	}

	#processRenderQueue(frameImageData) {
		var that = this;

		// if there is a renderer in the queue then run render pass with this renderer
		if (this.#renderQueue.length) {
			var renderer = this.#renderQueue.shift(); // pop renderer from render queue

			// render content with current renderer then process next renderer in queue
			renderer.renderFrame(frameImageData.data).then(outputData => {
				that.#processRenderQueue(outputData);
			});
		// no more renderer in queue then draw final image and start queue process again	
		} else {
			that.#outputBuffer.clear();
			that.#outputBuffer.context.putImageData(frameImageData, 0, 0);
			//console.log('here');
			requestAnimationFrame(that.#renderFrame.bind(that));
		}
	}

	#layerLoaded() {
		PubSub.publish('layer.loaded', this);
		// Autoload video if needed
		if (this.#options.type === 'video' && this.#content.options.autoplay && this.#content.isLoaded) {
			this.#content.data.play();
		}

		if (typeof this.#loadedListener === 'function') {
			this.#loadedListener(this);
		}

		// start rendering
		if (this.#hasRenderer) {
			console.log(this.#layerId);
			requestAnimationFrame(this.#renderFrame.bind(this));
		}
	}

	#layerUpdated() {
		if (typeof this.#updatedListener === 'function') {
			this.#updatedListener(this);
		}
	}
	
	isVisible() {
		return this.#options.visible;
	}

	setVisibility(state) {
		this.#options.visible = !!state;
		PubSub.publish('layer.visibilityChanged', this)
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
		if (!this.#hasRenderer) {
			return this.#content.data;
		} else {
			return this.#outputBuffer.canvas;
			//return this.#content.data;
		}
	}

	get rawData() {
		return this.#content.data;
	}

	get options() {
		return this.#options;
	}

	getId() {
		return this.#layerId;
	}

	isTransparent() {
		return this.#options.transparent;
	}

}

export { Layer };