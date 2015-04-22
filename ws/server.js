var WebSocketServer = require('ws').Server,
	server = new WebSocketServer({ port: 1337 }),
	keypress = require('keypress'),
	client,
	score = 0,
	to = null;

/*keypress(process.stdin);
	
process.stdin.on('keypress', function (ch, key) {

if (typeof key === 'undefined') {
	return;
}
  console.log('got "keypress"', key);
  
  if (key.ctrl && key.name === 'c') {
    process.stdin.pause();
  }
  
  if (key.name === '+') {
	increaseScore(true);
  }
  
  if (key.name === '*') {
	increaseScore();
  }

  if (key.name === '/') {
	clearTimeout(to);
  }
  
  
});

process.stdin.resume();*/
	
server.on('connection', function connection(_client) {
  /*ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });*/
  
  client = _client;

  sendMessage('loadVideo', {
	file : 'medias/dmd-error.webm',
	play : true
  });
  
  increaseScore();
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