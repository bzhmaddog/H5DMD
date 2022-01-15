import { DMD } from '../DMD.mjs'

class CPURenderer {
	#xSpace;
	#ySpace;
	#pixelWidth;
	#pixelHeight;
	#dotShape;
    #dmdWidth;
    #dmdHeight;
    #screenWidth;
	#screenHeight;
	#brightness;


    constructor(dmdWidth, dmdHeight, screenWidth, screenHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape) {
        this.#dmdWidth = dmdWidth;
        this.#dmdHeight = dmdHeight;
        this.#screenWidth = screenWidth;
		this.#screenHeight = screenHeight;
        this.#pixelWidth = pixelWidth;
        this.#pixelHeight = pixelHeight;
        this.#xSpace = xSpace;
        this.#ySpace = ySpace;
        this.#dotShape = dotShape;
		this.#brightness = 1;
    }

	init() {
		return new Promise(resolve => {
        	resolve();
		});
    }


    /**
	 * Get the index of the pixel at position X,Y in the Canvas
	 * @param x {integer} the column of the position
	 * @param y {integer} the row of the pixel
	 * @result {integer} index of the pixel in the data object
	 */
	getResizedPixelIndex(x, y) {
		// (x - 1) * 4 = the first pixel doesn't have a space before
		return (x - 1) * this.#pixelWidth * 4  + (x - 1) * this.#xSpace * 4 + (y - 1) * this.#screenWidth * 4 * (this.#pixelHeight + this.#ySpace) ;
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

				// TODO : Brightness

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
			pIndex += this.#screenWidth * 4 - this.#pixelWidth * 4;
		}
	}

   	/**
	 * Render DMD dots
	 * @param frameData input image data
	 * @returns 
	 */
	renderFrame(frameData) {

		//console.log(frameData);

		var dmdImageData = new ImageData(this.#screenWidth, this.#screenHeight)
		var dmdData = dmdImageData.data;

		return new Promise( resolve => {
			var x = 1;
			var y = 1;
		
			// each pixel use 4 bytes (RGBA)
			for (var i = 0 ; i < this.#dmdWidth * this.#dmdHeight * 4 ; i+=4) {
				// get the pixel from the current frame
				var r = frameData[i];
				var g = frameData[i+1];
				var b = frameData[i+2];
				var a = frameData[i+3];

				this.#drawDot(x, y, dmdData, r, g, b, a);

				x++;
				if (x > this.#dmdWidth) {
					x = 1;
					y++;
				}
			}

			resolve(dmdImageData);
		});
	}

	/**
	 * Set brightness of the dots between 0 and 1 (does not affect the background color)
	 * @param {float} b
	 */
	setBrightness(b) {
		this.#brightness = Math.max(0, Math.min(b, 1));
	}
}

export { CPURenderer };