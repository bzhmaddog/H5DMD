import { OffscreenBuffer } from './OffscreenBuffer.js';
import { Easing } from './Easing.js';
import { DMDRenderer, DotShape } from './renderers/DMDRenderer.js';
import { IRendererDictionary, Renderer } from './renderers/Renderer.js';
import { BaseLayer, LayerType } from './layers/BaseLayer.js';
import { CanvasLayer } from './layers/CanvasLayer.js';
import { VideoLayer } from './layers/VideoLayer.js';
import { AnimationLayer } from './layers/AnimationLayer.js';
import { SpritesLayer } from './layers/SpritesLayer.js';
import { TextLayer } from './layers/TextLayer.js';
import { Options } from './Options.js';
import { ChangeAlphaRenderer } from './renderers/ChangeAlphaRenderer.js';
import { RemoveAliasingRenderer } from './renderers/RemoveAliasingRenderer.js';
import { OutlineRenderer } from './renderers/OutlineRenderer.js';

//import { LayerType } from './BaseLayer';

//import { IRenderer, IRendererDictionary } from './renderers/IRenderer';


interface ILayerDictionnary {
	[index: string]: BaseLayer
}

interface ILayer {
	id: string,
	zIndex: number
}

class DMD {

	private _outputCanvas: HTMLCanvasElement;
	private _outputContext: CanvasRenderingContext2D;
	private _xOffset: number;
	private _yOffset: number;
	private _layers: ILayerDictionnary;
	private _sortedLayers: ILayer[];
	private _outputWidth: number;
	private _outputHeight: number;
	private _frameBuffer: OffscreenBuffer;
	private _fpsBox: HTMLDivElement;
	private _zIndex: number;
	private _renderer: DMDRenderer;
	private _isRunning: boolean;
	private _fps: number;
	private _lastRenderTime: number;
	private _layerRenderers: IRendererDictionary;
	private _initDone: boolean;
	private _backgroundColor: string;
	private _renderNextFrame: Function;
	private _renderFPS: Function;

	/**
	 * 
	 * @param {HTMLCanvasElement} outputCanvas Dom Element where the DMD will be drawed
	 * @param {number} dotSize Horizontal width of the virtual pixels (ex: 1 dot will be 4 pixels wide) 
	 * @param {number} dotSpace number of 'black' pixels between each column (vertical lines between dots)
	 * @param {number} xOffset // TODO : horizontal shifting
	 * @param {number} yOffset  // TODO : vertical shifting
	 * @param {string} dotShape // TODO(GPU) : Shape of the dots (can be square or circle)
	 * @param {number} backgroundBrightness brightness of the background (below the dots)
	 * @param {number} brightness brightness of the dots
	 * @param {boolean} showFPS show FPS count or not
	 */
	constructor(
		outputCanvas: HTMLCanvasElement,
		dotSize: number,
		dotSpace: number,
		xOffset: number,
		yOffset: number,
		dotShape: DotShape,
		backgroundBrightness: number,
		brightness: number,
		showFPS: boolean
	) {

		this._outputCanvas = outputCanvas;
		this._outputContext = this._outputCanvas.getContext('2d');
		this._xOffset = xOffset;
		this._yOffset = yOffset;
		this._outputWidth = Math.floor(this._outputCanvas.width / (dotSize + dotSpace));
		this._outputHeight = Math.floor(this._outputCanvas.height / (dotSize + dotSpace));
		this._frameBuffer = new OffscreenBuffer(this._outputWidth, this._outputHeight, true);
		this._zIndex = 1;
		this._layers = {} as ILayerDictionnary;
		this._sortedLayers = [];
		this._renderFPS = function () { }; // Does nothing
		this._backgroundColor = `rgba(14,14,14,255)`;
		this._isRunning = false;
		this._fps = 0;
		this._renderNextFrame = function () { };

		console.log(`Creating a ${this._outputWidth}x${this._outputHeight} DMD on a ${this._outputCanvas.width}x${this._outputCanvas.height} canvas`);

		this._renderer = new DMDRenderer(this._outputWidth, this._outputHeight, this._outputCanvas.width, this._outputCanvas.height, dotSize, dotSpace, dotShape || DotShape.Circle, backgroundBrightness, brightness);

		// Add renderers needed for layers rendering
		this._layerRenderers = {
			'opacity' : new ChangeAlphaRenderer(this._outputWidth, this._outputHeight), // used by layer with opacity < 1
			'no-antialiasing' : new RemoveAliasingRenderer(this._outputWidth, this._outputHeight), // used by TextLayer if antialiasing  = false
			'outline' : new OutlineRenderer(this._outputWidth, this._outputHeight)  // used by TextLayer when outlineWidth > 1
		} as IRendererDictionary;

		this._initDone = false;

		// IF needed create and show fps div in hte top right corner of the screen
		if (!!showFPS) {
			// Dom element to ouput fps value
			// TODO : Remove later
			this._fpsBox = document.createElement('div');
			this._fpsBox.style.position = 'absolute';
			this._fpsBox.style.right = '0';
			this._fpsBox.style.top = '0';
			this._fpsBox.style.zIndex = '99999'; // WTF is this a string : check if/where we do addition/substraction
			this._fpsBox.style.color = 'red';
			this._fpsBox.style.background = "rgba(255,255,255,0.5)";
			this._fpsBox.style.padding = '5px';
			this._fpsBox.style.minWidth = '40px';
			this._fpsBox.style.textAlign = 'center';

			document.body.appendChild(this._fpsBox);

			this._renderFPS = this.__renderFPS; // Enable fps rendering on top of dmd
		}

		// Reset layers
		this.reset();
	}

