// Helper class to create an image buffer
var DMD = DMD || {};

DMD.Buffer = function (width, height) {
	var _canvas = document.createElement('canvas'),
		_context = _canvas.getContext('2d');
		
	_canvas.width = width;
	_canvas.height = height;

	return {
		width : width,
		height : height,
		canvas : _canvas,
		context : _context
	}
};