import { BaseLayer } from "./BaseLayer.mjs";

class AnimationLayer extends BaseLayer {
    #images;
	#isPlaying;
    #isPaused;
    #loop;
	#renderNextFrame;
    #onPlayListener;
	#onPauseListener;
    #onStopListener;
    #frameIndex;
    #startTime;
    #frameDuration;


	constructor(_id, _width, _height, _options, _renderers, _loadedListener, _updatedListener, _playListener, _pauseListener, _stopListener) {

		var options = Object.assign({loop : false, autoplay : false, width: _width, height: _height}, _options);

        super(_id, _width, _height, options, _renderers, _loadedListener, _updatedListener);

        this._setType('animation');

		this.#onPlayListener = _playListener;
		this.#onPauseListener = _pauseListener;
        this.#onStopListener = _stopListener;
        this.#images = [new Image()];
        this.#isPlaying = false;
        this.#isPaused = false;
        this.#frameIndex = 0;
        this.#loop = options.loop;
        this.#renderNextFrame = function(){};

        if (!Array.isArray(options.images)) {
            throw new Error("options.images is required (array of paths to images)");
        }

        if (typeof options.duration !== 'number') {
            throw new Error("options.duration is required (value in milliseconds)");
        }

        this.#loadImages(options.images);
    }

    #onImagesLoaded() {

        // calculate how long each frame should be displayed
        this.#frameDuration = this._options.duration / this.#images.length;

        console.log(`Frame duration = ${this.#frameDuration}`);

        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this.#images[this.#frameIndex], 0, 0, this.width, this.height);

        this._layerLoaded();

		if (this._options.autoplay) {
			this.play();
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
            this.stop();
            return;
        }

        if (frameIndex != this.#frameIndex) {
            //console.log(frameIndex);
            //console.log(this.#images[this.#frameIndex]);
        }


        if (frameIndex >= this.#images.length) {
            this.#startTime = null;
            frameIndex = 0;
        }

        this.#frameIndex = frameIndex;

        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this.#images[this.#frameIndex], 0, 0, this.width, this.height);

        this.#renderNextFrame();
    }

    #requestRenderNextFrame() {
        requestAnimationFrame(this.#renderFrame.bind(this));        
    }

    #loadImages(images) {
        var tmpImages = [];
        var that = this;
        var cnt = 0;

        for(var i = 0 ; i < images.length ; i++) {

            tmpImages.push(null);

            // Index is used to put loaded image in the correct position in the array
            this._loadImageSynced(images[i], i).then( response => {

                response.blob.then( blob => {

                    createImageBitmap(blob).then( bitmap => {

                        //console.log(response.index, bitmap);

                        tmpImages[response.index] = bitmap;

                        cnt++;
                        if (cnt === images.length) {
                            that.#images = [...tmpImages];
                            that.#onImagesLoaded();
                        }
                    });
                });
            });
        }
    }

    play(loop) {
        if (this.isLoaded() && !this.#isPlaying) {
            
            if (typeof loop !== 'undefined') {
                this.#loop = !!loop;
            } else if (!this.#isPaused) {
                this.#loop = this._options.loop;
            }

            this.#startTime = null;
            this.#isPlaying = true;
            this.#isPaused = false;

            this.#renderNextFrame = this.#requestRenderNextFrame;
            this.#requestRenderNextFrame();

            this._startRendering();

            if (typeof this.#onPlayListener === 'function') {
                this.#onPlayListener();
            }
        }
    }

    stop() {
        if (this.#isPlaying) {
            this.#isPlaying = false;
            this.#isPaused = false;
            this.#frameIndex = 0;
            this.#renderNextFrame = function(){};
            this._stopRendering();

            if (typeof this.#onStopListener === 'function') {
                this.#onStopListener();
            }
        }
    }

    pause() {
        if (this.#isPlaying) {

            console.log(this.#loop);
            // Only looping animation can be paused
            if (this.#loop) {
                this.#isPlaying = false;
                this.#isPaused = true;
                this.#renderNextFrame = function(){};
                if (typeof this.#onPauseListener === 'function') {
                    this.#onPauseListener();
                }
            } else {
                console.log("Only looping animation can be paused");
                this.stop();
            }
        }
    }

    resume() {
        if (this.#isPaused) {
            this.play();
        } else {
            console.log("This video is not paused");
        }
    }


    get isPlaying() {
        return this.#isPlaying;
    }

    get isPaused() {
        return this.#isPaused; 
    }
    
	/*get rawData() {
        if (this.#frameIndex > this.#images.length - 1) {
            throw new Error(`Index out of bound : ${this.#frameIndex}`);
        }
        //console.log("frameIndex = ", this.#frameIndex);
		return this.#images[this.#frameIndex];
	}*/
}

export { AnimationLayer };