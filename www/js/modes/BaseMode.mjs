import { Mode } from "./Mode.mjs";


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
    }

    #onPlayersChanged(event, data) {
        var currentPlayer = this._variables.get('player', 'player', 1);
        var ballBefore = 0;
        var scoreBefore = 0;
        
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
        super.start(priority);

        var that = this;

        PubSub.subscribe('variable.player.players.changed', this.#onPlayersChanged.bind(this));

        PubSub.subscribe('variable.player.player.changed', this.#onPlayerChanged.bind(this));

        if (!this._audioManager.isLoaded('start')) {
            PubSub.subscribe('sound.start.loaded', function() {
                logger.log("start sound loaded");
                this._audioManager.playSound('start');
            });
            this._audioManager.loadSound(this.#startSound, 'start');
        } else {
           this._audioManager.playSound('start');
        }


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

    /*stop() {
        super.stop();
    }*/

    #startMainMusic() {
        this._audioManager.playSound('main', true);
    }
}

export { BaseMode };