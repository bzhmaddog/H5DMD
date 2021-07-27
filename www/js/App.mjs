import { Modes } from './modes/Modes.mjs';
import { BaseMode } from './modes/BaseMode.mjs';
import { AttractMode } from './modes/AttractMode.mjs';
import { DMD } from './dmd/DMD.mjs';
import { Fonts } from './fonts/Fonts.mjs';
import { Resources } from './resources/Resources.mjs';
import { Variables } from './variables/Variables.mjs';
import { AudioManager } from './audio-manager/AudioManager.mjs';
import { WSS } from './ws/WSS.mjs';

class App {
	#dlgBox;
	#wsServer;
    #dmd;
    #wss;
    #scores;
    #players;
    #player;
    #ball;
    #wsConnected;
    #resources;
    #audioManager;
    #fonts;
    #modes;
    #variables;
    #canvas;

    /**
     * 
     * @param {string} canvasId id of the canvas where the dmd will be rendered
     */
    constructor(canvasId) {
        this.#dlgBox;
        this.#wsServer;
        this.#dmd;
        this.#wss = new WSS();
        this.#scores = [];
        this.#players = 0;
        this.#player = 0;
        this.#ball = 0;
        this.#wsConnected = false;
        this.#resources = new Resources('/res/resources.json');
        this.#audioManager = new AudioManager();
        this.#fonts;
        this.#modes = new Modes();
        this.#variables = new Variables();
        this.#canvas = document.getElementById(canvasId);
        this.#fonts = new Fonts();
    }

    start() {
        var that = this;
        // Create a new DMD where each pixel will be 5x5
		// pixels will be spaced by 3 pixels horizontaly and verticaly
		// the original medias size will be 128x64
		// and the final DMD size will be 1024x511
		// pixel shape will be circle (can be circle or square at the moment)
		this.#dmd = new DMD(256, 78, 1280, 390, 4, 4, 1, 1, 1, 1, DMD.DotShape.Square, this.#canvas);
		
		// dmd without dot effect
		//dmd = new DMD(1280, 390, 1280, 390, 1, 1, 0, 0, 0, 0, 'square', document.getElementById('dmd'));

		this.#dlgBox = document.createElement('div');
        this.#dlgBox.id = 'dialog-box';
        document.body.appendChild(this.#dlgBox);

		PubSub.subscribe('layer.created', function(ev, layer) {
			console.log("Layer created :", layer);
		});


		PubSub.subscribe('layer.loaded', function(ev, options) {
			console.log("Layer loaded :", options);
		});

		// Load resources file then reset dmd
		this.#resources.load().then(function(resources) {
			console.log("Resources loaded", resources);

			// Reset the DMD (show only background layer and mpf logo)
			that.#resetDMD();

			// Preload some musics/sounds
			resources.getMusics().filter(music => music.preload === true).forEach( music => {
				that.#audioManager.loadSound(music.url, music.key);
			});

			// Preload fonts
			that.#resources.getFonts().forEach(f => {
				that.#fonts.add(f.key, f.name, f.url).load().then(function() {
					console.log(`Font '${f.name}' is loaded`);
				});
			});

            // Instantiate attract mode class
            var attractMode = new AttractMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);
			var baseMode = new BaseMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);

            // Init modes
            // TODO : Add modes here
			that.#modes.add('attract', attractMode);
			that.#modes.add('base', baseMode);
	
            // try to connect to socket server
			that.#connectServer();
		});		
    }

    /**
     * Connect to socket server
     */
    #connectServer() {
        var that = this;

        this.#showDlg('Waiting for server ...', 'info');
		// Connect to the server via a websocket
		this.#wsServer = new WebSocket('ws://' + location.hostname + ':1337', ['soap', 'xmpp']);

		// Bind error event to display it on the DMD
		this.#wsServer.onerror = function (event) {
			console.log("WebSocket onerror", event);

			if (event.target.readyState === 3) {
				//that.#showDlg('Connection error : Retrying ...', 'error');
				setTimeout(that.#connectServer.bind(that), 1500);
			}
		};

		this.#wsServer.onopen = function(event) {
			console.log("WebSocket onconnect", event);
			// Create a message Handler
			//messagesHandler = WS.messagesHandler(wsServer);
			that.#wss.setServer(that.#wsServer, that.#handleReceivedMessage.bind(that));

			that.#wsConnected = true;

			that.#showDlg("Connected...", 'success');
			
            setTimeout(that.#hideDlg.bind(that), 1000);
		}

		this.#wsServer.onclose = function(event) {
			if (that.#wsConnected) {
				console.log("WebSocket onclose", event);
				that.#wsConnected = false;
				that.#reset();

				that.#showDlg("Connection lost ...", 'error');
				setTimeout(that.#connectServer.bind(this), 1000);
			}
		}

	}

    /**
     * Hide system dialog box
     */
	#hideDlg() {
		this.#dlgBox.className = '';
		this.#dlgBox.innerHTML = '';
	}

    /**
     * Show system dialog box
     */
	#showDlg(txt, classTxt) {
		this.#dlgBox.className = 'dlg-' + classTxt;
		this.#dlgBox.innerHTML = txt;
	}


	/**
	 * Handle messages from web socket server
	 * @param {event} ev 
	 */
	#handleReceivedMessage(ev) {
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
				console.log("MPF connected");
				break;
			case 'mc_hello':
				console.log("MPF says hello");
				break;
			case 'mc_reset':
				console.log("MPF requested reset");
				this.#dmd.removeLayer("logo");
				this.#wsServer.send('mc_ready');
				break;
			case 'mc_machine_variable':
				for (const [key, value] of Object.entries(params)) {
					this.#variables.set(key,value);
				};
				break;
			case 'mc_mode_start':
				this.#modes.startMode(params.name, params.priority);
				break;
			case 'mc_goodbye':
				console.log("MPF said goodbye");
				this.#reset();
				break;
			default:
				console.log("Unhandled message received : ", data);

		}
	}

    /**
     * Reset app
     */
	#reset() {
		this.#modes.stopActiveMode();
		this.#resetDMD();
		this.#audioManager.reset();
	}

	/**
	 * Reset all layers and add the two default layers
	 */
	#resetDMD() {
		console.log("DMD reset");
		this.#dmd.reset();

		this.#dmd.addLayer({
			name :'logo',
			type : 'image',
			src : 'images/logo.png',
			mimeType : 'image/png',
			//visible : false
		});
	}
}

export { App };