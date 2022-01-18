import { Buffer } from './Buffer.mjs';
import { Utils } from './Utils.mjs';
import { Easing } from './Easing.mjs';
//import { CPURenderer } from './renderers/CPURenderer.mjs';
import { GPURenderer } from './renderers/GPURenderer.mjs';
import { ChangeAlphaRenderer } from './renderers/ChangeAlphaRenderer.mjs';
import { RemoveAliasingRenderer } from './renderers/RemoveAliasingRenderer.mjs';
import { OutlineRenderer } from './renderers/OutlineRenderer.mjs';
import { ImageLayer } from './ImageLayer.mjs';
import { CanvasLayer } from './CanvasLayer.mjs';
import { AnimationLayer } from './AnimationLayer.mjs';
import { VideoLayer } from './VideoLayer.mjs';
import { TextLayer } from './TextLayer.mjs';
import { SpritesLayer } from './SpritesLayer.mjs';

class DMD {
	static DotShape = Utils.createEnum(['Square', 'Circle']);
	static LayerType = Utils.createEnum(['Image', 'Canvas', 'Text', 'Video', 'Animation', 'Sprites']);
	
	#outputCanvas;
	#outputContext;
	#xOffset;
	#yOffset;
	#layers;
	#sortedLayers;
	#outputWidth;
	#outputHeight;
	#frameBuffer;
	#fpsBox;
	#zIndex;
	#renderFPS;
	#renderer;
	#isRunning;
	#fps;
	#lastRenderTime;
	#layerRenderers;
	#initDone;
	#backgroundColor;
	#renderNextFrame;

