DMD.Video = function (width, height) {
	'use strict';
	
	var video = document.createElement('video'); // create a video element (not attached to the dom
	
	video.width = width;
	video.height = height;
	
	video.addEventListener('loadeddata', function () {
		PubSub.publish('video.loaded', video.src);
	});
	
	function load(filename, mimeType) {
		video.type = mimeType;
		video.src = filename; // load the video
	}
	
	video.load = load;

	return video;
}