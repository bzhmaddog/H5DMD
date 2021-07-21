(function () {
	'use strict';
	
	var dlgBox,
		wsServer,
		dmd,
		messagesHandler,
		mode,
		scores = [],
		players = 0,
		player = 0,
		ball = 0,
		wsConnected = false,
		resources = new Resources(),
		audioManager = new AudioManager(),
		fonts;

	var mpf = {
		modes : {
			attract : Modes.attract
		},
		variables : {}
	};

	// When dom is loaded create the objects and bind the events
	document.addEventListener('DOMContentLoaded', function () {

		// Create a new DMD where each pixel will be 5x5
		// pixels will be spaced by 3 pixels horizontaly and verticaly
		// the original medias size will be 128x64
		// and the final DMD size will be 1024x511
		// pixel shape will be circle (can be circle or square at the moment)
		dmd = new DMD(256, 78, 1280, 390, 4, 4, 1, 1, 1, 1, 'square', document.getElementById('dmd'));
		
		// dmd without dot effect
		//dmd = new DMD(1280, 390, 1280, 390, 1, 1, 0, 0, 0, 0, 'square', document.getElementById('dmd'));

		/*
, {
			superfly : new FontFace('Superfly', 'url(/fonts/SUPERFLY.otf)'),
			dusty : new FontFace('Dusty', 'url(/fonts/Dusty.otf)')
		}
		*/

		dlgBox = document.getElementById('dialog-box');

		PubSub.subscribe('resources.loaded', function() {

			// Preload some musics/sounds
			resources.getMusics().filter(music => music.preload === true).forEach( music => {
				audioManager.loadSound(music.url, music.key);
			});

			//console.log('here');
			fonts = new Fonts(resources.getFonts());
		});

		resetDMD();

		/*dmd.addLayer({
			name :'test',
			type : 'video',
			src : 'medias/extraballAlpha.webm',
			mimeType : 'video/webm',
			loop : true
		});*/

		PubSub.subscribe('ws.receive', function (ev, data) {
			//console.log('--- BEGIN ---');
			handleReceivedMessage(data);
		});

		PubSub.subscribe('layer.loaded', function(ev, options) {
			console.log('Layer loaded :', options);
		});

		//dmd.debug();
		/*setTimeout( function() {
			audioManager.playSound('attract');
		}, 5000);*/
		
		connectServer();
	},false);

function connectServer() {

	showDlg('Waiting for server ...', 'info');
	// Connect to the server via a websocket
	wsServer = new WebSocket('ws://' + location.hostname + ':1337', ['soap', 'xmpp']);

	// Bind error event to display it on the DMD
	wsServer.onerror = function (event) {
		console.log('WebSocket onerror', event);

		if (event.target.readyState === 3) {
			//showDlg('Connection error : Retrying ...', 'error');
			setTimeout(connectServer, 1500);
		}
	};

	wsServer.onopen = function(event) {
		console.log('WebSocket onconnect', event);
		// Create a message Handler
		messagesHandler = new WS.messagesHandler(wsServer);

		wsConnected = true;

		showDlg('Connected...', 'success');
		setTimeout(hideDlg, 1000);
	}

	wsServer.onclose = function(event) {
		if (wsConnected) {
			console.log('WebSocket onclose', event);
			wsConnected = false;

			resetDMD();
			audioManager.reset();
			//resetDMD();
			showDlg('Connection lost ...', 'error');
			setTimeout(connectServer, 1000);
		}
	}

}

function hideDlg() {
	dlgBox.className = '';
	dlgBox.innerHTML = '';
}

function showDlg(txt, classTxt) {
	dlgBox.className = 'dlg-' + classTxt;
	dlgBox.innerHTML = txt;
}


function handleReceivedMessage(data) {
	const parts = data.split('?');
	let cmd = "";
	let params = {};

	if (parts.length > 1) {
		const urlSearchParams = new URLSearchParams(parts[1]);
		params = Object.fromEntries(urlSearchParams.entries());
		cmd = parts[0];
		//console.log(params);
	} else {
		cmd = data;
	}

	switch(cmd) {
		case 'mc_connected':
			console.log('MPF connected');
			break;
		case 'mc_hello':
			console.log('MPF says hello');
			break;
		case 'mc_reset':
			console.log('MPF requested reset');
			dmd.removeLayer('logo');
			wsServer.send('mc_ready');
	 		break;
		case 'mc_machine_variable':
			mpf.variables = Object.assign(mpf.variables, params);
			break;
		case 'mc_mode_start':
			startMode(params.name,params.priority);
			break;
		case 'mc_goodbye':
			console.log('MPF said goodbye');
			console.log(mode);
			if (typeof mode === 'object' && typeof mode.stop === 'function') {
				mode.stop();
			}
			resetDMD();
			audioManager.reset();
			break;
		default:
			console.log('Unhandled message received : ' + data);

	}

	//console.log('--- END ---');
}


/**
 * Reset all layers and add the two default layers
 */
function resetDMD() {
	dmd.reset();
	dmd.addLayer({
		name : 'background',
		type : 'image',
		src : 'images/background.png',
		mimeType : 'image/png',
		transparent : false,
	});

	dmd.addLayer({
		name :'logo',
		type : 'image',
		src : 'images/logo.png',
		mimeType : 'image/png'
	});
}

function startMode(name, priority) {
	console.log(mode);

	if (typeof mode === 'object' && mode.isStarted()) {
		mode.stop();
	}

	if (typeof mpf.modes[name] !== 'undefined') {
		mode = mpf.modes[name](dmd, resources, fonts, mpf.variables, audioManager);
		mode.start(priority);
	}
}


})();