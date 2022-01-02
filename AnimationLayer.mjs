import { Buffer } from "./Buffer.mjs";

class AnimationLayer {
    #images;
    #id;
    #loaded;
    #listener;
    #options;
    #playing;
    #frameIndex;
    #loop;
    #startTime;
    #frameDuration;
    #outputBuffer;
    #renderNextFrame;
    #onPlayListener;
	#onPauseListener;


    constructor(id, _options, _listener, _onPlayListener, _onPauseListener) {
        var _defaultOptions = { loop: false, autoplay: false};

        this.#id = id;
        this.#loaded = false;
        this.#listener = _listener;
		this.#onPlayListener = _onPlayListener;
		this.#onPauseListener = _onPauseListener;

        this.#options = Object.assign(_defaultOptions, _options);
        this.#images = [new Image()];
        this.#playing = false;
        this.#frameIndex = 0;
        this.#loop = this.#options.loop;
        this.#outputBuffer = new Buffer(this.#options.width, this.#options.height);
        this.#renderNextFrame = function(){};

        if (typeof this.#options.duration !== 'number') {
            throw new Error("You must provide a duration");
        }
    }

    #onDataLoaded() {
        this.#loaded =  true;

        this.#outputBuffer.clear();
        this.#outputBuffer.context.drawImage(this.#images[this.#frameIndex], 0, 0, this.#outputBuffer.width, this.#outputBuffer.height);


//        console.log('onDataLoaded', this);
        if (typeof this.#listener === 'function') {
            this.#listener(this);
        }
    }

    #renderFrame(t) {

        var now = t;

        if (!this.#startTime) {
            this.#startTime = now;
//            console.log("Start Time = ", this.#startTime);
        }

        var position = now - this.#startTime;

        var frameIndex = Math.floor(position / this.#frameDuration);

        //console.log(frameIndex);

        if (!this.#loop && frameIndex >= this.#images.length) {
//            console.log("End = ", position);
            return;
        }

        /*if (frameIndex != this.#frameIndex) {
            console.log(frameIndex);
        }*/


        if (frameIndex >= this.#images.length) {
            this.#startTime = null;
            frameIndex = 0;
        }

        this.#frameIndex = frameIndex;

        this.#outputBuffer.clear();

        //console.log(this.#images[this.#frameIndex]);

        this.#outputBuffer.context.drawImage(this.#images[this.#frameIndex], 0, 0, this.#outputBuffer.width, this.#outputBuffer.height);

        this.#renderNextFrame();
    }

    #requestRenderNextFrame() {
        requestAnimationFrame(this.#renderFrame.bind(this));        
    }

    /**
     * Fetch image from server
     * @param {string} src 
     * @returns 
     */
     async #loadImage(src, index) {
        let response = await fetch(src);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          } else {
            return { 
                blob : response.blob(),
                index : index
            };
          }        
    }


    loadImages(images) {
        var tmpImages = [];
        var that = this;
        var cnt = 0;

        return new Promise( (resolve, reject) => {

            if (images.length) {
                this.#loaded =  false;

                for(var i = 0 ; i < images.length ; i++) {

                    tmpImages.push(null);

                    this.#loadImage(images[i], i).then( response => {

                        response.blob.then( blob => {

                            createImageBitmap(blob).then( bitmap => {

                                //console.log(response.index, bitmap);

                                tmpImages[response.index] = bitmap;

                                cnt++;
                                if (cnt === images.length) {
                                    that.#images = [...tmpImages];
                                    //console.log(that.#images);
                                    that.#onDataLoaded();
                                    resolve();
                                }
                            });
                        });
                    });
                }
            } else {
                reject();
            }
        });
    }

    play(loop) {
        if (!this.#playing && this.#loaded) {
            
            // calculate how long each frame should be displayed
            this.#frameDuration = this.#options.duration / this.#images.length;

            //console.log(this.#frameDuration);
            //console.log(this.#images.length);

            if (typeof loop !== 'undefined') {
                this.#loop = !!loop;
            }

            this.#startTime = null;
            this.#playing = true;

            this.#renderNextFrame = this.#requestRenderNextFrame;
            this.#requestRenderNextFrame();

            if (typeof this.#onPlayListener === 'function') {
                this.#onPlayListener();
            }
        }
    }

    stop() {
        if (this.#playing) {
            this.#playing = false;
            this.#frameIndex = 0;
            this.#renderNextFrame = function(){};
        }
    }

    pause() {
        if (this.#playing) {
            this.#playing = false;
            this.#renderNextFrame = function(){};

            if (typeof this.#onPauseListener === 'function') {
                this.#onPauseListener();
            }
        }
    }


    get isPlaying() {
        return this.#playing;
    }
    
    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

    get data() {
        return this.#outputBuffer.canvas;
    }

    get context() {
        return this.#outputBuffer.context;
    }

	get rawData() {
        if (this.#frameIndex > this.#images.length - 1) {
            throw new Error(`Index out of bound : ${this.#frameIndex}`);
        }
        //console.log("frameIndex = ", this.#frameIndex);
		return this.#images[this.#frameIndex];
	}

    get options() {
        return this.#options;
    }

}

export { AnimationLayer };