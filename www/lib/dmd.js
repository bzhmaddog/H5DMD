var DMD = function (oWidth, oHeight, cWidth, cHeight, pixelWidth, pixelHeight, xSpace, ySpace, xOffset, yOffset, pixelShape, el) {

	var canvas = el,
		context = canvas.getContext('2d'),
		xSpace = xSpace,
		ySpace = xSpace,
		pixelWidth = pixelWidth,
		pixelHeight = pixelHeight,
		pixelShape = pixelShape,
		layers = {},
		width = oWidth,
		height = oHeight,
		dmdBuffer = new DMD.Buffer(cWidth, cHeight),
		frameBuffer = new DMD.Buffer(oWidth, oHeight),
		strings = strings,
		startTime,
		frames = 0,
		lastFrames = 0;
		
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

	function addLayer(options) {
		if (options.hasOwnProperty('name') && typeof layers[options.name] === 'undefined') {
			if (options.hasOwnProperty('type')) {
				layers[options.name] = new DMD.Layer(width, height, options);
			} else {
				console.log('Cannot create layer "' + options.name + '" without a type');
			}
		} else {
			console.log('Layer "' + options.name + '" already exist');
		}
	}

	function removeLayer(name) {
		if (typeof layers[name] !== 'undefined') {
			delete layers[name];
		}
	}

	function showLayer(name) {
		if (typeof layers[name] !== 'undefined') {
			layers[name].setVisibility(true);
		}
	}

	function hideLayer(name) {
		if (typeof layers[name] !== 'undefined') {
			console.log('hideLayer', name);
			layers[name].setVisibility(false);
		}
	}

	function reset() {
		layers = {};
	}

	function debug() {
		console.log(layers);
	}

	function renderDMD(timestamp) {
		//console.log(layers);
		for (var name in layers) {
			if (layers.hasOwnProperty(name)) {
				var layer = layers[name];

				if (layer.isVisible()) {

					// Get current image
					var dmdImageData = dmdBuffer.context.getImageData(0,0, dmdBuffer.width, dmdBuffer.height);
					var dmdData = dmdImageData.data;

					// Draw layer content into a buffer
					frameBuffer.context.drawImage(layer.content, 0, 0, frameBuffer.width, frameBuffer.height);
					
					// Get data from layer content
					var frameImageData = frameBuffer.context.getImageData(0, 0,frameBuffer.width, frameBuffer.height);
					var frameData = frameImageData.data;
					
					var x = 1;
					var y = 1;
		
					// each pixel use 4 bytes (RGBA)
					for (var i = 0 ; i < frameBuffer.width * frameBuffer.height * 4 ; i+=4) {
						// get the pixel from the current frame
						var r = frameData[i];
						var g = frameData[i+1];
						var b = frameData[i+2];
						var a = frameData[i+3];

						drawPixel(x, y, dmdData, r, g, b, a);

						x++;
						if (x > frameBuffer.width) {
							x = 1;
							y++;
						}
					}
					
					dmdImageData.data = dmdData;

					
					// put the altered data back into the canvas context
					//context.putImageData(dmdImageData, 0, 0);				
					context.putImageData(dmdImageData, 0, 0);
				}
			}
		}

		var now = new Date().getTime();
		var dt = now - startTime;
		var df = frames - lastFrames;
		startTime = now;
		lastFrames = frames;

		var fps = (df * 1000) / dt;

		frames++;


		document.getElementById('fps-box').innerHTML = Math.round(fps) + 'fps';



		requestAnimationFrame(renderDMD);
	}

	function getLayer(name) {
		if (typeof layers[name] !== 'undefined') {
			return layers[name];
		} else {
			return null;
		}
	}

	//setInterval(renderDMD, 1);
	//setTimeout(renderDMD,1000);
	startTime = new Date().getTime();
	requestAnimationFrame(renderDMD);




	
	return {
		canvas : canvas,
		context : context,
		width : canvas.width,
		height : canvas.height,
		pixelWidth : pixelWidth,
		pixelHeight : pixelHeight,
		getResizedPixelIndex : getResizedPixelIndex,
		addLayer : addLayer,
		removeLayer : removeLayer,
		showLayer : showLayer,
		hideLayer : hideLayer,
		reset : reset,
		debug : debug,
		getLayer : getLayer,
	}
};