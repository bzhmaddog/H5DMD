import { Mode } from "./Mode.mjs";
import { Colors } from "../colors/Colors.mjs"
import { Utils } from "../utils/Utils.mjs"

class BaseMode extends Mode {
    #startSound;
    #mainMusic;
    #scoreLayer;
    #hudLayer;


    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);

        this.name = 'base';
        this.#startSound = this._resources.getSound('start');
        this.#mainMusic = this._resources.getMusic('main');

        //this.init();
    }

    init() {
        super.init();
       
        // Should be above common layers by below special layers
		this.#hudLayer = this._dmd.addLayer({
			name : 'hud',
			type : 'text',
			transparent : true,
			zIndex : 1000,
			visible : false
		});			

		this.#scoreLayer = this._dmd.addLayer({
			name : 'score',
			type : 'text',
			transparent : true,
			zIndex : 1001,
			visible : false
		});			


		this.#hudLayer.content.addText('ball-text', this._resources.getString('ballText'), {
			fontSize : '10',
			fontFamily : 'Dusty',
			align : 'right',
			xOffset : -11,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		this.#hudLayer.content.addText('ball-value', 1, {
			fontSize : '10',
			fontFamily : 'Dusty',
			align : 'right',
			xOffset : -1,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		this.#hudLayer.content.addText('player-text', Utils.format(this._resources.getString('playerText'),"") + " :", {
			fontSize : '10',
			fontFamily : 'Dusty',
			left : 2,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		this.#hudLayer.content.addText('player-value', 1, {
			fontSize : '10',
			fontFamily : 'Dusty',
			left : 61,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		this.#scoreLayer.content.addText('score', 0, {
			fontSize : '40',
			fontFamily : 'Dusty',
			align : 'right',
			xOffset : -1,
			vAlign : 'middle',
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue,
			adjustWidth : true
		});
    }


    #onPlayersChanged(event, data) {
        var currentPlayer = this._variables.get('player', 'player', 1);
        var ballBefore = 0;
        var scoreBefore = 0;

        if (typeof data.before !== undefined && (data.after.length > data.before.length)) {
            this._audioManager.playSound('start', 'extra-player-start-sound');
        }
        
        if (typeof data.before !== undefined && typeof data.before[currentPlayer - 1] !== 'undefined') {
            ballBefore = data.before[currentPlayer - 1].ball || 1;
            scoreBefore = data.before[currentPlayer - 1].score || 0;
        }

        //logger.log("Players var changed :", data);

        if (data.after[currentPlayer - 1].score !== scoreBefore) {
            //logger.log("Ball Changed", data.after[currentPlayer - 1].ball);
            this.#scoreLayer.content.getText('score-value').setText(data.after[currentPlayer - 1].score);
        }


        if (data.after[currentPlayer - 1].ball !== ballBefore) {
            //logger.log("Ball Changed", data.after[currentPlayer - 1].ball);
            this.#hudLayer.content.getText('ball-value').setText(data.after[currentPlayer - 1].ball);
        }
    }

    #onPlayerChanged(event, data) {
        logger.log("Player changed", data);
        var player = data.after;
        var playersData = this._variables.get('player', 'players', []);

        if ([playersData.length]) {
            var playerData = playersData[player - 1];
            this.#hudLayer.content.getText('player-value').setText(player);
            this.#scoreLayer.content.getText('score').setText(playerData.score);
        }

    }

    start(priority) {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return;
        }

        var that = this;

        PubSub.subscribe('variable.player.players.changed', this.#onPlayersChanged.bind(this));

        PubSub.subscribe('variable.player.player.changed', this.#onPlayerChanged.bind(this));

        this._audioManager.playSound('start', 'start-first-player-sound');

        if (!this._audioManager.isLoaded('main')) {
            PubSub.subscribe('sound.main.loaded', function() {
                logger.log("main music loaded");
                setTimeout(that.#startMainMusic.bind(that), 1000);
            });
            this._audioManager.loadSound(this.#mainMusic, 'main');
        } else {
            setTimeout(this.#startMainMusic.bind(this), 1000);
        }

        this.#hudLayer = this._dmd.getLayer('hud');
        this.#scoreLayer = this._dmd.getLayer('score');

        this.#hudLayer.setVisibility(true);
        this.#scoreLayer.setVisibility(true);
    }

    stop() {
        super.stop();

        PubSub.unsubscribe('variable.player.players.changed');
        PubSub.unsubscribe('variable.player.player.changed');

        this._audioManager.stopSound('main-music');

        this.#hudLayer.setVisibility(false);
        this.#scoreLayer.setVisibility(false);

        this._variables.set('player', 'player', 0);
        this._variables.set('player', 'players', []);

        //this._audioManager.playSound('gameover', 'gameover-sound');
    }

    #startMainMusic() {
        this._audioManager.playSound('main','main-music', true);
    }
}

export { BaseMode };