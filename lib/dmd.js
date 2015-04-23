var DMD = function (width, height, el) {
	var canvas = el,
		context = canvas.getContext('2d');
		
	canvas.width = width;
	canvas.height = height;

	return {
		canvas : canvas,
		context : context,
		width : canvas.width,
		height : canvas.height
	}
};