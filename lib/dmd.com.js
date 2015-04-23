DMD.messagesHandler = (function () {

	function processMessage(e) {
		var message = JSON.parse(e.data);
		switch(message.type) {
			case 'addLayer' :
				PubSub.publish('layer.add', message.data);
				break;
			/*case 'loadVideo' :
				PubSub.publish('video.load', message.data);
				break;
			case 'playVideo' :
				//video.play();
				PubSub.publish('video.play');
				break;
			case 'pauseVideo' :
				//video.pause();
				PubSub.publish('video.pause');
				break;
			case 'stopVideo' :
				//video.stop();
				PubSub.publish('video.stop');
				break;*/
		}
		
	}
	
	return {
		processMessage : processMessage
	}
})();