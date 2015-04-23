(function () {
	//'use strict';
	
	var DMDBackgroundImage = new Image(),	// The DMD Background image
		DMDErrorBackgroundImage = new Image(),
		messagesHandler = DMD.messagesHandler,
		dmd,
		video = new DMD.Video(320, 62),
		dmdBuffer,
		videoBuffer,
		server,
		score = 0;

		video.loop = true;
		//video.controls = true;
		
	// When dom is loaded create the objects and bind the events
	document.addEventListener('DOMContentLoaded', function () {

		// when the bg image is loaded then render background only
		DMDBackgroundImage.addEventListener('load', function () {
			renderBackground(DMDBackgroundImage);
		});
		
		// Load the background image
		DMDBackgroundImage.src = 'img/dmd-3x3.png';
		DMDErrorBackgroundImage.src = 'img/dmd-3x3-error.png';
	
		//document.body.appendChild(video);
		PubSub.subscribe('video.load', function (ev, data) {
			var sToken;
			
			if (data.play) {
				sToken = PubSub.subscribe('video.loaded', function () {
					video.play();
					PubSub.unsubscribe(sToken);
				});
			}
			video.load(data.file, data.type);
		});

		// Connect to the server via a websocket
		server = new WebSocket('ws://127.0.0.1:1337', ['soap', 'xmpp']);
		
		// bind onmessage event
		server.onmessage = messagesHandler.processMessage;

		// Bind error event to display it on the DMD
		server.onerror = function (error) {
		  console.log('WebSocket Error ' + error);
		  renderBackground(DMDErrorBackgroundImage);
		};
		
		dmd = new DMD(1280, 248, document.getElementById('dmd'));
		// Get the visible canvas and its context

		// Create the buffers we need
		dmdBuffer = new DMD.Buffer(dmd.width, dmd.height);
		videoBuffer = new DMD.Buffer(video.width, video.height);
		
		
		// start rendering frames when play is pressed
		// also start increasing the score randomly
		video.addEventListener('play', function(){
			renderFrame();
		},false);
	
	},false);


function pingServer() {
	try {
		server.send('ping');
	} catch (ee) {
		console.log('hello');
	}
}
	



/**
 * Get the index of the pixel at position X,Y in the Canvas
 * @param x {integer} the column of the position
 * @param y {integer} the row of the pixel
 * @result {integer} index of the pixel in the data object
 */
function getResizedPixelIndex(x, y) {
	// each pixel use 4 bytes. Our DMD is 3x3 pixel and 1px between each pixel
	// 12 = 3px * 4bytes
	// (x - 1) * 4 = the first pixel doesn't have a space before
	return (x - 1) * 12 + (x - 1) * 4 + (y - 1) * 1280 * 4 * 4 ;
} 

/**
 * Format a number with commas
 * @param nStr {string} a number as a string
 * @result {string} a formatted number
 */
function addCommas(nStr) {
	var x,
		x1,
		x2,
		rgx = /(\d+)(\d{3})/;

	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
} 

/**
 * Render our background image in the DMD canvas
 */
function renderBackground(image) {
	// draw the background image in the buffering canvas
	dmdBuffer.context.drawImage(image, 0, 0,dmdBuffer.width, dmdBuffer.height);

	var backImageData = dmdBuffer.context.getImageData(0,0, dmdBuffer.width, dmdBuffer.height);
	var backData = backImageData.data;

	backImageData.data = backData;
	dmd.context.putImageData(backImageData, 0, 0);
}

/**
 * Render the DMD
 */ 
function renderFrame() {
	if(video.paused || video.ended) {
		//return false;
	}

	// Get current frame (just an alias)
	var frame = video;

	// draw the background image in the buffering canvas
	//dmdBuffer.context.drawImage(DMDBackgroundImage, 0, 0,dmdBuffer.width, dmdBuffer.height);

	// draw the current video image in the frame buffer
	videoBuffer.context.drawImage(frame, 0, 0, video.width, video.height);
	
	videoBuffer.context.font = '22pt Arial';
	videoBuffer.context.fillStyle = '#de8e01';
	videoBuffer.context.strokeStyle = '#fff';
	videoBuffer.context.textAlign = 'right';
	videoBuffer.context.fillText(addCommas(score.toString()), 320, 25);	
	
	// Grab the pixel data from the backing canvas
	var backImageData = dmdBuffer.context.getImageData(0,0, dmdBuffer.width, dmdBuffer.height);
	var backData = backImageData.data;
	
	var frameImageData = videoBuffer.context.getImageData(0, 0,video.width, video.height);
	var frameData = frameImageData.data;

	// Loop through the pixels, turning them grayscale
	var p = 0;
	
	var x = 1;
	var y = 1;
	
	for (var i = 0 ; i < 320*62*4 ; i+=4) { // each pixel use 4 bytes (RGBA)
	//for (var i = 0 ; i < 1280*2 ; i+=4) { // each pixel use 4 bytes (RGBA)
		
		// get the pixel from the current frame
		var r = frameData[i];
		var g = frameData[i+1];
		var b = frameData[i+2];
		var a = frameData[i+3];

		// get the data index for this pixel in the DMD
		// use mapping to get fast results
		var pIndex = getResizedPixelIndex(x, y);
		
		for (var row = 0 ; row < 3 ; row++) {
			for(var col = 0 ; col < 3 ; col++) {
				backData[pIndex] = r;
				backData[pIndex+1] = g;
				backData[pIndex+2] = b;
				backData[pIndex+3] = a;
				
				pIndex += 4;
			}
			pIndex += 1280 * 4 - 12;
		}
		p++;

		x++;
	
		if (x > video.width) {
			x = 1;
			y++;
		}
	}
	
	backImageData.data = backData;
	
	dmd.context.putImageData(backImageData, 0, 0);

	// Render nextFrame
	setTimeout(renderFrame, 20);
}

})();