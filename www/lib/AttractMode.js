

class AttractMode {
    #creditsString;
    #startString;
    #blinkInterval;
    #modeStarted;
    #startLayer;
    #titleLayer;
    #attractMusic;
    #fonts;
    #dmd;
    #variables;
    #resources;
    #audioManager;


     constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        this.#modeStarted = false;
        this.#fonts = _fonts;
        this.#dmd = _dmd;
        this.#variables = _variables;
        this.#resources = _resources;
        this.#audioManager = _audioManager;
        this.#attractMusic = this.#resources.getMusic('attract');
     }

    start(priority) {
        var that = this;

        var creditsString = this.#variables.get('credits_string', 'credit_string_error');
        var startString = this.#resources.getString('attractModeStart');

        console.log("Starting attract mode with priority : ", priority);

        this.#dmd.addLayer({
            name : 'attract-image',
            type : 'image',
            src : 'images/title.png',
            mimeType : 'image/png',
            transparent : false
        });

        this.#titleLayer = this.#dmd.addLayer({ name : 'attract-title', type : 'text'});
        this.#startLayer =  this.#dmd.addLayer({ name : 'attract-start', type: 'text', visible : false});

		this.#fonts.getFont('Superfly').load().then(function() {

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

		this.#fonts.getFont('Dusty').load().then(function() {

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
            that.#modeStarted = true;
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
        if (!this.#modeStarted) {
            console.log("Attract mode is not started");
            return;
        }

        console.log("Stopping attract mode");

        //this.#audioManager.stopSound('attract');

        this.#modeStarted = false;
        clearInterval(this.#blinkInterval);

        this.#dmd.removeLayer('attract-image');
        this.#dmd.removeLayer('attract-title');
        this.#dmd.removeLayer('attract-start');
    }

    isStarted() {
        return this.#modeStarted;
    }
}