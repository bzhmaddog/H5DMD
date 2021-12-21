import { Buffer } from './Buffer.mjs';
import { Text } from './Text.mjs';
import { Colors } from './Colors.mjs';

class TextLayer {
    #id;
    #loaded;
    #options;
    #texts;
    #buffer;
    #ctx;
    #loadedListener;
    #updatedListener;

    constructor(id, _options, _loadedListener, _updatedListener) {
        var defaultOptions = {};
        this.#id = id,
        this.#loaded = false;
        this.#options = Object.assign(defaultOptions, _options);
        this.#buffer = new Buffer(_options.width, _options.height);
        this.#ctx = this.#buffer.context;
        this.#ctx.imageSmoothingEnabled = false;
        this.#loadedListener = _loadedListener;
        this.#updatedListener = _updatedListener;
        this.#texts = {};

        this.#buffer.context.imageSmoothingEnabled = false;

        this.#onDataLoaded();
    }

    #onDataLoaded() {
        this.#loaded =  true;
        if (typeof this.#loadedListener === 'function') {
            this.#loadedListener(this)
        }
    }

    #onTextUpdated() {
        this.#redrawLayer();
        if (typeof this.#updatedListener === 'function') {
            //this.#updatedListener(this);
        }
    }

    #redrawLayer() {
        var texts = this.#texts;
        this.#texts = {};
        var that = this;

        this.#buffer.clear();

        Object.keys(texts).forEach(id => {
            var text = texts[id];
            that.addText(id, text.getText(), text.getOptions());
        });
    }


    addText(id, text, _options) {
        var defaultOptions = {
            top : 0,
            left: 0,
            color: Colors.white,
            align : 'left',
            fontSize : '12',
            fontFamily : 'Arial',
            textBaseline : 'top',
            xOffset : 0,
            yOffset : 0,
            strokeWidth : 0,
            strokeColor : Colors.black,
            adjustWidth : false
        },
        options = Object.assign(defaultOptions, _options);

        if (typeof text === 'undefined' || text === '') {
            return;
        }

        this.#texts[id] = new Text(text, options, this.#onTextUpdated.bind(this));

        var left = options.left;
        var top = options.top;

        this.#ctx.fillStyle = options.color;
        this.#ctx.textBaseline = options.textBaseline;

        var m;

        if (options.adjustWidth) {
            var textOk = false;

            while(!textOk) {
                this.#ctx.font = options.fontSize + 'px ' + options.fontFamily;
                m = this.#ctx.measureText(text);
   
                if (m.width > this.#options.width - 5) {
                    options.fontSize--;
                } else {
                    textOk = true;
                }
            }
            
        } else {
            this.#ctx.font = (options.fontSize) + 'px ' + options.fontFamily;
            m = this.#ctx.measureText(text);       
        }



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
    }

    get getId() {
		return this.#id;
	}

	get isLoaded() {
		return this.#loaded;
	}

	get data() {
        return this.#buffer.canvas;
	}

	get options() {
		return this.#options;
	}

    get texts() {
        return this.#texts;
    }

    getText(id) {
        return this.#texts[id];
    }

    removeAllTexts() {
        this.#texts = {};
    }
}

export { TextLayer };