	/**
	 * Init DMD renderer then all layer renderers
	 * @returns Promise
	 */
	init(): Promise<void> {
		var that = this;

		return new Promise(resolve => {

			let renderers: Promise<void>[] = [];

			Object.keys(this._layerRenderers).forEach(id => {
				renderers.push(this._layerRenderers[id].init());
			});

			this._renderer.init().then(device => {

				// Check if it still behave like chainPromises
				Promise.all<void>(renderers).then(() => {
					this._initDone = true;
					resolve();
				});

				/*Utils.chainPromises(renderers)
					.then(() => {
						this.initDone = true;
						resolve();
					});
					*/
			});
		});
	}

	/**
	 * Start rendering layers
	 */
	run() {
		if (!this._initDone) {
			throw new Error("call DMD.init() first");
		}

		this._isRunning = true;
		this._lastRenderTime = window.performance.now();
		this._renderNextFrame = this.requestNextFrame;
		this._renderNextFrame();
	}

	/**
	 * Stop DMD rendering
	 */
	stop() {
		this._isRunning = false;
		this._renderNextFrame = function () { console.log("DMD render stopped") };
	}

	/**
	 * Render output DMD
	 */
	private renderDMD() {
		var that = this;

		// Fill rectangle with background color
		this._frameBuffer.context.fillStyle = this._backgroundColor;
		this._frameBuffer.context.fillRect(0, 0, this._outputWidth, this._outputHeight);

		// Draw each visible layer on top of previous one to create the final screen
		this._sortedLayers.forEach(l => {
			if (this._layers.hasOwnProperty(l.id)) {
				var layer = this._layers[l.id];

				if (layer.isVisible() && layer.isLoaded()) {
					// Draw layer content into a buffer
					this._frameBuffer.context.drawImage(layer.canvas, 0, 0);
				}
			}
		});

		// Get data from the merged layers content
		var frameImageData = this._frameBuffer.context.getImageData(0, 0, this._frameBuffer.width, this._frameBuffer.height);

		// Generate DMD frame
		this._renderer.renderFrame(frameImageData).then((dmdImageData: ImageData) => {

			createImageBitmap(dmdImageData).then(bitmap => {

				// Clear target canvas
				that._outputContext.clearRect(0, 0, that._outputCanvas.width, that._outputCanvas.height);

				// Render final DMD image onto target canvas
				that._outputContext.drawImage(bitmap, 0, 0);

				// Render FPS box if needed
				that._renderFPS();

				var now = window.performance.now();
				var delta = (now - that._lastRenderTime);
				that._lastRenderTime = now;

				// Calculate FPS
				this._fps = Math.round((1000 / delta) * 1e2) / 1e2;

				this._renderNextFrame();
			});

		});
	}

	/**
	 * Update FPS output div with current fps value
	 */
	private __renderFPS() {
		this._fpsBox.innerHTML = `${this.fps} fps`;
	}

	/**
	 * Request next Frame rendering cycle
	 */
	private requestNextFrame() {
		requestAnimationFrame(this.renderDMD.bind(this));
	}

	private sortLayers() {
		this._sortedLayers = this._sortedLayers.sort((a, b) => (a.zIndex > b.zIndex) ? 1 : -1);
	}


