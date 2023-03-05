import { Buffer } from './Buffer';
import { Easing } from './Easing';
import { DMDRenderer } from './renderers/DMDRenderer';
import { ChangeAlphaRenderer } from './renderers/ChangeAlphaRenderer';
import { RemoveAliasingRenderer } from './renderers/RemoveAliasingRenderer';
import { OutlineRenderer } from './renderers/OutlineRenderer';
import { LayerType } from './BaseLayer';
import { IImageLayerOptions, ImageLayer } from './ImageLayer';
import { ICanvasLayerOptions, CanvasLayer } from './CanvasLayer';
import { IAnimationLayerOptions, AnimationLayer } from './AnimationLayer';
import { IVideoLayerOptions, VideoLayer } from './VideoLayer';
import { ITextLayerOptions, TextLayer } from './TextLayer';
import { ISpritesLayerOptions, SpritesLayer } from './SpritesLayer';
import { BaseLayer } from './BaseLayer';
import { IRenderer, IRendererDictionary } from './renderers/IRenderer';


interface ILayerDictionnary {
	[index: string]: BaseLayer
}

interface ILayer {
	id: string,
	zIndex: number
}

class DMD {

	private outputCanvas: HTMLCanvasElement;
	private outputContext: CanvasRenderingContext2D;
	private xOffset: number;
	private yOffset: number;
	private layers: ILayerDictionnary;
	private sortedLayers: ILayer[];
	private outputWidth: number;
	private outputHeight: number;
	private frameBuffer: Buffer;
	private fpsBox: HTMLDivElement;
	private zIndex: number;
	private renderer: GPURenderer;
	private isRunning: boolean;
	private _fps: number;
	private lastRenderTime: number;
	private layerRenderers: IRendererDictionary;
	private initDone: boolean;
	private backgroundColor: string;
	private renderNextFrame: Function;
	private renderFPS: Function;

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

		this.outputCanvas = outputCanvas;
		this.outputContext = this.outputCanvas.getContext('2d');
		this.xOffset = xOffset;
		this.yOffset = yOffset;
		this.outputWidth = Math.floor(this.outputCanvas.width / (dotSize + dotSpace));
		this.outputHeight = Math.floor(this.outputCanvas.height / (dotSize + dotSpace));
		this.frameBuffer = new Buffer(this.outputWidth, this.outputHeight, true);
		this.zIndex = 1;
		this.layers = {} as ILayerDictionnary;
		this.sortedLayers = [];
		this.renderFPS = function () { }; // Does nothing
		this.backgroundColor = `rgba(14,14,14,255)`;
		this.isRunning = false;
		this._fps = 0;
		this.renderNextFrame = function(){};

		console.log(`Creating a ${this.outputWidth}x${this.outputHeight} DMD on a ${this.outputCanvas.width}x${this.outputCanvas.height} canvas`);

		this.renderer = new GPURenderer(this.outputWidth, this.outputHeight, this.outputCanvas.width, this.outputCanvas.height, dotSize, dotSpace, dotShape || DotShape.Circle, backgroundBrightness, brightness);

		// Add renderers needed for layers rendering
		this.layerRenderers = {
			'opacity' : new ChangeAlphaRenderer(this.outputWidth, this.outputHeight), // used by layer with opacity < 1
			'no-antialiasing' : new RemoveAliasingRenderer(this.outputWidth, this.outputHeight), // used by TextLayer if antialiasing  = false
			'outline' : new OutlineRenderer(this.outputWidth, this.outputHeight)  // used by TextLayer when outlineWidth > 1
		} as IRendererDictionary;

		this.initDone = false;

