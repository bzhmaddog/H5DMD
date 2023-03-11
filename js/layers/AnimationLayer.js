import { BaseLayer } from "./BaseLayer.js";
import { Options } from "../Options.js";
import { LayerType } from "./BaseLayer.js";
class AnimationLayer extends BaseLayer {
    constructor(id, width, height, options, renderers, loadedListener, updatedListener, playListener, pauseListener, stopListener) {
        super(id, LayerType.Video, width, height, renderers, loadedListener, updatedListener);
        var defaultOptions = new Options({ loop: false, autoplay: false });
        Object.assign(this._options, defaultOptions, options);
        this._onPlayListener = playListener;
        this._onPauseListener = pauseListener;
        this._onStopListener = stopListener;
        this._images = []; // [new Image()];
        this._isPlaying = false;
        this._isPaused = false;
        this._frameIndex = 0;
        this._loop = options.get('loop', false);
        this.__renderNextFrame = function () { };
        if (!Array.isArray(options.get('images'))) {
            throw new Error("options.images is required (array of paths to images)");
        }
        if (typeof options.get('duration') !== 'number') {
            throw new Error("options.duration is required (value in milliseconds)");
        }
        this._loadImages(options.get('images', []));
    }
    /**
     * Called when all images are finished loading
     */
    _onImagesLoaded() {
        // calculate how long each frame should be displayed
        this._frameDuration = this._options.get('duration') / this._images.length;
        //console.log(`Frame duration = ${this._frameDuration}`);
        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this._images[this._frameIndex], 0, 0, this.width, this.height);
        // Call parent loaded callback
        this._layerLoaded();
        if (this._options.get('autoplay')) {
            this.play();
        }
    }
    /**
     * Render current frame in content buffer
     * @param {number} t
     * @returns
     */
    __renderFrame(t) {
        var now = t;
        var previousFrameIndex = this._frameIndex;
        if (!this._startTime) {
            this._startTime = now;
        }
        var position = now - this._startTime;
        var frameIndex = Math.floor(position / this._frameDuration);
        // If not looping stop at the last image in the array
        if (!this._loop && frameIndex >= this._images.length) {
            this.stop();
            return;
        }
        // Loop back to the first image
        if (frameIndex >= this._images.length) {
            this._startTime = null;
            frameIndex = 0;
        }
        this._frameIndex = frameIndex;
        // If it is the same frame as last call then no need to redraw it
        if (frameIndex !== previousFrameIndex) {
            // Update content buffer with current frame data
            this._drawImage();
        }
        // Render next frame if needed
        this.__renderNextFrame();
    }
    _drawImage() {
        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this._images[this._frameIndex], 0, 0, this.width, this.height);
    }
    /**
     * Request rendering of next frame
     */
    _requestRenderNextFrame() {
        requestAnimationFrame(this.__renderFrame.bind(this));
    }
    /**
     * Load animation images
     * @param {array of string or Image} images
     */
    _loadImages(images) {
        var tmpImages = [];
        var that = this;
        var cnt = 0;
        for (var i = 0; i < images.length; i++) {
            tmpImages.push(undefined);
            // Index is used to put loaded image in the correct position in the array
            this._loadImageSynced(images[i], i).then(response => {
                response.blob.then(blob => {
                    createImageBitmap(blob).then(bitmap => {
                        //console.log(response.index, bitmap);
                        tmpImages[response.index] = bitmap;
                        cnt++;
                        if (cnt === images.length) {
                            that._images = [...tmpImages];
                            that._onImagesLoaded(); // All images are loaded
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
        if (this.isLoaded() && !this._isPlaying) {
            // if loop param provided then set animation loop to value
            if (typeof loop !== 'undefined') {
                this._loop = !!loop;
                // Otherwise if animation is not paused reset loop state to initial options
            }
            else if (!this._isPaused) {
                this._loop = this._options.get('loop');
            }
            this._startTime = null;
            this._isPlaying = true;
            this._isPaused = false;
            this.__renderNextFrame = this._requestRenderNextFrame;
            this._requestRenderNextFrame();
            this._startRendering();
            if (typeof this._onPlayListener === 'function') {
                this._onPlayListener();
            }
        }
    }
    /**
     * Stop animation (frame index goes back to 0)
     */
    stop() {
        if (this._isPlaying) {
            this._isPlaying = false;
            this._isPaused = false;
            this._frameIndex = 0;
            this.__renderNextFrame = function () { };
            this._stopRendering();
            if (typeof this._onStopListener === 'function') {
                this._onStopListener();
            }
        }
    }
    /**
     * Pause animation to current frame index (if started with loop=true otherwise duration will be wrong)
     * TODO : Maybe it is still possible to finish the animation
     */
    pause() {
        if (this._isPlaying) {
            // Only looping animation can be paused
            if (this._loop) {
                this._isPlaying = false;
                this._isPaused = true;
                this.__renderNextFrame = function () { };
                if (typeof this._onPauseListener === 'function') {
                    this._onPauseListener();
                }
            }
            else {
                console.log("Only looping animation can be paused");
                this.stop();
            }
        }
    }
    /**
     * Resumed a paused animation
     */
    resume() {
        if (this._isPaused) {
            this.play();
        }
        else {
            console.log("This video is not paused");
        }
    }
    nextFrame() {
        var nextFrame = this._frameIndex + 1;
        if (nextFrame >= this._images.length) {
            nextFrame = 0;
        }
        this._frameIndex = nextFrame;
        requestAnimationFrame(this._drawImage.bind(this));
        this._layerUpdated();
    }
    previousFrame() {
        var prevFrame = this._frameIndex - 1;
        if (prevFrame <= 0) {
            prevFrame = this._images.length - 1;
        }
        this._frameIndex = prevFrame;
        requestAnimationFrame(this._drawImage.bind(this));
        this._layerUpdated();
    }
    /**
     * Override base method to stop/resume animation when changing layer visibility
     */
    setVisibility(visible) {
        super.setVisibility(visible);
        if (!visible && this._isPlaying) {
            this.pause();
        }
        else if (visible && this._isPaused) {
            this.resume();
        }
    }
    /**
     * return state of animation
     */
    get isPlaying() {
        return this._isPlaying;
    }
    /**
     * return state of animation
     */
    get isPaused() {
        return this._isPaused;
    }
}
export { AnimationLayer };
//# sourceMappingURL=AnimationLayer.js.map