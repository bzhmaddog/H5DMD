import { Buffer } from "./Buffer.mjs";

class Sprite {
    #id;
    #buffer;
    #spriteSheet;
    #animations;
    #animation;
    #isAnimating;
    #spriteSheetLoaded;
    #loop;
    #queue;
    #loopSequence;
    #frameOffset;
    #maxHeight;
    #maxWidth;
    #endOfQueueListener;
    #frameDuration;
    #frameIndex;
    #startTime;

    /**
     * 
     * @param {string} spriteSheetSrc Path to the spritesheet file
     * @param {number} frameOffset Distance between each frame (horizontaly)
     * @returns 
     */
    constructor(id, spriteSheetSrc, frameOffset) {
        const that = this;

        this.#id = id;
        this.#spriteSheet = new Image();

        this.#buffer = new Buffer(0 ,0);

        this.#animations = {};
        this.#animation = null;
        this.#isAnimating = false;
        this.#spriteSheetLoaded = false;
        this.#loop = 1;
        this.#queue = [];
        this.#loopSequence = false;
        this.#maxHeight = 0;
        this.#maxWidth = 0;
        this.#frameIndex = 0;
        this.#frameDuration = 0;

        this.#frameOffset = frameOffset;

        return new Promise(resolve => {
            that.#spriteSheet.addEventListener('load', function() {
                //console.log("Spritesheet Loaded");
                that.#spriteSheetLoaded = true;
                resolve(that);
            });
            that.#spriteSheet.src = spriteSheetSrc;
        });
    }

    /**
     * 
     * @param {string} id Name of the animation (used to run/stop it)
     * @param {number} nbFrames Number of frames in this animation
     * @param {number} width Number of horizontal pixels of each frame
     * @param {number} height Number of vertical pixels of each frame
     * @param {number} xOffset Offset from the left side of the spritesheet
     * @param {number} Yoffset Offset from the top of the spritesheet
     * @param {number} duration duration of animation (ms)
     */
    addAnimation(id, nbFrames, width, height, xOffset, Yoffset, duration) {

        if (typeof this.#animations[id] === 'undefined') {
            this.#animations[id] = {
                width: width,
                height: height,
                nbFrames : nbFrames,
                xOffset : xOffset,
                yOffset : Yoffset,
                duration : duration
            };

            this.#maxHeight = Math.max(this.#maxHeight, height);
            this.#maxWidth = Math.max(this.#maxWidth, width);
        } else {
            throw new Error(`Animation [${id} already exists in sprite [${this.#id}]`);
        }
    }

    /**
     * Main render routine
     */
    #doAnimation(t) {
        var now = t;
        var previousFrameIndex = this.#frameIndex;

        if (this.#startTime === null) {
            this.#startTime = now;
        }

        var delta = now - this.#startTime;

        // Calculate frame number given delta and duration
        this.#frameIndex = Math.floor(delta / this.#frameDuration);

        // If loop is 
        if (this.#frameIndex >= this.#animation.params.nbFrames) {
            this.#loop++;

            // End of loop then process queue to start next animation in line
            if (this.#animation.loop > 0 && this.#loop > this.#animation.loop) {
                this.#processQueue(true);
                return;
            }

            // Start animation back to first frame
            this.#frameIndex = 0;
            this.#startTime = null;
        }


        // Only redraw buffer is frame is different
        if (this.#frameIndex !== previousFrameIndex) {
            let xOffset = this.#frameIndex * (this.#animation.params.width + this.#frameOffset) + this.#animation.params.xOffset;
            // Shift vertical position so that sprites are aligned at the bottom
            let yPos = this.#maxHeight - this.#animation.params.height;

            //console.log(`${this.#frameIndex} / ${xOffset} / ${yPos}`);
   
            this.#buffer.clear();
            this.#buffer.context.drawImage(this.#spriteSheet,  xOffset,  this.#animation.params.yOffset, this.#animation.params.width, this.#animation.params.height, 0, yPos, this.#animation.params.width, this.#animation.params.height);
        }

        requestAnimationFrame(this.#doAnimation.bind(this));
    }

    /**
     * Pop animation from the queue and play it
     */
    #processQueue() {

        if (this.#queue.length > 0) {

            if (this.#loopSequence) {

                if (this.#queue.length > 1) {
                    this.#animation = this.#queue.shift();
                    // Put this animation to the bottom of the queue is needed
                    this.#queue.push(this.#animation);
                } else {
                    console.log('here');
                    this.#animation = this.#queue[0];
                }

            } else {
                this.#animation = this.#queue.shift();
            }


            this.#frameIndex = this.#animation.params.nbFrames; // To force rendering of frame 0
            this.#startTime = null;
            this.#frameDuration = this.#animation.params.duration / this.#animation.params.nbFrames;
            this.#isAnimating = true;
            this.#loop = 1;


            // Resizing will clear buffer so do it only if needed
            if (this.#buffer.width !== this.#animation.params.width) {
                this.#buffer.width = this.#animation.params.width;
            }

            // Resizing will clear buffer so do it only if needed
            if (this.#buffer.height !== this.#maxHeight) {
                this.#buffer.height =  this.#maxHeight;
            }

            requestAnimationFrame(this.#doAnimation.bind(this));
        } else {
            this.#isAnimating = false;
            if (typeof this.#endOfQueueListener === 'function') {
                this.#endOfQueueListener(this.#id);
            }
        }
    }


    /**
     * Play a single animation
     * @param {string} Animation id
     * @param {number} nbLoop 
     */
    enqueueSingle(id, nbLoop) {

        // Exit if source image is not loaded
        if (!this.#spriteSheetLoaded) {
            return;
        }

        this.#queue.push({
            params : this.#animations[id],
            loop : (typeof nbLoop === 'number') ? nbLoop : 0
        });
    }



    /**
     * 
     * @param {array} An array of ids and number of loop 
     * @param {boolean} should the sequence loop indefinitely
     */
    enqueueSequence(seq, loop) {

      
        // Build array of animation
        // array[0] = animation id
        // array[1] = number of loop
        for (var i = 0 ; i < seq.length ; i++) {
            this.#queue.push({
                params : this.#animations[seq[i][0]],
                loop : Math.max(1, seq[i][1])
            });
        }

        // Boolean
        this.#loopSequence = !!loop;

        // Start animation
        //this.#processQueue();
    }

    run() {
        this.#processQueue();
    }

    /**
     * Stop current animation
     * TODO
     */
    stop() {
        this.#isAnimating = false;
        this.#loopSequence = false;
        this.#queue = [];
    }

    /**
     * Return current image
     */
    get data() {
        return this.#buffer.canvas;
	}

    /**
     * Get output buffer context
     */
    get context() {
        return this.#buffer.context;
    }

    /**
     * Get sprite width
     */
    get width() {
        return this.#maxWidth;
    }

    /**
     * Get sprite height
     */
    get height() {
        return this.#maxHeight;
    }

    /**
     * Is the sprite currently animating ?
     * @returns boolean
     */
    isAnimating() {
        return this.#isAnimating;
    }

    /**
     * Set the End of queue listener that will be called when current queue is empty
     * @param {function} _listener 
     */
    setEndOfQueueListener(_listener) {
        if (typeof _listener === 'function') {
            this.#endOfQueueListener = _listener;
        }
    }

    /**
     * Clone this sprite and return it
     * @returns Sprite
     */
    clone() {
        return new Promise(resolve => {

           new Sprite(this.#spriteSheet.src, this.#frameOffset).then( s => {

                Object.keys(this.#animations).forEach(id => {
                    //console.log(id);
                    var a = this.#animations[id];
                    //console.log(a);
                    s.addAnimation(id, a.nbFrames, a.width, a.height, a.xOffset, a.yOffset, a.duration);
                });
          
                resolve(s);
            });
        });
    }
}

export { Sprite };