		// IF needed create and show fps div in hte top right corner of the screen
		if (!!showFPS) {
			// Dom element to ouput fps value
			// TODO : Remove later
			this.fpsBox = document.createElement('div');
			this.fpsBox.style.position = 'absolute';
			this.fpsBox.style.right = '0';
			this.fpsBox.style.top = '0';
			this.fpsBox.style.zIndex = '99999'; // WTF is this a string : check if/where we do addition/substraction
			this.fpsBox.style.color = 'red';
			this.fpsBox.style.background = "rgba(255,255,255,0.5)";
			this.fpsBox.style.padding = '5px';
			this.fpsBox.style.minWidth = '40px';
			this.fpsBox.style.textAlign = 'center';

			document.body.appendChild(this.fpsBox);

			this.renderFPS = this._renderFPS; // Enable fps rendering on top of dmd
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

			Object.keys(this.layerRenderers).forEach(id => {
				renderers.push(this.layerRenderers[id].init());
			});

			this.renderer.init().then(device => {

				// Check if it still behave like chainPromises
				Promise.all<void>(renderers).then(() => {
					this.initDone = true;
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
		if (!this.initDone) {
			throw new Error("call DMD.init() first");
		}

		this.isRunning = true;
		this.lastRenderTime = window.performance.now();
		this.renderNextFrame = this.requestNextFrame;
		this.renderNextFrame();
	}

	/**
	 * Stop DMD rendering
	 */
	stop() {
		this.isRunning = false;
		this.renderNextFrame = function(){console.log("DMD render stopped")};
	}

	/**
	 * Render output DMD
	 */
	private renderDMD() {
		var that = this;

		// Fill rectangle with background color
		this.frameBuffer.context.fillStyle = this.backgroundColor;
		this.frameBuffer.context.fillRect(0, 0, this.outputWidth, this.outputHeight);

		// Draw each visible layer on top of previous one to create the final screen
		this.sortedLayers.forEach(l => {
			if (this.layers.hasOwnProperty(l.id)) {
				var layer = this.layers[l.id];

				if (layer.isVisible() && layer.isLoaded()) {
					// Draw layer content into a buffer
					this.frameBuffer.context.drawImage(layer.canvas, 0, 0);
				}
			}
		});

		// Get data from the merged layers content
		var frameImageData = this.frameBuffer.context.getImageData(0, 0, this.frameBuffer.width, this.frameBuffer.height);

		// Generate DMD frame
		this.renderer.renderFrame(frameImageData).then(dmdImageData => {

			createImageBitmap(dmdImageData).then(bitmap => {

				// Clear target canvas
				that.outputContext.clearRect(0, 0, that.outputCanvas.width, that.outputCanvas.height);

				// Render final DMD image onto target canvas
				that.outputContext.drawImage(bitmap, 0, 0);

				// Render FPS box if needed
				that.renderFPS();

				var now = window.performance.now();
				var delta = (now - that.lastRenderTime);
				that.lastRenderTime = now;

				// Calculate FPS
				this._fps = Math.round((1000 / delta) * 1e2) / 1e2;

				this.renderNextFrame();
			});

		});
	}

	/**
	 * Update FPS output div with current fps value
	 */
	private _renderFPS() {
		this.fpsBox.innerHTML = `${this.fps} fps`;
	}

	/**
	 * Request next Frame rendering cycle
	 */
	private requestNextFrame() {
		requestAnimationFrame(this.renderDMD.bind(this));
	}

	private sortLayers() {
		this.sortedLayers = this.sortedLayers.sort((a, b) => (a.zIndex > b.zIndex) ? 1 : -1);
	}

	/**
	 * Create a new layer object and add it to the list of layers
	 * @param {string} id : mandatory
	 * @param {LayerType} type : mandatory
	 * @param {object} options
	 * @see BaseLayer for available options
	 * @return layer
	 */
	private _createLayer(
		type: LayerType,
		id: string,
		options: any,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
		_layerOnPlayListener?: Function,
		_layerOnPauseListener?: Function,
		_layerOnStopListener?: Function,
	) {

		// add zIndex if not specified
		var options = Object.assign({ visible : true }, options);


		if (typeof this.layers[id] === 'undefined') {

			var layer;

			switch(type) {
				case LayerType.Image:
					layer = new ImageLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener);
					break;
				case LayerType.Canvas:
					layer = new CanvasLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener);
					break;
				case LayerType.Animation:
					layer = new AnimationLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener);
					break;
				case LayerType.Text:
					layer = new TextLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener);
					break;
				case LayerType.Video:
					layer = new VideoLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener,_layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener);
					break;
				case LayerType.Sprites:
					layer = new SpritesLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener);
					break;
				default:
					throw new TypeError(`Invalid layer type : ${type}`);
			}

