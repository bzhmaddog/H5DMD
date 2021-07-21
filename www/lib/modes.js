var Modes = (Modes || {});


Modes.attract = function(dmd, resources, fonts, variables, audioManager) {
    var creditsString = variables.credits_string,
        startString = resources.getString('attractModeStart'),
        blinkInterval,
        modeStarted = false;

    var start = function(p) {
        console.log('Starting attract mode with priority : ' + p);

        dmd.addLayer({
            name : 'attract-image',
            type : 'image',
            src : 'images/title.png',
            mimeType : 'image/png',
            transparent : false
        });

		fonts.getFont('superfly').load().then(function() {
			dmd.addLayer({
				name : 'attract-title',
				type : 'text',
				fontSize: '30',
                fontFamily : 'Superfly',
				text : "SCOTT",
				left: 130,
				color:'#21a6df',
                strokeWidth : 2,
                strokeColor : 'white'
			});
			dmd.addLayer({
				name : 'attract-title2',
				type : 'text',
				fontSize: '30',
                fontFamily : 'Superfly',
                text : "PILGRIM",
				left: 130,
				top: 25,
				color:'#21a6df',
                strokeWidth : 2,
                strokeColor : 'white'
			});
		});

		fonts.getFont('dusty').load().then(function() {
			dmd.addLayer({
				name : 'attract-title3',
				type : 'text',
				fontSize : '10',
                fontFamily : 'Dusty',
				text : 'VS. THE WORLD',
				left: 131,
				top: 50,
				color:'red'
			});

            dmd.addLayer({
				name : 'attract-credits',
				type : 'text',
				fontSize : '9',
                fontFamily : 'Dusty',
				text : creditsString,
				align: 'right',
                vAlign: 'bottom',
                xOffset : -2,
                yOffset : -1
            });


            dmd.addLayer({
				name : 'attract-start',
				type: 'text',
				fontSize: '10',
                fontFamily : 'Dusty',
				text : startString,
				align : 'center',
				top: 65,
                visible : false
            });

            /*if (!audioManager.isLoaded('attract')) {

                PubSub.subscribe('sound.attract.loaded', function() {
                    console.log('attract music loaded');
                    audioManager.playSound('attract');
                });

                audioManager.loadSound(resources.getMusic('attract'), 'attract');
            } else {
               audioManager.playSound('attract');
            }*/

            blinkInterval = setInterval(toggleStartText, 1000);
            modeStarted = true;
		});
    }

    var toggleStartText = function() {
        dmd.getLayer('attract-start').toggleVisibility();
    }

    var stop = function() {
        console.log('Stopping attract mode');

        if (!modeStarted) {
            console.log('Attract mode is not started');
            return;
        }

        audioManager.stopSound('attract');

        modeStarted = false;
        clearInterval(blinkInterval);

        dmd.removeLayer('attract-image');
        dmd.removeLayer('attract-title');
        dmd.removeLayer('attract-title2');
        dmd.removeLayer('attract-title3');
        dmd.removeLayer('attract-credits');
        dmd.removeLayer('attract-start');
    }

    var isStarted = function() {
        return modeStarted;
    }


    return {
        start : start,
        stop : stop,
        isStarted : isStarted
    }
};