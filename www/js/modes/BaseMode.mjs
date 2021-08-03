import { Mode } from "./Mode.mjs";


class BaseMode extends Mode {
    #startSound;
    #mainMusic;
    #scoreLayer;


    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);

        this.name = 'base';
        this.#startSound = this._resources.getSound('start');
        this.#mainMusic = this._resources.getMusic('main');
    }

    start(priority) {
        super.start(priority);

        var that = this;

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



        this._dmd.getLayer('hud').setVisibility(true);
        this.#scoreLayer = this._dmd.getLayer('score');
        
        this.#scoreLayer.setVisibility(true);
    }

    stop() {
        super.stop();
    }

    #startMainMusic() {
        this._audioManager.playSound('main', true);
    }
}

export { BaseMode };