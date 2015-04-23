var WebSocketServer = require('ws').Server,
	server = new WebSocketServer({ port: 1337 }),
	keypress = require('keypress'),
	client,
	score = 0,
	to = null,
	client;

server.on('connection', function connection(_client) {
  
	client = _client;
  
	sendMessage('addLayer', {
		name : 'background',
		type : 'image',
		src : 'img/dmd-128x64-empty.png',
		mimeType : 'image/png',
		width : 128,
		height : 64,
		transparent : false,
		visible : false
	});
	
	sendMessage('addLayer', {
		name : 'test',
		type : 'image',
		src : 'img/bg-test.png',
		mimeType : 'image/png',
		width : 128,
		height : 64,
		transparent : false,
		visible : true
	});
  
  
  sendMessage('addLayer', {
	name : 'mainVideo',
	type : 'video',
	src : 'medias/extraballAlpha.webm',
	mimeType : 'video/webm',
	width : 128,
	height : 64,
	transparent : true,
	visible : true,
	autoplay : true,
	loop : false
  });
  
  
  /*sendMessage('loadVideo', {
	file : 'medias/test-7x7.webm',
	type : 'video/webm',
	play : true
  });*/
  
  //increaseScore();
});

function sendMessage(messageType, data) {
	client.send(JSON.stringify({
		type : messageType,
		data : data
	}));
}

function playCurrentVideo() {
	  sendMessage('playVideo', {});
}

function increaseScore(once) {
	var n = Math.random() * 2000 + 100;
	
	score = Math.round(score + Math.random() * 1000000 + 500);

	sendMessage('updateScore', {
		score : score
	});
	
	/*if (score > 5000000) {
	  sendMessage('loadVideo', {
		file : 'medias/test.webm',
		play : true
	  });
	  
	  //setTimeout(playCurrentVideo, 2000);
	}*/
	
	if (!!once === false) {
		to = setTimeout(increaseScore, n, false);
	}
}