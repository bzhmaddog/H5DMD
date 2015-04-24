var DMD = function (oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, pixelShape, el) {

	console.log(el);
	
	var canvas = el,
		context = canvas.getContext('2d'),
		xSpace = xSpace,
		ySpace = xSpace,
		pixelWidth = pixelWidth,
		pixelHeight = pixelHeight,
		pixelShape = pixelShape,
		layers = [],
		layerIndexes = {},
		maxXpixels = oWidth,
		maxYpixels = oHeight,
		dmdBuffer = new DMD.Buffer(cWidth, cHeight),
		frameBuffer = new DMD.Buffer(oWidth, oHeight);
		
	canvas.width = cWidth;
	canvas.height = cHeight;

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
		return (x - 1) * pixelWidth * 4  + (x - 1) * xSpace * 4 + (y - 1) * canvas.width * 4 * (pixelHeight + ySpace) ;
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
			pIndex += canvas.width * 4 - pixelWidth * 4;
		}
	}

	function addLayer(name) {
		var layer = DMD.Layer(arguments); // cannot use new here because I want to pass all arguments
		layers.push(layer);
		layerIndexes[name] = layers.length - 1;
	}

	function renderDMD() {
		//console.log(layers.length);
		for (var l = 0 ; l < layers.length ; l++) {
			var layer = layers[l];
			//console.log('renderDMD',l);			
			
			if (layer.isVisible()) {

				
				var dmdImageData = dmdBuffer.context.getImageData(0,0, dmdBuffer.width, dmdBuffer.height);
				var dmdData = dmdImageData.data;

				frameBuffer.context.drawImage(layer.content, 0, 0, frameBuffer.width, frameBuffer.height);
				
				var frameImageData = frameBuffer.context.getImageData(0, 0,frameBuffer.width, frameBuffer.height);
				var frameData = frameImageData.data;
				
				var x = 1;
				var y = 1;
	
				for (var i = 0 ; i < frameBuffer.width * frameBuffer.height *4 ; i+=4) { // each pixel use 4 bytes (RGBA)
					// get the pixel from the current frame
					var r = frameData[i];
					var g = frameData[i+1];
					var b = frameData[i+2];
					var a = frameData[i+3];

					//r = 255;
					//g = 255;
					//b = 255;

					drawPixel(x, y, dmdData, r, g, b, a);

					x++;
					if (x > frameBuffer.width) {
						x = 1;
						y++;
					}
				}
				
				dmdImageData.data = dmdData;
				
				// put the altered data back into the canvas context
				context.putImageData(dmdImageData, 0, 0);				
				
				
				
			}
		}
	}

	setInterval(renderDMD, 20);
	//setTimeout(renderDMD,1000);
	
	return {
		canvas : canvas,
		context : context,
		width : canvas.width,
		height : canvas.height,
		pixelWidth : pixelWidth,
		pixelHeight : pixelHeight,
		getResizedPixelIndex : getResizedPixelIndex,
		//drawPixel : drawPixel,
		addLayer : addLayer
	}
};