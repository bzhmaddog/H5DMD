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
	
	constructor(_width, _height, _options, _loadedListener, _updatedListener) {

		var defaultOptions = {
			type : '',
			transparent : true,
			visible : true,
			opacity : 1,
			renderer : null
		};

		this.#width = _width;
		this.#height = _height;
		this.#loadedListener = _loadedListener;
		this.#updatedListener = _updatedListener;

		this.#options = Object.assign(defaultOptions, _options);

		this.#layerId = 'layer_' + this.#options.type + '_' + this.#options.name;


		this.#options = Object.assign({ name : this.#layerId, width : _width, height : _height }, this.#options);

		if (this.#options.renderer !== null) {
			this.#hasRenderer = true;
			this.#outputBuffer = new Buffer(_width, _height);
			this.#renderBuffer = new Buffer(_width, _height);

			this.#renderBuffer.context.imageSmoothingEnabled = false;
			this.#outputBuffer.context.imageSmoothingEnabled = false;

			
			requestAnimationFrame(this.#render.bind(this));
		} else {
			this.#hasRenderer = false;
		}

		//console.log(this.#hasRenderer);

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

	#render() {
		const that = this;

		this.#renderBuffer.clear();
		this.#renderBuffer.context.drawImage(this.#content.data, 0, 0);

		//var img  = this.#renderBuffer.canvas.toDataURL("image/png");
		//document.getElementById('test').src = img;

		var frameImageData = this.#renderBuffer.context.getImageData(0, 0, this.#width, this.#height);
		var frameData = frameImageData.data;


		//document.getElementById('test').getContext('2d').putImageData(frameImageData,0,0);

		this.#options.renderer.renderFrame(frameData).then(outputData => {

			that.#outputBuffer.clear();
			that.#outputBuffer.context.putImageData(outputData, 0, 0);

			//console.log(outputData);
			requestAnimationFrame(that.#render.bind(that));
		});
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

}

export { Layer };