	/**
	 * 
	 * @param {HTMLCanvasElement} outputCanvas Dom Element where the DMD will be drawed
	 * @param {integer} dotSize Horizontal width of the virtual pixels (ex: 1 dot will be 4 pixels wide) 
	 * @param {integer} dotSpace number of 'black' pixels between each column (vertical lines between dots)
	 * @param {integer} xOffset // TODO : horizontal shifting
	 * @param {integer} yOffset  // TODO : vertical shifting
	 * @param {string} dotShape // TODO(GPU) : Shape of the dots (can be square or circle)
	 */
	constructor(outputCanvas, dotSize, dotSpace, xOffset, yOffset, dotShape, backgroundBrightness, brightness, showFPS) {
		this.#outputCanvas = outputCanvas;
		this.#outputContext = this.#outputCanvas.getContext('2d');
		this.#xOffset = xOffset;
		this.#yOffset = yOffset;
		this.#outputWidth = Math.floor(this.#outputCanvas.width / (dotSize + dotSpace));
		this.#outputHeight = Math.floor(this.#outputCanvas.height / (dotSize + dotSpace));
		this.#frameBuffer = new Buffer(this.#outputWidth, this.#outputHeight);
		this.#zIndex = 1;
		this.#sortedLayers = [];
		this.#renderFPS = function () { }; // Does nothing
		this.#backgroundColor = `rgba(14,14,14,255)`;
		this.#isRunning = false;
		this.#fps = 0;
		this.#renderNextFrame = function(){};

		console.log(`Creating a ${this.#outputWidth}x${this.#outputHeight} DMD on a ${this.#outputCanvas.width}x${this.#outputCanvas.height} canvas`);


		//this.#renderer = new CPURenderer(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape);
		this.#renderer = new GPURenderer(this.#outputWidth, this.#outputHeight, this.#outputCanvas.width, this.#outputCanvas.height, dotSize, dotSpace, dotShape || DMD.DotShape.Circle, backgroundBrightness, brightness);

		// Add renderers needed for layers rendering
		this.#layerRenderers = {
			'opacity' : new ChangeAlphaRenderer(this.#outputWidth, this.#outputHeight), // used by layer with opacity < 1
			'no-antialiasing' : new RemoveAliasingRenderer(this.#outputWidth, this.#outputHeight), // used by TextLayer if antialiasing  = false
			'outline' : new OutlineRenderer(this.#outputWidth, this.#outputHeight)  // used by TextLayer when outlineWidth > 1
		};

		this.#initDone = false;

		// IF needed create and show fps div in hte top right corner of the screen
		if (!!showFPS) {
			// Dom element to ouput fps value
			// TODO : Remove later
			this.#fpsBox = document.createElement('div');
			this.#fpsBox.style.position = 'absolute';
			this.#fpsBox.style.right = '0';
			this.#fpsBox.style.top = '0';
			this.#fpsBox.style.zIndex = 99999;
			this.#fpsBox.style.color = 'red';
			this.#fpsBox.style.background = "rgba(255,255,255,0.5)";
			this.#fpsBox.style.padding = '5px';
			this.#fpsBox.style.minWidth = '40px';
			this.#fpsBox.style.textAlign = 'center';

			document.body.appendChild(this.#fpsBox);

			this.#renderFPS = this.#_renderFPS; // Enable fps rendering on top of dmd
		}

		// Reset layers
		this.reset();
	}

	/**
	 * Init DMD renderer then all layer renderers
	 * @returns Promise
	 */
	init() {
		var that = this;

		return new Promise(resolve => {
			var renderers = [];
			Object.keys(this.#layerRenderers).forEach(id => {
				renderers.push(this.#layerRenderers[id].init());
			});

			this.#renderer.init().then(device => {
				Utils.chainPromises(renderers)
					.then(() => {
						this.#initDone = true;
						resolve();
					});
			});
		});
	}

	/**
	 * Start rendering layers
	 */
	run() {
		if (!this.#initDone) {
			throw new Error("call DMD.init() first");
		}

		this.#isRunning = true;
		this.#lastRenderTime = window.performance.now();
		this.#renderNextFrame = this.#requestNextFrame;
		this.#renderNextFrame();
	}

	/**
	 * Stop DMD rendering
	 */
	stop() {
		this.#isRunning = false;
		this.#renderNextFrame = function(){console.log("DMD render stopped")};
	}

	/**
	 * Render output DMD
	 */
	#renderDMD() {
		var that = this;

		// Fill rectangle with background color
		this.#frameBuffer.context.fillStyle = this.#backgroundColor;
		this.#frameBuffer.context.fillRect(0, 0, this.#outputWidth, this.#outputHeight);

		// Draw each visible layer on top of previous one to create the final screen
		this.#sortedLayers.forEach(l => {
			if (this.#layers.hasOwnProperty(l.name)) {
				var layer = this.#layers[l.name];

				if (layer.isVisible() && layer.isLoaded()) {
					// Draw layer content into a buffer
					this.#frameBuffer.context.drawImage(layer.canvas, 0, 0);
				}
			}
		});

		// Get data from the merged layers content
		var frameImageData = this.#frameBuffer.context.getImageData(0, 0, this.#frameBuffer.width, this.#frameBuffer.height);

		// Generate DMD frame
		this.#renderer.renderFrame(frameImageData.data).then(dmdImageData => {

			createImageBitmap(dmdImageData).then(bitmap => {

				// Clear target canvas
				that.#outputContext.clearRect(0, 0, that.#outputCanvas.width, that.#outputCanvas.height);

				// Render final DMD image onto target canvas
				that.#outputContext.drawImage(bitmap, 0, 0);

				// Render FPS box if needed
				that.#renderFPS();

				var now = window.performance.now();
				var delta = (now - that.#lastRenderTime);
				that.#lastRenderTime = now;

				// Calculate FPS
				this.#fps = Math.round((1000 / delta) * 1e2) / 1e2;

				this.#renderNextFrame();
			});

		});
	}

	/**
	 * Update FPS output div with current fps value
	 */
	#_renderFPS() {
		this.#fpsBox.innerHTML = `${this.#fps} fps`;
	}

	/**
	 * Request next Frame rendering cycle
	 */
	#requestNextFrame() {
		requestAnimationFrame(this.#renderDMD.bind(this));
	}

	#sortLayers() {
		this.#sortedLayers = this.#sortedLayers.sort((a, b) => (a.zIndex > b.zIndex) ? 1 : -1);		
	}

	/**
	 * Create a new layer object and add it to the list of layers
	 * @param {string} id : mandatory
	 * @param {string} type : mandatory
	 * @param {object} options
	 * @see BaseLayer for available options
	 * @return layer
	 */
	createLayer(type, id, _options, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener, _zIndex) {

		if (typeof type !== 'string') {
			throw new TypeError("Layers must have a type[image,canvas,animation,text,sprite,video]");
		}

		if (typeof id !== 'string') {
			throw new TypeError("Layers must have a unique id");
		}

		// add zIndex if not specified
		var options = Object.assign({ visible : true }, _options);


		if (typeof this.#layers[id] === 'undefined') {

				var layer;
				switch(type) {
					case DMD.LayerType.Image:
						layer = new ImageLayer(id, this.#outputWidth, this.#outputHeight, options, this.#layerRenderers, _layerLoadedListener,_layerUpdatedListener);
						break;
					case DMD.LayerType.Canvas:
						layer = new CanvasLayer(id, this.#outputWidth, this.#outputHeight, options, this.#layerRenderers, _layerLoadedListener,_layerUpdatedListener);
						break;
					case DMD.LayerType.Animation:
						layer = new AnimationLayer(id, this.#outputWidth, this.#outputHeight, options, this.#layerRenderers, _layerLoadedListener,_layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener);
						break;
					case DMD.LayerType.Text:
						layer = new TextLayer(id, this.#outputWidth, this.#outputHeight, options, this.#layerRenderers, _layerLoadedListener,_layerUpdatedListener);
						break;
					case DMD.LayerType.Video:
						layer = new VideoLayer(id, this.#outputWidth, this.#outputHeight, options, this.#layerRenderers, _layerLoadedListener,_layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener);
						break;
					case DMD.LayerType.Sprites:
						layer = new SpritesLayer(id, this.#outputWidth, this.#outputHeight, options, this.#layerRenderers, _layerLoadedListener, _layerUpdatedListener);
						break;
					default:
						throw new TypeError(`Invalid layer type : ${type}`);
				}

				this.#layers[id] = layer;

				var zIndex = this.#zIndex;

				if (typeof _zIndex === 'number') {
					zIndex = _zIndex;
				} else {
					this.#zIndex++;
				}

				// Add new layer to sorted array
				this.#sortedLayers.push({ name : id, zIndex: zIndex });

				// Sort by zIndex inc
				this.#sortLayers();

				return this.#layers[id];
		} else {
			throw new Error(`Layer [${id}] already exists`);
		}
	}

	/**
	 * Add an external layer object to the DMD
	 * @param {string} id 
	 * @param {BaseLayer} layer
	 */
	addLayer(id, layer, _zIndex) {
		if (typeof this.#layers[id] === 'undefined') {

			if (typeof layer === 'object' &&
				(
					layer.constructor === CanvasLayer ||
					layer.constructor === ImageLayer ||
					layer.constructor === VideoLayer ||
					layer.constructor === TextLayer ||
					layer.constructor === AnimationLayer ||
					layer.constructor === SpritesLayer
			)
			) {

				if (layer.width === this.#outputCanvas.width && layer.height === this.#outputCanvas.height ) {

					var zIndex = this.#zIndex;

					if (typeof _zIndex === 'number') {
						zIndex = _zIndex;
					} else {
						this.#zIndex++;
					}

					this.#layers[id] = layer;
					this.#sortedLayers.push({name : id, zIndex : zIndex});
					this.#sortLayers();
				} else {
					console.error(`Layer[${id}] width/height mismatch : Expected[${this.#outputCanvas.width}x${this.#outputCanvas.height}] but received[${layer.width}x${layer.height}]`);
				}
			} else {
				console.error("Object is not a valid layer object", layer);
			}

		} else {
			console.error(`A layer named '${id}' already exists`);
		}

	}



	/**
	 * Remove specified layer
	 * @param {string/Layer} layer 
	 */
	removeLayer(layer) {
		let layerId;

		if (typeof layer === 'object') {
			layerId = layer.id;
		} else {
			layerId = layer;
		}

		if (typeof this.#layers[layerId] !== 'undefined') {

			this.#layers[layerId].destroy(); // Force stop rendering since delete does seems to GC

			// Remove Layer object from array
			delete this.#layers[layerId];

			// Sort layers without deleted layer
			this.#sortedLayers = this.#sortedLayers.filter(l => { return l.id !== layerId });

			console.log(`Removing layer : ${layerId}`);
		} else {
			console.log('This layer does not exist');
		}
	}

	/**
	 * Show/Hide specified layer
	 * @param {string} id 
	 */
	setLayerVisibility(id, state) {
		if (typeof this.#layers[id] !== 'undefined') {
			this.#layers[id].setVisibility(!!state);
		}
	}

	/**
	 * Show/hid group of layers
	 * @param {string} name 
	 * @param {boolean} state 
	 */
	setLayerGroupVisibility(name, state) {
		Object.keys(this.#layers).forEach(key => {
			if (this.#layers[key].groups.includes(name)) {
				this.#layers[key].setVisibility(!!state);
			}
		});
	}

	/**
	 * Reset DMD
	 */
	reset() {
		this.#layers = {};
		this.#sortedLayers = [];
	}

	/**
	 * Output some info in the console
	 */
	debug() {
		console.log(this.#layers);
		console.log(this.#sortedLayers);
	}

	/**
	 * Get specified layer
	 * @param {string} name 
	 * @returns 
	 */
	getLayer(name) {
		if (typeof this.#layers[name] !== 'undefined') {
			return this.#layers[name];
		} else {
			return null;
		}
	}

	fadeOut(duration) {
		var start = window.performance.now();
		var that = this;

		var startBrightness = that.#renderer.brightness;

		return new Promise(resolve => {
			var cb = function () {
				var delta = window.performance.now() - start;
				var b = startBrightness - Easing.easeOutSine(delta, 0, startBrightness, duration);
				that.#renderer.setBrightness(b);

				if (that.#renderer.brightness <= 0 || delta > duration) {
					that.#renderer.setBrightness(0);
					resolve();
				} else {
					setTimeout(cb, 1);
				}
			}
			cb();
		});
	}

	fadeIn(duration) {
		var start = window.performance.now();
		var that = this;

		var startBrightness = that.#renderer.brightness;

		var cnt = 0;

		return new Promise(resolve => {
			var cb = function () {
				cnt++;
				var delta = window.performance.now() - start;
				//console.log(delta);
				var b = Easing.easeOutSine(delta, startBrightness, 1, duration);
				that.#renderer.setBrightness(b);

				if (that.#renderer.brightness >= 1 || delta > duration) {
					that.#renderer.setBrightness(1);
					//console.log(cnt);
					resolve();
				} else {
					setTimeout(cb, 1);
				}
			}
			cb();
		});
	}

	/**
	 * Set DMD opacity betwewn 0 and 255
	 * @param {number} b
	 */
	setBrightness(b) {
		// Pass brightness to the renderer
		this.#renderer.setBrightness(b);
	}

	/**
	 * Add a renderer instance to the DMD
	 * TODO : Check if really a renderer class
	 * @param {string} id (unique)
	 * @param {object} renderer 
	 */
	addRenderer(id, renderer) {

		if (this.#isRunning) {
			throw new Error("Renderers must be added before calling DMD.init()")
		}

		// TODO check if renderer is a renderer class
		if (typeof this.#layerRenderers[id] === 'undefined') {
			if (typeof renderer === 'object' && typeof renderer.renderFrame === 'function') {
				this.#layerRenderers[id] = renderer;
			} else {
				throw new Error("Renderer object might not be a Renderer class");
			}
		} else {
			throw new Error(`A renderer with this id[${id}] already exists`);
		}
	}

	/**
	 * Get DMD brightness
	 */
	get brightness() {
		return this.#renderer.brightness;
	}

	/**
	 * Get canvas
	 */
	get canvas() {
		return this.#outputCanvas;
	}

	/**
	 * Get canvas context
	 */
	get context() {
		return this.#outputContext;
	}

	/**
	 * Return width of the DND (dots)
	 */
	get dmdWidth() {
		return this.#outputWidth;
	}

	/**
	 * Return height of the DND (dots)
	 */
	get dmdHeight() {
		return this.#outputHeight;
	}

	/**
	 * Return width of the canvas (pixels)
	 */
	get screenWidth() {
		return this.#outputCanvas.width;
	}

	/**
	 * Return height of the canvas (pixels)
	 */
	get screenHeight() {
		return this.#outputCanvas.height;
	}

	/**
	 * Get current fps value
	 */
	get fps() {
		return this.#fps;
	}
}

export { DMD };