	/**
	 * Fase dmd brightness out
	 * @param {number} duration in ms
	 * @returns {Promise<void>} 
	 */
	fadeOut(duration: number): Promise<void> {
		var start = window.performance.now();
		var that = this;

		var startBrightness = that._renderer.brightness;

		return new Promise(resolve => {
			var cb = function () {
				var delta = window.performance.now() - start;
				var b = startBrightness - Easing.easeOutSine(delta, 0, startBrightness, duration);
				that._renderer.setBrightness(b);

				if (that._renderer.brightness <= 0 || delta > duration) {
					that._renderer.setBrightness(0);
					resolve();
				} else {
					setTimeout(cb, 1);
				}
			}
			cb();
		});
	}

	/**
	 * Fade DMD brightness in
	 * @param {number} duration in ms
	 * @returns {Promise<void>}
	 */
	fadeIn(duration: number): Promise<void> {
		var start = window.performance.now();
		var that = this;

		var startBrightness = that._renderer.brightness;

		var cnt = 0;

		return new Promise(resolve => {
			var cb = function () {
				cnt++;
				var delta = window.performance.now() - start;
				//console.log(delta);
				var b = Easing.easeOutSine(delta, startBrightness, 1, duration);
				that._renderer.setBrightness(b);

				if (that._renderer.brightness >= 1 || delta > duration) {
					that._renderer.setBrightness(1);
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
	setBrightness(b: number) {
		// Pass brightness to the renderer
		this._renderer.setBrightness(b);
	}

	createCanvasLayer(
		id: string,
		options: Options,
		layerLoadedListener?: Function,
		layerUpdatedListener?: Function,
	): CanvasLayer {
		return this._createLayer(
			LayerType.Canvas,
			id,
			options,
			layerLoadedListener,
			layerUpdatedListener
		) as CanvasLayer
	}

	createVideoLayer(
		id: string,
		options: Options,
		layerLoadedListener?: Function,
		layerUpdatedListener?: Function,
		layerOnPlayListener?: Function,
		layerOnPauseListener?: Function
		// Why no _layerOnStopListener ?
	): VideoLayer {
		return this._createLayer(
			LayerType.Video,
			id,
			options,
			layerLoadedListener,
			layerUpdatedListener,
			layerOnPlayListener,
			layerOnPauseListener
		) as VideoLayer
	}

	createAnimationLayer(
		id: string,
		options: Options,
		layerLoadedListener?: Function,
		layerUpdatedListener?: Function,
		layerOnPlayListener?: Function,
		layerOnPauseListener?: Function,
		layerOnStopListener?: Function
	): AnimationLayer {
		return this._createLayer(
			LayerType.Animation,
			id,
			options,
			layerLoadedListener,
			layerUpdatedListener,
			layerOnPlayListener,
			layerOnPauseListener,
			layerOnStopListener
		) as AnimationLayer
	}

	createSpriteLayer(
		id: string,
		options: Options,
		layerLoadedListener?: Function,
		layerUpdatedListener?: Function,
	): SpritesLayer {
		return this._createLayer(
			LayerType.Sprites,
			id,
			options,
			layerLoadedListener,
			layerUpdatedListener,
		) as SpritesLayer
	}

	
	createTextLayer(
		id: string,
		options: Options,
		layerLoadedListener?: Function,
		layerUpdatedListener?: Function,
	): TextLayer {
		return this._createLayer(
			LayerType.Text,
			id,
			options,
			layerLoadedListener,
			layerUpdatedListener,
		) as TextLayer
	}

	/**
	 * Remove specified layer
	 * @param {string} id 
	 */
	removeLayer(id: string) {

		if (typeof this._layers[id] !== 'undefined') {

			this._layers[id].destroy(); // Force stop rendering since delete does seems to GC

			// Remove Layer object from array
			delete this._layers[id];

			// Sort layers without deleted layer
			this._sortedLayers = this._sortedLayers.filter(l => { return l.id !== id });

			console.log(`Removing layer : ${id}`);
		} else {
			console.log('This layer does not exist');
		}
	}

	/**
	 * Show/Hide specified layer
	 * @param {string} id 
	 * @param {boolean} state
	 */
	setLayerVisibility(id: string, state: boolean) {
		if (typeof this._layers[id] !== 'undefined') {
			this._layers[id].setVisibility(!!state);
		}
	}
	
	/**
	 * Show/hid group of layers
	 * @param {string} name 
	 * @param {boolean} state 
	 */
	setLayerGroupVisibility(name: string, state: boolean) {
		Object.keys(this._layers).forEach(key => {
			if (this._layers[key].groups.includes(name)) {
				this._layers[key].setVisibility(!!state);
			}
		});
	}
	
	/**
	 * Add a renderer instance to the DMD
	 * TODO : Check if really a renderer class
	 * @param {string} id (unique)
	 * @param {IRenderer} renderer 
	 */
	addRenderer(id: string, renderer: Renderer) {

		if (this._isRunning) {
			throw new Error("Renderers must be added before calling DMD.init()")
		}

		// TODO check if renderer is a renderer class
		if (typeof this._layerRenderers[id] === 'undefined') {
			if (typeof renderer === 'object' && typeof renderer.renderFrame === 'function') {
				this._layerRenderers[id] = renderer;
			} else {
				throw new Error("Renderer object might not be a Renderer class");
			}
		} else {
			throw new Error(`A renderer with this id[${id}] already exists`);
		}
	}
	

	/**
	 * Reset DMD
	 */
	reset() {
		//TODO delete all layer first
		this._layers = {} as ILayerDictionnary;
		this._sortedLayers = [];
	}

	/**
	 * Output some info in the console
	 */
	debug() {
		console.log(this._layers);
		console.log(this._sortedLayers);
	}

	/**
	 * Get specified layer
	 * @param {string} name 
	 * @returns BaseLayer
	 */
	getLayer(name: string): BaseLayer {
		if (typeof this._layers[name] !== 'undefined') {
			return this._layers[name];
		} else {
			return null;
		}
	}

	/**
	 * Get DMD brightness
	 */
	get brightness() {
		return this._renderer.brightness;
	}

	/**
	 * Get canvas
	 */
	get canvas() {
		return this._outputCanvas;
	}

	/**
	 * Get canvas context
	 */
	get context() {
		return this._outputContext;
	}

	/**
	 * Return width of the DND (dots)
	 */
	get width() {
		return this._outputWidth;
	}

	/**
	 * Return height of the DND (dots)
	 */
	get height() {
		return this._outputHeight;
	}

	/**
	 * Return width of the canvas (pixels)
	 */
	get screenWidth() {
		return this._outputCanvas.width;
	}

	/**
	 * Return height of the canvas (pixels)
	 */
	get screenHeight() {
		return this._outputCanvas.height;
	}

	/**
	 * Get current fps value
	 */
	get fps() {
		return this._fps;
	}

	/**
	 * Create a new layer object and add it to the list of layers
	 * @param {string} id : mandatory
	 * @param {LayerType} type : mandatory
	 * @param {object} _options
	 * @see BaseLayer for available options
	 * @return layer
	 */
	private _createLayer(
		type: LayerType,
		id: string,
		_options: Options,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
		_layerOnPlayListener?: Function,
		_layerOnPauseListener?: Function,
		_layerOnStopListener?: Function,
	) {

		// This method is called by child layer creator which can be called from javascript directly so
		// make sure we have an Options object from now on
		var options = new Options(_options);

		if (typeof this._layers[id] === 'undefined') {

			var layer;

			switch (type) {
				case LayerType.Canvas:
					layer = new CanvasLayer(id, this._outputWidth, this._outputHeight, options, this._layerRenderers, _layerLoadedListener, _layerUpdatedListener);
					break;
				case LayerType.Video:
					layer = new VideoLayer(id, this._outputWidth, this._outputHeight, options, this._layerRenderers, _layerLoadedListener,_layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener);
					break;
				case LayerType.Animation:
					layer = new AnimationLayer(id, this._outputWidth, this._outputHeight, options, this._layerRenderers, _layerLoadedListener,_layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener);
					break;
				case LayerType.Sprites:
					layer = new SpritesLayer(id, this._outputWidth, this._outputHeight, options, this._layerRenderers, _layerLoadedListener, _layerUpdatedListener);
					break;	
				case LayerType.Text:
					layer = new TextLayer(id, this._outputWidth, this._outputHeight, options, this._layerRenderers, _layerLoadedListener,_layerUpdatedListener);
					break;
						
				/*case LayerType.Image:
					layer = new ImageLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener);
					break;
				case LayerType.Text:
					layer = new TextLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener);
					break;
*/
				default:
					throw new TypeError(`Invalid layer type : ${type}`);
			}

			this._layers[id] = layer as BaseLayer; // use getType() to retrieve the type later 

			var zIndex = this._zIndex;

			if (options.hasProperty('zIndex')) {
				zIndex = options.get('zIndex');
			} else {
				this._zIndex++;
			}

			// Add new layer to sorted array
			this._sortedLayers.push({ id: id, zIndex: zIndex });

			// Sort by zIndex inc
			this.sortLayers();

			return layer as BaseLayer;
		} else {
			throw new Error(`Layer [${id}] already exists`);
		}
	}

}

export { DMD };