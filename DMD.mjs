import { Buffer } from './Buffer.mjs';
import { Layer } from './Layer.mjs';
import { Utils } from './Utils.mjs';
import { Easing } from './Easing.mjs';
import { CPURenderer} from './renderers/CPURenderer.mjs';
import { GPURenderer } from './renderers/GPURenderer.mjs';


class DMD {
	static DotShape = Utils.createEnum(['Square','Circle']);
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
	#dmdBuffer;
	#frameBuffer;
	#transparencyBuffer;
	#startTime;
	#frames;
	#lastFrames;
	#fpsBox;
	#zIndex;
	#renderFPS;
	#renderer;
	#isRunning;

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
		this.#dmdBuffer = new Buffer(cWidth, cHeight);
		this.#frameBuffer = new Buffer(oWidth, oHeight);
		this.#transparencyBuffer = new Buffer(oWidth, oHeight);
		this.#startTime = 0;
		this.#frames = 0;
		this.#lastFrames = 0;
		this.#zIndex = 1;
		this.#sortedLayers = [];
		this.#renderFPS = function() {}; // Does nothing
		
		this.#canvas.width = cWidth;
		this.#canvas.height = cHeight;

		this.#isRunning = false;

		//this.#renderer = new CPURenderer(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape);
		this.#renderer = new GPURenderer(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape, backgroundBrightness, brightness);

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

		this.#startTime = new Date().getTime();

		this.reset();

		window.debugDMD = this.debug.bind(this);

		// Start rendering frames
	}

	run() {
		this.#renderer.init().then( device => {
			this.#isRunning = true;
			requestAnimationFrame(this.#renderDMD.bind(this));
		});
	}


	/**
	 * 
	 * @param {integer} timestamp 
	 */
	#renderDMD(timestamp) {
		var that = this;

		// Fill black rectangle (black will be converted to lowest dot intensity)
		this.#frameBuffer.context.fillRect(0, 0, this.#outputWidth, this.#outputHeight);

		this.#sortedLayers.forEach( l =>  {
			if (this.#layers.hasOwnProperty(l.name)) {
				var layer = this.#layers[l.name];

				if (layer.isVisible() && layer.content.isLoaded) {
					// Draw layer content into a buffer
					this.#frameBuffer.context.drawImage(layer.data, 0, 0, this.#frameBuffer.width, this.#frameBuffer.height);

				}
			}
		});

		// Get data from the merged layers content
		var frameImageData = this.#frameBuffer.context.getImageData(0, 0, this.#frameBuffer.width, this.#frameBuffer.height);
		var frameData = frameImageData.data;

		//document.getElementById('test').getContext('2d').putImageData(frameImageData,0,0);
		
		this.#renderer.renderFrame(frameData).then( dmdImageData => {
			that.#context.putImageData(dmdImageData, 0, 0);
			that.#renderFPS();

			if (that.#isRunning) {
				requestAnimationFrame(that.#renderDMD.bind(that));
			}
		});
	}	

	#_renderFPS(){
		// calculate FPS rate
		var now = new Date().getTime();
		var dt = now - this.#startTime;
		var df = this.#frames - this.#lastFrames;

		this.#startTime = now;
		this.#lastFrames = this.#frames;

		var fps = (df * 1000) / dt;

		this.#frames++;

		this.#fpsBox.innerHTML = Math.round(fps) + 'fps';
	}

	#layerdLoaded() {
		//logger.log("Layer loaded");
		//requestAnimationFrame(this.#renderDMD.bind(this));
	}

	#layerUpdated() {
		//logger.log('here');
		//requestAnimationFrame(this.#renderDMD.bind(this));
	}

	/**
	 * Add a new layer
	 * @param {object} options
	 * {
	 *  name : mandatory
	 * 	type : mandatory
	 *  @see Layer for available options
	 * }
	 * @returns 
	 */
	addLayer(_options) {
		if (_options.name === '') {
			logger.log("Please give a name to your layer");
			return;
		}

		// add zIndex if not specified
		var options = Object.assign({ zIndex: this.#zIndex, visible : true}, _options);

		// Only background can have zIndex = 0 this is to make sure it is the first layer to be rendered
		if (options.zIndex === 0) {
			options.zIndex = options.zIndex + 1;
		}

		if (options.hasOwnProperty('name') && typeof this.#layers[options.name] === 'undefined') {
			if (options.hasOwnProperty('type')) {
				this.#layers[options.name] = new Layer(this.#outputWidth, this.#outputHeight, options, this.#layerdLoaded.bind(this), this.#layerUpdated.bind(this));

				if (options.zIndex === this.#zIndex) {
					this.#zIndex++;
				}

				// Add new layer to sorted array
				this.#sortedLayers.push({ name : options.name, zIndex : options.zIndex});
		
				// Sort by zIndex inc
				this.#sortedLayers = this.#sortedLayers.sort((a,b)=> (a.zIndex > b.zIndex) ? 1 : -1);

				return this.#layers[options.name]
			} else {
				logger.log(`Cannot create layer ${options.name}] without a type`);
				return null;
			}
		} else {
			logger.log(`Layer [${options.name}] already exists`);
			return this.#layers[options.name]
		}
	}

	/**
	 * Remove specified layer
	 * @param {string/Layer} layer 
	 */
	removeLayer(layer) {
		let layerName;

		if (typeof layer === 'object') {
			layerName = layer.name;
		} else {
			layerName = layer;
		}

		if (typeof this.#layers[layerName] !== 'undefined') {
			delete this.#layers[layerName];
			this.#sortedLayers = this.#sortedLayers.filter( l => {return l.name !== layerName});			
		} else {
			logger.log('This layer does not exist');
		}
	}

	/**
	 * Show specified layer
	 * @param {string} name 
	 */
	showLayer(name) {
		if (typeof this.#layers[name] !== 'undefined') {
			this.#layers[name].setVisibility(true);
		}
	}

	/**
	 * Hide specified layer
	 * @param {string} name 
	 */
	hideLayer(name) {
		if (name === 'background') {
			logger.log("Cannot hide background layer");
			return;
		}

		if (typeof this.#layers[name] !== 'undefined') {
			logger.log('hideLayer', name);
			this.#layers[name].setVisibility(false);
		}
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
		logger.log(this.#layers);
		logger.log(this.#sortedLayers);
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

}

export { DMD };