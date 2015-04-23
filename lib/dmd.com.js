DMD.messagesHandler = (function () {

	function processMessage(e) {
		var message = JSON.parse(e.data);
		switch(message.type) {
			case 'updateScore' :
				//score = message.data.score
				PubSub.publish('score.update', {
					score : message.data.score
				});
				break;
			case 'loadVideo' :
				/*video.src = message.data.file;
				if (!!message.data.play === true) {
					video.play();
				}*/
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
				break;
		}
		
	}
	
	return {
		processMessage : processMessage
	}
})();