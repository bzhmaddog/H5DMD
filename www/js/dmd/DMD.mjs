import { Buffer } from './Buffer.mjs';
import { Layer } from './Layer.mjs';
import { Utils } from '../utils/Utils.mjs';


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
	#startTime;
	#frames;
	#lastFrames;
	#fpsBox;
	#backgroundLayer;
	#zIndex;
	#renderFPS;
	#dmdImageData;
	#dmdData;

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
	constructor(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, xOffset, yOffset, dotShape, targetCanvas, showFPS) {
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
		this.#startTime = 0;
		this.#frames = 0;
		this.#lastFrames = 0;
		this.#zIndex = 1;
		this.#sortedLayers = [];
		this.#renderFPS = function() {}; // Does nothing
		
		this.#canvas.width = cWidth;
		this.#canvas.height = cHeight;

		this.#dmdImageData = new ImageData(this.#dmdBuffer.width, this.#dmdBuffer.height)
		this.#dmdData = this.#dmdImageData.data;


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


		this.#backgroundLayer = new Layer(this.#outputWidth, this.#outputHeight, {
			name : 'background',
			type : 'image',
			src : 'images/background.webp',
			mimeType : 'image/webp',
			transparent : false,
			zIndex : 0
		});

		this.reset();

		window.debugDMD = this.debug.bind(this);

		// Start rendering frames
		requestAnimationFrame(this.#renderDMD.bind(this));
	}
	
	/**
	 * Get the index of the pixel at position X,Y in the Canvas
	 * @param x {integer} the column of the position
	 * @param y {integer} the row of the pixel
	 * @result {integer} index of the pixel in the data object
	 */
	getResizedPixelIndex(x, y) {
		// (x - 1) * 4 = the first pixel doesn't have a space before
		return (x - 1) * this.#pixelWidth * 4  + (x - 1) * this.#xSpace * 4 + (y - 1) * this.#canvas.width * 4 * (this.#pixelHeight + this.#ySpace) ;
	}

	/**
	 * 
	 * @param {integer} x 
	 * @param {integer} y 
	 * @param {array} dataArray 
	 * @param {integer} red 
	 * @param {integer} green 
	 * @param {integer} blue 
	 * @param {integer} alpha 
	 */	
	#drawDot(x, y, dataArray, red, green, blue, alpha) {
		var pIndex = this.getResizedPixelIndex(x, y),
			r,
			g,
			b,
			a;

		for (var row = 0 ; row < this.#pixelHeight ; row++) {
			for(var col = 0 ; col < this.#pixelWidth ; col++) {
				r = red;
				g = green;
				b = blue;
				a = alpha;

			
				if (this.#dotShape === DMD.DotShape.Circle) {
					if ( (row === 0 && (col === 0 || col === this.#pixelWidth -1)) || (row === this.#pixelHeight -1 && (col === 0 || col === this.#pixelWidth -1))) {
						r = 0;
						g = 0;
						b = 0;
						a = 255;
					}
				}

				// Hack Pixels that are too dark  to make then look like the background (15,15,15)
				// TODO : Get background color from a variable
				if (r < 15 && g < 15 && b < 15) {
					r = 15;
					g = 15;
					b = 15;
					a = 255;
				}
			
				dataArray[pIndex] = r;
				dataArray[pIndex+1] = g;
				dataArray[pIndex+2] = b;
				dataArray[pIndex+3] = a;
				
				pIndex += 4;
			}
			pIndex += this.#canvas.width * 4 - this.#pixelWidth * 4;
		}
	}

	/**
	 * 
	 * @param {integer} timestamp 
	 */
	#renderDMD(timestamp) {

		//logger.log(this.#layers);

		this.#sortedLayers.forEach( l =>  {
			if (this.#layers.hasOwnProperty(l.name)) {
				var layer = this.#layers[l.name];

				if (layer.isVisible() && layer.content.isLoaded) {
					// Draw layer content into a buffer
					this.#frameBuffer.context.drawImage(layer.content.data, 0, 0, this.#frameBuffer.width, this.#frameBuffer.height);
				}
			}
		});

		// Get data from the merged layers content
		var frameImageData = this.#frameBuffer.context.getImageData(0, 0, this.#frameBuffer.width, this.#frameBuffer.height);
		var frameData = frameImageData.data;
					
		var x = 1;
		var y = 1;
		
		// each pixel use 4 bytes (RGBA)
		for (var i = 0 ; i < this.#frameBuffer.width * this.#frameBuffer.height * 4 ; i+=4) {
			// get the pixel from the current frame
			var r = frameData[i];
			var g = frameData[i+1];
			var b = frameData[i+2];
			var a = frameData[i+3];

			this.#drawDot(x, y, this.#dmdData, r, g, b, a);

			x++;
			if (x > this.#frameBuffer.width) {
				x = 1;
				y++;
			}
		}
	
		// put the altered data back into the canvas context
		// which draw the dmd dots on the screen
		this.#context.putImageData(this.#dmdImageData, 0, 0);


		this.#renderFPS();

		// request render next frame
		requestAnimationFrame(this.#renderDMD.bind(this));
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
		if (_options.name === 'background') {
			logger.log("'background' is a reserver name. Please choose another name for you layer");
			return;
		}

		// add zIndex if not specified
		var options = Object.assign({ zIndex: this.#zIndex}, _options);

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
	 * @param {string} name 
	 */
	removeLayer(name) {
		if (name === 'background') {
			logger.log("Cannot remove background layer");
			return;
		}

		if (typeof this.#layers[name] !== 'undefined') {
			delete this.#layers[name];
			this.#sortedLayers = this.#sortedLayers.filter( l => {return l.name !== name});			
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
		// TODO : Cleanup objects ? does GC do it by itself ?
		this.#layers = {
			'background' : this.#backgroundLayer
		};
		this.#sortedLayers = [ {name : 'background', zIndex : 0}];
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
}

export { DMD };