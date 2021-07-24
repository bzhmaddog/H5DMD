class DMD {
	#canvas;
	#context;
	#xSpace;
	#ySpace;
	#pixelWidth;
	#pixelHeight;
	#pixelShape;
	#layers;
	#outputWidth;
	#outputHeight;
	#dmdBuffer;
	#frameBuffer;
	#startTime;
	#frames;
	#lastFrames;
	#fpsBox;

	constructor(oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, xOffset, yOffset, pixelShape, targetCanvas) {
		this.#canvas = targetCanvas,
		this.#context = this.#canvas.getContext('2d'),
		this.#xSpace = xSpace,
		this.#ySpace = ySpace,
		this.#pixelWidth = pixelWidth,
		this.#pixelHeight = pixelHeight,
		this.#pixelShape = pixelShape,
		this.#layers = {},
		this.#outputWidth = oWidth,
		this.#outputHeight = oHeight,
		this.#dmdBuffer = new Buffer(cWidth, cHeight),
		this.#frameBuffer = new Buffer(oWidth, oHeight),
		this.#startTime = 0,
		this.#frames = 0,
		this.#lastFrames = 0;
		
		this.#canvas.width = cWidth;
		this.#canvas.height = cHeight;

		this.#fpsBox = document.createElement('div');
		this.#fpsBox.style.position = 'absolute';
		this.#fpsBox.style.right = '0';
		this.#fpsBox.style.top = '0';
		this.#fpsBox.style.zIndex = 99999;
		this.#fpsBox.style.color = 'red';

		document.body.appendChild(this.#fpsBox);

		if (this.#pixelShape !== 'square' && this.#pixelShape !== 'circle') {
			pixelShape = 'square';
		}

		this.#startTime = new Date().getTime();
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

	#drawPixel(x, y, dataArray, red, green, blue, alpha) {
		var pIndex = this.getResizedPixelIndex(x, y),
			pOld = pIndex,
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
			
				if (this.#pixelShape === 'circle') {
					if ( (row === 0 && (col === 0 || col === this.#pixelWidth -1)) || (row === this.#pixelHeight -1 && (col === 0 || col === this.#pixelWidth -1))) {
						r = 0;
						g = 0;
						b = 0;
						a = 255;
					}
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

	#renderDMD(timestamp) {

		for (var name in this.#layers) {
			if (this.#layers.hasOwnProperty(name)) {
				var layer = this.#layers[name];

				if (layer.isVisible() && layer.content.isLoaded) {

					// Get current image
					var dmdImageData = this.#dmdBuffer.context.getImageData(0,0, this.#dmdBuffer.width, this.#dmdBuffer.height);
					var dmdData = dmdImageData.data;

					// Draw layer content into a buffer
					this.#frameBuffer.context.drawImage(layer.content.data, 0, 0, this.#frameBuffer.width, this.#frameBuffer.height);
					
					// Get data from layer content
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

						this.#drawPixel(x, y, dmdData, r, g, b, a);

						x++;
						if (x > this.#frameBuffer.width) {
							x = 1;
							y++;
						}
					}
				
					// put the altered data back into the canvas context
					this.#context.putImageData(dmdImageData, 0, 0);
				}
			}
		}

		var now = new Date().getTime();
		var dt = now - this.#startTime;
		var df = this.#frames - this.#lastFrames;
		this.#startTime = now;
		this.#lastFrames = this.#frames;

		var fps = (df * 1000) / dt;

		this.#frames++;

		this.#fpsBox.innerHTML = Math.round(fps) + 'fps';

		requestAnimationFrame(this.#renderDMD.bind(this));
	}	

	addLayer(options) {
		if (options.hasOwnProperty('name') && typeof this.#layers[options.name] === 'undefined') {
			if (options.hasOwnProperty('type')) {
				this.#layers[options.name] = new Layer(this.#outputWidth, this.#outputHeight, options);
				return this.#layers[options.name]
			} else {
				console.log('Cannot create layer "' + options.name + '" without a type');
				return null;
			}
		} else {
			console.log('Layer "' + options.name + '" already exist');
			return this.#layers[options.name]
		}
	}

	removeLayer(name) {
		if (typeof this.#layers[name] !== 'undefined') {
			delete this.#layers[name];
		}
	}

	showLayer(name) {
		if (typeof this.#layers[name] !== 'undefined') {
			this.#layers[name].setVisibility(true);
		}
	}

	hideLayer(name) {
		if (typeof this.#layers[name] !== 'undefined') {
			console.log('hideLayer', name);
			this.#layers[name].setVisibility(false);
		}
	}

	reset() {
		// TODO : Cleanup objects ? does GC do it by itself ?
		this.#layers = {};
	}

	debug() {
		console.log(this.#layers);
	}

	getLayer(name) {
		if (typeof this.#layers[name] !== 'undefined') {
			return this.#layers[name];
		} else {
			return null;
		}
	}

	get canvas() {
		return this.#canvas;
	}
	
	get context() {
		return this.#context;
	}
}