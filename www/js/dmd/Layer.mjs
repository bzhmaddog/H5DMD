import { ImageLayer } from './ImageLayer.mjs';
import { VideoLayer } from './VideoLayer.mjs';
import { TextLayer } from './TextLayer.mjs';

/**
 * Provide a Layer for the DMD
 */
class Layer {
	#content;
	#layerId;
	#options;
	
	constructor(_width, _height, _options) {

		var defaultOptions = {
			type : '',
			transparent : true,
			visible : true,
			opacity : 1
		};

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
				this.#content = new TextLayer(this.#layerId, this.#options, this.#layerLoaded.bind(this));
				break;

		}

		PubSub.publish('layer.created', this);
	}

	#layerLoaded() {
		PubSub.publish('layer.loaded', this);
		// Autoload video if needed
		if (this.#options.type === 'video' && this.#content.options.autoplay && this.#content.isLoaded) {
			this.#content.data.play();
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

}

export { Layer };