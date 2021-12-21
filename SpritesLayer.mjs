import { Buffer } from "./Buffer.mjs";

class SpritesLayer {
	#id;
	#options;
    #listener;
    #loaded;
    #sprites;
    #buffer;
    #ctx;

	constructor(id, _options, _listener) {
		var defaultOptions = {
            loop : false,
            autoplay : false,
            mimeType : 'video/webm'
        };
        this.#loaded = false;
        this.#id = id;
        this.#options = Object.assign(defaultOptions, _options);
        this.#listener = _listener;
        this.#sprites = {};
        this.#buffer = new Buffer(this.#options.width, this.#options.height);
        this.#ctx = this.#buffer.context;
        this.#ctx.imageSmoothingEnabled = false;
	}

    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
        return  this.#buffer.canvas;
	}

	get options() {
		return this.#options;
	}    

    #drawResized(sprite, target) {
        var oWidth = sprite.sprite.width;
        var oHeight = sprite.sprite.height;
        var width = Math.round(sprite.width);
        var height = Math.round(sprite.height);
    
        var ratio_w = oWidth / width;
        var ratio_h = oHeight / height;
        var ratio_w_half = Math.ceil(ratio_w / 2);
        var ratio_h_half = Math.ceil(ratio_h / 2);

        var img2 = sprite.sprite.context.createImageData(width, height);
        var data = sprite.sprite.data;
        var data2 = img2.data;
    
        for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
                var x2 = (i + j * width) * 4;
                var weight = 0;
                var weights = 0;
                var weights_alpha = 0;
                var gx_r = 0;
                var gx_g = 0;
                var gx_b = 0;
                var gx_a = 0;
                var center_y = (j + 0.5) * ratio_h;
                var yy_start = Math.floor(j * ratio_h);
                var yy_stop = Math.ceil((j + 1) * ratio_h);
                for (var yy = yy_start; yy < yy_stop; yy++) {
                    var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                    var center_x = (i + 0.5) * ratio_w;
                    var w0 = dy * dy; //pre-calc part of w
                    var xx_start = Math.floor(i * ratio_w);
                    var xx_stop = Math.ceil((i + 1) * ratio_w);
                    for (var xx = xx_start; xx < xx_stop; xx++) {
                        var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                        var w = Math.sqrt(w0 + dx * dx);
                        if (w >= 1) {
                            //pixel too far
                            continue;
                        }
                        //hermite filter
                        weight = 2 * w * w * w - 3 * w * w + 1;
                        var pos_x = 4 * (xx + yy * oWidth);
                        //alpha
                        gx_a += weight * data[pos_x + 3];
                        weights_alpha += weight;
                        //colors
                        if (data[pos_x + 3] < 255)
                            weight = weight * data[pos_x + 3] / 250;
                        gx_r += weight * data[pos_x];
                        gx_g += weight * data[pos_x + 1];
                        gx_b += weight * data[pos_x + 2];
                        weights += weight;
                    }
                }
                data2[x2] = gx_r / weights;
                data2[x2 + 1] = gx_g / weights;
                data2[x2 + 2] = gx_b / weights;
                data2[x2 + 3] = gx_a / weights_alpha;
            }
        }

        this.#ctx.clearRect(0, 0, oWidth, oHeight);
    
        //draw
        //target.drawImage(data2, sprite.x, sprite.y);
    }

    #renderSprites() {
        const that = this;

        this.#buffer.clear();
        //this.#buffer.context.fillStyle =  "rgba(255, 255, 0, 1)";
        //this.#buffer.context.fillRect(0,0, this.#options.width, this.#options.height);

        
        Object.keys(this.#sprites).forEach(id => {
            if (this.#sprites[id].visible) {
                //console.log( that.#sprites[id].sprite.data);
                const data = that.#sprites[id].sprite.data;
                //const data = this.#resample(that.#sprites[id].sprite.context, that.#sprites[id].sprite.data , this.#sprites[id].sprite.width, this.#sprites[id].sprite.height, this.#sprites[id].w, this.#sprites[id].h);
                //this.#drawResized(that.#sprites[id], this.#buffer.context);
                //console.log(data);
                this.#buffer.context.drawImage(data, that.#sprites[id].x, that.#sprites[id].y, that.#sprites[id].w, that.#sprites[id].h);
            }
        });



        requestAnimationFrame(this.#renderSprites.bind(this));
    }

    addSprite(id, sprite, x, y, w, h) {
        if (typeof this.#sprites[id] !== 'undefined') {
            console.log('Already exists : ' + id);
            return false;
        }


        this.#sprites[id] = {
            x : x,
            y : y,
            w : w,
            h : h,
            sprite : sprite,
            visible : true
        };
        
        if (!this.#loaded && typeof this.#listener === 'function') {
            this.#listener(this);
            requestAnimationFrame(this.#renderSprites.bind(this))
        }

        this.#loaded = true;

        return true;
    }

    getSprite(id) {
        return this.#sprites[id].sprite;
    }

    moveSprite(id,x,y) {
        this.#sprites[id].x = x;
        this.#sprites[id].x = y;
    }

    hideSprite(id) {
        this.#sprites[id].visible = false;
    }
    
    showSprite(id) {
        this.#sprites[id].visible = true;
    }

}

export { SpritesLayer };