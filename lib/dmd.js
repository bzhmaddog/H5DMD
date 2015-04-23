var DMD = function (width, height, pixelWidth, pixelHeight, pixelShape, el) {

	console.log(el);
	
	var canvas = el,
		context = canvas.getContext('2d'),
		pixelWidth = pixelWidth,
		pixelHeight = pixelHeight,
		pixelShape = pixelShape;
		
	canvas.width = width;
	canvas.height = height;

	if (pixelShape !== 'square' && pixelShape !== 'circle') {
		pixelShape = 'square';
	}
	
	/**
	 * Get the index of the pixel at position X,Y in the Canvas
	 * @param x {integer} the column of the position
	 * @param y {integer} the row of the pixel
	 * @result {integer} index of the pixel in the data object
	 */
	function getResizedPixelIndex(x, y) {
		// (x - 1) * 4 = the first pixel doesn't have a space before
		return (x - 1) * pixelWidth * 4  + (x - 1) * 4 + (y - 1) * canvas.width * 4 * (pixelHeight + 1) ;
	}

	function drawPixel(x, y, dataArray, red, green, blue, alpha) {
		var pIndex = getResizedPixelIndex(x, y),
			pOld = pIndex,
			r,
			g,
			b,
			a;

		for (var row = 0 ; row < pixelHeight ; row++) {
			for(var col = 0 ; col < pixelWidth ; col++) {
				r = red;
				g = green;
				b = blue;
				a = alpha;
			
				if (pixelShape === 'circle') {
					if ( (row === 0 && (col === 0 || col === pixelWidth -1)) || (row === pixelHeight -1 && (col === 0 || col === pixelWidth -1))) {
						r = 15;
						g = 14;
						b = 14;
						a = 255;
					}
				}
			
				dataArray[pIndex] = r;
				dataArray[pIndex+1] = g;
				dataArray[pIndex+2] = b;
				dataArray[pIndex+3] = a;
				
				pIndex += 4;
			}
			pIndex += canvas.width * 4 - pixelWidth * 4;
		}
	}

	
	return {
		canvas : canvas,
		context : context,
		width : canvas.width,
		height : canvas.height,
		pixelWidth : pixelWidth,
		pixelHeight : pixelHeight,
		getResizedPixelIndex : getResizedPixelIndex,
		drawPixel : drawPixel
	}
};