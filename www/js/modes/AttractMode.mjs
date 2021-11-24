import { Mode } from './Mode.mjs';
import { Colors } from '../colors/Colors.mjs';
import { Utils } from '../utils/Utils.mjs';

//const ATTRACT_MUSIC_RESTART_DELAY = 300000; // 5 min
const ATTRACT_MUSIC_RESTART_DELAY = 30000;

const ATTRACT_RESTART_TIMEOUT = 30000;

class AttractMode extends Mode {
    #blinkInterval;
    #attractRestartTO;
    #attractMusicTO;
    #startLayer;
    #titleLayer;
    #backgroundLayer;
    #gameOverCloudsLayer;
    #gameOverCloudsLayer2;
    #gameOverBackgroundLayer;
    #gameOverTextLayer;
    #gameOverScoresLayer;
    #gameIsPlaying;
    #delayAttractMusic;

    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);
        this.name = 'attract';

        //this.init();
    }

    init() {
        super.init();

        // Credit string var is not initialized at this point
        var creditsString = this._variables.get('machine', 'credits_string', ".");
        var startString = this._resources.getString('attractModeStart');
        var goString = this._resources.getString('gameOver');

        // Listen to credits string var changes to update the text in the layer
        PubSub.subscribe('variable.machine.credits_string.changed', this.#onCreditsStringChanged.bind(this));

        this.#backgroundLayer = this._dmd.addLayer({
            name : 'attract-image',
            type : 'image',
            src : 'images/title.webp',
            mimeType : 'image/webp',
            transparent : false,
            visible : false
        });

        this.#titleLayer = this._dmd.addLayer({ name : 'attract-title', type : 'text', visible : false});
        this.#startLayer =  this._dmd.addLayer({ name : 'attract-start', type: 'text', visible : false});

        this.#gameOverCloudsLayer = this._dmd.addLayer({
            name : 'game-over-clouds',
            type: 'video',
            src : 'videos/game-over-clouds.webm',
            mimeType : 'video/webm',
            transparent : false,
            visible : false,
            autoplay : true,
            loop : true
        });

        this.#gameOverCloudsLayer2 = this._dmd.addLayer({
            name : 'game-over-clouds2',
            type: 'image',
            src : 'images/game-over-clouds.webp',
            mimeType : 'image/webp',
            transparent : false,
            visible : false,
            autoplay : true,
            loop : true
        });
        

        this.#gameOverBackgroundLayer = this._dmd.addLayer({
            name : 'game-over-bg',
            type: 'image',
            src : 'images/game-over.webp',
            mimeType : 'image/webp',
            transparent : false,
            visible : false
        });
        
        this.#gameOverTextLayer = this._dmd.addLayer({ name : 'game-over-text', type: 'text', visible : false});
        this.#gameOverScoresLayer = this._dmd.addLayer({ name : 'game-over-scores', type: 'text', visible : false});


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

        this.#gameOverTextLayer.content.addText('game-over', goString, {
            fontSize: '20',
            fontFamily : 'Dusty',
            align : 'center',
            top: 1,
            strokeWidth : 2,
            strokeColor : Colors.red
        });

        this.#gameIsPlaying = false;        
        this.#delayAttractMusic = false;
    }


    // Update credit string
    #onCreditsStringChanged(ev, data) {
        this.#titleLayer.content.getText('credits').setText(data.after);
    }

    start(priority) {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return;
        }

        var that = this;

        /*this.#gameIsPlaying = true;
        this._variables.set('player', 'players', [
            {ball : 3, score : 18695125000},
            {ball : 3, score : 1000},
            {ball : 3, score : 2500},
            {ball : 3, score : 500000},
        ]);*/

        // TODO Add Game over / highscores / attract screens cycle

        if (this.#gameIsPlaying) {
            this.#gameIsPlaying = false;

            //logger.log("Game Over");

            this.#gameOverCloudsLayer.setVisibility(true);
            this.#gameOverCloudsLayer2.setVisibility(true);
            this.#gameOverBackgroundLayer.setVisibility(true);
            this.#gameOverTextLayer.setVisibility(true);
            this.#gameOverScoresLayer.setVisibility(true);

            var players = this._variables.get('player', 'players', []);

            var top = (players.length-1) * 3 * -1 + 5;
            var timeout = 0;

            players.forEach( (p,i) => {

                setTimeout(function() {
                    //var score = Utils.formatScore(p.score);
                    var score = Utils.formatScore(Math.round(Math.random()*50000000000));

                    var pTxt = Utils.format(that._resources.getString('playerText'), i+1);

                    that.#gameOverScoresLayer.content.addText(`player-${i+1}-text`, pTxt, {
                        fontSize: '10',
                        fontFamily : 'Dusty',
                        left : 50,
                        vAlign : 'middle',
                        yOffset : top
                    });

                    that.#gameOverScoresLayer.content.addText(`player-${i+1}-colon`, ":", {
                        fontSize: '10',
                        fontFamily : 'Dusty',
                        left : 112,
                        vAlign : 'middle',
                        yOffset : top
                    });

                    
                    that.#gameOverScoresLayer.content.addText(`player-${i+1}-score`, score, {
                        fontSize: '10',
                        fontFamily : 'Dusty',
                        left : 120,
                        vAlign : 'middle',
                        yOffset : top
                    });

                    that._audioManager.playSound('dong', `dong-p${i+1}`);

                    top += 10;
                } , timeout);

                timeout += 1000;

            });

            this.#attractRestartTO = setTimeout(function(){
                that.#gameOverCloudsLayer.setVisibility(false);
                that.#gameOverCloudsLayer2.setVisibility(false);
                that.#gameOverBackgroundLayer.setVisibility(false);
                that.#gameOverTextLayer.setVisibility(false);
                that.#gameOverScoresLayer.setVisibility(false);
                that.#gameOverScoresLayer.content.removeAllTexts();
                that.#delayAttractMusic = true;
                that.start(priority);
            }, ATTRACT_RESTART_TIMEOUT);


        
        // Start attractmode
        } else {
            this.#backgroundLayer.setVisibility(true);
            this.#titleLayer.setVisibility(true);
            this.#startLayer.setVisibility(false);

            this.#blinkInterval = setInterval(this.#toggleStartText.bind(this), 1000);

            if (this.#delayAttractMusic) {
                this.#attractMusicTO = setTimeout(this.#startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
                this.#delayAttractMusic = false;
            } else {
                this.#startAttractMusic();
            }
        }
    }

    #startAttractMusic() {
        this._audioManager.playSound('attract', 'attract-music', false, this.#onMusicEnded.bind(this));
    }

    #toggleStartText = function() {
        this.#startLayer.toggleVisibility();
    }

    #onMusicEnded() {
        if (this.isStarted()) {
            logger.log("onMusicEnded() : Attract music ended, restarting later");
            this.#attractMusicTO = setTimeout(this.#startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
        } else {
            logger.log("onMusicEnded() : Mode not started so I will not restart attract music");
        }
    }

    stop() {
        super.stop();

        this._audioManager.stopSound('attract-music');

        this.#backgroundLayer.setVisibility(false);
        this.#titleLayer.setVisibility(false);
        this.#startLayer.setVisibility(false);

        this.#gameOverCloudsLayer.setVisibility(false);
        this.#gameOverCloudsLayer2.setVisibility(false);
        this.#gameOverBackgroundLayer.setVisibility(false);
        this.#gameOverTextLayer.setVisibility(false);
        this.#gameOverScoresLayer.setVisibility(false);
        this.#gameOverScoresLayer.content.removeAllTexts();


        clearTimeout(this.#attractMusicTO);
        this.#attractMusicTO = null;

        clearTimeout(this.#attractRestartTO);
        this.#attractRestartTO = null;

        clearInterval(this.#blinkInterval);
        this.#blinkInterval =  null;


        // Set variable so that attract mode knows a game was playing
        this.#gameIsPlaying = true;
    }
}

export { AttractMode };