import { ImageLayer } from './ImageLayer.mjs';
import { VideoLayer } from './VideoLayer.mjs';
import { TextLayer } from './TextLayer.mjs';
import { SpritesLayer } from './SpritesLayer.mjs';

/**
 * Provide a Layer for the DMD
 */
class Layer {
	#content;
	#layerId;
	#options;
	#loadedListener;
	#updatedListener;
	
	constructor(_width, _height, _options, _loadedListener, _updatedListener) {

		var defaultOptions = {
			type : '',
			transparent : true,
			visible : true,
			opacity : 1
		};

		this.#loadedListener = _loadedListener;
		this.#updatedListener = _updatedListener;

		this.#options = Object.assign(defaultOptions, _options);

		this.#layerId = 'layer_' + this.#options.type + '_' + this.#options.name;


		this.#options = Object.assign({ name : this.#layerId, width : _width, height : _height }, this.#options);


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

	get options() {
		return this.#options;
	}

	getId() {
		return this.#layerId;
	}

}

export { Layer };