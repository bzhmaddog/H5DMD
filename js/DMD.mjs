import { Buffer } from './Buffer.mjs';
import { Utils } from './Utils.mjs';
import { Easing } from './Easing.mjs';
import { CPURenderer } from './renderers/CPURenderer.mjs';
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
	#canvas;
	#context;
	#xSpace;
	#ySpace;
	#pixelWidth;
	#pixelHeight;
	#dotShape;
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
	//#testCtx;
	#backgroundColor;
	#cnt;
	#testImage;


	/**
	 * 
	 * @param {integer} oWidth Number of horizontal dots that will appear to the viewer
	 * @param {integer} oHeight Number of vertical dots that will appear to the viewer
	 * @param {integer} cWidth Number of real horizontal pixels of the display
	 * @param {integer} cHeight Number of real vertical pixels of the display 
	 * @param {integer} pixelWidth Horizontal width of the virtual pixels (ex: 1 dot will be 4 pixels wide) 
	 * @param {integer} pixelHeight Vertical height of the virtual pixels (ex: 1 dot will be 4 pixels tall)
	 * @param {integer} xSpace number of 'black' pixels between each column (vertical lines between dots)
	 * @param {integer} ySpace number of 'black' pixels between each row (horizontal lines between dots)
	 * @param {integer} xOffset // TODO : horizontal shifting
	 * @param {integer} yOffset  // TODO : vertical shifting
	 * @param {string} dotShape Shape of the dots (can be square or circle)
	 * @param {*} targetCanvas Dom Element where the DMD will be drawed
	 */
	constructor(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, xOffset, yOffset, dotShape, backgroundBrightness, brightness, targetCanvas, showFPS) {
		this.#canvas = targetCanvas;
		this.#context = this.#canvas.getContext('2d');
		this.#xSpace = xSpace;
		this.#ySpace = ySpace;
		this.#pixelWidth = pixelWidth;
		this.#pixelHeight = pixelHeight;
		this.#dotShape = dotShape;
		this.#outputWidth = oWidth;
		this.#outputHeight = oHeight;
		this.#frameBuffer = new Buffer(oWidth, oHeight);
		this.#zIndex = 1;
		this.#sortedLayers = [];
		this.#renderFPS = function () { }; // Does nothing

		this.#canvas.width = cWidth;
		this.#canvas.height = cHeight;

		this.#cnt = 0;

		this.#testImage = new Image();
		this.#testImage.src = "/resources/tests/white.png";

		this.#backgroundColor = `rgba(14,14,14,255)`;

		this.#isRunning = false;
		this.#fps = 0;
		this.#layerRenderers = {};

		//this.#renderer = new CPURenderer(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape);
		this.#renderer = new GPURenderer(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape, backgroundBrightness, brightness);

		// Add renderers needed for layers rendering
		this.#layerRenderers = {
			'opacity' : new ChangeAlphaRenderer(oWidth, oHeight), // used by layer with opacity < 1
			'no-antialiasing' : new RemoveAliasingRenderer(oWidth, oHeight), // used by TextLayer if antialiasing  = false
			'outline' : new OutlineRenderer(oWidth, oHeight)  // used by TextLayer when outlineWidth > 1
		};

		this.#initDone = false;

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

		this.#dotShape = dotShape || DMD.DotShape.Circle;

		//this.#startTime = window.performance.now();

		//this.#testCtx = document.getElementById('test').getContext('2d');

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
		requestAnimationFrame(this.#renderDMD.bind(this));
	}


	/**
	 * 
	 * @param {integer} timestamp 
	 */
	#renderDMD(timestamp) {
		var that = this;

		// Fill black rectangle (black will be converted to lowest dot intensity)
		this.#frameBuffer.context.fillStyle = this.#backgroundColor;
		//this.#frameBuffer.context.fillStyle = 'black';
		//this.#frameBuffer.context.fillStyle = 'transparent';

		this.#frameBuffer.context.fillRect(0, 0, this.#outputWidth, this.#outputHeight);

		//this.#frameBuffer.context.drawImage(layer.data, 0, 0, this.#frameBuffer.width, this.#frameBuffer.height);

		this.#sortedLayers.forEach(l => {
			if (this.#layers.hasOwnProperty(l.name)) {
				var layer = this.#layers[l.name];

				if (layer.isVisible() && layer.isLoaded()) {
					// Draw layer content into a buffer
					//this.#frameBuffer.context.drawImage(layer.data, 0, 0, this.#frameBuffer.width, this.#frameBuffer.height);
					//createImageBitmap(layer.canvas).then(bitmap => {
					//createImageBitmap(this.#testImage).then(bitmap => {
					this.#frameBuffer.context.drawImage(layer.canvas, 0, 0);
					//});

				}
			}
		});

	
		// Get data from the merged layers content
		var frameImageData = this.#frameBuffer.context.getImageData(0, 0, this.#frameBuffer.width, this.#frameBuffer.height);
		var frameData = frameImageData.data;

		/*if (this.#cnt < 20) {
			console.log(`Render : ${this.#cnt}`, frameData);
		}*/

		/*createImageBitmap(frameImageData).then(bitmap => {
			this.#testCtx.drawImage(bitmap, 0, 0);
		});*/

		this.#renderer.renderFrame(frameData).then(dmdImageData => {

			createImageBitmap(dmdImageData).then(bitmap => {

				that.#context.clearRect(0, 0, that.#canvas.width, that.#canvas.height);
				that.#context.drawImage(bitmap, 0, 0);

				that.#renderFPS();


				var now = window.performance.now();
				var delta = (now - that.#lastRenderTime);
				that.#lastRenderTime = now;

				this.#fps = Math.round((1000 / delta) * 1e2) / 1e2;

				if (that.#isRunning) {
					requestAnimationFrame(that.#renderDMD.bind(that));
					that.#cnt++;
				}

			});

		});
	}

	#_renderFPS() {
		this.#fpsBox.innerHTML = `${this.#fps} fps`;
	}

	/**
	 * Add a new layer
	 * @param {string} id : mandatory
	 * @param {string} type : mandatory
	 * @param {object} options
	 * @see BaseLayer for available options
	 * @return layer
	 */
	addLayer(type, id, _options, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener) {

		if (typeof type !== 'string') {
			throw new TypeError("Layers must have a type[image,canvas,animation,text,sprite,video]");
		}

		if (typeof id !== 'string') {
			throw new TypeError("Layers must have a unique id");
		}

		// add zIndex if not specified
		var options = Object.assign({ zIndex: this.#zIndex, visible: true }, _options);


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

				if (options.zIndex === this.#zIndex) {
					this.#zIndex++;
				}

				// Add new layer to sorted array
				this.#sortedLayers.push({ name: id, zIndex: options.zIndex });

				// Sort by zIndex inc
				this.#sortedLayers = this.#sortedLayers.sort((a, b) => (a.zIndex > b.zIndex) ? 1 : -1);

				return this.#layers[id]
		} else {
			throw new Error(`Layer [${id}] already exists`);
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
	setGroupVisibility(name, state) {
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
		// Pass opacity converted to alpha (integer between 0 and 255) to the renderer
		this.#renderer.setBrightness(b);
	}

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

	get brightness() {
		return this.#renderer.brightness;
	}

	/**
	 * Get canvas
	 */
	get canvas() {
		return this.#canvas;
	}

	/**
	 * Get canvas context
	 */
	get context() {
		return this.#context;
	}

	get dmdWidth() {
		return this.#outputWidth;
	}

	get dmdHeight() {
		return this.#outputHeight;
	}

	get canvasWidth() {
		return this.#canvas.width;
	}

	get canvasHeight() {
		return this.#canvas.height;
	}

	getFPS() {
		return this.#fps;
	}

}

export { DMD };