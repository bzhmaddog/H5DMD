/**
 * Extend video element with a load method and an event listener
 * @param width {integer} The width of the video
 * @param height {integer} The height of the video
 */
DMD.Video = function (width, height) {
	'use strict';
	
	console.log(width, height);

	// Create a video element
	var video = document.createElement('video'); // create a video element (not attached to the dom
	
	// set the dimensions
	video.width = width;
	video.height = height;
	
	// Bind loaded event of the video to publish an event so the client 
	// can do whatever it want (example: play the video) 
	video.addEventListener('loadeddata', function () {
		PubSub.publish('video.loaded', video);
	});

	/**
	 * Load a media in the video element
	 */
	function load(filename, mimeType) {
		video.type = mimeType;
		video.src = filename; // load the video
	}

	// Add the new method to our object
	video.load = load;

	// return the created video
	return video;
}