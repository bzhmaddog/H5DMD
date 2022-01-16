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

    /**
     * Called when all images are finished loading
     */
    #onImagesLoaded() {

        // calculate how long each frame should be displayed
        this.#frameDuration = this._options.duration / this.#images.length;

        //console.log(`Frame duration = ${this.#frameDuration}`);

        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this.#images[this.#frameIndex], 0, 0, this.width, this.height);

        // Call parent loaded callback
        this._layerLoaded();

		if (this._options.autoplay) {
			this.play();
		}

    }

    /**
     * Render current frame in content buffer
     * @param {number} t 
     * @returns 
     */
    #renderFrame(t) {

        var now = t;
        var previousFrameIndex = this.#frameIndex;

        if (!this.#startTime) {
            this.#startTime = now;
        }

        var position = now - this.#startTime;

        var frameIndex = Math.floor(position / this.#frameDuration);


        // If not looping stop at the last image in the array
        if (!this.#loop && frameIndex >= this.#images.length) {
            this.stop();
            return;
        }

        // Loop back to the first image
        if (frameIndex >= this.#images.length) {
            this.#startTime = null;
            frameIndex = 0;
        }

        this.#frameIndex = frameIndex;

        // If it is the same frame as last call then no need to redraw it
        if (frameIndex !== previousFrameIndex) {
            // Update content buffer with current frame data
            this._contentBuffer.clear();
            this._contentBuffer.context.drawImage(this.#images[this.#frameIndex], 0, 0, this.width, this.height);
        }

        // Render next frame if needed
        this.#renderNextFrame();
    }

    /**
     * Request rendering of next frame
     */
    #requestRenderNextFrame() {
        requestAnimationFrame(this.#renderFrame.bind(this));        
    }

    /**
     * Load animation images
     * @param {array of string or Image} images 
     */
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
                            that.#onImagesLoaded(); // All images are loaded
                        }
                    });
                });
            });
        }
    }

    /**
     * Play animation with current images array
     * @param {boolean} loop 
     */
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

    /**
     * Stop animation (frame index goes back to 0)
     */
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

    /**
     * Pause animation to current frame index (if started with loop=true otherwise duration will be wrong)
     * TODO : Maybe it is still possible to finish the animation
     */
    pause() {
        if (this.#isPlaying) {
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

    /**
     * Resumed a paused animation
     */
    resume() {
        if (this.#isPaused) {
            this.play();
        } else {
            console.log("This video is not paused");
        }
    }

    /**
     * return state of animation
     */
    get isPlaying() {
        return this.#isPlaying;
    }

    /**
     * return state of animation
     */
    get isPaused() {
        return this.#isPaused; 
    }
}

export { AnimationLayer };