			this.layers[id] = layer as BaseLayer; // use getType() to retrieve the type later 

			var zIndex = this.zIndex;

			if (typeof _zIndex === 'number') {
				zIndex = _zIndex;
			} else {
				this.zIndex++;
			}

			// Add new layer to sorted array
			this.sortedLayers.push({ id: id, zIndex: zIndex });

			// Sort by zIndex inc
			this.sortLayers();

			return this.layers[id];
		} else {
			throw new Error(`Layer [${id}] already exists`);
		}
	}

	createImageLayer(
		id: string,
		_options: IImageLayerOptions,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
	) {
		this._createLayer(
			LayerType.Image,
			id,
			_options,
			_zIndex,
			_layerLoadedListener,
			_layerUpdatedListener
		)
	}

	createCanvasLayer(
		id: string,
		_options: ICanvasLayerOptions,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
	) {
		this._createLayer(
			LayerType.Canvas,
			id,
			_options,
			_zIndex,
			_layerLoadedListener,
			_layerUpdatedListener
		)
	}

	createVideoLayer(
		id: string,
		_options: IVideoLayerOptions,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
		_layerOnPlayListener?: Function,
		_layerOnPauseListener?: Function
		// Why no _layerOnStopListener ?
	) {
		this._createLayer(
			LayerType.Video,
			id,
			_options,
			_zIndex,
			_layerLoadedListener,
			_layerUpdatedListener,
			_layerOnPlayListener,
			_layerOnPauseListener
		)
	}

	createAnimationLayer(
		id: string,
		_options: IAnimationLayerOptions,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
		_layerOnPlayListener?: Function,
		_layerOnPauseListener?: Function,
		_layerOnStopListener?: Function
	) {
		this._createLayer(
			LayerType.Animation,
			id,
			_options,
			_zIndex,
			_layerLoadedListener,
			_layerUpdatedListener,
			_layerOnPlayListener,
			_layerOnPauseListener,
			_layerOnStopListener
		)
	}

	createTextLayer(
		id: string,
		_options: ITextLayerOptions,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
	) {
		this._createLayer(
			LayerType.Text,
			id,
			_options,
			_zIndex,
			_layerLoadedListener,
			_layerUpdatedListener,
		)
	}

	createSpritesLayer(
		id: string,
		_options: ISpritesLayerOptions,
		_zIndex?: number,
		_layerLoadedListener?: Function,
		_layerUpdatedListener?: Function,
	) {
		this._createLayer(
			LayerType.Sprites,
			id,
			_options,
			_zIndex,
			_layerLoadedListener,
			_layerUpdatedListener,
		)
	}



	/**
	 * Add an external layer object to the DMD
	 * @param {string} id 
	 * @param {BaseLayer} layer
	 */
	/*addLayer(id: string, layer: BaseLayer, _zIndex: number) {
		if (typeof this.layers[id] === 'undefined') {

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

				if (layer.width === this.outputCanvas.width && layer.height === this.outputCanvas.height ) {

					var zIndex = this.zIndex;

					if (typeof _zIndex === 'number') {
						zIndex = _zIndex;
					} else {
						this.zIndex++;
					}

					this.layers[id] = layer;
					this.sortedLayers.push({name : id, zIndex : zIndex});
					this.sortLayers();
				} else {
					console.error(`Layer[${id}] width/height mismatch : Expected[${this.outputCanvas.width}x${this.outputCanvas.height}] but received[${layer.width}x${layer.height}]`);
				}
			} else {
				console.error("Object is not a valid layer object", layer);
			}

		} else {
			console.error(`A layer named '${id}' already exists`);
		}

	}*/



	/**
	 * Remove specified layer
	 * @param {string} id 
	 */
	removeLayer(id: string) {

		if (typeof this.layers[id] !== 'undefined') {

			this.layers[id].destroy(); // Force stop rendering since delete does seems to GC

			// Remove Layer object from array
			delete this.layers[id];

			// Sort layers without deleted layer
			this.sortedLayers = this.sortedLayers.filter(l => { return l.id !== id });

			console.log(`Removing layer : ${id}`);
		} else {
			console.log('This layer does not exist');
		}
	}

	/*removeLayer(layer: BaseLayer) {
		this.removeLayer(layer.id);
	}*/

	/**
	 * Show/Hide specified layer
	 * @param {string} id 
	 * @param {boolean} state
	 */
	setLayerVisibility(id: string, state: boolean) {
		if (typeof this.layers[id] !== 'undefined') {
			this.layers[id].setVisibility(!!state);
		}
	}

	/**
	 * Show/hid group of layers
	 * @param {string} name 
	 * @param {boolean} state 
	 */
	setLayerGroupVisibility(name: string, state: boolean) {
		Object.keys(this.layers).forEach(key => {
			if (this.layers[key].groups.includes(name)) {
				this.layers[key].setVisibility(!!state);
			}
		});
	}

	/**
	 * Reset DMD
	 */
	reset() {
		this.layers = {} as ILayerDictionnary;
		this.sortedLayers = [];
	}

	/**
	 * Output some info in the console
	 */
	debug() {
		console.log(this.layers);
		console.log(this.sortedLayers);
	}

	/**
	 * Get specified layer
	 * @param {string} name 
	 * @returns BaseLayer
	 */
	getLayer(name: string): BaseLayer {
		if (typeof this.layers[name] !== 'undefined') {
			return this.layers[name];
		} else {
			return null;
		}
	}

	/**
	 * Fase dmd brightness out
	 * @param {number} duration in ms
	 * @returns {Promise<void>} 
	 */
	fadeOut(duration: number): Promise<void> {
		var start = window.performance.now();
		var that = this;

		var startBrightness = that.renderer.brightness;

		return new Promise(resolve => {
			var cb = function () {
				var delta = window.performance.now() - start;
				var b = startBrightness - Easing.easeOutSine(delta, 0, startBrightness, duration);
				that.renderer.setBrightness(b);

				if (that.renderer.brightness <= 0 || delta > duration) {
					that.renderer.setBrightness(0);
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

		var startBrightness = that.renderer.brightness;

		var cnt = 0;

		return new Promise(resolve => {
			var cb = function () {
				cnt++;
				var delta = window.performance.now() - start;
				//console.log(delta);
				var b = Easing.easeOutSine(delta, startBrightness, 1, duration);
				that.renderer.setBrightness(b);

				if (that.renderer.brightness >= 1 || delta > duration) {
					that.renderer.setBrightness(1);
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
		this.renderer.setBrightness(b);
	}

	/**
	 * Add a renderer instance to the DMD
	 * TODO : Check if really a renderer class
	 * @param {string} id (unique)
	 * @param {IRenderer} renderer 
	 */
	addRenderer(id: string, renderer: IRenderer) {

		if (this.isRunning) {
			throw new Error("Renderers must be added before calling DMD.init()")
		}

		// TODO check if renderer is a renderer class
		if (typeof this.layerRenderers[id] === 'undefined') {
			if (typeof renderer === 'object' && typeof renderer.renderFrame === 'function') {
				this.layerRenderers[id] = renderer;
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
		return this.renderer.brightness;
	}

	/**
	 * Get canvas
	 */
	get canvas() {
		return this.outputCanvas;
	}

	/**
	 * Get canvas context
	 */
	get context() {
		return this.outputContext;
	}

	/**
	 * Return width of the DND (dots)
	 */
	get width() {
		return this.outputWidth;
	}

	/**
	 * Return height of the DND (dots)
	 */
	get height() {
		return this.outputHeight;
	}

	/**
	 * Return width of the canvas (pixels)
	 */
	get screenWidth() {
		return this.outputCanvas.width;
	}

	/**
	 * Return height of the canvas (pixels)
	 */
	get screenHeight() {
		return this.outputCanvas.height;
	}

	/**
	 * Get current fps value
	 */
	get fps() {
		return this._fps;
	}
}

export { DMD, DotShape };