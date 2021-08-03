import { Mode } from './Mode.mjs';
import { Colors } from '../colors/Colors.mjs';


class AttractMode extends Mode {
    #creditsString;
    #startString;
    #blinkInterval;
    #startLayer;
    #titleLayer;
    #attractMusic;

    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);
        this.name = 'attract';
        this.#attractMusic = this._resources.getMusic('attract');
    }

    start(priority) {
        super.start(priority);

        var that = this;
        var creditsString = this._variables.get('machine', 'credits_string', 'credit_string_error');
        var startString = this._resources.getString('attractModeStart');

        this._dmd.addLayer({
            name : 'attract-image',
            type : 'image',
            src : 'images/title.png',
            mimeType : 'image/png',
            transparent : false
        });

        this.#titleLayer = this._dmd.addLayer({ name : 'attract-title', type : 'text'});
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

        this.#blinkInterval = setInterval(this.#toggleStartText.bind(this), 1000);

        if (!this._audioManager.isLoaded('attract')) {

            PubSub.subscribe('sound.attract.loaded', function() {
                console.log("attract music loaded");
                that.#startAttractMusic();
            });

            this._audioManager.loadSound(this.#attractMusic, 'attract');
        } else {
           this.#startAttractMusic();
        }
    }

    #startAttractMusic() {
        this._audioManager.playSound('attract', false, this.#onMusicEnded.bind(this));
    }

    #toggleStartText = function() {
        this.#startLayer.toggleVisibility();
    }

    #onMusicEnded() {
        if (this.isStarted()) {
            console.log("onMusicEnded() : Attract music ended, restarting later");
            setTimeout(this.#startAttractMusic.bind(this), 300000);
        } else {
            console.log("onMusicEnded() : Mode not started so I will not restart attract music");
        }
    }

    stop() {
        super.stop();

        this._audioManager.stopSound('attract');

        clearInterval(this.#blinkInterval);

        this._dmd.removeLayer('attract-image');
        this._dmd.removeLayer('attract-title');
        this._dmd.removeLayer('attract-start');
    }
}

export { AttractMode };