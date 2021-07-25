import { Mode } from "./Mode.mjs";


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

        var creditsString = this._variables.get('credits_string', 'credit_string_error');
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

		this._fonts.getFont('Superfly').load().then(function() {

            console.log("Superfly loaded");

            that.#titleLayer.content.addText('title1', 'SCOTT', {
				fontSize: '30',
                fontFamily : 'Superfly',
				left: 140,
                top: 2,
				color:'#21a6df',
                strokeWidth : 2,
                strokeColor : 'white'
			});

			that.#titleLayer.content.addText('title2', 'PILGRIM', {
				fontSize: '30',
                fontFamily : 'Superfly',
				left: 140,
				top: 27,
				color:'#21a6df',
                strokeWidth : 2,
                strokeColor : 'white'
			});
		});

		this._fonts.getFont('Dusty').load().then(function() {

            console.log("dusty loaded");

			that.#titleLayer.content.addText('subtitle', 'VS. THE WORLD', {
				fontSize : '10',
                fontFamily : 'Dusty',
				left: 141,
				top: 52,
				color:'red'
			});

            that.#titleLayer.content.addText('credits', creditsString, {
				fontSize : '9',
                fontFamily : 'Dusty',
				align: 'right',
                vAlign: 'bottom',
                xOffset : -2,
                yOffset : -1
            });

            that.#startLayer.content.addText('start', startString, {
				fontSize: '10',
                fontFamily : 'Dusty',
				align : 'center',
				top: 65
            });

            that.#blinkInterval = setInterval(that.#toggleStartText.bind(that), 1000);
		});

        /*if (!this.#audioManager.isLoaded('attract')) {

            PubSub.subscribe('sound.attract.loaded', function() {
                console.log("attract music loaded");
                this.#audioManager.playSound('attract');
            });

            this.#audioManager.loadSound(this.#attractMusic, 'attract');
        } else {
           this.#audioManager.playSound('attract');
        }*/
    }

    #toggleStartText = function() {
        this.#startLayer.toggleVisibility();
    }

    stop() {
        super.stop();

        //this.#audioManager.stopSound('attract');

        clearInterval(this.#blinkInterval);

        this._dmd.removeLayer('attract-image');
        this._dmd.removeLayer('attract-title');
        this._dmd.removeLayer('attract-start');
    }
}

export { AttractMode };