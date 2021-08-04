import { Mode } from './Mode.mjs';
import { Colors } from '../colors/Colors.mjs';

const ATTRACT_MUSIC_RESTART_DELAY = 300000; // 5 min
//const ATTRACT_MUSIC_RESTART_DELAY = 30000;

class AttractMode extends Mode {
    #blinkInterval;
    #startLayer;
    #titleLayer;
    #backgroundLayer;

    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);
        this.name = 'attract';

        // Credit string var is not initialized at this point
        var creditsString = this._variables.get('machine', 'credits_string', ".");

        var startString = this._resources.getString('attractModeStart');

        // Listen to credits string var changes to update the text in the layer
        PubSub.subscribe('variable.machine.credits_string.changed', this.#onCreditsStringChanged.bind(this));

        this.#backgroundLayer = this._dmd.addLayer({
            name : 'attract-image',
            type : 'image',
            src : 'images/title.png',
            mimeType : 'image/png',
            transparent : false,
            visible : false
        });

        this.#titleLayer = this._dmd.addLayer({ name : 'attract-title', type : 'text', visible : false});
        this.#startLayer =  this._dmd.addLayer({ name : 'attract-start', type: 'text', visible : false});


        this.#titleLayer.content.addText('title1', 'SCOTT', {
            fontSize : '30',
            fontFamily : 'Superfly',
            left : 140,
            top : 2,
            color :Colors.blue,
            strokeWidth : 2,
            strokeColor : Colors.white
        });

        this.#titleLayer.content.addText('title2', 'PILGRIM', {
            fontSize : '30',
            fontFamily : 'Superfly',
            left : 140,
            top : 27,
            color :Colors.blue,
            strokeWidth : 2,
            strokeColor : Colors.white
        });

        this.#titleLayer.content.addText('subtitle', 'VS. THE WORLD', {
            fontSize : '10',
            fontFamily : 'Dusty',
            left : 141,
            top : 52,
            color : Colors.red
        });

        this.#titleLayer.content.addText('credits', creditsString, {
            fontSize : '9',
            fontFamily : 'Dusty',
            align: 'right',
            vAlign: 'bottom',
            xOffset : -2,
            yOffset : -1
        });

        this.#startLayer.content.addText('start', startString, {
            fontSize: '10',
            fontFamily : 'Dusty',
            align : 'center',
            top: 65,
            strokeWidth : 2,
            strokeColor : Colors.red
        });    
    }

    // Update credit string
    #onCreditsStringChanged(ev, data) {
        this.#titleLayer.content.getText('credits').setText(data.after);
    }

    start(priority) {
        super.start(priority);

        // TODO Add Game over / highscores / attract screens cycle

        this.#backgroundLayer.setVisibility(true);
        this.#titleLayer.setVisibility(true);

        this.#blinkInterval = setInterval(this.#toggleStartText.bind(this), 1000);

        this.#startAttractMusic();
    }

    #startAttractMusic() {
        this._audioManager.playSound('attract', false, this.#onMusicEnded.bind(this));
    }

    #toggleStartText = function() {
        this.#startLayer.toggleVisibility();
    }

    #onMusicEnded() {
        if (this.isStarted()) {
            logger.log("onMusicEnded() : Attract music ended, restarting later");
            setTimeout(this.#startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
        } else {
            logger.log("onMusicEnded() : Mode not started so I will not restart attract music");
        }
    }

    stop() {
        super.stop();

        this._audioManager.stopSound('attract');

        clearInterval(this.#blinkInterval);

        this.#backgroundLayer.setVisibility(false);
        this.#titleLayer.setVisibility(false);
        this.#startLayer.setVisibility(false);
    }
}

export { AttractMode };