/**
 * Provide a simple class to build a buffer for our layers and our DMD
 * @param width {integer} The width of the buffer
 * @param height {integer} The height of the buffer
 */
DMD.Buffer = function (width, height) {
	var canvas = document.createElement('canvas'),
		context = canvas.getContext('2d');
		
	canvas.width = width;
	canvas.height = height;

	// return an object with the width/height and the canvas and its context
	return {
		width : width,
		height : height,
		canvas : canvas,
		context : context
	}
};