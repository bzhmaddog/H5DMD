class TextLayer {
    #id;
    #loaded;
    #image;
    #options;
    #texts;
    #buffer;
    #ctx;
    #listener;

    constructor(id, _options, _listener) {
        this.#id = id,
        this.#loaded = false;
        this.#options = _options;
        this.#buffer = new Buffer(_options.width, _options.height);
        this.#ctx = this.#buffer.context;
        this.#ctx.imageSmoothingEnabled = false;
        this.#image = new Image();
        this.#listener = _listener;
        this.#image.addEventListener('load',  this.#onDataLoaded.bind(this));
        this.#texts = {};
    }

    #onDataLoaded() {
        this.#loaded =  true;
        if (typeof this.#listener === 'function') {
            this.#listener(this)
        }
    }

    addText(id, text, _options) {
        var defaultOptions = {
            top : 0,
            left: 0,
            color: 'white',
            align : 'left',
            fontSize : '12',
            fontFamily : 'Arial',
            textBaseline : 'top',
            xOffset : 0,
            yOffset : 0,
            strokeWidth : 0,
            strokeColor : 'black'
        },
        options = Object.assign(defaultOptions, _options);

        if (typeof text === 'undefined' || text === '') {
            return;
        }

        this.#texts[id] = {
            text : text,
            options : options
        }

        var left = options.left;
        var top = options.top;

        this.#ctx.fillStyle = options.color;
        this.#ctx.textBaseline = options.textBaseline;
        this.#ctx.font = (options.fontSize) + 'px ' + options.fontFamily;

        var m = this.#ctx.measureText(text);

        if (options.align === 'center') {
            left = (this.#options.width/2) - (m.width / 2);
        } else if (options.align === 'right') {
            left = this.#options.width - m.width;
        }

        if (typeof options.vAlign !== 'undefined') {
            // https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
            // Approximation of line height since api doesn't provide native method
            var textHeight = this.#ctx.measureText('M').width;

            switch(options.vAlign) {
                case 'top':
                    top = 0;
                    break;
                case 'middle':
                    top = (this.#options.height/2) - (textHeight / 2);
                    break;
                case 'bottom':
                    top = this.#options.height - textHeight;
                    break;
            }
        }

        left += options.xOffset;
        top += options.yOffset;

        if (options.strokeWidth > 0) {
            this.#ctx.strokeStyle = options.strokeColor;
            this.#ctx.lineWidth = options.strokeWidth;
            this.#ctx.strokeText(text, left, top);
        }

        this.#ctx.fillText(text, left, top);
   
        this.#image.src = this.#buffer.canvas.toDataURL("image/png");
    }

    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
		return this.#image;
	}

	get options() {
		return this.#options;
	}

    getText(id) {
        return this.#texts[id];
    }

    get texts() {
        return this.#texts;
    }
}