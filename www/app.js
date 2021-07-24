(function () {
	'use strict';
	
	var dlgBox,
		wsServer,
		dmd,
		wss = new WSS(),
		scores = [],
		players = 0,
		player = 0,
		ball = 0,
		wsConnected = false,
		resources = new Resources('/res/resources.json'),
		audioManager = new AudioManager(),
		fonts,
		modes,
		variables = new Variables();

	// When dom is loaded create the objects and bind the events
	document.addEventListener('DOMContentLoaded', function () {

		// Create a new DMD where each pixel will be 5x5
		// pixels will be spaced by 3 pixels horizontaly and verticaly
		// the original medias size will be 128x64
		// and the final DMD size will be 1024x511
		// pixel shape will be circle (can be circle or square at the moment)
		dmd = new DMD(256, 78, 1280, 390, 4, 4, 1, 1, 1, 1, DMD.DotShape.Square, document.getElementById('dmd'));
		
		// dmd without dot effect
		//dmd = new DMD(1280, 390, 1280, 390, 1, 1, 0, 0, 0, 0, 'square', document.getElementById('dmd'));

		dlgBox = document.getElementById('dialog-box');

		/*PubSub.subscribe('ws.receive', function (ev, data) {
			//console.log('--- BEGIN ---');
			handleReceivedMessage(data);
		});*/

		PubSub.subscribe('layer.created', function(ev, layer) {
			console.log('Layer created :', layer);
		});


		PubSub.subscribe('layer.loaded', function(ev, options) {
			console.log('Layer loaded :', options);
		});

		// Load resources file then reset dmd
		// TODO : Use promise instead ?
		resources.load(function() {

			resetDMD();

			//var testLayer = dmd.addLayer({ name : 'text-test', type : 'text'});

			// Preload some musics/sounds
			resources.getMusics().filter(music => music.preload === true).forEach( music => {
				audioManager.loadSound(music.url, music.key);
			});

			//console.log('here');
			fonts = new Fonts(resources.getFonts());

			console.log(audioManager);

			modes = new Modes({
				attract : new AttractMode(dmd, resources, fonts, variables, audioManager)
			}, dmd, resources, fonts, variables, audioManager);
	

			/*dmd.addLayer({
			name :'test',
			type : 'video',
			src : 'videos/extraballAlpha.webm',
			mimeType : 'video/webm',
			loop : false,
			autoplay: false
			}).content.play();*/

			/*fonts.getFont('dusty').load().then(function() {

				console.log('superfly loaded');
	
				testLayer.content.addText('title1', 'TEST', {
					fontSize: '30',
					fontFamily : 'dusty',
					align : 'center',
					vAlign : 'middle',
					color:'#21a6df',
					strokeWidth : 2,
					strokeColor : 'white'
				});
			});*/

			connectServer();
		});


		//dmd.debug();
		/*setTimeout( function() {
			audioManager.playSound('attract');
		}, 5000);*/
		
		
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
		//messagesHandler = WS.messagesHandler(wsServer);
		wss.setServer(wsServer, handleReceivedMessage);

		wsConnected = true;

		showDlg('Connected...', 'success');
		setTimeout(hideDlg, 1000);
	}

	wsServer.onclose = function(event) {
		if (wsConnected) {
			console.log('WebSocket onclose', event);
			wsConnected = false;
			reset();

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


/**
 * Handle messages from web socket server
 * @param {event} ev 
 */
function handleReceivedMessage(ev) {
	let data = ev.data;
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
			for (const [key, value] of Object.entries(params)) {
				variables.set(key,value);
			};
			break;
		case 'mc_mode_start':
			modes.startMode(params.name,params.priority);
			break;
		case 'mc_goodbye':
			console.log('MPF said goodbye');
			reset();
			break;
		default:
			console.log('Unhandled message received : ' + data);

	}

	//console.log('--- END ---');
}


function reset() {
	modes.stopActiveMode();
	resetDMD();
	audioManager.reset();
}

/**
 * Reset all layers and add the two default layers
 */
function resetDMD() {
	console.log('DMD reset');
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


})();