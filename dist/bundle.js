/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/AnimationLayer.ts":
/*!*******************************!*\
  !*** ./src/AnimationLayer.ts ***!
  \*******************************/
/***/ (() => {

throw new Error("Module parse failed: Unexpected token (113:36)\nFile was processed with these loaders:\n * ./node_modules/ts-loader/index.js\nYou may need an additional loader to handle the result of these loaders.\n|      */\n|     AnimationLayer.prototype._loadImages = function (images) {\n>         var tmpImages = ImageBitmap[];\n|         var that = this;\n|         var cnt = 0;");

/***/ }),

/***/ "./src/BaseLayer.ts":
/*!**************************!*\
  !*** ./src/BaseLayer.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BaseLayer": () => (/* binding */ BaseLayer),
/* harmony export */   "LayerType": () => (/* binding */ LayerType)
/* harmony export */ });
/* harmony import */ var _Buffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Buffer */ "./src/Buffer.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};

var LayerType;
(function (LayerType) {
    LayerType[LayerType["Image"] = 0] = "Image";
    LayerType[LayerType["Canvas"] = 1] = "Canvas";
    LayerType[LayerType["Text"] = 2] = "Text";
    LayerType[LayerType["Video"] = 3] = "Video";
    LayerType[LayerType["Animation"] = 4] = "Animation";
    LayerType[LayerType["Sprites"] = 5] = "Sprites";
})(LayerType || (LayerType = {}));
/**
 * Abstract Layer for the DMD
 */
var BaseLayer = /** @class */ (function () {
    function BaseLayer(id, width, height, renderers, loadedListener, updatedListener) {
        if (this.constructor === BaseLayer) {
            throw new TypeError('Abstract class "BaseLayer" cannot be instantiated directly');
        }
        this._id = id;
        this._loadedListener = loadedListener;
        this._updatedListener = updatedListener;
        this._defaultRenderQueue = [];
        this._renderQueue = [];
        this._availableRenderers = Object.assign({}, renderers);
        this._opacity = 1;
        this._loaded = false;
        this._rendererParams = {};
        this._groups = ['default'];
        this._options = {
            visible: true,
            renderers: [],
            antialiasing: true,
            aaTreshold: 254,
            groups: []
        };
        this._options.aaTreshold = Math.min(this._options.aaTreshold, 254);
        if (!Array.isArray(this._options.renderers)) {
            throw new TypeError("options.renderers should be an array");
        }
        if (typeof this._options.groups === 'string') {
            try {
                this._groups = this._groups.concat(this._options.groups.replace(/\s*/gi, '').split(/[ ,;]/));
            }
            catch (e) {
                throw new Error("Incorrect list of group provided", e);
            }
        }
        else if (Array.isArray(this._options.groups)) {
            this._groups = this._groups.concat(this._options.groups);
        }
        this._visible = this._options.visible;
        // Empty method to automatically end rendering when layer is hidden
        this._renderNextFrame = function () { console.log("Layer [".concat(this._id, "] : Rendering ended")); };
        this._contentBuffer = new _Buffer__WEBPACK_IMPORTED_MODULE_0__.Buffer(width, height, true);
        this._outputBuffer = new _Buffer__WEBPACK_IMPORTED_MODULE_0__.Buffer(width, height);
        // NOT WORKING
        this._contentBuffer.context.imageSmoothingEnabled = this._options.antialiasing;
        this._outputBuffer.context.imageSmoothingEnabled = this._options.antialiasing;
        // Build default render queue to save some time in renderFrame
        // Since this should not change after creation
        for (var i = 0; i < this._options.renderers.length; i++) {
            if (typeof this._availableRenderers[this._options.renderers[i]] !== 'undefined') {
                this._defaultRenderQueue.push({
                    id: this._options.renderers[i],
                    instance: this._availableRenderers[this._options.renderers[i]]
                });
            }
            else {
                console.log("Renderer ".concat(this._options.renderers[i], " is not in the list of available renderers"));
            }
        }
        // Match antialiasing remomving renderer params to the value in options
        this.setRendererParams('no-antialiasing', [this._options.aaTreshold]);
        // set opacity from options if needed
        if (typeof this._options.opacity === 'number') {
            var opacity = Math.max(0, Math.min(Number.parseFloat(this._options.opacity), 1));
            this._opacity = Math.round(opacity * 1e3) / 1e3;
            // set opacity renderer param value
            this.setRendererParams('opacity', [this._opacity]);
        }
    }
    /**
     * get render parameters for specified renderer key
     * @param {string} id
     * @returns
     */
    BaseLayer.prototype.getRendererParams = function (id) {
        if (typeof this._rendererParams[id] !== 'undefined') {
            return this._rendererParams[id];
        }
        else {
            return null;
        }
    };
    /**
     * Set renderer parameters
     * TODO : Improve that by creating Classes provided by renderers themself
     * @param {string} id
     * @param {array} value
     */
    BaseLayer.prototype.setRendererParams = function (id, value) {
        this._rendererParams[id] = value;
    };
    /**
     * Request rendering of layer frame
     */
    BaseLayer.prototype._requestAnimationFrame = function () {
        requestAnimationFrame(this._renderFrame.bind(this));
    };
    /**
     * Start rendering process
     */
    BaseLayer.prototype._renderFrame = function (t) {
        var that = this;
        // clone renderers array;
        this._renderQueue = __spreadArray([], this._defaultRenderQueue, true) || [];
        // If opacity is below 1 add opacity renderer
        if (this._opacity < 1) {
            this._renderQueue.push({
                id: 'opacity',
                instance: this._availableRenderers['opacity']
            });
        }
        // Get initial data from layer content
        var frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
        // start renderers queue processing
        this._processRenderQueue(frameImageData);
    };
    /**
     * Process image data provided through current renderer in queue and call it self recursively until no more renderer in queue
     * @param {ImageData} frameImageData
     * @returns {ImageData} result data of the renderer
     */
    BaseLayer.prototype._processRenderQueue = function (frameImageData) {
        var that = this;
        // if there is a renderer in the queue then run render pass with this renderer
        if (this._renderQueue.length) {
            var renderer = this._renderQueue.shift(); // pop renderer from render queue
            // First param is always the image data
            var params = [frameImageData.data];
            // Merge renderer params with array of params specific to this renderer if any
            if (this.getRendererParams(renderer.id) !== null) {
                params = params.concat(this.getRendererParams(renderer.id));
            }
            //console.log(this._id, params);
            // Apply 'filter' to provided content with current renderer then process next renderer in queue
            renderer.instance.renderFrame.apply(renderer.instance, params).then(function (outputData) {
                that._processRenderQueue(outputData);
            });
            // no more renderer in queue then draw final image and start queue process again	
        }
        else {
            // Erase current output buffer content
            that._outputBuffer.clear();
            // Put final frame data into output buffer and start process again (if needed)
            createImageBitmap(frameImageData).then(function (bitmap) {
                // Put final layer data in the output buffer
                that._outputBuffer.context.drawImage(bitmap, 0, 0);
                // request next frame rendering
                that._renderNextFrame();
            });
        }
    };
    /**
     * Layer is loaded : Start rendering and call the callback if needed
     * @param {boolean} startRenderingLoop
     */
    BaseLayer.prototype._layerLoaded = function (startRenderingLoop) {
        if (startRenderingLoop === void 0) { startRenderingLoop = false; }
        var that = this;
        this._loaded = true;
        console.log("Layer [".concat(this._id, "] : Loaded"));
        // If no renderer in the queue then just render the frame data once
        if (this._defaultRenderQueue.length === 0 && this._opacity === 1) {
            // Put content data in output buffer
            var frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
            this._outputBuffer.clear();
            createImageBitmap(frameImageData).then(function (bitmap) {
                that._outputBuffer.context.drawImage(bitmap, 0, 0);
            });
        }
        // start rendering visible layers which have renderers
        if (this.isVisible() && (this.haveRenderer() || !!startRenderingLoop)) {
            this._renderNextFrame = this._requestAnimationFrame;
            this._requestAnimationFrame();
        }
        // Call callback if there is one
        if (typeof this._loadedListener === 'function') {
            this._loadedListener(this);
        }
    };
    /**
     * Layer was updated
     */
    BaseLayer.prototype._layerUpdated = function () {
        console.log("Layer [".concat(this._id, "] : Updated"));
        // Re-render frame if needed
        if (!this.haveRenderer()) {
            this._renderFrame();
        }
        // Callback parent if available
        if (typeof this._updatedListener === 'function') {
            this._updatedListener(this);
        }
    };
    /**
     * Stop rendering of the layer
     */
    BaseLayer.prototype._stopRendering = function () {
        this._renderNextFrame = function () { console.log("Rendering stopped : ".concat(this._id)); };
    };
    /**
     * Start rendering of the layer
     */
    BaseLayer.prototype._startRendering = function () {
        console.log("Layer [".concat(this._id, "] : Start rendering"));
        this._renderNextFrame = this._requestAnimationFrame;
        this._requestAnimationFrame();
    };
    /**
     * Fetch an image from remote server
     * @param {string} src
     * @returns
     */
    BaseLayer.prototype._loadImage = function (src) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(src)];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 2];
                        throw new Error("HTTP error! status: ".concat(response.status));
                    case 2: return [4 /*yield*/, response.blob()];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Fetch image from server with an index used to determine position
     * @param {string} src
     * @param {number} index
     * @returns
     */
    BaseLayer.prototype._loadImageSynced = function (src, index) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(src)];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("HTTP error! status: ".concat(response.status));
                        }
                        else {
                            return [2 /*return*/, {
                                    blob: response.blob(),
                                    index: index
                                }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Return visibility state of the layer
     * @returns boolean
     */
    BaseLayer.prototype.isVisible = function () {
        return this._visible;
    };
    /**
     * Set visibility state of the layer
     * @param {boolean} state
     */
    BaseLayer.prototype.setVisibility = function (state) {
        // State didn't change do nothing
        if (state === this._visible) {
            return;
        }
        this._visible = state;
        // If layer become visible and have renderers then start the rendering loop
        if (this._visible && this.haveRenderer()) {
            this._renderNextFrame = this._requestAnimationFrame;
            this._requestAnimationFrame();
            // Otherwise stop the rendering loop
        }
        else {
            this._renderNextFrame = function () { console.log('End of rendering :' + this._id); };
        }
    };
    /**
     * Toggle layer visibility and return the new state
     * @returns boolean
     */
    BaseLayer.prototype.toggleVisibility = function () {
        this._visible = !this._visible;
        return this._visible;
    };
    /**
     * Return the type of the layer
     * @returns string
     */
    BaseLayer.prototype.getType = function () {
        return this._type;
    };
    /**
     * Return layer id
     * @returns string
     */
    BaseLayer.prototype.getId = function () {
        return this._id;
    };
    /**
     * Return requested renderer instance
     * @param {string} id
     * @returns object
     */
    BaseLayer.prototype._getRendererInstance = function (id) {
        if (typeof this._availableRenderers[id] !== 'undefined') {
            return this._availableRenderers[id];
        }
        else {
            throw new Error("This renderer is not available");
        }
    };
    /**
     * Return if the layer have renderer in the queue
     * @returns boolean
     */
    BaseLayer.prototype.haveRenderer = function () {
        return this._defaultRenderQueue.length > 0;
    };
    /**
     * Set layer opacity (0 -> 1)
     * @param {number} o
     */
    BaseLayer.prototype.setOpacity = function (o) {
        var opacity = Math.max(0, Math.min(Number.parseFloat(o), 1));
        this._opacity = Math.round(opacity * 1e3) / 1e3;
        // set opacity renderer param value
        this.setRendererParams('opacity', [this._opacity]);
        console.log("Layer [".concat(this._id, "] : Opacity changed to ").concat(this._opacity));
        // Layer need to be redrawn
        this._layerUpdated();
    };
    /**
     * Clear buffers
     */
    BaseLayer.prototype.clear = function () {
        this._contentBuffer.clear();
        this._outputBuffer.clear();
    };
    /**
     * Redraw layer
     */
    /*redraw() {
        this._requestAnimationFrame();
    }*/
    /**
     * Return loading state of the layer
     * @returns boolean
     */
    BaseLayer.prototype.isLoaded = function () {
        return this._loaded;
    };
    /**
     * Set layer type
     * @param {LayerType} t
     */
    BaseLayer.prototype._setType = function (t) {
        this._type = t;
    };
    /**
     * Enable/Disable antialiasing
     * TODO : Fix not working as expected
     * @param {boolean} enabled
     */
    BaseLayer.prototype._setAntialiasing = function (enabled) {
        this._outputBuffer.context.imageSmoothingEnabled = enabled;
    };
    Object.defineProperty(BaseLayer.prototype, "imageData", {
        /**
         * Get current image data
         */
        get: function () {
            return this._outputBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "canvas", {
        /**
         * Get output canvas
         */
        get: function () {
            return this._outputBuffer.canvas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "originalCanvas", {
        /**
         * Get content canvas (whith any filter)
         */
        get: function () {
            return this._contentBuffer.canvas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "context", {
        /**
         * Get output canvas context
         */
        get: function () {
            return this._outputBuffer.context;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "options", {
        /**
         * Get layer options
         */
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "width", {
        /**
         * Get layer width
         */
        get: function () {
            return this._outputBuffer.width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "height", {
        /**
         * Get layer height
         */
        get: function () {
            return this._outputBuffer.height;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseLayer.prototype, "groups", {
        /**
         * Get groups the layer belong to
         */
        get: function () {
            return this._groups;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Destroy layer (for now it just mean stopping rendering)
     */
    BaseLayer.prototype.destroy = function () {
        this._renderNextFrame = function () { console.log("Destroying layer : ".concat(this._id)); };
    };
    return BaseLayer;
}());



/***/ }),

/***/ "./src/Buffer.ts":
/*!***********************!*\
  !*** ./src/Buffer.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Buffer": () => (/* binding */ Buffer)
/* harmony export */ });
/**
 * Provide a simple class to build a buffer for our layers and our DMD
 */
var Buffer = /** @class */ (function () {
    /**
    * @param width {integer} The width of the buffer
    * @param height {integer} The height of the buffer
    */
    function Buffer(width, height, willReadFrequently) {
        if (willReadFrequently === void 0) { willReadFrequently = true; }
        this._canvas = document.createElement('canvas'); // Offscreen canvas
        this._canvas.width = width;
        this._canvas.height = height;
        var options = null;
        if (willReadFrequently) {
            //console.log("Buffer() : Settings willReadyFrequently to true")
            options = { willReadFrequently: true };
        }
        this._context = this._canvas.getContext('2d', options);
    }
    Object.defineProperty(Buffer.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "canvas", {
        get: function () {
            return this._canvas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "width", {
        get: function () {
            return this._canvas.width;
        },
        set: function (width) {
            this._canvas.width = width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "height", {
        get: function () {
            return this._canvas.height;
        },
        set: function (height) {
            this._canvas.height = height;
        },
        enumerable: false,
        configurable: true
    });
    Buffer.prototype.clear = function () {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    };
    return Buffer;
}());



/***/ }),

/***/ "./src/CanvasLayer.ts":
/*!****************************!*\
  !*** ./src/CanvasLayer.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CanvasLayer": () => (/* binding */ CanvasLayer)
/* harmony export */ });
/* harmony import */ var _BaseLayer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseLayer */ "./src/BaseLayer.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var CanvasLayer = /** @class */ (function (_super) {
    __extends(CanvasLayer, _super);
    function CanvasLayer(id, width, height, options, renderers, loadedListener, updatedListener) {
        var _this = _super.call(this, id, width, height, renderers, loadedListener, updatedListener) || this;
        _this._options = Object.assign(_this._options, options);
        _this._setType(_BaseLayer__WEBPACK_IMPORTED_MODULE_0__.LayerType.Canvas);
        _this._globalOptions = {
            top: 0,
            left: 0,
            keepAspectRatio: true
        };
        // Delay onLayerUpdated a bit otherwise #content is undefined in Layer.mjs
        setTimeout(_this._layerLoaded.bind(_this), 1);
        return _this;
    }
    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param {HTMLImageElement} img
     * @param {object} _options
     */
    CanvasLayer.prototype.drawImage = function (img, _options) {
        var defaultOptions = {
            width: img.width,
            height: img.height
        };
        var options = this._buildOptions(_options, defaultOptions);
        this._contentBuffer.context.drawImage(img, options.left, options.top, options.width, options.height);
        this._layerUpdated();
    };
    /**
     * Draw provided image onto canvas
     * If img is a string then image is loaded before drawing
     * @param {string} img
     * @param {object} _options
     */
    /*drawImage(img: string, _options) {
        var that = this;

        this._loadImage(img).then(blob => {
            createImageBitmap(blob).then( bitmap => {

                var defaultOptions = {
                    width : bitmap.width,
                    height : bitmap.height
                };

                var options = that._buildOptions(_options, defaultOptions);

                that._contentBuffer.context.drawImage(bitmap, options.left, options.top, options.width, options.height);
                that._layerUpdated();
            });
        });
    }*/
    CanvasLayer.prototype._buildOptions = function (_options, _defaultOptions) {
        var options = Object.assign(this._globalOptions, _defaultOptions, _options);
        var isMissingDimension = (typeof _options.width === 'undefined' || typeof _options.height === 'undefined');
        var isMissingAllDimensions = (typeof _options.width === 'undefined' && typeof _options.height === 'undefined');
        if (typeof options.left === 'string' && options.left.at(-1) === '%') {
            var xv = parseInt(options.left.replace('%', ''), 10);
            options.left = Math.floor((xv * this.width) / 100);
        }
        if (typeof options.top === 'string' && options.top.at(-1) === '%') {
            var yv = parseInt(options.top.replace('%', ''), 10);
            options.top = Math.floor((yv * this.height) / 100);
        }
        if (typeof options.width === 'string' && options.width.at(-1) === '%') {
            var wv = parseInt(options.width.replace('%', ''), 10);
            options.width = Math.floor((wv * this.width) / 100); // % of the dmd Width
        }
        if (typeof options.height === 'string' && options.height.at(-1) === '%') {
            var hv = parseInt(options.height.replace('%', ''), 10);
            options.height = Math.floor((hv * this.height) / 100); // % of the dmd Height
        }
        // If provided only one of width or height and keeping ratio is required then calculate the missing dimension
        if (options.keepAspectRatio && isMissingDimension && !isMissingAllDimensions) {
            if (typeof _options.width === 'undefined') {
                options.width = Math.floor(options.height * _defaultOptions.width / _defaultOptions.height);
            }
            else if (typeof _options.height === 'undefined') {
                options.height = Math.floor(options.width * _defaultOptions.height / _defaultOptions.width);
            }
        }
        if (typeof options.align === 'string') {
            switch (options.align) {
                case 'left':
                    if (typeof _options.left !== 'undefined' && options.left !== 0) {
                        console.warn("CanvasLayer[".concat(this.getId(), "].drawImage() : align: 'left' is overriding left:").concat(_options.left));
                    }
                    options.left = 0;
                case 'center':
                    var alignCenter = this.width / 2 - options.width / 2;
                    if (typeof _options.left !== 'undefined' && options.left !== alignCenter) {
                        console.warn("CanvasLayer[".concat(this.getId(), "].drawImage() : align: 'center' is overriding left:").concat(_options.left));
                    }
                    options.left = alignCenter;
                    break;
                case 'right':
                    var alignRight = this.width - options.width;
                    if (typeof _options.left !== 'undefined' && options.left !== alignRight) {
                        console.warn("CanvasLayer[".concat(this.getId(), "].drawImage() : align: 'right' is overriding left:").concat(_options.left));
                    }
                    options.left = alignRight;
                    break;
                default:
                    console.warn("CanvasLaye[".concat(this.getId(), "].drawImage(): Incorrect value align:'").concat(options.align, "'"));
            }
        }
        if (typeof options.vAlign === 'string') {
            switch (options.vAlign) {
                case 'top':
                    if (typeof _options.top !== 'undefined' && options.top !== 0) {
                        console.warn("CanvasLayer[".concat(this.getId(), "].drawImage() : vAlign: 'top' is overriding top:").concat(_options.top));
                    }
                    options.top = 0;
                    break;
                case 'middle':
                    var alignMiddle = this.height / 2 - options.height / 2;
                    if (typeof _options.top !== 'undefined' && options.top !== alignMiddle) {
                        console.warn("CanvasLayer[".concat(this.getId(), "].drawImage() : vAlign: 'middle' is overriding top:").concat(_options.top));
                    }
                    options.top = alignMiddle;
                    break;
                case 'bottom':
                    var alignBottom = this.height - options.height;
                    if (typeof _options.top !== 'undefined' && options.top !== alignBottom) {
                        console.warn("CanvasLayer[".concat(this.getId(), "].drawImage() : vAlign: 'bottom' is overriding top:").concat(_options.top));
                    }
                    options.top = alignBottom;
                    break;
                default:
                    console.warn("CanvasLayer[".concat(this.getId(), "].drawImage(): Incorrect value vAlign:'").concat(options.vAlign, "'"));
            }
        }
        //console.log(this.getId(), options);
        return options;
    };
    return CanvasLayer;
}(_BaseLayer__WEBPACK_IMPORTED_MODULE_0__.BaseLayer));



/***/ }),

/***/ "./src/Easing.ts":
/*!***********************!*\
  !*** ./src/Easing.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Easing": () => (/* binding */ Easing)
/* harmony export */ });
var Easing = /** @class */ (function () {
    function Easing() {
    }
    Easing.easeLinear = function (t, b, c, d) {
        return c * t / d + b;
    };
    Easing.easeOutQuad = function (t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    };
    Easing.easeOutSine = function (t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    };
    Easing.easeInSine = function (t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    };
    return Easing;
}());



/***/ }),

/***/ "./src/ImageLayer.ts":
/*!***************************!*\
  !*** ./src/ImageLayer.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ImageLayer": () => (/* binding */ ImageLayer)
/* harmony export */ });
/* harmony import */ var _CanvasLayer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CanvasLayer */ "./src/CanvasLayer.ts");
/* harmony import */ var _BaseLayer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./BaseLayer */ "./src/BaseLayer.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();


// TODO: Consider merging with CanvasLayer
var ImageLayer = /** @class */ (function (_super) {
    __extends(ImageLayer, _super);
    function ImageLayer(id, width, height, options, renderers, loadedListener, updatedListener) {
        var _this = _super.call(this, id, width, height, options, renderers, loadedListener, updatedListener) || this;
        _this._setType(_BaseLayer__WEBPACK_IMPORTED_MODULE_1__.LayerType.Image);
        _this.drawImage(options.image, {
            left: 0,
            top: 0,
            width: width,
            height: height
        });
        return _this;
    }
    return ImageLayer;
}(_CanvasLayer__WEBPACK_IMPORTED_MODULE_0__.CanvasLayer));



/***/ }),

/***/ "./src/Sprite.ts":
/*!***********************!*\
  !*** ./src/Sprite.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Sprite": () => (/* binding */ Sprite)
/* harmony export */ });
/* harmony import */ var _Buffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Buffer */ "./src/Buffer.ts");

var Sprite = /** @class */ (function () {
    /**
     *
     * @param {string} spriteSheetSrc Path to the spritesheet file
     * @param {number} hFrameOffset Distance between each frame (horizontaly)
     * @param {number} vFrameOffset Distance between each frame (vertically))
     */
    function Sprite(id, hFrameOffset, vFrameOffset) {
        this._id = id;
        this._spriteSheet = new Image();
        this._buffer = new _Buffer__WEBPACK_IMPORTED_MODULE_0__.Buffer(0, 0);
        this._animations = [];
        this._animation = null;
        this._isAnimating = false;
        this._spriteSheetLoaded = false;
        this._loop = 1;
        this._queue = [];
        this._loopSequence = false;
        this._maxHeight = 0;
        this._maxWidth = 0;
        this._frameIndex = 0;
        this._frameDuration = 0;
        this._hFrameOffset = hFrameOffset;
        this._vFrameOffset = vFrameOffset;
    }
    Sprite.prototype.loadSpritesheet = function (src) {
        var that = this;
        return new Promise(function (resolve) {
            that._spriteSheet.addEventListener('load', function () {
                that._spriteSheetLoaded = true;
                resolve();
            });
            that._spriteSheet.src = src;
        });
    };
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
    Sprite.prototype.addAnimation = function (id, nbFrames, width, height, xOffset, Yoffset, duration) {
        if (typeof this._animations[id] === 'undefined') {
            this._animations[id] = {
                width: width,
                height: height,
                nbFrames: nbFrames,
                xOffset: xOffset,
                yOffset: Yoffset,
                duration: duration
            };
            this._maxHeight = Math.max(this._maxHeight, height);
            this._maxWidth = Math.max(this._maxWidth, width);
        }
        else {
            throw new Error("Animation [".concat(id, " already exists in sprite [").concat(this._id, "]"));
        }
    };
    /**
     * Main render routine
     */
    Sprite.prototype._doAnimation = function (t) {
        var now = t;
        var previousFrameIndex = this._frameIndex;
        if (this._startTime === null) {
            this._startTime = now;
        }
        var delta = now - this._startTime;
        // Calculate frame number given delta and duration
        this._frameIndex = Math.floor(delta / this._frameDuration);
        // If loop is 
        if (this._frameIndex >= this._animation.params.nbFrames) {
            this._loop++;
            // End of loop then process queue to start next animation in line
            if (this._animation.loop > 0 && this._loop > this._animation.loop) {
                this._processQueue();
                return;
            }
            // Start animation back to first frame
            this._frameIndex = 0;
            this._startTime = null;
        }
        // Only redraw buffer is frame is different
        if (this._frameIndex !== previousFrameIndex) {
            var xOffset = this._frameIndex * (this._animation.params.width + this._frameOffset) + this._animation.params.xOffset;
            // Shift vertical position so that sprites are aligned at the bottom
            var yPos = this._maxHeight - this._animation.params.height;
            //console.log(`${this._frameIndex} / ${xOffset} / ${yPos}`);
            this._buffer.clear();
            this._buffer.context.drawImage(this._spriteSheet, xOffset, this._animation.params.yOffset, this._animation.params.width, this._animation.params.height, 0, yPos, this._animation.params.width, this._animation.params.height);
        }
        requestAnimationFrame(this._doAnimation.bind(this));
    };
    /**
     * Pop animation from the queue and play it
     */
    Sprite.prototype._processQueue = function () {
        if (this._queue.length > 0) {
            if (this._loopSequence) {
                if (this._queue.length > 1) {
                    this._animation = this._queue.shift();
                    // Put this animation to the bottom of the queue is needed
                    this._queue.push(this._animation);
                }
                else {
                    console.log('here');
                    this._animation = this._queue[0];
                }
            }
            else {
                this._animation = this._queue.shift();
            }
            this._frameIndex = this._animation.params.nbFrames; // To force rendering of frame 0
            this._startTime = null;
            this._frameDuration = this._animation.params.duration / this._animation.params.nbFrames;
            this._isAnimating = true;
            this._loop = 1;
            // Resizing will clear buffer so do it only if needed
            if (this._buffer.width !== this._animation.params.width) {
                this._buffer.width = this._animation.params.width;
            }
            // Resizing will clear buffer so do it only if needed
            if (this._buffer.height !== this._maxHeight) {
                this._buffer.height = this._maxHeight;
            }
            requestAnimationFrame(this._doAnimation.bind(this));
        }
        else {
            this._isAnimating = false;
            if (typeof this._endOfQueueListener === 'function') {
                this._endOfQueueListener(this._id);
            }
        }
    };
    /**
     * Play a single animation
     * @param {string} Animation id
     * @param {number} nbLoop
     */
    Sprite.prototype.enqueueSingle = function (id, nbLoop) {
        // Exit if source image is not loaded
        if (!this._spriteSheetLoaded) {
            return;
        }
        this._queue.push({
            params: this._animations[id],
            loop: (typeof nbLoop === 'number') ? nbLoop : 0
        });
    };
    /**
     *
     * @param {array} An array of ids and number of loop
     * @param {boolean} should the sequence loop indefinitely
     */
    Sprite.prototype.enqueueSequence = function (seq, loop) {
        // Build array of animation
        // array[0] = animation id
        // array[1] = number of loop
        for (var i = 0; i < seq.length; i++) {
            this._queue.push({
                params: this._animations[seq[i][0]],
                loop: Math.max(1, seq[i][1])
            });
        }
        // Boolean
        this._loopSequence = !!loop;
        // Start animation
        //this._processQueue();
    };
    Sprite.prototype.run = function () {
        this._processQueue();
    };
    /**
     * Stop current animation
     * TODO
     */
    Sprite.prototype.stop = function () {
        this._isAnimating = false;
        this._loopSequence = false;
        this._queue = [];
    };
    Object.defineProperty(Sprite.prototype, "data", {
        /**
         * Return current image
         */
        get: function () {
            return this._buffer.canvas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "context", {
        /**
         * Get output buffer context
         */
        get: function () {
            return this._buffer.context;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "width", {
        /**
         * Get sprite width
         */
        get: function () {
            return this._maxWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sprite.prototype, "height", {
        /**
         * Get sprite height
         */
        get: function () {
            return this._maxHeight;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Is the sprite currently animating ?
     * @returns boolean
     */
    Sprite.prototype.isAnimating = function () {
        return this._isAnimating;
    };
    /**
     * Set the End of queue listener that will be called when current queue is empty
     * @param {Function} listener
     */
    Sprite.prototype.setEndOfQueueListener = function (listener) {
        this._endOfQueueListener = listener;
    };
    return Sprite;
}());



/***/ }),

/***/ "./src/SpritesLayer.ts":
/*!*****************************!*\
  !*** ./src/SpritesLayer.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SpritesLayer": () => (/* binding */ SpritesLayer)
/* harmony export */ });
/* harmony import */ var _BaseLayer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseLayer */ "./src/BaseLayer.ts");
/* harmony import */ var _Sprite__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Sprite */ "./src/Sprite.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();


var SpritesLayer = /** @class */ (function (_super) {
    __extends(SpritesLayer, _super);
    function SpritesLayer(id, width, height, _options, renderers, loadedListener, updatedListener) {
        var _this = this;
        var defaultOptions = {
            loop: false,
            autoplay: false,
            mimeType: 'video/webm'
        };
        _this = _super.call(this, id, width, height, Object.assign(defaultOptions, _options), renderers, loadedListener, updatedListener) || this;
        _this._setType(_BaseLayer__WEBPACK_IMPORTED_MODULE_0__.LayerType.Sprites);
        _this._sprites = [];
        _this._runningSprites = 0;
        _this._renderNextFrame = function () { };
        setTimeout(_this._layerLoaded.bind(_this), 1);
        return _this;
    }
    /**
     * Render frame with all sprites data
     */
    SpritesLayer.prototype._renderFrame = function () {
        var _this = this;
        var that = this;
        this._contentBuffer.clear();
        Object.keys(this._sprites).forEach(function (id) {
            if (_this._sprites[id].visible) {
                _this._contentBuffer.context.drawImage(that._sprites[id].sprite.data, that._sprites[id].x, that._sprites[id].y);
            }
        });
        this._renderNextFrame(); // if needed
    };
    /**
     * Request rendering of next frame
     */
    SpritesLayer.prototype._requestRenderNextFrame = function () {
        requestAnimationFrame(this._renderFrame.bind(this));
    };
    /**
     * Create a sprite and add it to the layer
     * @param {string} id
     * @param {string} src
     * @param {number} hFrameOffset  (horizontal distance between frames)
     * @param {number} vFrameOffset  (vertical distance between frames)
     * @param {array<string>} animations
     * @param {number} x (horizontal position on layer)
     * @param {number} y (vertical position on layer)
     */
    SpritesLayer.prototype.createSprite = function (id, src, hFrameOffset, vFrameOffset, animations, x, y) {
        var _this = this;
        var that = this;
        return new Promise(function (resolve, reject) {
            if (typeof _this._sprites[id] === 'undefined') {
                if (animations.length) {
                    var sprite = new _Sprite__WEBPACK_IMPORTED_MODULE_1__.Sprite(id, hFrameOffset, vFrameOffset);
                    sprite.loadSpritesheet(src).then(function () {
                        for (var i = 0; i < animations.length; i++) {
                            sprite.addAnimation.apply(sprite, animations[i]);
                        }
                        that.addSprite(id, sprite, x, y);
                        resolve();
                    });
                }
                else {
                    reject("No animations provided for sprite ".concat(id));
                }
            }
            else {
                reject("Sprite [".concat(id, "] already exists"));
            }
        });
    };
    /**
     * Add an existing Sprite object to the layer ad x,y position
     * @param {string} id
     * @param {Sprite} sprite
     * @param {string} _x
     * @param {string} _y
     * @param {boolean} v
     * @returns {boolean} true if sprite was assed false otherwise
     */
    SpritesLayer.prototype.addSprite = function (id, sprite, _x, _y, v) {
        var isVisible = true;
        if (typeof sprite === 'object' && sprite.constructor !== _Sprite__WEBPACK_IMPORTED_MODULE_1__.Sprite) {
            console.error("Provided sprite is not a Sprite object");
            return false;
        }
        if (typeof this._sprites[id] !== 'undefined') {
            console.error('Already exists : ' + id);
            return false;
        }
        if (typeof v !== 'undefined') {
            isVisible = !!v;
        }
        var x = _x || 0;
        var y = _y || 0;
        if (_x.at(-1) === '%') {
            var vx = parseFloat(_x.replace('%', ''), 10);
            x = Math.floor((vx * this.width) / 100);
        }
        else {
            x = parseInt(_x, 10);
        }
        if (_y.at(-1) === '%') {
            var vy = parseFloat(_y.replace('%', ''), 10);
            y = Math.floor((vy * this.height) / 100);
        }
        else {
            y = parseInt(_y, 10);
        }
        this._sprites[id] = {
            x: x,
            y: y,
            sprite: sprite,
            visible: isVisible
        };
        // set sprite listener to this layer
        sprite.setEndOfQueueListener(this._onQueueEnded.bind(this));
        this._layerUpdated();
        return true;
    };
    /**
     * End of quest listener
     * @param {string} id : sprite queue which ended
     */
    SpritesLayer.prototype._onQueueEnded = function (id) {
        this._runningSprites--;
        // If not more sprite is running then no need to keep rendering new frames
        if (this._runningSprites <= 0) {
            this._runningSprites = 0;
            this._renderNextFrame = function () { };
            this._stopRendering();
        }
    };
    /*getSprite(id) {
        if (typeof this._sprites[id] !== 'undefined') {
            return this._sprites[id].sprite;
        } else {
            throw new Error(`No sprite named : ${id} found in layer [#{this._id}]`);
        }
    }*/
    /**
     * Change sprite position to x,y
     * @param {string} id
     * @param {string} x
     * @param {string} y
     */
    SpritesLayer.prototype.moveSprite = function (id, x, y) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].x = x;
            this._sprites[id].x = y;
        }
        else {
            console.error("Layer[".concat(this.getId(), "] : sprite [").concat(id, "] does not exist"));
        }
    };
    /**
     * Change sprite visibility
     * @param {string} id
     * @param {boolean} v
     */
    SpritesLayer.prototype.setSpriteVisibility = function (id, v) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].visible = v;
        }
        else {
            console.error("Layer[".concat(this.getId(), "] : sprite [").concat(id, "] does not exist"));
        }
    };
    /**
     * Run sprite current animation
     * @param {string} id
     */
    SpritesLayer.prototype.run = function (id) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._startRendering();
            if (!this._sprites[id].sprite.isAnimating()) {
                this._runningSprites++;
                this._sprites[id].sprite.run();
                if (this._runningSprites === 1) {
                    this._renderNextFrame = this._requestRenderNextFrame;
                    this._requestRenderNextFrame();
                }
            }
        }
        else {
            console.error("Layer[".concat(this.getId(), "] : sprite [").concat(id, "] does not exist"));
        }
    };
    /**
     * Stop sprite current animation
     * @param {string} id
     */
    SpritesLayer.prototype.stop = function (id) {
        if (typeof this._sprites[id] !== 'undefined') {
            if (this._sprites[id].sprite.isAnimating()) {
                this._runningSprites--;
                this._sprites[id].sprite.stop();
            }
        }
        else {
            console.error("Layer[".concat(this.getId(), "] : sprite [").concat(id, "] does not exist"));
        }
        // Stop rendering if no sprite running
        if (this._runningSprites <= 0) {
            this._runningSprites = 0;
            this._renderNextFrame = function () { };
        }
    };
    /**
     * Add sequence of animations to sprite queue
     * @param {string} id
     * @param {array} queue
     * @param {boolean} loop
     */
    SpritesLayer.prototype.enqueueSequence = function (id, queue, loop) {
        if (typeof this._sprites[id] !== 'undefined') {
            this._sprites[id].sprite.enqueueSequence(queue, loop);
        }
        else {
            console.error("Layer[".concat(this.getId(), "] : sprite [").concat(id, "] does not exist"));
        }
    };
    return SpritesLayer;
}(_BaseLayer__WEBPACK_IMPORTED_MODULE_0__.BaseLayer));



/***/ }),

/***/ "./src/TextLayer.ts":
/*!**************************!*\
  !*** ./src/TextLayer.ts ***!
  \**************************/
/***/ (() => {

throw new Error("Module parse failed: Unexpected token (258:72)\nFile was processed with these loaders:\n * ./node_modules/ts-loader/index.js\nYou may need an additional loader to handle the result of these loaders.\n|             throw new TypeError(\"text is not a string\");\n|         }\n>         if (typeof text !== 'undefined' && text !== \"\" && text !== this.) {\n|             this._text = text;\n|             this._drawText(options).then(function () {");

/***/ }),

/***/ "./src/Utils.ts":
/*!**********************!*\
  !*** ./src/Utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Utils": () => (/* binding */ Utils)
/* harmony export */ });
var Utils = /** @class */ (function () {
    function Utils() {
    }
    /**
     * Process an array of Promise
     * TODO : handle errors
     * @param {Array} promises
     * @returns
     */
    /*static chainPromises(promises: Promise<any>): Promise<void> {
       return new Promise(resolve => {

           var queue = [...promises];

           var processQueue = function() {
               if (queue.length) {
                   var promise = queue.shift();
                   promise.then(() => {
                       processQueue();
                   });

               // finished
               } else {
                   resolve();
               }
           }

           // start process
           processQueue();
       });
   }*/
    /**
     * Add alpha component to a RGB string
     * @param {string} str
     * @param {string} alpha
     * @returns {string}
     */
    Utils.hexRGBToHexRGBA = function (str, alpha) {
        if (alpha.match(/[0-9a-f][0-9a-f]/gi)) {
            return str + alpha;
        }
        else {
            throw new TypeError("alpha must be an hex string between 00 and FF");
        }
    };
    /**
 * Add alpha component to a RGB string
 * @param {string} str
 * @param {number} alpha
 * @returns {string}
 */
    Utils.hexRGBToHexRGBA = function (str, alpha) {
        if (alpha >= 0 && alpha <= 255) {
            return str + alpha.toString(16);
        }
        else {
            throw new TypeError("alpha must be an int between 0 and 255 or a an hex string between 00 and FF");
        }
    };
    /**
     * Return int value of an hex color
     * @param {string} str
     * @param {string} prefix
     * @returns {number}
     */
    Utils.hexColorToInt = function (str, prefix) {
        var p = prefix || "";
        return parseInt(str.replace(/^#/gi, p), 16);
    };
    /**
     * Revert RGBA components
     * @param {string} rgba
     * @returns {string} abgr string
     */
    Utils.rgba2abgr = function (rgba) {
        var arr = rgba.match(/.{2}/g);
        if (arr === null) {
            throw new TypeError("Invalid rgba string");
        }
        return arr[3] + arr[2] + arr[1] + arr[0];
    };
    /**
     * Convert an hexadecimal string to an array of hex byte
     * @param {string} hex
     * @returns {array<string>}
     */
    Utils.hexToArray = function (hex) {
        return hex.match(/.{2}/g) || [];
    };
    return Utils;
}());



/***/ }),

/***/ "./src/VideoLayer.ts":
/*!***************************!*\
  !*** ./src/VideoLayer.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VideoLayer": () => (/* binding */ VideoLayer)
/* harmony export */ });
/* harmony import */ var _BaseLayer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BaseLayer */ "./src/BaseLayer.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var VideoLayer = /** @class */ (function (_super) {
    __extends(VideoLayer, _super);
    /**
     * Create an object that contains a video element and some utility methods
     * @param id {string} id of the object
     * @param width {integer} The width of the video
     * @param height {integer} The height of the video
     */
    //constructor(id, _options, _listener, _onPlayListener, _onPauseListener) {
    function VideoLayer(id, width, height, options, renderers, loadedListener, updatedListener, playListener, pauseListener) {
        var _this = _super.call(this, id, width, height, renderers, loadedListener, updatedListener) || this;
        _this._options = Object.assign(_this._options, { loop: false, autoplay: false }, options);
        _this._onPlayListener = playListener;
        _this._onPauseListener = pauseListener;
        // Create a video element
        _this._video = document.createElement('video'); // create a video element (not attached to the dom
        // set the dimensions
        _this._video.width = options.width || width;
        _this._video.height = options.height || height;
        _this._video.loop = !!options.loop;
        _this._isPlaying = false;
        _this._renderNextFrame = function () { };
        // Bind loaded event of the video to publish an event so the client 
        // can do whatever it want (example: play the video) 
        _this._video.addEventListener('loadeddata', _this._onVideoLoaded.bind(_this));
        _this._video.addEventListener('play', _this._onVideoPlayed.bind(_this));
        _this._video.addEventListener('pause', _this._onVideoPaused.bind(_this));
        if (typeof options.src === 'string') {
            _this.load(options.src);
        }
        return _this;
    }
    VideoLayer.prototype._onVideoLoaded = function () {
        this._contentBuffer.context.drawImage(this._video, 0, 0, this._video.width, this._video.height);
        if (this._options.autoplay) {
            this.play();
        }
        this._layerLoaded();
    };
    VideoLayer.prototype._onVideoPlayed = function () {
        this._renderNextFrame = this._requestRenderNextFrame;
        this._requestRenderNextFrame();
        if (typeof this._onPlayListener === 'function') {
            this._onPlayListener();
        }
    };
    VideoLayer.prototype._onVideoPaused = function () {
        this._renderNextFrame = function () { console.log('End of video rendering'); };
        this._stopRendering();
        if (typeof this._onPauseListener === 'function') {
            this._onPauseListener();
        }
    };
    VideoLayer.prototype._renderFrame = function (t) {
        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this._video, 0, 0, this._options.width, this._options.height);
        this._renderNextFrame();
    };
    VideoLayer.prototype._requestRenderNextFrame = function () {
        requestAnimationFrame(this._renderFrame.bind(this));
    };
    /**
     * Load a media in the video element
     */
    VideoLayer.prototype.load = function (src, mimeType) {
        //this.#video.type = mimeType;
        this._video.src = src; // load the video
    };
    VideoLayer.prototype.play = function () {
        if (this._isPlaying) {
            return;
        }
        this._isPlaying = true;
        this._renderNextFrame = this._requestRenderNextFrame;
        this._requestRenderNextFrame();
        this._video.play();
        this._startRendering();
    };
    VideoLayer.prototype.stop = function (reset) {
        this._isPlaying = false;
        this._video.pause();
        if (reset) {
            this._video.currentTime = 0;
        }
        this._renderNextFrame = function () {
            "End of video rendering";
        };
    };
    VideoLayer.prototype.isPlaying = function () {
        return this._isPlaying;
    };
    return VideoLayer;
}(_BaseLayer__WEBPACK_IMPORTED_MODULE_0__.BaseLayer));



/***/ }),

/***/ "./src/renderers/ChangeAlphaRenderer.ts":
/*!**********************************************!*\
  !*** ./src/renderers/ChangeAlphaRenderer.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ChangeAlphaRenderer": () => (/* binding */ ChangeAlphaRenderer)
/* harmony export */ });
/// <reference types="@webgpu/types" />
var ChangeAlphaRenderer = /** @class */ (function () {
    /**
     * @param {number} width
     * @param {number} height
     */
    function ChangeAlphaRenderer(width, height) {
        this._device;
        this._adapter;
        this._shaderModule;
        this._width = width;
        this._height = height;
        this._bufferByteLength = width * height * 4;
        this.renderFrame = this._doNothing;
    }
    /**
     * Init renderer
     * @returns Promise
     */
    ChangeAlphaRenderer.prototype.init = function () {
        var that = this;
        return new Promise(function (resolve) {
            navigator.gpu.requestAdapter().then(function (adapter) {
                that._adapter = adapter;
                adapter.requestDevice().then(function (device) {
                    that._device = device;
                    that._shaderModule = device.createShaderModule({
                        code: "\n                            struct UBO {\n                                opacity: f32\n                            }\n\n                            struct Image {\n                                rgba: array<u32>\n                            }\n\n                            fn f2u(f: f32) -> u32 {\n                                return u32(ceil(f));\n                            }\n\n                            @group(0) @binding(0) var<storage,read> inputPixels: Image;\n                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;\n                            @group(0) @binding(2) var<uniform> uniforms : UBO;\n\n                            @compute\n                            @workgroup_size(1)\n                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {\n                                let index : u32 = global_id.x + global_id.y * ".concat(that._width, "u;\n                                let pixelColor : u32 = inputPixels.rgba[index];\n                                let opacity : f32 = uniforms.opacity;\n\n                                \n                                var a : u32 = (pixelColor >> 24u) & 255u;\n                                let b : u32 = (pixelColor >> 16u) & 255u;\n                                let g : u32 = (pixelColor >> 8u) & 255u;\n                                let r : u32 = (pixelColor & 255u);\n\n                                var aa = f2u(floor(f32(a) * opacity));\n\n                                // Hack : Todo find why floor not working (0 * anything) should give 0\n                                if (opacity == 0f) {\n                                    aa = 0u;\n                                }\n\n                                outputPixels.rgba[index] = (aa << 24u) | (b << 16u) | (g << 8u) | r;\n                            }\n                        ")
                    });
                    console.log('ChangeAlphaRenderer:init()');
                    that._shaderModule.compilationInfo().then(function (i) {
                        if (i.messages.length > 0) {
                            console.warn("ChangeAlphaRenderer:compilationInfo() ", i.messages);
                        }
                    });
                    that.renderFrame = that._doRendering;
                    resolve();
                });
            });
        });
    };
    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in _doRendering)
     * @param {ImageData} frameData
     * @returns {ImageData}
     */
    ChangeAlphaRenderer.prototype._doNothing = function (frameData) {
        //console.log("Init not done cannot apply filter");
        return new Promise(function (resolve) {
            resolve(frameData);
        });
    };
    /**
     * Apply filter to provided data then return altered data
     * @param {ImageData} frameData
     * @param {number} opacity
     * @returns {Promise<ImageData>}
     */
    ChangeAlphaRenderer.prototype._doRendering = function (frameData, opacity) {
        var _this = this;
        var o = opacity || 1;
        var that = this;
        var UBOBuffer = this._device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        var gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        var gpuTempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        var gpuOutputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        var bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                }
            ]
        });
        var bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: UBOBuffer
                    }
                }
            ]
        });
        var computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        });
        return new Promise(function (resolve) {
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data));
            gpuInputBuffer.unmap();
            // Write values to uniform buffer object
            var uniformData = [o];
            var uniformTypedArray = new Float32Array(uniformData);
            _this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);
            var commandEncoder = that._device.createCommandEncoder();
            var passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that._width, that._height);
            passEncoder.end();
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that._bufferByteLength);
            that._device.queue.submit([commandEncoder.finish()]);
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then(function () {
                // Grab data from output buffer
                var pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
                // Generate Image data usable by a canvas
                var imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that._width, that._height);
                // return to caller
                resolve(imageData);
            });
        });
    };
    return ChangeAlphaRenderer;
}());



/***/ }),

/***/ "./src/renderers/GPURenderer.ts":
/*!**************************************!*\
  !*** ./src/renderers/GPURenderer.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GPURenderer": () => (/* binding */ GPURenderer)
/* harmony export */ });
var GPURenderer = /** @class */ (function () {
    /**
     *
     * @param {number} dmdWidth
     * @param {number} dmdHeight
     * @param {number} screenWidth
     * @param {number} screenHeight
     * @param {number} pixelSize
     * @param {number} dotSpace
     * @param {*} dotShape
     * @param {number} bgBrightness
     * @param {number} brightness
     */
    function GPURenderer(dmdWidth, dmdHeight, screenWidth, screenHeight, pixelSize, dotSpace, dotShape, bgBrightness, brightness) {
        //console.log(arguments);
        this._dmdWidth = dmdWidth;
        this._dmdHeight = dmdHeight;
        this._screenWidth = screenWidth;
        this._screenHeight = screenHeight;
        this._pixelSize = pixelSize;
        this._dotSpace = dotSpace;
        this._dotShape = dotShape;
        this._device;
        this._adapter;
        this._shaderModule;
        this._dmdBufferByteLength = dmdWidth * dmdHeight * 4;
        this._screenBufferByteLength = screenWidth * screenHeight * 4;
        this.renderFrame = this._doNothing;
        this._bgBrightness = 14;
        this._bgColor = 4279176975;
        this._brightness = 1;
        if (typeof bgBrightness === 'number') {
            this._bgBrightness = bgBrightness;
            this._bgColor = parseInt("FF" + this._int2Hex(bgBrightness) + this._int2Hex(bgBrightness) + this._int2Hex(bgBrightness), 16);
        }
        if (typeof bgBrightness === 'number') {
            this.setBrightness(brightness);
        }
        var bgp2 = this._bgBrightness * this._bgBrightness;
        this._bgHSP = Math.sqrt(0.299 * bgp2 + 0.587 * bgp2 + 0.114 * bgp2);
    }
    GPURenderer.prototype._int2Hex = function (n) {
        var hex = n.toString(16);
        if (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    };
    GPURenderer.prototype.init = function () {
        var _this = this;
        var that = this;
        return new Promise(function (resolve) {
            navigator.gpu.requestAdapter().then(function (adapter) {
                that._adapter = adapter;
                adapter.requestDevice().then(function (device) {
                    that._device = device;
                    that._shaderModule = device.createShaderModule({
                        code: "\n                            struct UBO {\n                                brightness: f32\n                            }\n\n                            struct Image {\n                                rgba: array<u32>\n                            }\n\n                            fn f2i(f: f32) -> u32 {\n                                return u32(ceil(f));\n                            }\n\n                            fn u2f(u: u32) -> f32 {\n                                return f32(u);\n                            }\n\n                            @group(0) @binding(0) var<storage,read> inputPixels: Image;\n                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;\n                            @group(0) @binding(2) var<uniform> uniforms : UBO;\n\n                            @compute\n                            @workgroup_size(1)\n                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {\n                                var bgBrightness : u32 = ".concat(that._bgBrightness, "u;\n                                var index : u32 = global_id.x + global_id.y *  ").concat(that._dmdWidth, "u;\n                                var pixel : u32 = inputPixels.rgba[index];\n                                var brightness : f32 = uniforms.brightness;\n                                var br = 0u;\n                                var bg = 0u;\n                                var bb = 0u;\n                                \n                                let a : u32 = (pixel >> 24u) & 255u;\n                                let b : u32 = (pixel >> 16u) & 255u;\n                                let g : u32 = (pixel >> 8u) & 255u;\n                                let r : u32 = (pixel & 255u);\n\n                                // If component is above darkest color then apply brightness limiter\n                                if (r >= bgBrightness) {\n                                    br = bgBrightness + f2i(f32(r - bgBrightness) * brightness);\n                                }\n\n                                // If component is above darkest color then apply brightness limiter\n                                if (g >= bgBrightness) {\n                                    bg = bgBrightness + f2i(f32(g - bgBrightness) * brightness);\n                                }\n\n                                // If component is above darkest color then apply brightness limiter\n                                if (b >= bgBrightness) {\n                                    bb = bgBrightness + f2i(f32(b - bgBrightness) * brightness);\n                                }\n\n                                // Recreate pixel color but force alpha to 255\n                                pixel = (255u << 24u) | (bb << 16u) | (bg << 8u) | br;\n\n                                var t : u32 = r + g + b;\n                                var hsp : f32 =  sqrt(.299f * u2f(r) * u2f(r) + .587f * u2f(g) * u2f(g) + .114 * u2f(b) * u2f(b));\n                \n                                // Pixels that are too dark will be hacked to give the 'off' dot look of the DMD\n                                //if (t < bgBrightness*3u) {\n                                if (hsp - 8f < ").concat(_this._bgHSP, "f) {\n                                    pixel = ").concat(that._bgColor, "u;\n                                    //pixel = 4294901760u;\n                                }\n                \n                                // First byte index of the output dot\n                                var resizedPixelIndex : u32 = (global_id.x * ").concat(that._pixelSize, "u)  + (global_id.x * ").concat(that._dotSpace, "u) + (global_id.y * ").concat(that._screenWidth, "u * (").concat(that._pixelSize, "u + ").concat(that._dotSpace, "u));\n                \n                                for ( var row: u32 = 0u ; row < ").concat(that._pixelSize, "u; row = row + 1u ) {\n                                    for ( var col: u32 = 0u ; col < ").concat(that._pixelSize, "u; col = col + 1u ) {\n                                        outputPixels.rgba[resizedPixelIndex] = pixel;\n                                        resizedPixelIndex = resizedPixelIndex + 1u;\n                                    }\n                                    resizedPixelIndex = resizedPixelIndex + ").concat(that._screenWidth, "u - ").concat(that._pixelSize, "u;\n                                }\n                            }\n                        ")
                    });
                    console.log("GPURenderer:init()");
                    _this._shaderModule.compilationInfo().then(function (i) {
                        if (i.messages.length > 0) {
                            console.warn('GPURenderer:compilationInfo()', i.messages);
                        }
                    });
                    that.renderFrame = that._doRendering;
                    resolve();
                });
            });
        });
    };
    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {ImageData} frameData
     * @returns
     */
    GPURenderer.prototype._doNothing = function (frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(function (resolve) {
            resolve(frameData);
        });
    };
    /**
     * Render a DMD frame
     * @param {ImageData} frameData
     * @returns {ImageData}
     */
    GPURenderer.prototype._doRendering = function (frameData) {
        var _this = this;
        var that = this;
        var UBOBuffer = this._device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        var gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._dmdBufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        var gpuTempBuffer = this._device.createBuffer({
            size: this._screenBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        var gpuOutputBuffer = this._device.createBuffer({
            size: this._screenBufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        var bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                }
            ]
        });
        var bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: UBOBuffer
                    }
                }
            ]
        });
        var computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        });
        return new Promise(function (resolve) {
            //new Uint8Array(gpuConfBuffer.getMappedRange()).set(new Uint8Array([this._brightness]));
            //gpuConfBuffer.unmap();
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data));
            gpuInputBuffer.unmap();
            // Write values to uniform buffer object
            var uniformData = [_this._brightness];
            var uniformTypedArray = new Float32Array(uniformData);
            _this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);
            var commandEncoder = that._device.createCommandEncoder();
            var passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that._dmdWidth, that._dmdHeight);
            passEncoder.end();
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that._screenBufferByteLength);
            that._device.queue.submit([commandEncoder.finish()]);
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then(function () {
                // Grab data from output buffer
                var pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
                // Generate Image data usable by a canvas
                var imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that._screenWidth, that._screenHeight);
                // console.log(imageData);
                // return to caller
                resolve(imageData);
            });
        });
    };
    /**
     * Set brightness of the dots between 0 and 1 (does not affect the background color)
     * @param {float} b
     */
    GPURenderer.prototype.setBrightness = function (b) {
        var b = Math.max(0, Math.min(Number.parseFloat(b), 1)); // normalize
        this._brightness = Math.round(b * 1e3) / 1e3; // round to 1 digit after dot
    };
    Object.defineProperty(GPURenderer.prototype, "brightness", {
        get: function () {
            return this._brightness;
        },
        enumerable: false,
        configurable: true
    });
    return GPURenderer;
}());



/***/ }),

/***/ "./src/renderers/OutlineRenderer.ts":
/*!******************************************!*\
  !*** ./src/renderers/OutlineRenderer.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OutlineRenderer": () => (/* binding */ OutlineRenderer)
/* harmony export */ });
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Utils */ "./src/Utils.ts");
/// <reference types="@webgpu/types" />

var OutlineRenderer = /** @class */ (function () {
    /**
     * @param {number} width
     * @param {number} height
     */
    function OutlineRenderer(width, height) {
        this._device;
        this._adapter;
        this._shaderModule;
        this._width = width;
        this._height = height;
        this._bufferByteLength = width * height * 4;
        this.renderFrame = this._doNothing;
    }
    OutlineRenderer.prototype.init = function () {
        var that = this;
        return new Promise(function (resolve) {
            navigator.gpu.requestAdapter().then(function (adapter) {
                that._adapter = adapter;
                adapter.requestDevice().then(function (device) {
                    that._device = device;
                    that._shaderModule = device.createShaderModule({
                        code: "\n                            struct UBO {\n                                innerColor: u32,\n                                outerColor: u32,\n                                lineWidth: u32\n                            }\n                            struct Image {\n                                rgba: array<u32>\n                            }\n\n                            @group(0) @binding(0) var<storage,read> inputPixels: Image;\n                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;\n                            @group(0) @binding(2) var<uniform> uniforms : UBO;\n\n                            @compute\n                            @workgroup_size(1)\n                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {\n                                let index : u32 = global_id.x + global_id.y * ".concat(that._width, "u;\n                                let lineSize : u32 = ").concat(that._width, "u;\n\n                                let pixelColor : u32 = inputPixels.rgba[index];\n                                let innerColor : u32 = uniforms.innerColor;\n                                let outerColor : u32 = uniforms.outerColor;\n                                let lineWidth : u32 = uniforms.lineWidth;\n\n                                \n                                var a : u32 = (pixelColor >> 24u) & 255u;\n                                let b : u32 = (pixelColor >> 16u) & 255u;\n                                let g : u32 = (pixelColor >> 8u) & 255u;\n                                let r : u32 = (pixelColor & 255u);\n                                \n\n                                // if inner color pixel found check pixels around\n                                if (pixelColor != innerColor) {\n\n                                    var innerColorFound = false;\n                                    \n                                    if (global_id.x > 0u && global_id.x < ").concat(that._width - 1, "u && global_id.y > 0u && global_id.y < ").concat(that._height - 1, "u) {\n                                        let topPixel = index - lineSize * lineWidth;\n                                        let bottomPixel = index + lineSize * lineWidth;\n                                        let leftPixel = index - lineWidth;\n                                        let rightPixel = index + lineWidth;\n                                        let topLeftPixel = topPixel - lineWidth;\n                                        let topRightPixel = topPixel + lineWidth;\n                                        let bottomLeftPixel = bottomPixel - lineWidth;\n                                        let bottomRightPixel = bottomPixel + lineWidth;\n\n                                        if (\n                                            inputPixels.rgba[topPixel] == innerColor ||\n                                            inputPixels.rgba[rightPixel] == innerColor ||\n                                            inputPixels.rgba[bottomPixel] == innerColor ||\n                                            inputPixels.rgba[leftPixel] == innerColor ||\n                                            inputPixels.rgba[topLeftPixel] == innerColor ||\n                                            inputPixels.rgba[topRightPixel] == innerColor ||\n                                            inputPixels.rgba[bottomLeftPixel] == innerColor ||\n                                            inputPixels.rgba[bottomRightPixel] == innerColor\n                                        ) {\n                                            innerColorFound = true;\n                                        }\n                                    }\n\n\n                                    if (innerColorFound) {\n                                        outputPixels.rgba[index] = outerColor;                                        \n                                    } else {\n                                        outputPixels.rgba[index] = pixelColor;\n                                        //outputPixels.rgba[index] = 4294967040u;\n                                    }\n\n                                } else {\n                                    outputPixels.rgba[index] = pixelColor;\n                                }\n\n                                //outputPixels.rgba[index] = 4278190335u;\n                            }\n                        ")
                    });
                    console.log('OutlineRenderer:init()');
                    that._shaderModule.compilationInfo().then(function (i) {
                        if (i.messages.length > 0) {
                            console.warn("OutlineRenderer:compilationInfo() ", i.messages);
                        }
                    });
                    that.renderFrame = that._doRendering;
                    resolve();
                });
            });
        });
    };
    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {ImageData} frameData
     * @returns Promise<ImageData>
     */
    OutlineRenderer.prototype._doNothing = function (frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(function (resolve) {
            resolve(frameData);
        });
    };
    /**
     * Render frame
     * @param {ImageData} frameData
     * @param {string} innerColor
     * @param {string} outerColor
     * @param {number} width
     * @returns {Promise<ImageData>}
     */
    OutlineRenderer.prototype._doRendering = function (frameData, innerColor, outerColor, width) {
        var _this = this;
        var that = this;
        var UBOBuffer = this._device.createBuffer({
            size: 3 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        var gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        var gpuTempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        var gpuOutputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        var bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                }
            ]
        });
        var bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: UBOBuffer
                    }
                }
            ]
        });
        var computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        });
        return new Promise(function (resolve) {
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data));
            gpuInputBuffer.unmap();
            // Write values to uniform buffer object
            var uniformData = [
                _Utils__WEBPACK_IMPORTED_MODULE_0__.Utils.hexColorToInt(_Utils__WEBPACK_IMPORTED_MODULE_0__.Utils.rgba2abgr(innerColor)),
                _Utils__WEBPACK_IMPORTED_MODULE_0__.Utils.hexColorToInt(_Utils__WEBPACK_IMPORTED_MODULE_0__.Utils.rgba2abgr(outerColor)),
                width
            ];
            //console.log(uniformData);
            var uniformTypedArray = new Int32Array(uniformData);
            _this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);
            var commandEncoder = that._device.createCommandEncoder();
            var passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that._width, that._height);
            passEncoder.end();
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that._bufferByteLength);
            that._device.queue.submit([commandEncoder.finish()]);
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then(function () {
                // Grab data from output buffer
                var pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
                // Generate Image data usable by a canvas
                var imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that._width, that._height);
                //console.log(imageData.data);
                // return to caller
                resolve(imageData);
            });
        });
    };
    return OutlineRenderer;
}());



/***/ }),

/***/ "./src/renderers/RemoveAliasingRenderer.ts":
/*!*************************************************!*\
  !*** ./src/renderers/RemoveAliasingRenderer.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "RemoveAliasingRenderer": () => (/* binding */ RemoveAliasingRenderer)
/* harmony export */ });
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Utils */ "./src/Utils.ts");

var RemoveAliasingRenderer = /** @class */ (function () {
    /**
     * @param {number} width
     * @param {number} height
     */
    function RemoveAliasingRenderer(width, height) {
        this._device;
        this._adapter;
        this._shaderModule;
        this._width = width;
        this._height = height;
        this._bufferByteLength = width * height * 4;
        this.renderFrame = this._doNothing;
    }
    RemoveAliasingRenderer.prototype.init = function () {
        var that = this;
        return new Promise(function (resolve) {
            navigator.gpu.requestAdapter().then(function (adapter) {
                that._adapter = adapter;
                adapter.requestDevice().then(function (device) {
                    that._device = device;
                    that._shaderModule = device.createShaderModule({
                        code: "\n                            struct UBO {\n                                treshold : u32,\n                                baseColor : u32\n                            }\n                            struct Image {\n                                rgba: array<u32>\n                            }\n\n                            @group(0) @binding(0) var<storage,read> inputPixels: Image;\n                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;\n                            @group(0) @binding(2) var<uniform> uniforms : UBO;                                                        \n\n                            @compute\n                            @workgroup_size(1)\n                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {\n                                let lineSize : u32 = ".concat(that._width, "u;\n                                let lineWidth : u32 = 1u;\n\n                                let index : u32 = global_id.x + global_id.y * lineSize;\n                                var pixelColor : u32 = inputPixels.rgba[index];\n                                \n                                let a : u32 = (pixelColor >> 24u) & 255u;                                \n                                let b : u32 = (pixelColor >> 16u) & 255u;\n                                let g : u32 = (pixelColor >> 8u) & 255u;\n                                let r : u32 = (pixelColor & 255u);\n\n                                outputPixels.rgba[index] = pixelColor;\n\n                                //let innerColor: u32 =  255u << 24u | a << 16u | g << 8u | r;\n                                //let innerColor: u32 = 255u << 24u | 0u << 16u | 0u << 8u | 255u;\n                                //let innerColor: u32 = 255u << 24u | 255u << 16u | 255u << 8u | 255u;\n                                let innerColor = uniforms.baseColor;\n\n                                if (a > 0u && pixelColor != innerColor) {\n\n                                    var innerColorFound = false;\n\n                                    if (global_id.x > 0u && global_id.x < ").concat(that._width - 1, "u && global_id.y > 0u && global_id.y < ").concat(that._height - 1, "u) {\n\n                                        //outputPixels.rgba[index] = 255u << 24u | 255u << 16u | 255u << 8u | 0u;\n\n                                        let topPixel = index - lineSize * lineWidth;\n                                        let bottomPixel = index + lineSize * lineWidth;\n                                        let leftPixel = index - lineWidth;\n                                        let rightPixel = index + lineWidth;\n                                        let topLeftPixel = topPixel - lineWidth;\n                                        let topRightPixel = topPixel + lineWidth;\n                                        let bottomLeftPixel = bottomPixel - lineWidth;\n                                        let bottomRightPixel = bottomPixel + lineWidth;\n\n                                        if (\n                                            inputPixels.rgba[topPixel] == innerColor ||\n                                            inputPixels.rgba[rightPixel] == innerColor ||\n                                            inputPixels.rgba[bottomPixel] == innerColor ||\n                                            inputPixels.rgba[leftPixel] == innerColor ||\n                                            inputPixels.rgba[topLeftPixel] == innerColor ||\n                                            inputPixels.rgba[topRightPixel] == innerColor ||\n                                            inputPixels.rgba[bottomLeftPixel] == innerColor ||\n                                            inputPixels.rgba[bottomRightPixel] == innerColor\n                                        ) {\n                                            innerColorFound = true;\n                                        }\n                                    }\n\n\n                                    if (innerColorFound && a >= uniforms.treshold && a < 255u) {\n                                        outputPixels.rgba[index] = (255u << 24u) | (b << 16u) | (g << 8u) | r;\n                                    } else {\n                                        outputPixels.rgba[index] = (0u << 24u) | (b << 16u) | (g << 8u) | r;\n                                    }\n\n                                }\n                                // else {\n                                    //outputPixels.rgba[index] = 200u << 24u | 0u << 16u | 0u << 8u | 0u;\n                               // }\n\n                               //outputPixels.rgba[index] = 255u << 24u | 255u << 16u | 255u << 8u | 255u;\n             \n                            }\n                        ")
                    });
                    console.log('RemoveAliasingRenderer:init()');
                    that._shaderModule.compilationInfo().then(function (i) {
                        if (i.messages.length > 0) {
                            console.warn("RemoveAliasingRenderer:compilationInfo() ", i.messages);
                        }
                    });
                    that.renderFrame = that._doRendering;
                    resolve();
                });
            });
        });
    };
    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {ImageData} frameData
     * @returns
     */
    RemoveAliasingRenderer.prototype._doNothing = function (frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(function (resolve) {
            resolve(frameData);
        });
    };
    RemoveAliasingRenderer.prototype._doRendering = function (frameData, options) {
        var _this = this;
        var that = this;
        var treshold = options[treshold] || 0;
        var baseColor = options[baseColor];
        var UBOBuffer = this._device.createBuffer({
            size: 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        var gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        var gpuTempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        var gpuOutputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        var bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                }
            ]
        });
        var bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: UBOBuffer
                    }
                }
            ]
        });
        var computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        });
        return new Promise(function (resolve) {
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data));
            gpuInputBuffer.unmap();
            // Write values to uniform buffer object
            var uniformData = [treshold, _Utils__WEBPACK_IMPORTED_MODULE_0__.Utils.hexColorToInt(_Utils__WEBPACK_IMPORTED_MODULE_0__.Utils.rgba2abgr(baseColor))];
            var uniformTypedArray = new Int32Array(uniformData);
            _this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);
            var commandEncoder = that._device.createCommandEncoder();
            var passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that._width, that._height);
            passEncoder.end();
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that._bufferByteLength);
            that._device.queue.submit([commandEncoder.finish()]);
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then(function () {
                // Grab data from output buffer
                var pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
                // Generate Image data usable by a canvas
                var imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that._width, that._height);
                //console.log(imageData.data);
                // return to caller
                resolve(imageData);
            });
        });
    };
    return RemoveAliasingRenderer;
}());



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DMD": () => (/* binding */ DMD),
/* harmony export */   "DotShape": () => (/* binding */ DotShape)
/* harmony export */ });
/* harmony import */ var _Buffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Buffer */ "./src/Buffer.ts");
/* harmony import */ var _Easing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Easing */ "./src/Easing.ts");
/* harmony import */ var _renderers_GPURenderer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./renderers/GPURenderer */ "./src/renderers/GPURenderer.ts");
/* harmony import */ var _renderers_ChangeAlphaRenderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./renderers/ChangeAlphaRenderer */ "./src/renderers/ChangeAlphaRenderer.ts");
/* harmony import */ var _renderers_RemoveAliasingRenderer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./renderers/RemoveAliasingRenderer */ "./src/renderers/RemoveAliasingRenderer.ts");
/* harmony import */ var _renderers_OutlineRenderer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./renderers/OutlineRenderer */ "./src/renderers/OutlineRenderer.ts");
/* harmony import */ var _BaseLayer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./BaseLayer */ "./src/BaseLayer.ts");
/* harmony import */ var _ImageLayer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./ImageLayer */ "./src/ImageLayer.ts");
/* harmony import */ var _CanvasLayer__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./CanvasLayer */ "./src/CanvasLayer.ts");
/* harmony import */ var _AnimationLayer__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./AnimationLayer */ "./src/AnimationLayer.ts");
/* harmony import */ var _AnimationLayer__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(_AnimationLayer__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _VideoLayer__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./VideoLayer */ "./src/VideoLayer.ts");
/* harmony import */ var _TextLayer__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./TextLayer */ "./src/TextLayer.ts");
/* harmony import */ var _TextLayer__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(_TextLayer__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _SpritesLayer__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./SpritesLayer */ "./src/SpritesLayer.ts");













var DotShape;
(function (DotShape) {
    DotShape[DotShape["Square"] = 0] = "Square";
    DotShape[DotShape["Circle"] = 1] = "Circle";
})(DotShape || (DotShape = {}));
var DMD = /** @class */ (function () {
    /**
     *
     * @param {HTMLCanvasElement} outputCanvas Dom Element where the DMD will be drawed
     * @param {number} dotSize Horizontal width of the virtual pixels (ex: 1 dot will be 4 pixels wide)
     * @param {number} dotSpace number of 'black' pixels between each column (vertical lines between dots)
     * @param {number} xOffset // TODO : horizontal shifting
     * @param {number} yOffset  // TODO : vertical shifting
     * @param {string} dotShape // TODO(GPU) : Shape of the dots (can be square or circle)
     * @param {number} backgroundBrightness brightness of the background (below the dots)
     * @param {number} brightness brightness of the dots
     * @param {boolean} showFPS show FPS count or not
     */
    function DMD(outputCanvas, dotSize, dotSpace, xOffset, yOffset, dotShape, backgroundBrightness, brightness, showFPS) {
        this.outputCanvas = outputCanvas;
        this.outputContext = this.outputCanvas.getContext('2d');
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.outputWidth = Math.floor(this.outputCanvas.width / (dotSize + dotSpace));
        this.outputHeight = Math.floor(this.outputCanvas.height / (dotSize + dotSpace));
        this.frameBuffer = new _Buffer__WEBPACK_IMPORTED_MODULE_0__.Buffer(this.outputWidth, this.outputHeight, true);
        this.zIndex = 1;
        this.layers = {};
        this.sortedLayers = [];
        this.renderFPS = function () { }; // Does nothing
        this.backgroundColor = "rgba(14,14,14,255)";
        this.isRunning = false;
        this._fps = 0;
        this.renderNextFrame = function () { };
        console.log("Creating a ".concat(this.outputWidth, "x").concat(this.outputHeight, " DMD on a ").concat(this.outputCanvas.width, "x").concat(this.outputCanvas.height, " canvas"));
        this.renderer = new _renderers_GPURenderer__WEBPACK_IMPORTED_MODULE_2__.GPURenderer(this.outputWidth, this.outputHeight, this.outputCanvas.width, this.outputCanvas.height, dotSize, dotSpace, dotShape || DotShape.Circle, backgroundBrightness, brightness);
        // Add renderers needed for layers rendering
        this.layerRenderers = {
            'opacity': new _renderers_ChangeAlphaRenderer__WEBPACK_IMPORTED_MODULE_3__.ChangeAlphaRenderer(this.outputWidth, this.outputHeight),
            'no-antialiasing': new _renderers_RemoveAliasingRenderer__WEBPACK_IMPORTED_MODULE_4__.RemoveAliasingRenderer(this.outputWidth, this.outputHeight),
            'outline': new _renderers_OutlineRenderer__WEBPACK_IMPORTED_MODULE_5__.OutlineRenderer(this.outputWidth, this.outputHeight) // used by TextLayer when outlineWidth > 1
        };
        this.initDone = false;
        // IF needed create and show fps div in hte top right corner of the screen
        if (!!showFPS) {
            // Dom element to ouput fps value
            // TODO : Remove later
            this.fpsBox = document.createElement('div');
            this.fpsBox.style.position = 'absolute';
            this.fpsBox.style.right = '0';
            this.fpsBox.style.top = '0';
            this.fpsBox.style.zIndex = '99999'; // WTF is this a string : check if/where we do addition/substraction
            this.fpsBox.style.color = 'red';
            this.fpsBox.style.background = "rgba(255,255,255,0.5)";
            this.fpsBox.style.padding = '5px';
            this.fpsBox.style.minWidth = '40px';
            this.fpsBox.style.textAlign = 'center';
            document.body.appendChild(this.fpsBox);
            this.renderFPS = this._renderFPS; // Enable fps rendering on top of dmd
        }
        // Reset layers
        this.reset();
    }
    /**
     * Init DMD renderer then all layer renderers
     * @returns Promise
     */
    DMD.prototype.init = function () {
        var _this = this;
        var that = this;
        return new Promise(function (resolve) {
            var renderers = [];
            Object.keys(_this.layerRenderers).forEach(function (id) {
                renderers.push(_this.layerRenderers[id].init());
            });
            _this.renderer.init().then(function (device) {
                // Check if it still behave like chainPromises
                Promise.all(renderers).then(function () {
                    _this.initDone = true;
                    resolve();
                });
                /*Utils.chainPromises(renderers)
                    .then(() => {
                        this.initDone = true;
                        resolve();
                    });
                    */
            });
        });
    };
    /**
     * Start rendering layers
     */
    DMD.prototype.run = function () {
        if (!this.initDone) {
            throw new Error("call DMD.init() first");
        }
        this.isRunning = true;
        this.lastRenderTime = window.performance.now();
        this.renderNextFrame = this.requestNextFrame;
        this.renderNextFrame();
    };
    /**
     * Stop DMD rendering
     */
    DMD.prototype.stop = function () {
        this.isRunning = false;
        this.renderNextFrame = function () { console.log("DMD render stopped"); };
    };
    /**
     * Render output DMD
     */
    DMD.prototype.renderDMD = function () {
        var _this = this;
        var that = this;
        // Fill rectangle with background color
        this.frameBuffer.context.fillStyle = this.backgroundColor;
        this.frameBuffer.context.fillRect(0, 0, this.outputWidth, this.outputHeight);
        // Draw each visible layer on top of previous one to create the final screen
        this.sortedLayers.forEach(function (l) {
            if (_this.layers.hasOwnProperty(l.id)) {
                var layer = _this.layers[l.id];
                if (layer.isVisible() && layer.isLoaded()) {
                    // Draw layer content into a buffer
                    _this.frameBuffer.context.drawImage(layer.canvas, 0, 0);
                }
            }
        });
        // Get data from the merged layers content
        var frameImageData = this.frameBuffer.context.getImageData(0, 0, this.frameBuffer.width, this.frameBuffer.height);
        // Generate DMD frame
        this.renderer.renderFrame(frameImageData).then(function (dmdImageData) {
            createImageBitmap(dmdImageData).then(function (bitmap) {
                // Clear target canvas
                that.outputContext.clearRect(0, 0, that.outputCanvas.width, that.outputCanvas.height);
                // Render final DMD image onto target canvas
                that.outputContext.drawImage(bitmap, 0, 0);
                // Render FPS box if needed
                that.renderFPS();
                var now = window.performance.now();
                var delta = (now - that.lastRenderTime);
                that.lastRenderTime = now;
                // Calculate FPS
                _this._fps = Math.round((1000 / delta) * 1e2) / 1e2;
                _this.renderNextFrame();
            });
        });
    };
    /**
     * Update FPS output div with current fps value
     */
    DMD.prototype._renderFPS = function () {
        this.fpsBox.innerHTML = "".concat(this.fps, " fps");
    };
    /**
     * Request next Frame rendering cycle
     */
    DMD.prototype.requestNextFrame = function () {
        requestAnimationFrame(this.renderDMD.bind(this));
    };
    DMD.prototype.sortLayers = function () {
        this.sortedLayers = this.sortedLayers.sort(function (a, b) { return (a.zIndex > b.zIndex) ? 1 : -1; });
    };
    /**
     * Create a new layer object and add it to the list of layers
     * @param {string} id : mandatory
     * @param {LayerType} type : mandatory
     * @param {object} options
     * @see BaseLayer for available options
     * @return layer
     */
    DMD.prototype._createLayer = function (type, id, options, _zIndex, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener) {
        // add zIndex if not specified
        var options = Object.assign({ visible: true }, options);
        if (typeof this.layers[id] === 'undefined') {
            var layer;
            switch (type) {
                case _BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Image:
                    layer = new _ImageLayer__WEBPACK_IMPORTED_MODULE_7__.ImageLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener);
                    break;
                case _BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Canvas:
                    layer = new _CanvasLayer__WEBPACK_IMPORTED_MODULE_8__.CanvasLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener);
                    break;
                case _BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Animation:
                    layer = new _AnimationLayer__WEBPACK_IMPORTED_MODULE_9__.AnimationLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener);
                    break;
                case _BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Text:
                    layer = new _TextLayer__WEBPACK_IMPORTED_MODULE_11__.TextLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener);
                    break;
                case _BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Video:
                    layer = new _VideoLayer__WEBPACK_IMPORTED_MODULE_10__.VideoLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener);
                    break;
                case _BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Sprites:
                    layer = new _SpritesLayer__WEBPACK_IMPORTED_MODULE_12__.SpritesLayer(id, this.outputWidth, this.outputHeight, options, this.layerRenderers, _layerLoadedListener, _layerUpdatedListener);
                    break;
                default:
                    throw new TypeError("Invalid layer type : ".concat(type));
            }
            this.layers[id] = layer; // use getType() to retrieve the type later 
            var zIndex = this.zIndex;
            if (typeof _zIndex === 'number') {
                zIndex = _zIndex;
            }
            else {
                this.zIndex++;
            }
            // Add new layer to sorted array
            this.sortedLayers.push({ id: id, zIndex: zIndex });
            // Sort by zIndex inc
            this.sortLayers();
            return this.layers[id];
        }
        else {
            throw new Error("Layer [".concat(id, "] already exists"));
        }
    };
    DMD.prototype.createImageLayer = function (id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener) {
        this._createLayer(_BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Image, id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener);
    };
    DMD.prototype.createCanvasLayer = function (id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener) {
        this._createLayer(_BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Canvas, id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener);
    };
    DMD.prototype.createVideoLayer = function (id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener
    // Why no _layerOnStopListener ?
    ) {
        this._createLayer(_BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Video, id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener);
    };
    DMD.prototype.createAnimationLayer = function (id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener) {
        this._createLayer(_BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Animation, id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener, _layerOnPlayListener, _layerOnPauseListener, _layerOnStopListener);
    };
    DMD.prototype.createTextLayer = function (id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener) {
        this._createLayer(_BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Text, id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener);
    };
    DMD.prototype.createSpritesLayer = function (id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener) {
        this._createLayer(_BaseLayer__WEBPACK_IMPORTED_MODULE_6__.LayerType.Sprites, id, _options, _zIndex, _layerLoadedListener, _layerUpdatedListener);
    };
    /**
     * Add an external layer object to the DMD
     * @param {string} id
     * @param {BaseLayer} layer
     */
    /*addLayer(id: string, layer: BaseLayer, _zIndex: number) {
        if (typeof this.layers[id] === 'undefined') {

            if (typeof layer === 'object' &&
                (
                    layer.constructor === CanvasLayer ||
                    layer.constructor === ImageLayer ||
                    layer.constructor === VideoLayer ||
                    layer.constructor === TextLayer ||
                    layer.constructor === AnimationLayer ||
                    layer.constructor === SpritesLayer
            )
            ) {

                if (layer.width === this.outputCanvas.width && layer.height === this.outputCanvas.height ) {

                    var zIndex = this.zIndex;

                    if (typeof _zIndex === 'number') {
                        zIndex = _zIndex;
                    } else {
                        this.zIndex++;
                    }

                    this.layers[id] = layer;
                    this.sortedLayers.push({name : id, zIndex : zIndex});
                    this.sortLayers();
                } else {
                    console.error(`Layer[${id}] width/height mismatch : Expected[${this.outputCanvas.width}x${this.outputCanvas.height}] but received[${layer.width}x${layer.height}]`);
                }
            } else {
                console.error("Object is not a valid layer object", layer);
            }

        } else {
            console.error(`A layer named '${id}' already exists`);
        }

    }*/
    /**
     * Remove specified layer
     * @param {string} id
     */
    DMD.prototype.removeLayer = function (id) {
        if (typeof this.layers[id] !== 'undefined') {
            this.layers[id].destroy(); // Force stop rendering since delete does seems to GC
            // Remove Layer object from array
            delete this.layers[id];
            // Sort layers without deleted layer
            this.sortedLayers = this.sortedLayers.filter(function (l) { return l.id !== id; });
            console.log("Removing layer : ".concat(id));
        }
        else {
            console.log('This layer does not exist');
        }
    };
    /*removeLayer(layer: BaseLayer) {
        this.removeLayer(layer.id);
    }*/
    /**
     * Show/Hide specified layer
     * @param {string} id
     * @param {boolean} state
     */
    DMD.prototype.setLayerVisibility = function (id, state) {
        if (typeof this.layers[id] !== 'undefined') {
            this.layers[id].setVisibility(!!state);
        }
    };
    /**
     * Show/hid group of layers
     * @param {string} name
     * @param {boolean} state
     */
    DMD.prototype.setLayerGroupVisibility = function (name, state) {
        var _this = this;
        Object.keys(this.layers).forEach(function (key) {
            if (_this.layers[key].groups.includes(name)) {
                _this.layers[key].setVisibility(!!state);
            }
        });
    };
    /**
     * Reset DMD
     */
    DMD.prototype.reset = function () {
        this.layers = {};
        this.sortedLayers = [];
    };
    /**
     * Output some info in the console
     */
    DMD.prototype.debug = function () {
        console.log(this.layers);
        console.log(this.sortedLayers);
    };
    /**
     * Get specified layer
     * @param {string} name
     * @returns BaseLayer
     */
    DMD.prototype.getLayer = function (name) {
        if (typeof this.layers[name] !== 'undefined') {
            return this.layers[name];
        }
        else {
            return null;
        }
    };
    /**
     * Fase dmd brightness out
     * @param {number} duration in ms
     * @returns {Promise<void>}
     */
    DMD.prototype.fadeOut = function (duration) {
        var start = window.performance.now();
        var that = this;
        var startBrightness = that.renderer.brightness;
        return new Promise(function (resolve) {
            var cb = function () {
                var delta = window.performance.now() - start;
                var b = startBrightness - _Easing__WEBPACK_IMPORTED_MODULE_1__.Easing.easeOutSine(delta, 0, startBrightness, duration);
                that.renderer.setBrightness(b);
                if (that.renderer.brightness <= 0 || delta > duration) {
                    that.renderer.setBrightness(0);
                    resolve();
                }
                else {
                    setTimeout(cb, 1);
                }
            };
            cb();
        });
    };
    /**
     * Fade DMD brightness in
     * @param {number} duration in ms
     * @returns {Promise<void>}
     */
    DMD.prototype.fadeIn = function (duration) {
        var start = window.performance.now();
        var that = this;
        var startBrightness = that.renderer.brightness;
        var cnt = 0;
        return new Promise(function (resolve) {
            var cb = function () {
                cnt++;
                var delta = window.performance.now() - start;
                //console.log(delta);
                var b = _Easing__WEBPACK_IMPORTED_MODULE_1__.Easing.easeOutSine(delta, startBrightness, 1, duration);
                that.renderer.setBrightness(b);
                if (that.renderer.brightness >= 1 || delta > duration) {
                    that.renderer.setBrightness(1);
                    //console.log(cnt);
                    resolve();
                }
                else {
                    setTimeout(cb, 1);
                }
            };
            cb();
        });
    };
    /**
     * Set DMD opacity betwewn 0 and 255
     * @param {number} b
     */
    DMD.prototype.setBrightness = function (b) {
        // Pass brightness to the renderer
        this.renderer.setBrightness(b);
    };
    /**
     * Add a renderer instance to the DMD
     * TODO : Check if really a renderer class
     * @param {string} id (unique)
     * @param {IRenderer} renderer
     */
    DMD.prototype.addRenderer = function (id, renderer) {
        if (this.isRunning) {
            throw new Error("Renderers must be added before calling DMD.init()");
        }
        // TODO check if renderer is a renderer class
        if (typeof this.layerRenderers[id] === 'undefined') {
            if (typeof renderer === 'object' && typeof renderer.renderFrame === 'function') {
                this.layerRenderers[id] = renderer;
            }
            else {
                throw new Error("Renderer object might not be a Renderer class");
            }
        }
        else {
            throw new Error("A renderer with this id[".concat(id, "] already exists"));
        }
    };
    Object.defineProperty(DMD.prototype, "brightness", {
        /**
         * Get DMD brightness
         */
        get: function () {
            return this.renderer.brightness;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "canvas", {
        /**
         * Get canvas
         */
        get: function () {
            return this.outputCanvas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "context", {
        /**
         * Get canvas context
         */
        get: function () {
            return this.outputContext;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "width", {
        /**
         * Return width of the DND (dots)
         */
        get: function () {
            return this.outputWidth;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "height", {
        /**
         * Return height of the DND (dots)
         */
        get: function () {
            return this.outputHeight;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "screenWidth", {
        /**
         * Return width of the canvas (pixels)
         */
        get: function () {
            return this.outputCanvas.width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "screenHeight", {
        /**
         * Return height of the canvas (pixels)
         */
        get: function () {
            return this.outputCanvas.height;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DMD.prototype, "fps", {
        /**
         * Get current fps value
         */
        get: function () {
            return this._fps;
        },
        enumerable: false,
        configurable: true
    });
    return DMD;
}());


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUtELHNCQUFJLHVCQUFNO1FBSFY7O1dBRUc7YUFDSDtZQUNDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDOzs7T0FBQTtJQUtELHNCQUFJLDRCQUFXO1FBSGY7O1dBRUc7YUFDSDtZQUNDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFDaEMsQ0FBQzs7O09BQUE7SUFLRCxzQkFBSSw2QkFBWTtRQUhoQjs7V0FFRzthQUNIO1lBQ0MsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQUtELHNCQUFJLG9CQUFHO1FBSFA7O1dBRUc7YUFDSDtZQUNDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDOzs7T0FBQTtJQUNGLFVBQUM7QUFBRCxDQUFDO0FBRXdCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL0Jhc2VMYXllci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvQnVmZmVyLnRzIiwid2VicGFjazovLy8uL3NyYy9DYW52YXNMYXllci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvRWFzaW5nLnRzIiwid2VicGFjazovLy8uL3NyYy9JbWFnZUxheWVyLnRzIiwid2VicGFjazovLy8uL3NyYy9TcHJpdGUudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1Nwcml0ZXNMYXllci50cyIsIndlYnBhY2s6Ly8vLi9zcmMvVXRpbHMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1ZpZGVvTGF5ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3JlbmRlcmVycy9DaGFuZ2VBbHBoYVJlbmRlcmVyLnRzIiwid2VicGFjazovLy8uL3NyYy9yZW5kZXJlcnMvR1BVUmVuZGVyZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3JlbmRlcmVycy9PdXRsaW5lUmVuZGVyZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3JlbmRlcmVycy9SZW1vdmVBbGlhc2luZ1JlbmRlcmVyLnRzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnLi9CdWZmZXInO1xuaW1wb3J0IHsgSVJlbmRlcmVyLCBJUmVuZGVyZXJEaWN0aW9uYXJ5IH0gZnJvbSAnLi9yZW5kZXJlcnMvSVJlbmRlcmVyJztcblxuZW51bSBMYXllclR5cGUge1xuXHRJbWFnZSxcblx0Q2FudmFzLFxuXHRUZXh0LFxuXHRWaWRlbyxcblx0QW5pbWF0aW9uLFxuXHRTcHJpdGVzXG59XG5cbmludGVyZmFjZSBJQmFzZUxheWVyT3B0aW9ucyB7XG4gICAgdmlzaWJsZTogYm9vbGVhbixcbiAgICByZW5kZXJlcnM/OiBbXSxcbiAgICBhbnRpYWxpYXNpbmc6IGJvb2xlYW4sXG4gICAgYWFUcmVzaG9sZDogbnVtYmVyLFxuICAgIGdyb3Vwczogc3RyaW5nW11cbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBMYXllciBmb3IgdGhlIERNRFxuICovXG5hYnN0cmFjdCBjbGFzcyBCYXNlTGF5ZXIge1xuXG4gICAgLy9Qcm90ZWN0ZWRcbiAgICBwcm90ZWN0ZWQgX2lkOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIF9vcHRpb25zOiBJQmFzZUxheWVyT3B0aW9ucztcbiAgICBwcm90ZWN0ZWQgX2NvbnRlbnRCdWZmZXI6IEJ1ZmZlcjtcbiAgICBwcm90ZWN0ZWQgX3JlbmRlck5leHRGcmFtZTogRnVuY3Rpb247XG5cbiAgICBcbiAgICAvLyBQcml2YXRlXG4gICAgcHJpdmF0ZSBfdHlwZTogTGF5ZXJUeXBlO1xuICAgIHByaXZhdGUgX2xvYWRlZExpc3RlbmVyPzogRnVuY3Rpb247XG4gICAgcHJpdmF0ZSBfdXBkYXRlZExpc3RlbmVyPzogRnVuY3Rpb247XG4gICAgcHJpdmF0ZSBfYXZhaWxhYmxlUmVuZGVyZXJzOiB7fTtcbiAgICBwcml2YXRlIF9kZWZhdWx0UmVuZGVyUXVldWU6IFtdO1xuICAgIHByaXZhdGUgX3JlbmRlclF1ZXVlOiBbXTtcbiAgICBwcml2YXRlIF9vcGFjaXR5OiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfZ3JvdXBzOiBzdHJpbmdbXTtcbiAgICBwcml2YXRlIF92aXNpYmxlOiBib29sZWFuO1xuICAgIHByaXZhdGUgX291dHB1dEJ1ZmZlcjogQnVmZmVyO1xuICAgIHByaXZhdGUgX2xvYWRlZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIF9yZW5kZXJlclBhcmFtczoge307XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgd2lkdGg6IG51bWJlcixcbiAgICAgICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgIHJlbmRlcmVycz86IElSZW5kZXJlckRpY3Rpb25hcnksXG4gICAgICAgIGxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG4gICAgICAgIHVwZGF0ZWRMaXN0ZW5lcj86IEZ1bmN0aW9uXG4gICAgKSB7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IgPT09IEJhc2VMYXllcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWJzdHJhY3QgY2xhc3MgXCJCYXNlTGF5ZXJcIiBjYW5ub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pZCA9IGlkO1xuICAgICAgICB0aGlzLl9sb2FkZWRMaXN0ZW5lciA9IGxvYWRlZExpc3RlbmVyO1xuICAgICAgICB0aGlzLl91cGRhdGVkTGlzdGVuZXIgPSB1cGRhdGVkTGlzdGVuZXI7XG4gICAgICAgIHRoaXMuX2RlZmF1bHRSZW5kZXJRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9yZW5kZXJRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9hdmFpbGFibGVSZW5kZXJlcnMgPSBPYmplY3QuYXNzaWduKHt9LCByZW5kZXJlcnMpO1xuICAgICAgICB0aGlzLl9vcGFjaXR5ID0gMTtcbiAgICAgICAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3JlbmRlcmVyUGFyYW1zID0ge307XG4gICAgICAgIHRoaXMuX2dyb3VwcyA9IFsnZGVmYXVsdCddO1xuXG5cbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZpc2libGUgOiB0cnVlLFxuICAgICAgICAgICAgcmVuZGVyZXJzOiBbXSxcbiAgICAgICAgICAgIGFudGlhbGlhc2luZyA6IHRydWUsXG4gICAgICAgICAgICBhYVRyZXNob2xkIDogMjU0LFxuICAgICAgICAgICAgZ3JvdXBzOiBbXVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fb3B0aW9ucy5hYVRyZXNob2xkID0gTWF0aC5taW4odGhpcy5fb3B0aW9ucy5hYVRyZXNob2xkLCAyNTQpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLl9vcHRpb25zLnJlbmRlcmVycykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJvcHRpb25zLnJlbmRlcmVycyBzaG91bGQgYmUgYW4gYXJyYXlcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX29wdGlvbnMuZ3JvdXBzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ncm91cHMgPSB0aGlzLl9ncm91cHMuY29uY2F0KHRoaXMuX29wdGlvbnMuZ3JvdXBzLnJlcGxhY2UoL1xccyovZ2ksICcnKS5zcGxpdCgvWyAsO10vKSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5jb3JyZWN0IGxpc3Qgb2YgZ3JvdXAgcHJvdmlkZWRcIiwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLl9vcHRpb25zLmdyb3VwcykpIHtcbiAgICAgICAgICAgIHRoaXMuX2dyb3VwcyA9IHRoaXMuX2dyb3Vwcy5jb25jYXQodGhpcy5fb3B0aW9ucy5ncm91cHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdmlzaWJsZSA9IHRoaXMuX29wdGlvbnMudmlzaWJsZTtcblxuICAgICAgICAvLyBFbXB0eSBtZXRob2QgdG8gYXV0b21hdGljYWxseSBlbmQgcmVuZGVyaW5nIHdoZW4gbGF5ZXIgaXMgaGlkZGVuXG4gICAgICAgIHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZyhgTGF5ZXIgWyR7dGhpcy5faWR9XSA6IFJlbmRlcmluZyBlbmRlZGApIH07XG5cblxuICAgICAgICB0aGlzLl9jb250ZW50QnVmZmVyID0gbmV3IEJ1ZmZlcih3aWR0aCwgaGVpZ2h0LCB0cnVlKTtcbiAgICAgICAgdGhpcy5fb3V0cHV0QnVmZmVyID0gbmV3IEJ1ZmZlcih3aWR0aCwgaGVpZ2h0KTtcblxuICAgICAgICAvLyBOT1QgV09SS0lOR1xuICAgICAgICB0aGlzLl9jb250ZW50QnVmZmVyLmNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gdGhpcy5fb3B0aW9ucy5hbnRpYWxpYXNpbmc7XG4gICAgICAgIHRoaXMuX291dHB1dEJ1ZmZlci5jb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IHRoaXMuX29wdGlvbnMuYW50aWFsaWFzaW5nO1xuXG4gICAgICAgIFxuICAgICAgICAvLyBCdWlsZCBkZWZhdWx0IHJlbmRlciBxdWV1ZSB0byBzYXZlIHNvbWUgdGltZSBpbiByZW5kZXJGcmFtZVxuICAgICAgICAvLyBTaW5jZSB0aGlzIHNob3VsZCBub3QgY2hhbmdlIGFmdGVyIGNyZWF0aW9uXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fb3B0aW9ucy5yZW5kZXJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5fYXZhaWxhYmxlUmVuZGVyZXJzW3RoaXMuX29wdGlvbnMucmVuZGVyZXJzW2ldXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWZhdWx0UmVuZGVyUXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGlkIDogdGhpcy5fb3B0aW9ucy5yZW5kZXJlcnNbaV0sXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlIDogdGhpcy5fYXZhaWxhYmxlUmVuZGVyZXJzW3RoaXMuX29wdGlvbnMucmVuZGVyZXJzW2ldXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVuZGVyZXIgJHt0aGlzLl9vcHRpb25zLnJlbmRlcmVyc1tpXX0gaXMgbm90IGluIHRoZSBsaXN0IG9mIGF2YWlsYWJsZSByZW5kZXJlcnNgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hdGNoIGFudGlhbGlhc2luZyByZW1vbXZpbmcgcmVuZGVyZXIgcGFyYW1zIHRvIHRoZSB2YWx1ZSBpbiBvcHRpb25zXG4gICAgICAgIHRoaXMuc2V0UmVuZGVyZXJQYXJhbXMoJ25vLWFudGlhbGlhc2luZycsIFt0aGlzLl9vcHRpb25zLmFhVHJlc2hvbGRdKTtcblxuXG4gICAgICAgIC8vIHNldCBvcGFjaXR5IGZyb20gb3B0aW9ucyBpZiBuZWVkZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9vcHRpb25zLm9wYWNpdHkgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB2YXIgb3BhY2l0eSA9IE1hdGgubWF4KDAsIE1hdGgubWluKE51bWJlci5wYXJzZUZsb2F0KHRoaXMuX29wdGlvbnMub3BhY2l0eSksIDEpKTtcbiAgICAgICAgICAgIHRoaXMuX29wYWNpdHkgPSBNYXRoLnJvdW5kKG9wYWNpdHkgKiAxZTMpIC8gMWUzO1xuXG4gICAgICAgICAgICAvLyBzZXQgb3BhY2l0eSByZW5kZXJlciBwYXJhbSB2YWx1ZVxuICAgICAgICAgICAgdGhpcy5zZXRSZW5kZXJlclBhcmFtcygnb3BhY2l0eScsIFt0aGlzLl9vcGFjaXR5XSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXQgcmVuZGVyIHBhcmFtZXRlcnMgZm9yIHNwZWNpZmllZCByZW5kZXJlciBrZXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZ2V0UmVuZGVyZXJQYXJhbXMoaWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX3JlbmRlcmVyUGFyYW1zW2lkXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJlclBhcmFtc1tpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCByZW5kZXJlciBwYXJhbWV0ZXJzXG4gICAgICogVE9ETyA6IEltcHJvdmUgdGhhdCBieSBjcmVhdGluZyBDbGFzc2VzIHByb3ZpZGVkIGJ5IHJlbmRlcmVycyB0aGVtc2VsZlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge2FycmF5fSB2YWx1ZSBcbiAgICAgKi9cbiAgICBzZXRSZW5kZXJlclBhcmFtcyhpZDogc3RyaW5nLCB2YWx1ZTogYW55W10pIHtcbiAgICAgICAgdGhpcy5fcmVuZGVyZXJQYXJhbXNbaWRdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCByZW5kZXJpbmcgb2YgbGF5ZXIgZnJhbWVcbiAgICAgKi9cbiAgICBwcml2YXRlIF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9yZW5kZXJGcmFtZS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCByZW5kZXJpbmcgcHJvY2Vzc1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBfcmVuZGVyRnJhbWUodD86IG51bWJlcikge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcblxuICAgICAgICAvLyBjbG9uZSByZW5kZXJlcnMgYXJyYXk7XG4gICAgICAgIHRoaXMuX3JlbmRlclF1ZXVlID0gWy4uLnRoaXMuX2RlZmF1bHRSZW5kZXJRdWV1ZV0gfHwgW107XG5cbiAgICAgICAgLy8gSWYgb3BhY2l0eSBpcyBiZWxvdyAxIGFkZCBvcGFjaXR5IHJlbmRlcmVyXG4gICAgICAgIGlmICh0aGlzLl9vcGFjaXR5IDwgMSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyUXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQgOiAnb3BhY2l0eScsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgOiB0aGlzLl9hdmFpbGFibGVSZW5kZXJlcnNbJ29wYWNpdHknXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgaW5pdGlhbCBkYXRhIGZyb20gbGF5ZXIgY29udGVudFxuICAgICAgICB2YXIgZnJhbWVJbWFnZURhdGEgPSB0aGlzLl9jb250ZW50QnVmZmVyLmNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMuX291dHB1dEJ1ZmZlci53aWR0aCwgdGhpcy5fb3V0cHV0QnVmZmVyLmhlaWdodCk7XG5cbiAgICAgICAgLy8gc3RhcnQgcmVuZGVyZXJzIHF1ZXVlIHByb2Nlc3NpbmdcbiAgICAgICAgdGhpcy5fcHJvY2Vzc1JlbmRlclF1ZXVlKGZyYW1lSW1hZ2VEYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzIGltYWdlIGRhdGEgcHJvdmlkZWQgdGhyb3VnaCBjdXJyZW50IHJlbmRlcmVyIGluIHF1ZXVlIGFuZCBjYWxsIGl0IHNlbGYgcmVjdXJzaXZlbHkgdW50aWwgbm8gbW9yZSByZW5kZXJlciBpbiBxdWV1ZVxuICAgICAqIEBwYXJhbSB7SW1hZ2VEYXRhfSBmcmFtZUltYWdlRGF0YSBcbiAgICAgKiBAcmV0dXJucyB7SW1hZ2VEYXRhfSByZXN1bHQgZGF0YSBvZiB0aGUgcmVuZGVyZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIF9wcm9jZXNzUmVuZGVyUXVldWUoZnJhbWVJbWFnZURhdGE6IEltYWdlRGF0YSkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSByZW5kZXJlciBpbiB0aGUgcXVldWUgdGhlbiBydW4gcmVuZGVyIHBhc3Mgd2l0aCB0aGlzIHJlbmRlcmVyXG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IHRoaXMuX3JlbmRlclF1ZXVlLnNoaWZ0KCk7IC8vIHBvcCByZW5kZXJlciBmcm9tIHJlbmRlciBxdWV1ZVxuXG4gICAgICAgICAgICAvLyBGaXJzdCBwYXJhbSBpcyBhbHdheXMgdGhlIGltYWdlIGRhdGFcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbZnJhbWVJbWFnZURhdGEuZGF0YV07XG5cbiAgICAgICAgICAgIC8vIE1lcmdlIHJlbmRlcmVyIHBhcmFtcyB3aXRoIGFycmF5IG9mIHBhcmFtcyBzcGVjaWZpYyB0byB0aGlzIHJlbmRlcmVyIGlmIGFueVxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0UmVuZGVyZXJQYXJhbXMocmVuZGVyZXIuaWQpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gcGFyYW1zLmNvbmNhdCh0aGlzLmdldFJlbmRlcmVyUGFyYW1zKHJlbmRlcmVyLmlkKSk7XG4gICAgICAgICAgICB9IFxuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMuX2lkLCBwYXJhbXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBcHBseSAnZmlsdGVyJyB0byBwcm92aWRlZCBjb250ZW50IHdpdGggY3VycmVudCByZW5kZXJlciB0aGVuIHByb2Nlc3MgbmV4dCByZW5kZXJlciBpbiBxdWV1ZVxuICAgICAgICAgICAgcmVuZGVyZXIuaW5zdGFuY2UucmVuZGVyRnJhbWUuYXBwbHkocmVuZGVyZXIuaW5zdGFuY2UsIHBhcmFtcykudGhlbihvdXRwdXREYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9wcm9jZXNzUmVuZGVyUXVldWUob3V0cHV0RGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gbm8gbW9yZSByZW5kZXJlciBpbiBxdWV1ZSB0aGVuIGRyYXcgZmluYWwgaW1hZ2UgYW5kIHN0YXJ0IHF1ZXVlIHByb2Nlc3MgYWdhaW5cdFxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBFcmFzZSBjdXJyZW50IG91dHB1dCBidWZmZXIgY29udGVudFxuICAgICAgICAgICAgdGhhdC5fb3V0cHV0QnVmZmVyLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIC8vIFB1dCBmaW5hbCBmcmFtZSBkYXRhIGludG8gb3V0cHV0IGJ1ZmZlciBhbmQgc3RhcnQgcHJvY2VzcyBhZ2FpbiAoaWYgbmVlZGVkKVxuICAgICAgICAgICAgY3JlYXRlSW1hZ2VCaXRtYXAoZnJhbWVJbWFnZURhdGEpLnRoZW4oYml0bWFwID0+IHtcbiAgICAgICAgICAgICAgICAvLyBQdXQgZmluYWwgbGF5ZXIgZGF0YSBpbiB0aGUgb3V0cHV0IGJ1ZmZlclxuICAgICAgICAgICAgICAgIHRoYXQuX291dHB1dEJ1ZmZlci5jb250ZXh0LmRyYXdJbWFnZShiaXRtYXAsIDAsIDApO1xuICAgICAgICAgICAgICAgIC8vIHJlcXVlc3QgbmV4dCBmcmFtZSByZW5kZXJpbmdcbiAgICAgICAgICAgICAgICB0aGF0Ll9yZW5kZXJOZXh0RnJhbWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGF5ZXIgaXMgbG9hZGVkIDogU3RhcnQgcmVuZGVyaW5nIGFuZCBjYWxsIHRoZSBjYWxsYmFjayBpZiBuZWVkZWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHN0YXJ0UmVuZGVyaW5nTG9vcCBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2xheWVyTG9hZGVkKHN0YXJ0UmVuZGVyaW5nTG9vcDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICB0aGlzLl9sb2FkZWQgPSB0cnVlO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGBMYXllciBbJHt0aGlzLl9pZH1dIDogTG9hZGVkYCk7XG5cbiAgICAgICAgLy8gSWYgbm8gcmVuZGVyZXIgaW4gdGhlIHF1ZXVlIHRoZW4ganVzdCByZW5kZXIgdGhlIGZyYW1lIGRhdGEgb25jZVxuICAgICAgICBpZiAodGhpcy5fZGVmYXVsdFJlbmRlclF1ZXVlLmxlbmd0aCA9PT0gMCAmJiB0aGlzLl9vcGFjaXR5ID09PSAxKSB7XG4gICAgICAgICAgICAvLyBQdXQgY29udGVudCBkYXRhIGluIG91dHB1dCBidWZmZXJcbiAgICAgICAgICAgIHZhciBmcmFtZUltYWdlRGF0YSA9IHRoaXMuX2NvbnRlbnRCdWZmZXIuY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy5fb3V0cHV0QnVmZmVyLndpZHRoLCB0aGlzLl9vdXRwdXRCdWZmZXIuaGVpZ2h0KTtcblxuICAgICAgICAgICAgdGhpcy5fb3V0cHV0QnVmZmVyLmNsZWFyKCk7XG4gICAgICAgICAgICBjcmVhdGVJbWFnZUJpdG1hcChmcmFtZUltYWdlRGF0YSkudGhlbihiaXRtYXAgPT4ge1xuICAgICAgICAgICAgICAgIHRoYXQuX291dHB1dEJ1ZmZlci5jb250ZXh0LmRyYXdJbWFnZShiaXRtYXAsIDAsIDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdGFydCByZW5kZXJpbmcgdmlzaWJsZSBsYXllcnMgd2hpY2ggaGF2ZSByZW5kZXJlcnNcblx0XHRpZiAodGhpcy5pc1Zpc2libGUoKSAmJiAodGhpcy5oYXZlUmVuZGVyZXIoKSB8fCAhIXN0YXJ0UmVuZGVyaW5nTG9vcCkpIHtcblx0XHRcdHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IHRoaXMuX3JlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0XHRcdHRoaXMuX3JlcXVlc3RBbmltYXRpb25GcmFtZSgpO1xuXHRcdH1cblxuICAgICAgICAvLyBDYWxsIGNhbGxiYWNrIGlmIHRoZXJlIGlzIG9uZVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2xvYWRlZExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkZWRMaXN0ZW5lcih0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExheWVyIHdhcyB1cGRhdGVkXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9sYXllclVwZGF0ZWQoKSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coYExheWVyIFske3RoaXMuX2lkfV0gOiBVcGRhdGVkYCk7XG5cbiAgICAgICAgLy8gUmUtcmVuZGVyIGZyYW1lIGlmIG5lZWRlZFxuICAgICAgICBpZiAoIXRoaXMuaGF2ZVJlbmRlcmVyKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlckZyYW1lKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsYmFjayBwYXJlbnQgaWYgYXZhaWxhYmxlXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fdXBkYXRlZExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVkTGlzdGVuZXIodGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9wIHJlbmRlcmluZyBvZiB0aGUgbGF5ZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3N0b3BSZW5kZXJpbmcoKSB7XG4gICAgICAgIHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCkge2NvbnNvbGUubG9nKGBSZW5kZXJpbmcgc3RvcHBlZCA6ICR7dGhpcy5faWR9YCl9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgcmVuZGVyaW5nIG9mIHRoZSBsYXllclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfc3RhcnRSZW5kZXJpbmcoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBMYXllciBbJHt0aGlzLl9pZH1dIDogU3RhcnQgcmVuZGVyaW5nYCk7XG5cbiAgICAgICAgdGhpcy5fcmVuZGVyTmV4dEZyYW1lID0gdGhpcy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaCBhbiBpbWFnZSBmcm9tIHJlbW90ZSBzZXJ2ZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3JjIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBfbG9hZEltYWdlKHNyYzogc3RyaW5nKSB7XG4gICAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHNyYyk7XG5cbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcbiAgICAgICAgfSAgICAgICAgXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmV0Y2ggaW1hZ2UgZnJvbSBzZXJ2ZXIgd2l0aCBhbiBpbmRleCB1c2VkIHRvIGRldGVybWluZSBwb3NpdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzcmMgXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgIHByb3RlY3RlZCBhc3luYyBfbG9hZEltYWdlU3luY2VkKHNyYzogc3RyaW5nLCBpbmRleDogbnVtYmVyKSB7XG4gICAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHNyYyk7XG5cbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICAgICAgYmxvYiA6IHJlc3BvbnNlLmJsb2IoKSxcbiAgICAgICAgICAgICAgICBpbmRleCA6IGluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBsYXllclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW5cbiAgICAgKi9cbiAgICBpc1Zpc2libGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92aXNpYmxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBsYXllclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc3RhdGUgXG4gICAgICovXG4gICAgc2V0VmlzaWJpbGl0eShzdGF0ZTogYm9vbGVhbikge1xuXG4gICAgICAgIC8vIFN0YXRlIGRpZG4ndCBjaGFuZ2UgZG8gbm90aGluZ1xuICAgICAgICBpZiAoc3RhdGUgPT09IHRoaXMuX3Zpc2libGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Zpc2libGUgPSBzdGF0ZTtcblxuICAgICAgICAvLyBJZiBsYXllciBiZWNvbWUgdmlzaWJsZSBhbmQgaGF2ZSByZW5kZXJlcnMgdGhlbiBzdGFydCB0aGUgcmVuZGVyaW5nIGxvb3BcbiAgICAgICAgaWYgKHRoaXMuX3Zpc2libGUgJiYgdGhpcy5oYXZlUmVuZGVyZXIoKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyTmV4dEZyYW1lID0gdGhpcy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCk7XG4gICAgICAgICAgICAvLyBPdGhlcndpc2Ugc3RvcCB0aGUgcmVuZGVyaW5nIGxvb3BcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZygnRW5kIG9mIHJlbmRlcmluZyA6JyArIHRoaXMuX2lkKSB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIGxheWVyIHZpc2liaWxpdHkgYW5kIHJldHVybiB0aGUgbmV3IHN0YXRlXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIHRvZ2dsZVZpc2liaWxpdHkoKSB7XG4gICAgICAgIHRoaXMuX3Zpc2libGUgPSAhdGhpcy5fdmlzaWJsZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Zpc2libGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSB0eXBlIG9mIHRoZSBsYXllclxuICAgICAqIEByZXR1cm5zIHN0cmluZ1xuICAgICAqL1xuICAgIGdldFR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90eXBlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBsYXllciBpZFxuICAgICAqIEByZXR1cm5zIHN0cmluZ1xuICAgICAqL1xuICAgIGdldElkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHJlcXVlc3RlZCByZW5kZXJlciBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyBvYmplY3RcbiAgICAgKi9cbiAgICBfZ2V0UmVuZGVyZXJJbnN0YW5jZShpZDogc3RyaW5nKTogSVJlbmRlcmVyIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hdmFpbGFibGVSZW5kZXJlcnNbaWRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICByZXR1cm4gIHRoaXMuX2F2YWlsYWJsZVJlbmRlcmVyc1tpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIHJlbmRlcmVyIGlzIG5vdCBhdmFpbGFibGVcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gaWYgdGhlIGxheWVyIGhhdmUgcmVuZGVyZXIgaW4gdGhlIHF1ZXVlXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIGhhdmVSZW5kZXJlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHRSZW5kZXJRdWV1ZS5sZW5ndGggPiAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBsYXllciBvcGFjaXR5ICgwIC0+IDEpXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG8gXG4gICAgICovXG4gICAgc2V0T3BhY2l0eShvOiBudW1iZXIpIHtcbiAgICAgICAgdmFyIG9wYWNpdHkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihOdW1iZXIucGFyc2VGbG9hdChvKSwgMSkpO1xuICAgICAgICB0aGlzLl9vcGFjaXR5ID0gTWF0aC5yb3VuZChvcGFjaXR5ICogMWUzKSAvIDFlMztcblxuICAgICAgICAvLyBzZXQgb3BhY2l0eSByZW5kZXJlciBwYXJhbSB2YWx1ZVxuICAgICAgICB0aGlzLnNldFJlbmRlcmVyUGFyYW1zKCdvcGFjaXR5JywgW3RoaXMuX29wYWNpdHldKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhgTGF5ZXIgWyR7dGhpcy5faWR9XSA6IE9wYWNpdHkgY2hhbmdlZCB0byAke3RoaXMuX29wYWNpdHl9YCk7XG5cbiAgICAgICAgLy8gTGF5ZXIgbmVlZCB0byBiZSByZWRyYXduXG4gICAgICAgIHRoaXMuX2xheWVyVXBkYXRlZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFyIGJ1ZmZlcnNcbiAgICAgKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fY29udGVudEJ1ZmZlci5jbGVhcigpO1xuICAgICAgICB0aGlzLl9vdXRwdXRCdWZmZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWRyYXcgbGF5ZXJcbiAgICAgKi9cbiAgICAvKnJlZHJhdygpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCk7XG4gICAgfSovXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gbG9hZGluZyBzdGF0ZSBvZiB0aGUgbGF5ZXJcbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgaXNMb2FkZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2xvYWRlZDtcblx0fVxuXG4gICAgLyoqXG4gICAgICogU2V0IGxheWVyIHR5cGUgXG4gICAgICogQHBhcmFtIHtMYXllclR5cGV9IHQgXG4gICAgICovXG4gICAgX3NldFR5cGUodDogTGF5ZXJUeXBlKSB7XG4gICAgICAgIHRoaXMuX3R5cGUgPSB0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZS9EaXNhYmxlIGFudGlhbGlhc2luZ1xuICAgICAqIFRPRE8gOiBGaXggbm90IHdvcmtpbmcgYXMgZXhwZWN0ZWRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGVuYWJsZWQgXG4gICAgICovXG4gICAgX3NldEFudGlhbGlhc2luZyhlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX291dHB1dEJ1ZmZlci5jb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGN1cnJlbnQgaW1hZ2UgZGF0YVxuICAgICAqL1xuICAgIGdldCBpbWFnZURhdGEoKTogSW1hZ2VEYXRhIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX291dHB1dEJ1ZmZlci5jb250ZXh0LmdldEltYWdlRGF0YSgwLDAsIHRoaXMuX291dHB1dEJ1ZmZlci53aWR0aCwgdGhpcy5fb3V0cHV0QnVmZmVyLmhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IG91dHB1dCBjYW52YXNcbiAgICAgKi9cbiAgICBnZXQgY2FudmFzKCk6IEhUTUxDYW52YXNFbGVtZW50IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX291dHB1dEJ1ZmZlci5jYW52YXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGNvbnRlbnQgY2FudmFzICh3aGl0aCBhbnkgZmlsdGVyKVxuICAgICAqL1xuICAgIGdldCBvcmlnaW5hbENhbnZhcygpOiBIVE1MQ2FudmFzRWxlbWVudCB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZW50QnVmZmVyLmNhbnZhcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgb3V0cHV0IGNhbnZhcyBjb250ZXh0XG4gICAgICovXG4gICAgZ2V0IGNvbnRleHQoKTogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX291dHB1dEJ1ZmZlci5jb250ZXh0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBsYXllciBvcHRpb25zXG4gICAgICovXG4gICAgZ2V0IG9wdGlvbnMoKToge30ge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucztcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogR2V0IGxheWVyIHdpZHRoXG4gICAgICovXG4gICAgZ2V0IHdpZHRoKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vdXRwdXRCdWZmZXIud2lkdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGxheWVyIGhlaWdodFxuICAgICAqL1xuICAgIGdldCBoZWlnaHQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX291dHB1dEJ1ZmZlci5oZWlnaHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGdyb3VwcyB0aGUgbGF5ZXIgYmVsb25nIHRvXG4gICAgICovXG4gICAgZ2V0IGdyb3VwcygpOiBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ncm91cHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSBsYXllciAoZm9yIG5vdyBpdCBqdXN0IG1lYW4gc3RvcHBpbmcgcmVuZGVyaW5nKVxuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCkgeyBjb25zb2xlLmxvZyhgRGVzdHJveWluZyBsYXllciA6ICR7dGhpcy5faWR9YCkgfTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IEJhc2VMYXllciwgTGF5ZXJUeXBlLCBJQmFzZUxheWVyT3B0aW9ucyB9OyIsIi8qKlxuICogUHJvdmlkZSBhIHNpbXBsZSBjbGFzcyB0byBidWlsZCBhIGJ1ZmZlciBmb3Igb3VyIGxheWVycyBhbmQgb3VyIERNRFxuICovXG5jbGFzcyBCdWZmZXIge1xuXHRwcml2YXRlIF9jYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuXHRwcml2YXRlIF9jb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG5cblx0LyoqXG5cdCogQHBhcmFtIHdpZHRoIHtpbnRlZ2VyfSBUaGUgd2lkdGggb2YgdGhlIGJ1ZmZlclxuXHQqIEBwYXJhbSBoZWlnaHQge2ludGVnZXJ9IFRoZSBoZWlnaHQgb2YgdGhlIGJ1ZmZlclxuXHQqL1xuXHRjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgd2lsbFJlYWRGcmVxdWVudGx5OiBib29sZWFuID0gdHJ1ZSkge1xuXHRcdHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpOyAvLyBPZmZzY3JlZW4gY2FudmFzXG5cdFx0dGhpcy5fY2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5fY2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdHZhciBvcHRpb25zID0gbnVsbDtcblxuXHRcdGlmICh3aWxsUmVhZEZyZXF1ZW50bHkpIHtcblx0XHRcdC8vY29uc29sZS5sb2coXCJCdWZmZXIoKSA6IFNldHRpbmdzIHdpbGxSZWFkeUZyZXF1ZW50bHkgdG8gdHJ1ZVwiKVxuXHRcdFx0b3B0aW9ucyA9IHsgd2lsbFJlYWRGcmVxdWVudGx5IDogdHJ1ZSB9O1xuXHRcdH1cblxuXG5cdFx0dGhpcy5fY29udGV4dCA9IHRoaXMuX2NhbnZhcy5nZXRDb250ZXh0KCcyZCcsIG9wdGlvbnMpO1xuXHR9XG5cblx0Z2V0IGNvbnRleHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NvbnRleHRcblx0fVxuXG5cdGdldCBjYW52YXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NhbnZhc1xuXHR9XG5cblx0Z2V0IHdpZHRoKCkge1xuXHRcdHJldHVybiB0aGlzLl9jYW52YXMud2lkdGhcblx0fVxuXG5cdGdldCBoZWlnaHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NhbnZhcy5oZWlnaHRcblx0fVxuXG5cdHNldCB3aWR0aCh3aWR0aCkge1xuXHRcdHRoaXMuX2NhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHR9XG5cblx0c2V0IGhlaWdodChoZWlnaHQpIHtcblx0XHR0aGlzLl9jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHR9XG5cblx0Y2xlYXIoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuX2NhbnZhcy53aWR0aCwgdGhpcy5fY2FudmFzLmhlaWdodCk7XG5cdH1cbn1cblxuZXhwb3J0IHsgQnVmZmVyIH07IiwiaW1wb3J0IHsgQmFzZUxheWVyLCBMYXllclR5cGUsIElCYXNlTGF5ZXJPcHRpb25zIH0gZnJvbSAnLi9CYXNlTGF5ZXInO1xuaW1wb3J0IHsgSVJlbmRlcmVyLCBJUmVuZGVyZXJEaWN0aW9uYXJ5IH0gZnJvbSAnLi9yZW5kZXJlcnMvSVJlbmRlcmVyJ1xuXG5pbnRlcmZhY2UgSUNhbnZhc0xheWVyT3B0aW9ucyBleHRlbmRzIElCYXNlTGF5ZXJPcHRpb25zIHtcblxufVxuXG5pbnRlcmZhY2UgSUltYWdlT3B0aW9ucyB7XG4gICAgd2lkdGg/OiBudW1iZXIsXG4gICAgaGVpZ2h0PzogbnVtYmVyLFxuICAgIHRvcD86IG51bWJlcixcbiAgICBsZWZ0PzogbnVtYmVyLFxuICAgIGFsaWduPzogc3RyaW5nLFxuICAgIHZBbGlnbj86IHN0cmluZ1xufVxuXG5cbmNsYXNzIENhbnZhc0xheWVyIGV4dGVuZHMgQmFzZUxheWVyIHtcblxuICAgIHByaXZhdGUgX2dsb2JhbE9wdGlvbnM7IC8vIFdoeSA/XG5cbiAgICBwcm90ZWN0ZWQgX29wdGlvbnM6IElDYW52YXNMYXllck9wdGlvbnM7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgd2lkdGg6IG51bWJlcixcbiAgICAgICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgIG9wdGlvbnM6IElDYW52YXNMYXllck9wdGlvbnMsXG4gICAgICAgIHJlbmRlcmVycz86IElSZW5kZXJlckRpY3Rpb25hcnksXG4gICAgICAgIGxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG4gICAgICAgIHVwZGF0ZWRMaXN0ZW5lcj86IEZ1bmN0aW9uXG4gICAgKSB7XG5cbiAgICAgICAgc3VwZXIoaWQsIHdpZHRoLCBoZWlnaHQsIHJlbmRlcmVycywgbG9hZGVkTGlzdGVuZXIsIHVwZGF0ZWRMaXN0ZW5lcik7XG5cbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24odGhpcy5fb3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fc2V0VHlwZShMYXllclR5cGUuQ2FudmFzKTtcblxuICAgICAgICB0aGlzLl9nbG9iYWxPcHRpb25zID0ge1xuICAgICAgICAgICAgdG9wIDogMCxcbiAgICAgICAgICAgIGxlZnQgOiAwLFxuICAgICAgICAgICAga2VlcEFzcGVjdFJhdGlvIDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERlbGF5IG9uTGF5ZXJVcGRhdGVkIGEgYml0IG90aGVyd2lzZSAjY29udGVudCBpcyB1bmRlZmluZWQgaW4gTGF5ZXIubWpzXG4gICAgICAgIHNldFRpbWVvdXQodGhpcy5fbGF5ZXJMb2FkZWQuYmluZCh0aGlzKSwgMSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRHJhdyBwcm92aWRlZCBpbWFnZSBvbnRvIGNhbnZhc1xuICAgICAqIElmIGltZyBpcyBhIHN0cmluZyB0aGVuIGltYWdlIGlzIGxvYWRlZCBiZWZvcmUgZHJhd2luZ1xuICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1nIFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBfb3B0aW9uc1xuICAgICAqL1xuICAgIGRyYXdJbWFnZShpbWc6IEhUTUxJbWFnZUVsZW1lbnQsIF9vcHRpb25zOiBJSW1hZ2VPcHRpb25zKSB7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdE9wdGlvbnM6IElJbWFnZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aWR0aCA6IGltZy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA6IGltZy5oZWlnaHRcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3B0aW9uczogSUltYWdlT3B0aW9ucyA9IHRoaXMuX2J1aWxkT3B0aW9ucyhfb3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX2NvbnRlbnRCdWZmZXIuY29udGV4dC5kcmF3SW1hZ2UoaW1nLCBvcHRpb25zLmxlZnQsIG9wdGlvbnMudG9wLCBvcHRpb25zLndpZHRoICwgb3B0aW9ucy5oZWlnaHQpO1xuICAgICAgICB0aGlzLl9sYXllclVwZGF0ZWQoKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIERyYXcgcHJvdmlkZWQgaW1hZ2Ugb250byBjYW52YXNcbiAgICAgKiBJZiBpbWcgaXMgYSBzdHJpbmcgdGhlbiBpbWFnZSBpcyBsb2FkZWQgYmVmb3JlIGRyYXdpbmdcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW1nIFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBfb3B0aW9uc1xuICAgICAqL1xuICAgIC8qZHJhd0ltYWdlKGltZzogc3RyaW5nLCBfb3B0aW9ucykge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5fbG9hZEltYWdlKGltZykudGhlbihibG9iID0+IHtcbiAgICAgICAgICAgIGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpLnRoZW4oIGJpdG1hcCA9PiB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogYml0bWFwLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgOiBiaXRtYXAuaGVpZ2h0XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhhdC5fYnVpbGRPcHRpb25zKF9vcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICB0aGF0Ll9jb250ZW50QnVmZmVyLmNvbnRleHQuZHJhd0ltYWdlKGJpdG1hcCwgb3B0aW9ucy5sZWZ0LCBvcHRpb25zLnRvcCwgb3B0aW9ucy53aWR0aCwgb3B0aW9ucy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIHRoYXQuX2xheWVyVXBkYXRlZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0qL1xuXG5cbiAgICBwcml2YXRlIF9idWlsZE9wdGlvbnMoX29wdGlvbnM6IElJbWFnZU9wdGlvbnMsIF9kZWZhdWx0T3B0aW9uczogSUltYWdlT3B0aW9ucyk6IElJbWFnZU9wdGlvbnMge1xuICAgICAgICB2YXIgb3B0aW9uczogSUltYWdlT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24odGhpcy5fZ2xvYmFsT3B0aW9ucywgX2RlZmF1bHRPcHRpb25zLCBfb3B0aW9ucyk7XG5cblxuICAgICAgICB2YXIgaXNNaXNzaW5nRGltZW5zaW9uID0gKHR5cGVvZiBfb3B0aW9ucy53aWR0aCA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIF9vcHRpb25zLmhlaWdodCA9PT0gJ3VuZGVmaW5lZCcpO1xuICAgICAgICB2YXIgaXNNaXNzaW5nQWxsRGltZW5zaW9ucyA9ICh0eXBlb2YgX29wdGlvbnMud2lkdGggPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBfb3B0aW9ucy5oZWlnaHQgPT09ICd1bmRlZmluZWQnKVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5sZWZ0ID09PSAnc3RyaW5nJyAmJiBvcHRpb25zLmxlZnQuYXQoLTEpID09PSAnJScpIHtcbiAgICAgICAgICAgIHZhciB4diA9IHBhcnNlSW50KG9wdGlvbnMubGVmdC5yZXBsYWNlKCclJywnJyksIDEwKTtcbiAgICAgICAgICAgIG9wdGlvbnMubGVmdCA9IE1hdGguZmxvb3IoKHh2ICogdGhpcy53aWR0aCkgLyAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRvcCA9PT0gJ3N0cmluZycgJiYgb3B0aW9ucy50b3AuYXQoLTEpID09PSAnJScpIHtcbiAgICAgICAgICAgIHZhciB5diA9IHBhcnNlSW50KG9wdGlvbnMudG9wLnJlcGxhY2UoJyUnLCcnKSwgMTApO1xuICAgICAgICAgICAgb3B0aW9ucy50b3AgPSBNYXRoLmZsb29yKCh5diAqIHRoaXMuaGVpZ2h0KSAvIDEwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMud2lkdGggPT09ICdzdHJpbmcnICYmIG9wdGlvbnMud2lkdGguYXQoLTEpID09PSAnJScpIHtcbiAgICAgICAgICAgIHZhciB3diA9IHBhcnNlSW50KG9wdGlvbnMud2lkdGgucmVwbGFjZSgnJScsJycpLCAxMCk7XG4gICAgICAgICAgICBvcHRpb25zLndpZHRoID0gTWF0aC5mbG9vcigod3YgKiB0aGlzLndpZHRoKSAvIDEwMCk7ICAvLyAlIG9mIHRoZSBkbWQgV2lkdGhcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5oZWlnaHQgPT09ICdzdHJpbmcnICYmIG9wdGlvbnMuaGVpZ2h0LmF0KC0xKSA9PT0gJyUnKSB7XG4gICAgICAgICAgICB2YXIgaHYgPSBwYXJzZUludChvcHRpb25zLmhlaWdodC5yZXBsYWNlKCclJywnJyksIDEwKTtcbiAgICAgICAgICAgIG9wdGlvbnMuaGVpZ2h0ID0gTWF0aC5mbG9vcigoaHYgKiB0aGlzLmhlaWdodCkgLyAxMDApOyAvLyAlIG9mIHRoZSBkbWQgSGVpZ2h0XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBwcm92aWRlZCBvbmx5IG9uZSBvZiB3aWR0aCBvciBoZWlnaHQgYW5kIGtlZXBpbmcgcmF0aW8gaXMgcmVxdWlyZWQgdGhlbiBjYWxjdWxhdGUgdGhlIG1pc3NpbmcgZGltZW5zaW9uXG4gICAgICAgIGlmIChvcHRpb25zLmtlZXBBc3BlY3RSYXRpbyAmJiBpc01pc3NpbmdEaW1lbnNpb24gJiYgIWlzTWlzc2luZ0FsbERpbWVuc2lvbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgX29wdGlvbnMud2lkdGggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy53aWR0aCA9IE1hdGguZmxvb3Iob3B0aW9ucy5oZWlnaHQgKiBfZGVmYXVsdE9wdGlvbnMud2lkdGggLyBfZGVmYXVsdE9wdGlvbnMuaGVpZ2h0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIF9vcHRpb25zLmhlaWdodCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmhlaWdodCA9IE1hdGguZmxvb3Iob3B0aW9ucy53aWR0aCAqIF9kZWZhdWx0T3B0aW9ucy5oZWlnaHQgLyBfZGVmYXVsdE9wdGlvbnMud2lkdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmFsaWduID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc3dpdGNoKG9wdGlvbnMuYWxpZ24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBfb3B0aW9ucy5sZWZ0ICE9PSAndW5kZWZpbmVkJyAmJiBvcHRpb25zLmxlZnQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2FudmFzTGF5ZXJbJHt0aGlzLmdldElkKCl9XS5kcmF3SW1hZ2UoKSA6IGFsaWduOiAnbGVmdCcgaXMgb3ZlcnJpZGluZyBsZWZ0OiR7X29wdGlvbnMubGVmdH1gKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubGVmdCA9IDA7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFsaWduQ2VudGVyID0gdGhpcy53aWR0aCAvIDIgLSBvcHRpb25zLndpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBfb3B0aW9ucy5sZWZ0ICE9PSAndW5kZWZpbmVkJyAmJiBvcHRpb25zLmxlZnQgIT09IGFsaWduQ2VudGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbnZhc0xheWVyWyR7dGhpcy5nZXRJZCgpfV0uZHJhd0ltYWdlKCkgOiBhbGlnbjogJ2NlbnRlcicgaXMgb3ZlcnJpZGluZyBsZWZ0OiR7X29wdGlvbnMubGVmdH1gKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubGVmdCA9IGFsaWduQ2VudGVyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbGlnblJpZ2h0ID0gdGhpcy53aWR0aCAtIG9wdGlvbnMud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgX29wdGlvbnMubGVmdCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0aW9ucy5sZWZ0ICE9PSBhbGlnblJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbnZhc0xheWVyWyR7dGhpcy5nZXRJZCgpfV0uZHJhd0ltYWdlKCkgOiBhbGlnbjogJ3JpZ2h0JyBpcyBvdmVycmlkaW5nIGxlZnQ6JHtfb3B0aW9ucy5sZWZ0fWApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sZWZ0ID0gYWxpZ25SaWdodDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDYW52YXNMYXllWyR7dGhpcy5nZXRJZCgpfV0uZHJhd0ltYWdlKCk6IEluY29ycmVjdCB2YWx1ZSBhbGlnbjonJHtvcHRpb25zLmFsaWdufSdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy52QWxpZ24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzd2l0Y2gob3B0aW9ucy52QWxpZ24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd0b3AnOlxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIF9vcHRpb25zLnRvcCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0aW9ucy50b3AgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2FudmFzTGF5ZXJbJHt0aGlzLmdldElkKCl9XS5kcmF3SW1hZ2UoKSA6IHZBbGlnbjogJ3RvcCcgaXMgb3ZlcnJpZGluZyB0b3A6JHtfb3B0aW9ucy50b3B9YClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnRvcCA9IDA7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbWlkZGxlJzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFsaWduTWlkZGxlID0gdGhpcy5oZWlnaHQgLyAyIC0gb3B0aW9ucy5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIF9vcHRpb25zLnRvcCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0aW9ucy50b3AgIT09IGFsaWduTWlkZGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbnZhc0xheWVyWyR7dGhpcy5nZXRJZCgpfV0uZHJhd0ltYWdlKCkgOiB2QWxpZ246ICdtaWRkbGUnIGlzIG92ZXJyaWRpbmcgdG9wOiR7X29wdGlvbnMudG9wfWApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy50b3AgPSBhbGlnbk1pZGRsZTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgICAgICAgICAgICB2YXIgYWxpZ25Cb3R0b20gPSB0aGlzLmhlaWdodCAtIG9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIF9vcHRpb25zLnRvcCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0aW9ucy50b3AgIT09IGFsaWduQm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbnZhc0xheWVyWyR7dGhpcy5nZXRJZCgpfV0uZHJhd0ltYWdlKCkgOiB2QWxpZ246ICdib3R0b20nIGlzIG92ZXJyaWRpbmcgdG9wOiR7X29wdGlvbnMudG9wfWApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy50b3AgPSBhbGlnbkJvdHRvbTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDYW52YXNMYXllclske3RoaXMuZ2V0SWQoKX1dLmRyYXdJbWFnZSgpOiBJbmNvcnJlY3QgdmFsdWUgdkFsaWduOicke29wdGlvbnMudkFsaWdufSdgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vY29uc29sZS5sb2codGhpcy5nZXRJZCgpLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG59XG5cbmV4cG9ydCB7IENhbnZhc0xheWVyLCBJQ2FudmFzTGF5ZXJPcHRpb25zIH07IiwiY2xhc3MgRWFzaW5nIHtcclxuXHJcbiAgICBzdGF0aWMgZWFzZUxpbmVhciAodDogbnVtYmVyLCBiOiBudW1iZXIsIGM6IG51bWJlciwgZDogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGMgKiB0IC8gZCArIGI7XHJcbiAgICB9XHJcblxyXG5cdHN0YXRpYyBlYXNlT3V0UXVhZCAodDogbnVtYmVyLCBiOiBudW1iZXIsIGM6IG51bWJlciwgZDogbnVtYmVyKSB7XHJcblx0XHRyZXR1cm4gLWMgKiAodCAvPSBkKSAqICh0IC0gMikgKyBiO1xyXG5cdH1cclxuXHJcbiAgICBzdGF0aWMgZWFzZU91dFNpbmUgKHQ6IG51bWJlciwgYjogbnVtYmVyLCBjOiBudW1iZXIsIGQ6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiBjICogTWF0aC5zaW4odCAvIGQgKiAoTWF0aC5QSSAvIDIpKSArIGI7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGVhc2VJblNpbmUgKHQ6IG51bWJlciwgYjogbnVtYmVyLCBjOiBudW1iZXIsIGQ6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiAtYyAqIE1hdGguY29zKHQgLyBkICogKE1hdGguUEkgLyAyKSkgKyBjICsgYjtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHsgRWFzaW5nIH07IiwiaW1wb3J0IHsgQ2FudmFzTGF5ZXIsIElDYW52YXNMYXllck9wdGlvbnMgfSBmcm9tICcuL0NhbnZhc0xheWVyJztcbmltcG9ydCB7IElCYXNlTGF5ZXJPcHRpb25zLCBMYXllclR5cGUgfSBmcm9tICcuL0Jhc2VMYXllcic7XG5pbXBvcnQgeyBJUmVuZGVyZXIsIElSZW5kZXJlckRpY3Rpb25hcnkgfSBmcm9tICcuL3JlbmRlcmVycy9JUmVuZGVyZXInO1xuXG5pbnRlcmZhY2UgSUltYWdlTGF5ZXJPcHRpb25zIGV4dGVuZHMgSUNhbnZhc0xheWVyT3B0aW9ucyB7XG4gICAgaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnRcbn1cblxuLy8gVE9ETzogQ29uc2lkZXIgbWVyZ2luZyB3aXRoIENhbnZhc0xheWVyXG5jbGFzcyBJbWFnZUxheWVyIGV4dGVuZHMgQ2FudmFzTGF5ZXIge1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgIHdpZHRoOiBudW1iZXIsXG4gICAgICAgIGhlaWdodDogbnVtYmVyLFxuICAgICAgICBvcHRpb25zOiBJSW1hZ2VMYXllck9wdGlvbnMsXG4gICAgICAgIHJlbmRlcmVycz86IElSZW5kZXJlckRpY3Rpb25hcnksXG4gICAgICAgIGxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG4gICAgICAgIHVwZGF0ZWRMaXN0ZW5lcj86IEZ1bmN0aW9uXG4gICAgKSB7XG5cbiAgICAgICAgc3VwZXIoaWQsIHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMsIHJlbmRlcmVycywgbG9hZGVkTGlzdGVuZXIsIHVwZGF0ZWRMaXN0ZW5lcik7XG4gICAgICAgIFxuXG4gICAgICAgIHRoaXMuX3NldFR5cGUoTGF5ZXJUeXBlLkltYWdlKTtcblxuICAgICAgICB0aGlzLmRyYXdJbWFnZShcbiAgICAgICAgICAgIG9wdGlvbnMuaW1hZ2UsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBJbWFnZUxheWVyLCBJSW1hZ2VMYXllck9wdGlvbnMgfTsiLCJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi9CdWZmZXJcIjtcclxuXHJcbmludGVyZmFjZSBJU3ByaXRlQW5pbWF0aW9uIHtcclxuICAgIGlkOiBzdHJpbmcsXHJcbiAgICB3aWR0aDogbnVtYmVyLFxyXG4gICAgaGVpZ2h0OiBudW1iZXIsXHJcbiAgICBuYkZyYW1lcyA6IG51bWJlcixcclxuICAgIHhPZmZzZXQgOiBudW1iZXIsXHJcbiAgICB5T2Zmc2V0IDogbnVtYmVyLFxyXG4gICAgZHVyYXRpb24gOiBudW1iZXJcclxufVxyXG5cclxuXHJcbmNsYXNzIFNwcml0ZSB7XHJcbiAgICBwcml2YXRlIF9pZDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBfYnVmZmVyOiBCdWZmZXI7XHJcbiAgICBwcml2YXRlIF9zcHJpdGVTaGVldDogSFRNTEltYWdlRWxlbWVudDtcclxuICAgIHByaXZhdGUgX2FuaW1hdGlvbnM6IElTcHJpdGVBbmltYXRpb25bXTtcclxuICAgIHByaXZhdGUgX2FuaW1hdGlvbjogPz8/PztcclxuICAgIHByaXZhdGUgX2lzQW5pbWF0aW5nOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfc3ByaXRlU2hlZXRMb2FkZWQ6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9sb29wOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9xdWV1ZTogSVNwcml0ZUFuaW1hdGlvbltdO1xyXG4gICAgcHJpdmF0ZSBfbG9vcFNlcXVlbmNlOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfaEZyYW1lT2Zmc2V0OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF92RnJhbWVPZmZzZXQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX21heEhlaWdodDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfbWF4V2lkdGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2VuZE9mUXVldWVMaXN0ZW5lcj86IEZ1bmN0aW9uO1xyXG4gICAgcHJpdmF0ZSBfZnJhbWVEdXJhdGlvbjogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZnJhbWVJbmRleDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfc3RhcnRUaW1lPzogbnVtYmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3ByaXRlU2hlZXRTcmMgUGF0aCB0byB0aGUgc3ByaXRlc2hlZXQgZmlsZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhGcmFtZU9mZnNldCBEaXN0YW5jZSBiZXR3ZWVuIGVhY2ggZnJhbWUgKGhvcml6b250YWx5KVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHZGcmFtZU9mZnNldCBEaXN0YW5jZSBiZXR3ZWVuIGVhY2ggZnJhbWUgKHZlcnRpY2FsbHkpKVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihpZDogc3RyaW5nLCBoRnJhbWVPZmZzZXQ6IG51bWJlciwgdkZyYW1lT2Zmc2V0OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9pZCA9IGlkO1xyXG4gICAgICAgIHRoaXMuX3Nwcml0ZVNoZWV0ID0gbmV3IEltYWdlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IG5ldyBCdWZmZXIoMCAsMCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2FuaW1hdGlvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLl9hbmltYXRpb24gPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2lzQW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fc3ByaXRlU2hlZXRMb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9sb29wID0gMTtcclxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2xvb3BTZXF1ZW5jZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX21heEhlaWdodCA9IDA7XHJcbiAgICAgICAgdGhpcy5fbWF4V2lkdGggPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lSW5kZXggPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lRHVyYXRpb24gPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9oRnJhbWVPZmZzZXQgPSBoRnJhbWVPZmZzZXQ7XHJcbiAgICAgICAgdGhpcy5fdkZyYW1lT2Zmc2V0ID0gdkZyYW1lT2Zmc2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWRTcHJpdGVzaGVldChzcmM6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgdGhhdC5fc3ByaXRlU2hlZXQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fc3ByaXRlU2hlZXRMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhhdC5fc3ByaXRlU2hlZXQuc3JjID0gc3JjO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgTmFtZSBvZiB0aGUgYW5pbWF0aW9uICh1c2VkIHRvIHJ1bi9zdG9wIGl0KVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG5iRnJhbWVzIE51bWJlciBvZiBmcmFtZXMgaW4gdGhpcyBhbmltYXRpb25cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCBOdW1iZXIgb2YgaG9yaXpvbnRhbCBwaXhlbHMgb2YgZWFjaCBmcmFtZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCBOdW1iZXIgb2YgdmVydGljYWwgcGl4ZWxzIG9mIGVhY2ggZnJhbWVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4T2Zmc2V0IE9mZnNldCBmcm9tIHRoZSBsZWZ0IHNpZGUgb2YgdGhlIHNwcml0ZXNoZWV0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gWW9mZnNldCBPZmZzZXQgZnJvbSB0aGUgdG9wIG9mIHRoZSBzcHJpdGVzaGVldFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIGR1cmF0aW9uIG9mIGFuaW1hdGlvbiAobXMpXHJcbiAgICAgKi9cclxuICAgIGFkZEFuaW1hdGlvbihcclxuICAgICAgICBpZDogc3RyaW5nLFxyXG4gICAgICAgIG5iRnJhbWVzOiBudW1iZXIsXHJcbiAgICAgICAgd2lkdGg6IG51bWJlcixcclxuICAgICAgICBoZWlnaHQ6IG51bWJlcixcclxuICAgICAgICB4T2Zmc2V0OiBudW1iZXIsXHJcbiAgICAgICAgWW9mZnNldDogbnVtYmVyLFxyXG4gICAgICAgIGR1cmF0aW9uOiBudW1iZXJcclxuICAgICkge1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2FuaW1hdGlvbnNbaWRdID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB0aGlzLl9hbmltYXRpb25zW2lkXSA9IHtcclxuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgbmJGcmFtZXMgOiBuYkZyYW1lcyxcclxuICAgICAgICAgICAgICAgIHhPZmZzZXQgOiB4T2Zmc2V0LFxyXG4gICAgICAgICAgICAgICAgeU9mZnNldCA6IFlvZmZzZXQsXHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA6IGR1cmF0aW9uXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9tYXhIZWlnaHQgPSBNYXRoLm1heCh0aGlzLl9tYXhIZWlnaHQsIGhlaWdodCk7XHJcbiAgICAgICAgICAgIHRoaXMuX21heFdpZHRoID0gTWF0aC5tYXgodGhpcy5fbWF4V2lkdGgsIHdpZHRoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFuaW1hdGlvbiBbJHtpZH0gYWxyZWFkeSBleGlzdHMgaW4gc3ByaXRlIFske3RoaXMuX2lkfV1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWluIHJlbmRlciByb3V0aW5lXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX2RvQW5pbWF0aW9uKHQ6IG51bWJlcikge1xyXG4gICAgICAgIHZhciBub3cgPSB0O1xyXG4gICAgICAgIHZhciBwcmV2aW91c0ZyYW1lSW5kZXggPSB0aGlzLl9mcmFtZUluZGV4O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhcnRUaW1lID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IG5vdztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkZWx0YSA9IG5vdyAtIHRoaXMuX3N0YXJ0VGltZTtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIGZyYW1lIG51bWJlciBnaXZlbiBkZWx0YSBhbmQgZHVyYXRpb25cclxuICAgICAgICB0aGlzLl9mcmFtZUluZGV4ID0gTWF0aC5mbG9vcihkZWx0YSAvIHRoaXMuX2ZyYW1lRHVyYXRpb24pO1xyXG5cclxuICAgICAgICAvLyBJZiBsb29wIGlzIFxyXG4gICAgICAgIGlmICh0aGlzLl9mcmFtZUluZGV4ID49IHRoaXMuX2FuaW1hdGlvbi5wYXJhbXMubmJGcmFtZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5fbG9vcCsrO1xyXG5cclxuICAgICAgICAgICAgLy8gRW5kIG9mIGxvb3AgdGhlbiBwcm9jZXNzIHF1ZXVlIHRvIHN0YXJ0IG5leHQgYW5pbWF0aW9uIGluIGxpbmVcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2FuaW1hdGlvbi5sb29wID4gMCAmJiB0aGlzLl9sb29wID4gdGhpcy5fYW5pbWF0aW9uLmxvb3ApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NRdWV1ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTdGFydCBhbmltYXRpb24gYmFjayB0byBmaXJzdCBmcmFtZVxyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZUluZGV4ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyBPbmx5IHJlZHJhdyBidWZmZXIgaXMgZnJhbWUgaXMgZGlmZmVyZW50XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZyYW1lSW5kZXggIT09IHByZXZpb3VzRnJhbWVJbmRleCkge1xyXG4gICAgICAgICAgICBsZXQgeE9mZnNldCA9IHRoaXMuX2ZyYW1lSW5kZXggKiAodGhpcy5fYW5pbWF0aW9uLnBhcmFtcy53aWR0aCArIHRoaXMuX2ZyYW1lT2Zmc2V0KSArIHRoaXMuX2FuaW1hdGlvbi5wYXJhbXMueE9mZnNldDtcclxuICAgICAgICAgICAgLy8gU2hpZnQgdmVydGljYWwgcG9zaXRpb24gc28gdGhhdCBzcHJpdGVzIGFyZSBhbGlnbmVkIGF0IHRoZSBib3R0b21cclxuICAgICAgICAgICAgbGV0IHlQb3MgPSB0aGlzLl9tYXhIZWlnaHQgLSB0aGlzLl9hbmltYXRpb24ucGFyYW1zLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYCR7dGhpcy5fZnJhbWVJbmRleH0gLyAke3hPZmZzZXR9IC8gJHt5UG9zfWApO1xyXG4gICBcclxuICAgICAgICAgICAgdGhpcy5fYnVmZmVyLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2J1ZmZlci5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLl9zcHJpdGVTaGVldCwgIHhPZmZzZXQsICB0aGlzLl9hbmltYXRpb24ucGFyYW1zLnlPZmZzZXQsIHRoaXMuX2FuaW1hdGlvbi5wYXJhbXMud2lkdGgsIHRoaXMuX2FuaW1hdGlvbi5wYXJhbXMuaGVpZ2h0LCAwLCB5UG9zLCB0aGlzLl9hbmltYXRpb24ucGFyYW1zLndpZHRoLCB0aGlzLl9hbmltYXRpb24ucGFyYW1zLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fZG9BbmltYXRpb24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQb3AgYW5pbWF0aW9uIGZyb20gdGhlIHF1ZXVlIGFuZCBwbGF5IGl0XHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX3Byb2Nlc3NRdWV1ZSgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9sb29wU2VxdWVuY2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FuaW1hdGlvbiA9IHRoaXMuX3F1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHV0IHRoaXMgYW5pbWF0aW9uIHRvIHRoZSBib3R0b20gb2YgdGhlIHF1ZXVlIGlzIG5lZWRlZFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnB1c2godGhpcy5fYW5pbWF0aW9uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2hlcmUnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hbmltYXRpb24gPSB0aGlzLl9xdWV1ZVswXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hbmltYXRpb24gPSB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5fZnJhbWVJbmRleCA9IHRoaXMuX2FuaW1hdGlvbi5wYXJhbXMubmJGcmFtZXM7IC8vIFRvIGZvcmNlIHJlbmRlcmluZyBvZiBmcmFtZSAwXHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lRHVyYXRpb24gPSB0aGlzLl9hbmltYXRpb24ucGFyYW1zLmR1cmF0aW9uIC8gdGhpcy5fYW5pbWF0aW9uLnBhcmFtcy5uYkZyYW1lcztcclxuICAgICAgICAgICAgdGhpcy5faXNBbmltYXRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLl9sb29wID0gMTtcclxuXHJcblxyXG4gICAgICAgICAgICAvLyBSZXNpemluZyB3aWxsIGNsZWFyIGJ1ZmZlciBzbyBkbyBpdCBvbmx5IGlmIG5lZWRlZFxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYnVmZmVyLndpZHRoICE9PSB0aGlzLl9hbmltYXRpb24ucGFyYW1zLndpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXIud2lkdGggPSB0aGlzLl9hbmltYXRpb24ucGFyYW1zLndpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXNpemluZyB3aWxsIGNsZWFyIGJ1ZmZlciBzbyBkbyBpdCBvbmx5IGlmIG5lZWRlZFxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYnVmZmVyLmhlaWdodCAhPT0gdGhpcy5fbWF4SGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXIuaGVpZ2h0ID0gIHRoaXMuX21heEhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX2RvQW5pbWF0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2lzQW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5fZW5kT2ZRdWV1ZUxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9lbmRPZlF1ZXVlTGlzdGVuZXIodGhpcy5faWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBsYXkgYSBzaW5nbGUgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gQW5pbWF0aW9uIGlkXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbmJMb29wIFxyXG4gICAgICovXHJcbiAgICBlbnF1ZXVlU2luZ2xlKGlkOiBzdHJpbmcsIG5iTG9vcDogbnVtYmVyKSB7XHJcblxyXG4gICAgICAgIC8vIEV4aXQgaWYgc291cmNlIGltYWdlIGlzIG5vdCBsb2FkZWRcclxuICAgICAgICBpZiAoIXRoaXMuX3Nwcml0ZVNoZWV0TG9hZGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xyXG4gICAgICAgICAgICBwYXJhbXMgOiB0aGlzLl9hbmltYXRpb25zW2lkXSxcclxuICAgICAgICAgICAgbG9vcCA6ICh0eXBlb2YgbmJMb29wID09PSAnbnVtYmVyJykgPyBuYkxvb3AgOiAwXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHthcnJheX0gQW4gYXJyYXkgb2YgaWRzIGFuZCBudW1iZXIgb2YgbG9vcCBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvdWxkIHRoZSBzZXF1ZW5jZSBsb29wIGluZGVmaW5pdGVseVxyXG4gICAgICovXHJcbiAgICBlbnF1ZXVlU2VxdWVuY2Uoc2VxOiBbXSwgbG9vcD86IGJvb2xlYW4pIHtcclxuXHJcbiAgICAgIFxyXG4gICAgICAgIC8vIEJ1aWxkIGFycmF5IG9mIGFuaW1hdGlvblxyXG4gICAgICAgIC8vIGFycmF5WzBdID0gYW5pbWF0aW9uIGlkXHJcbiAgICAgICAgLy8gYXJyYXlbMV0gPSBudW1iZXIgb2YgbG9vcFxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IHNlcS5sZW5ndGggOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5fcXVldWUucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwYXJhbXMgOiB0aGlzLl9hbmltYXRpb25zW3NlcVtpXVswXV0sXHJcbiAgICAgICAgICAgICAgICBsb29wIDogTWF0aC5tYXgoMSwgc2VxW2ldWzFdKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEJvb2xlYW5cclxuICAgICAgICB0aGlzLl9sb29wU2VxdWVuY2UgPSAhIWxvb3A7XHJcblxyXG4gICAgICAgIC8vIFN0YXJ0IGFuaW1hdGlvblxyXG4gICAgICAgIC8vdGhpcy5fcHJvY2Vzc1F1ZXVlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIHRoaXMuX3Byb2Nlc3NRdWV1ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RvcCBjdXJyZW50IGFuaW1hdGlvblxyXG4gICAgICogVE9ET1xyXG4gICAgICovXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIHRoaXMuX2lzQW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fbG9vcFNlcXVlbmNlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBjdXJyZW50IGltYWdlXHJcbiAgICAgKi9cclxuICAgIGdldCBkYXRhKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9idWZmZXIuY2FudmFzO1xyXG5cdH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBvdXRwdXQgYnVmZmVyIGNvbnRleHRcclxuICAgICAqL1xyXG4gICAgZ2V0IGNvbnRleHQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J1ZmZlci5jb250ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHNwcml0ZSB3aWR0aFxyXG4gICAgICovXHJcbiAgICBnZXQgd2lkdGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21heFdpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHNwcml0ZSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgZ2V0IGhlaWdodCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWF4SGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSXMgdGhlIHNwcml0ZSBjdXJyZW50bHkgYW5pbWF0aW5nID9cclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW5cclxuICAgICAqL1xyXG4gICAgaXNBbmltYXRpbmcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQW5pbWF0aW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSBFbmQgb2YgcXVldWUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGNhbGxlZCB3aGVuIGN1cnJlbnQgcXVldWUgaXMgZW1wdHlcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFxyXG4gICAgICovXHJcbiAgICBzZXRFbmRPZlF1ZXVlTGlzdGVuZXIobGlzdGVuZXI6IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fZW5kT2ZRdWV1ZUxpc3RlbmVyID0gbGlzdGVuZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbG9uZSB0aGlzIHNwcml0ZSBhbmQgcmV0dXJuIGl0XHJcbiAgICAgKiBAcmV0dXJucyBTcHJpdGVcclxuICAgICAqL1xyXG4gICAgLypjbG9uZSgpOiBQcm9taXNlPFNwcml0ZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuXHJcbiAgICAgICAgICAgbmV3IFNwcml0ZSh0aGlzLl9zcHJpdGVTaGVldC5zcmMsIHRoaXMuX2ZyYW1lT2Zmc2V0KS50aGVuKCBzID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9hbmltYXRpb25zKS5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGlkKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMuX2FuaW1hdGlvbnNbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcy5hZGRBbmltYXRpb24oaWQsIGEubmJGcmFtZXMsIGEud2lkdGgsIGEuaGVpZ2h0LCBhLnhPZmZzZXQsIGEueU9mZnNldCwgYS5kdXJhdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9Ki9cclxufVxyXG5cclxuZXhwb3J0IHsgU3ByaXRlIH07IiwiaW1wb3J0IHsgQmFzZUxheWVyLCBMYXllclR5cGUsIElCYXNlTGF5ZXJPcHRpb25zIH0gZnJvbSBcIi4vQmFzZUxheWVyXCI7XHJcbmltcG9ydCB7IElSZW5kZXJlciwgSVJlbmRlcmVyRGljdGlvbmFyeSB9IGZyb20gXCIuL3JlbmRlcmVycy9JUmVuZGVyZXJcIjtcclxuaW1wb3J0IHsgU3ByaXRlIH0gZnJvbSBcIi4vU3ByaXRlXCI7XHJcblxyXG5pbnRlcmZhY2UgSVNwcml0ZXNMYXllck9wdGlvbnMgZXh0ZW5kcyBJQmFzZUxheWVyT3B0aW9ucyB7XHJcblxyXG59XHJcblxyXG5cclxuY2xhc3MgU3ByaXRlc0xheWVyIGV4dGVuZHMgQmFzZUxheWVyIHtcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBfc3ByaXRlczogU3ByaXRlW107XHJcbiAgICBwcml2YXRlIF9ydW5uaW5nU3ByaXRlczogbnVtYmVyO1xyXG4gICAgXHJcblx0Y29uc3RydWN0b3IoXHJcbiAgICAgICAgaWQ6IHN0cmluZyxcclxuICAgICAgICB3aWR0aDogbnVtYmVyLFxyXG4gICAgICAgIGhlaWdodDogbnVtYmVyLFxyXG4gICAgICAgIF9vcHRpb25zOiBJU3ByaXRlc0xheWVyT3B0aW9ucyxcclxuICAgICAgICByZW5kZXJlcnM/OiBJUmVuZGVyZXJEaWN0aW9uYXJ5LFxyXG4gICAgICAgIGxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXHJcbiAgICAgICAgdXBkYXRlZExpc3RlbmVyPzogRnVuY3Rpb25cclxuICAgICkge1xyXG5cdFx0XHJcbiAgICAgICAgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBsb29wIDogZmFsc2UsXHJcbiAgICAgICAgICAgIGF1dG9wbGF5IDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbWVUeXBlIDogJ3ZpZGVvL3dlYm0nXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3VwZXIoaWQsIHdpZHRoLCBoZWlnaHQsIE9iamVjdC5hc3NpZ24oZGVmYXVsdE9wdGlvbnMsIF9vcHRpb25zKSwgcmVuZGVyZXJzLCBsb2FkZWRMaXN0ZW5lciwgdXBkYXRlZExpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2V0VHlwZShMYXllclR5cGUuU3ByaXRlcyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Nwcml0ZXMgPSBbXTtcclxuICAgICAgICB0aGlzLl9ydW5uaW5nU3ByaXRlcyA9IDA7XHJcbiAgICAgICAgdGhpcy5fcmVuZGVyTmV4dEZyYW1lID0gZnVuY3Rpb24oKXt9O1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KHRoaXMuX2xheWVyTG9hZGVkLmJpbmQodGhpcyksIDEpO1xyXG5cdH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlciBmcmFtZSB3aXRoIGFsbCBzcHJpdGVzIGRhdGFcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfcmVuZGVyRnJhbWUoKSB7XHJcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbnRlbnRCdWZmZXIuY2xlYXIoKTtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9zcHJpdGVzKS5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Nwcml0ZXNbaWRdLnZpc2libGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRCdWZmZXIuY29udGV4dC5kcmF3SW1hZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc3ByaXRlc1tpZF0uc3ByaXRlLmRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc3ByaXRlc1tpZF0ueCxcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zcHJpdGVzW2lkXS55XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3JlbmRlck5leHRGcmFtZSgpOyAvLyBpZiBuZWVkZWRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlcXVlc3QgcmVuZGVyaW5nIG9mIG5leHQgZnJhbWVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfcmVxdWVzdFJlbmRlck5leHRGcmFtZSgpIHtcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyRnJhbWUuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBzcHJpdGUgYW5kIGFkZCBpdCB0byB0aGUgbGF5ZXJcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzcmMgXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaEZyYW1lT2Zmc2V0ICAoaG9yaXpvbnRhbCBkaXN0YW5jZSBiZXR3ZWVuIGZyYW1lcylcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2RnJhbWVPZmZzZXQgICh2ZXJ0aWNhbCBkaXN0YW5jZSBiZXR3ZWVuIGZyYW1lcylcclxuICAgICAqIEBwYXJhbSB7YXJyYXk8c3RyaW5nPn0gYW5pbWF0aW9ucyBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IChob3Jpem9udGFsIHBvc2l0aW9uIG9uIGxheWVyKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkgKHZlcnRpY2FsIHBvc2l0aW9uIG9uIGxheWVyKVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVTcHJpdGUoXHJcbiAgICAgICAgaWQ6IHN0cmluZyxcclxuICAgICAgICBzcmM6IHN0cmluZyxcclxuICAgICAgICBoRnJhbWVPZmZzZXQ6IG51bWJlcixcclxuICAgICAgICB2RnJhbWVPZmZzZXQ6IG51bWJlcixcclxuICAgICAgICBhbmltYXRpb25zLFxyXG4gICAgICAgIHg6IHN0cmluZyxcclxuICAgICAgICB5OiBzdHJpbmdcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuX3Nwcml0ZXNbaWRdID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwcml0ZSA9IG5ldyBTcHJpdGUoaWQsIGhGcmFtZU9mZnNldCwgdkZyYW1lT2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBzcHJpdGUubG9hZFNwcml0ZXNoZWV0KHNyYykudGhlbigoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGkgPSAwIDsgaSA8IGFuaW1hdGlvbnMubGVuZ3RoIDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuYWRkQW5pbWF0aW9uKC4uLmFuaW1hdGlvbnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmFkZFNwcml0ZShpZCwgc3ByaXRlLCB4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGBObyBhbmltYXRpb25zIHByb3ZpZGVkIGZvciBzcHJpdGUgJHtpZH1gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChgU3ByaXRlIFske2lkfV0gYWxyZWFkeSBleGlzdHNgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIGFuIGV4aXN0aW5nIFNwcml0ZSBvYmplY3QgdG8gdGhlIGxheWVyIGFkIHgseSBwb3NpdGlvblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxyXG4gICAgICogQHBhcmFtIHtTcHJpdGV9IHNwcml0ZSBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBfeCBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBfeVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSB2XHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiBzcHJpdGUgd2FzIGFzc2VkIGZhbHNlIG90aGVyd2lzZVxyXG4gICAgICovXHJcbiAgICBhZGRTcHJpdGUoaWQ6IHN0cmluZywgc3ByaXRlOiBTcHJpdGUsIF94OiBzdHJpbmcsIF95OiBzdHJpbmcsIHY/OiBib29sZWFuKSB7XHJcbiAgICAgICAgdmFyIGlzVmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc3ByaXRlID09PSAnb2JqZWN0JyAmJiBzcHJpdGUuY29uc3RydWN0b3IgIT09IFNwcml0ZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUHJvdmlkZWQgc3ByaXRlIGlzIG5vdCBhIFNwcml0ZSBvYmplY3RcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fc3ByaXRlc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FscmVhZHkgZXhpc3RzIDogJyArIGlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBpc1Zpc2libGUgPSAhIXY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgeCA9IF94IHx8IDA7XHJcbiAgICAgICAgdmFyIHkgPSBfeSB8fCAwO1xyXG5cclxuICAgICAgICBpZiAoX3guYXQoLTEpID09PSAnJScpIHtcclxuICAgICAgICAgICAgdmFyIHZ4ID0gcGFyc2VGbG9hdChfeC5yZXBsYWNlKCclJywnJyksIDEwKTtcclxuICAgICAgICAgICAgeCA9IE1hdGguZmxvb3IoKHZ4ICogdGhpcy53aWR0aCkgLyAxMDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHggPSBwYXJzZUludChfeCwgMTApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF95LmF0KC0xKSA9PT0gJyUnKSB7XHJcbiAgICAgICAgICAgIHZhciB2eSA9IHBhcnNlRmxvYXQoX3kucmVwbGFjZSgnJScsJycpLCAxMCk7XHJcbiAgICAgICAgICAgIHkgPSBNYXRoLmZsb29yKCh2eSAqIHRoaXMuaGVpZ2h0KSAvIDEwMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeSA9IHBhcnNlSW50KF95LCAxMCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5fc3ByaXRlc1tpZF0gPSB7XHJcbiAgICAgICAgICAgIHggOiB4LFxyXG4gICAgICAgICAgICB5IDogeSxcclxuICAgICAgICAgICAgc3ByaXRlIDogc3ByaXRlLFxyXG4gICAgICAgICAgICB2aXNpYmxlIDogaXNWaXNpYmxlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gc2V0IHNwcml0ZSBsaXN0ZW5lciB0byB0aGlzIGxheWVyXHJcbiAgICAgICAgc3ByaXRlLnNldEVuZE9mUXVldWVMaXN0ZW5lcih0aGlzLl9vblF1ZXVlRW5kZWQuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2xheWVyVXBkYXRlZCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuZCBvZiBxdWVzdCBsaXN0ZW5lclxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIDogc3ByaXRlIHF1ZXVlIHdoaWNoIGVuZGVkXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX29uUXVldWVFbmRlZChpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5fcnVubmluZ1Nwcml0ZXMtLTtcclxuXHJcbiAgICAgICAgLy8gSWYgbm90IG1vcmUgc3ByaXRlIGlzIHJ1bm5pbmcgdGhlbiBubyBuZWVkIHRvIGtlZXAgcmVuZGVyaW5nIG5ldyBmcmFtZXNcclxuICAgICAgICBpZiAodGhpcy5fcnVubmluZ1Nwcml0ZXMgPD0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nU3ByaXRlcyA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCl7fTtcclxuICAgICAgICAgICAgdGhpcy5fc3RvcFJlbmRlcmluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKmdldFNwcml0ZShpZCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fc3ByaXRlc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zcHJpdGVzW2lkXS5zcHJpdGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBzcHJpdGUgbmFtZWQgOiAke2lkfSBmb3VuZCBpbiBsYXllciBbI3t0aGlzLl9pZH1dYCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc3ByaXRlIHBvc2l0aW9uIHRvIHgseVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHggXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30geSBcclxuICAgICAqL1xyXG4gICAgbW92ZVNwcml0ZShpZDogc3RyaW5nLCB4OiBTdHJpbmcsIHk6IFN0cmluZykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fc3ByaXRlc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3Nwcml0ZXNbaWRdLnggPSB4O1xyXG4gICAgICAgICAgICB0aGlzLl9zcHJpdGVzW2lkXS54ID0geTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBMYXllclske3RoaXMuZ2V0SWQoKX1dIDogc3ByaXRlIFske2lkfV0gZG9lcyBub3QgZXhpc3RgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGFuZ2Ugc3ByaXRlIHZpc2liaWxpdHlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdiBcclxuICAgICAqL1xyXG4gICAgc2V0U3ByaXRlVmlzaWJpbGl0eShpZDpzdHJpbmcsIHY6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX3Nwcml0ZXNbaWRdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB0aGlzLl9zcHJpdGVzW2lkXS52aXNpYmxlID0gdjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBMYXllclske3RoaXMuZ2V0SWQoKX1dIDogc3ByaXRlIFske2lkfV0gZG9lcyBub3QgZXhpc3RgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogUnVuIHNwcml0ZSBjdXJyZW50IGFuaW1hdGlvblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxyXG4gICAgICovXHJcbiAgICBydW4oaWQ6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fc3ByaXRlc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9zdGFydFJlbmRlcmluZygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9zcHJpdGVzW2lkXS5zcHJpdGUuaXNBbmltYXRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ1Nwcml0ZXMrKztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Nwcml0ZXNbaWRdLnNwcml0ZS5ydW4oKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcnVubmluZ1Nwcml0ZXMgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJOZXh0RnJhbWUgPSB0aGlzLl9yZXF1ZXN0UmVuZGVyTmV4dEZyYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RSZW5kZXJOZXh0RnJhbWUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYExheWVyWyR7dGhpcy5nZXRJZCgpfV0gOiBzcHJpdGUgWyR7aWR9XSBkb2VzIG5vdCBleGlzdGApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFN0b3Agc3ByaXRlIGN1cnJlbnQgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXHJcbiAgICAgKi9cclxuICAgIHN0b3AoaWQ6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fc3ByaXRlc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zcHJpdGVzW2lkXS5zcHJpdGUuaXNBbmltYXRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcnVubmluZ1Nwcml0ZXMtLTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Nwcml0ZXNbaWRdLnNwcml0ZS5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBMYXllclske3RoaXMuZ2V0SWQoKX1dIDogc3ByaXRlIFske2lkfV0gZG9lcyBub3QgZXhpc3RgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFN0b3AgcmVuZGVyaW5nIGlmIG5vIHNwcml0ZSBydW5uaW5nXHJcbiAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdTcHJpdGVzIDw9IDApIHtcclxuICAgICAgICAgICAgdGhpcy5fcnVubmluZ1Nwcml0ZXMgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJOZXh0RnJhbWUgPSBmdW5jdGlvbigpe307XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIHNlcXVlbmNlIG9mIGFuaW1hdGlvbnMgdG8gc3ByaXRlIHF1ZXVlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXHJcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBxdWV1ZSBcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbG9vcCBcclxuICAgICAqL1xyXG4gICAgZW5xdWV1ZVNlcXVlbmNlKGlkOiBzdHJpbmcsIHF1ZXVlOiBbXSwgbG9vcDogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fc3ByaXRlc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3Nwcml0ZXNbaWRdLnNwcml0ZS5lbnF1ZXVlU2VxdWVuY2UocXVldWUsIGxvb3ApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYExheWVyWyR7dGhpcy5nZXRJZCgpfV0gOiBzcHJpdGUgWyR7aWR9XSBkb2VzIG5vdCBleGlzdGApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBTcHJpdGVzTGF5ZXIsIElTcHJpdGVzTGF5ZXJPcHRpb25zIH07IiwiY2xhc3MgVXRpbHMge1xuXG5cdC8qKlxuXHQgKiBQcm9jZXNzIGFuIGFycmF5IG9mIFByb21pc2Vcblx0ICogVE9ETyA6IGhhbmRsZSBlcnJvcnNcblx0ICogQHBhcmFtIHtBcnJheX0gcHJvbWlzZXMgXG5cdCAqIEByZXR1cm5zIFxuXHQgKi9cblx0IC8qc3RhdGljIGNoYWluUHJvbWlzZXMocHJvbWlzZXM6IFByb21pc2U8YW55Pik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcblxuXHRcdFx0dmFyIHF1ZXVlID0gWy4uLnByb21pc2VzXTtcblxuXHRcdFx0dmFyIHByb2Nlc3NRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAocXVldWUubGVuZ3RoKSB7XG5cdFx0XHRcdFx0dmFyIHByb21pc2UgPSBxdWV1ZS5zaGlmdCgpO1xuXHRcdFx0XHRcdHByb21pc2UudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRwcm9jZXNzUXVldWUoKTtcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvLyBmaW5pc2hlZFx0XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIHN0YXJ0IHByb2Nlc3Ncblx0XHRcdHByb2Nlc3NRdWV1ZSgpO1xuXHRcdH0pO1xuXHR9Ki9cblxuXHQvKipcblx0ICogQWRkIGFscGhhIGNvbXBvbmVudCB0byBhIFJHQiBzdHJpbmdcblx0ICogQHBhcmFtIHtzdHJpbmd9IHN0ciBcblx0ICogQHBhcmFtIHtzdHJpbmd9IGFscGhhIFxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHQgKi9cblx0c3RhdGljIGhleFJHQlRvSGV4UkdCQShzdHI6IHN0cmluZywgYWxwaGE6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0aWYgKGFscGhhLm1hdGNoKC9bMC05YS1mXVswLTlhLWZdL2dpKSkge1xuXHRcdFx0cmV0dXJuIHN0ciArIGFscGhhO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiYWxwaGEgbXVzdCBiZSBhbiBoZXggc3RyaW5nIGJldHdlZW4gMDAgYW5kIEZGXCIpO1xuXHRcdH1cblx0fVxuXG5cdFx0LyoqXG5cdCAqIEFkZCBhbHBoYSBjb21wb25lbnQgdG8gYSBSR0Igc3RyaW5nXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBhbHBoYSBcblx0ICogQHJldHVybnMge3N0cmluZ31cblx0ICovXG5cdFx0c3RhdGljIGhleFJHQlRvSGV4UkdCQShzdHI6IHN0cmluZywgYWxwaGE6IG51bWJlcik6IHN0cmluZyB7XG5cdFx0XHRpZiAoYWxwaGEgPj0gMCAmJiBhbHBoYSA8PSAyNTUpIHtcblx0XHRcdFx0cmV0dXJuIHN0ciArIGFscGhhLnRvU3RyaW5nKDE2KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJhbHBoYSBtdXN0IGJlIGFuIGludCBiZXR3ZWVuIDAgYW5kIDI1NSBvciBhIGFuIGhleCBzdHJpbmcgYmV0d2VlbiAwMCBhbmQgRkZcIik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm4gaW50IHZhbHVlIG9mIGFuIGhleCBjb2xvclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gc3RyIFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IFxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfVxuXHQgKi9cblx0c3RhdGljIGhleENvbG9yVG9JbnQoc3RyOiBzdHJpbmcsIHByZWZpeD86IHN0cmluZyk6IG51bWJlciB7XG5cdFx0dmFyIHAgPSBwcmVmaXggfHwgXCJcIjtcblxuXHRcdHJldHVybiBwYXJzZUludChzdHIucmVwbGFjZSgvXiMvZ2ksIHApLCAxNik7XG5cdH1cblxuXHQvKipcblx0ICogUmV2ZXJ0IFJHQkEgY29tcG9uZW50c1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gcmdiYSBcblx0ICogQHJldHVybnMge3N0cmluZ30gYWJnciBzdHJpbmdcblx0ICovXG5cdHN0YXRpYyByZ2JhMmFiZ3IocmdiYTogc3RyaW5nKTogc3RyaW5nIHtcblx0XHR2YXIgYXJyID0gcmdiYS5tYXRjaCgvLnsyfS9nKTtcblxuXHRcdGlmIChhcnIgPT09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHJnYmEgc3RyaW5nXCIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhcnJbM10gKyBhcnJbMl0gKyBhcnJbMV0gKyBhcnJbMF07XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBhbiBoZXhhZGVjaW1hbCBzdHJpbmcgdG8gYW4gYXJyYXkgb2YgaGV4IGJ5dGVcblx0ICogQHBhcmFtIHtzdHJpbmd9IGhleCBcblx0ICogQHJldHVybnMge2FycmF5PHN0cmluZz59XG5cdCAqL1xuXHRzdGF0aWMgaGV4VG9BcnJheShoZXg6IHN0cmluZyk6IHN0cmluZ1tdIHtcblx0XHRyZXR1cm4gaGV4Lm1hdGNoKC8uezJ9L2cpIHx8IFtdO1xuXHR9XG59XG5cbmV4cG9ydCB7IFV0aWxzIH07IiwiaW1wb3J0IHsgQmFzZUxheWVyLCBJQmFzZUxheWVyT3B0aW9ucywgTGF5ZXJUeXBlIH0gZnJvbSBcIi4vQmFzZUxheWVyXCI7XG5pbXBvcnQgeyBJUmVuZGVyZXIsIElSZW5kZXJlckRpY3Rpb25hcnkgfSBmcm9tIFwiLi9yZW5kZXJlcnMvSVJlbmRlcmVyXCI7XG5cbmludGVyZmFjZSBJVmlkZW9MYXllck9wdGlvbnMgZXh0ZW5kcyBJQmFzZUxheWVyT3B0aW9ucyB7XG5cdHdpZHRoPzogbnVtYmVyLFxuXHRoZWlnaHQ/OiBudW1iZXJcblx0bG9vcD8gOiBib29sZWFuLFxuXHRhdXRvcGxheT8gOiBib29sZWFuLFxuXHRzcmM/OiBzdHJpbmdcbn1cblxuY2xhc3MgVmlkZW9MYXllciBleHRlbmRzIEJhc2VMYXllciB7XG5cblx0cHJpdmF0ZSBfdmlkZW86IEhUTUxWaWRlb0VsZW1lbnQ7XG5cdHByaXZhdGUgX2lzUGxheWluZzogYm9vbGVhbjtcblx0cHJpdmF0ZSBfb25QbGF5TGlzdGVuZXI/OiBGdW5jdGlvbjtcblx0cHJpdmF0ZSBfb25QYXVzZUxpc3RlbmVyPzogRnVuY3Rpb247XG5cblx0cHJvdGVjdGVkIF9vcHRpb25zOiBJVmlkZW9MYXllck9wdGlvbnM7XG5cblx0LyoqXG4gXHQgKiBDcmVhdGUgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgYSB2aWRlbyBlbGVtZW50IGFuZCBzb21lIHV0aWxpdHkgbWV0aG9kc1xuIFx0ICogQHBhcmFtIGlkIHtzdHJpbmd9IGlkIG9mIHRoZSBvYmplY3Rcblx0ICogQHBhcmFtIHdpZHRoIHtpbnRlZ2VyfSBUaGUgd2lkdGggb2YgdGhlIHZpZGVvXG4gXHQgKiBAcGFyYW0gaGVpZ2h0IHtpbnRlZ2VyfSBUaGUgaGVpZ2h0IG9mIHRoZSB2aWRlb1xuIFx0ICovXG5cdC8vY29uc3RydWN0b3IoaWQsIF9vcHRpb25zLCBfbGlzdGVuZXIsIF9vblBsYXlMaXN0ZW5lciwgX29uUGF1c2VMaXN0ZW5lcikge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRpZDogc3RyaW5nLFxuXHRcdHdpZHRoOiBudW1iZXIsXG5cdFx0aGVpZ2h0OiBudW1iZXIsXG5cdFx0b3B0aW9uczogSVZpZGVvTGF5ZXJPcHRpb25zLFxuXHRcdHJlbmRlcmVycz86IElSZW5kZXJlckRpY3Rpb25hcnksXG5cdFx0bG9hZGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHR1cGRhdGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRwbGF5TGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRwYXVzZUxpc3RlbmVyPzogRnVuY3Rpb25cblx0KSB7XG5cdFx0c3VwZXIoaWQsIHdpZHRoLCBoZWlnaHQsIHJlbmRlcmVycywgbG9hZGVkTGlzdGVuZXIsIHVwZGF0ZWRMaXN0ZW5lcik7XG5cblx0XHR0aGlzLl9vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLl9vcHRpb25zLCB7bG9vcCA6IGZhbHNlLCBhdXRvcGxheSA6IGZhbHNlfSwgb3B0aW9ucyk7XG5cblx0XHR0aGlzLl9vblBsYXlMaXN0ZW5lciA9IHBsYXlMaXN0ZW5lcjtcblx0XHR0aGlzLl9vblBhdXNlTGlzdGVuZXIgPSBwYXVzZUxpc3RlbmVyO1xuXG5cdFx0Ly8gQ3JlYXRlIGEgdmlkZW8gZWxlbWVudFxuXHRcdHRoaXMuX3ZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTsgLy8gY3JlYXRlIGEgdmlkZW8gZWxlbWVudCAobm90IGF0dGFjaGVkIHRvIHRoZSBkb21cblx0XHRcblx0XHQvLyBzZXQgdGhlIGRpbWVuc2lvbnNcblx0XHR0aGlzLl92aWRlby53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgd2lkdGg7XG5cdFx0dGhpcy5fdmlkZW8uaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgaGVpZ2h0O1xuXHRcdHRoaXMuX3ZpZGVvLmxvb3AgPSAhIW9wdGlvbnMubG9vcDtcblxuXHRcdHRoaXMuX2lzUGxheWluZyA9IGZhbHNlO1xuXHRcdFxuXHRcdHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCl7fTtcblxuXHRcdC8vIEJpbmQgbG9hZGVkIGV2ZW50IG9mIHRoZSB2aWRlbyB0byBwdWJsaXNoIGFuIGV2ZW50IHNvIHRoZSBjbGllbnQgXG5cdFx0Ly8gY2FuIGRvIHdoYXRldmVyIGl0IHdhbnQgKGV4YW1wbGU6IHBsYXkgdGhlIHZpZGVvKSBcblx0XHR0aGlzLl92aWRlby5hZGRFdmVudExpc3RlbmVyKCdsb2FkZWRkYXRhJywgdGhpcy5fb25WaWRlb0xvYWRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLl92aWRlby5hZGRFdmVudExpc3RlbmVyKCdwbGF5JywgdGhpcy5fb25WaWRlb1BsYXllZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLl92aWRlby5hZGRFdmVudExpc3RlbmVyKCdwYXVzZScsIHRoaXMuX29uVmlkZW9QYXVzZWQuYmluZCh0aGlzKSk7XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMuc3JjID09PSAnc3RyaW5nJykge1xuXHRcdFx0dGhpcy5sb2FkKG9wdGlvbnMuc3JjKTtcblx0XHR9XG5cdH1cblxuICAgIHByaXZhdGUgX29uVmlkZW9Mb2FkZWQoKSB7XG5cblx0XHR0aGlzLl9jb250ZW50QnVmZmVyLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuX3ZpZGVvLDAgLCAwLCB0aGlzLl92aWRlby53aWR0aCwgdGhpcy5fdmlkZW8uaGVpZ2h0KTtcblxuXHRcdGlmICh0aGlzLl9vcHRpb25zLmF1dG9wbGF5KSB7XG5cdFx0XHR0aGlzLnBsYXkoKTtcblx0XHR9XG5cblx0XHR0aGlzLl9sYXllckxvYWRlZCgpO1xuICAgIH1cblxuXHRwcml2YXRlIF9vblZpZGVvUGxheWVkKCkge1xuXHRcdHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IHRoaXMuX3JlcXVlc3RSZW5kZXJOZXh0RnJhbWU7XG5cdFx0dGhpcy5fcmVxdWVzdFJlbmRlck5leHRGcmFtZSgpO1xuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLl9vblBsYXlMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhpcy5fb25QbGF5TGlzdGVuZXIoKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIF9vblZpZGVvUGF1c2VkKCkge1xuXHRcdHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCl7Y29uc29sZS5sb2coJ0VuZCBvZiB2aWRlbyByZW5kZXJpbmcnKX07XG5cdFx0dGhpcy5fc3RvcFJlbmRlcmluZygpO1xuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLl9vblBhdXNlTGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRoaXMuX29uUGF1c2VMaXN0ZW5lcigpO1xuXHRcdH1cblx0fVxuXG5cdHByb3RlY3RlZCBfcmVuZGVyRnJhbWUodD86IG51bWJlcikge1xuXHRcdHRoaXMuX2NvbnRlbnRCdWZmZXIuY2xlYXIoKTtcblx0XHR0aGlzLl9jb250ZW50QnVmZmVyLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuX3ZpZGVvLCAwLCAwLCB0aGlzLl9vcHRpb25zLndpZHRoLCB0aGlzLl9vcHRpb25zLmhlaWdodCk7XG5cdFx0dGhpcy5fcmVuZGVyTmV4dEZyYW1lKCk7XG5cdH1cblxuXHRwcml2YXRlIF9yZXF1ZXN0UmVuZGVyTmV4dEZyYW1lKCkge1xuXHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9yZW5kZXJGcmFtZS5iaW5kKHRoaXMpKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIExvYWQgYSBtZWRpYSBpbiB0aGUgdmlkZW8gZWxlbWVudFxuXHQgKi9cblx0bG9hZChzcmM6IHN0cmluZywgbWltZVR5cGU/OiBzdHJpbmcpIHtcblx0XHQvL3RoaXMuI3ZpZGVvLnR5cGUgPSBtaW1lVHlwZTtcblx0XHR0aGlzLl92aWRlby5zcmMgPSBzcmM7IC8vIGxvYWQgdGhlIHZpZGVvXG5cdH1cblxuXHRwbGF5KCkge1xuXHRcdGlmICh0aGlzLl9pc1BsYXlpbmcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5faXNQbGF5aW5nID0gdHJ1ZTtcblx0XHR0aGlzLl9yZW5kZXJOZXh0RnJhbWUgPSB0aGlzLl9yZXF1ZXN0UmVuZGVyTmV4dEZyYW1lO1xuXHRcdHRoaXMuX3JlcXVlc3RSZW5kZXJOZXh0RnJhbWUoKTtcblx0XHR0aGlzLl92aWRlby5wbGF5KCk7XG5cblx0XHR0aGlzLl9zdGFydFJlbmRlcmluZygpO1xuXHR9XG5cblx0c3RvcChyZXNldDogYm9vbGVhbikge1xuXHRcdHRoaXMuX2lzUGxheWluZyA9IGZhbHNlO1xuXHRcdHRoaXMuX3ZpZGVvLnBhdXNlKCk7XG5cblx0XHRpZiAocmVzZXQpIHtcblx0XHRcdHRoaXMuX3ZpZGVvLmN1cnJlbnRUaW1lID0gMFxuXHRcdH1cblxuXHRcdHRoaXMuX3JlbmRlck5leHRGcmFtZSA9IGZ1bmN0aW9uKCl7XCJFbmQgb2YgdmlkZW8gcmVuZGVyaW5nXCJ9O1xuXHR9XG5cblx0aXNQbGF5aW5nKCkge1xuXHRcdHJldHVybiB0aGlzLl9pc1BsYXlpbmc7XG5cdH1cblxufVxuXG5leHBvcnQgeyBWaWRlb0xheWVyLCBJVmlkZW9MYXllck9wdGlvbnMgfTsiLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cIkB3ZWJncHUvdHlwZXNcIiAvPlxyXG5cclxuaW1wb3J0IHsgSVJlbmRlcmVyIH0gZnJvbSBcIi4vSVJlbmRlcmVyXCI7XHJcblxyXG5cclxuY2xhc3MgQ2hhbmdlQWxwaGFSZW5kZXJlciBpbXBsZW1lbnRzIElSZW5kZXJlciB7XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRhcHRlcjogR1BVQWRhcHRlcjtcclxuICAgIHByaXZhdGUgX2RldmljZTogR1BVRGV2aWNlO1xyXG4gICAgcHJpdmF0ZSBfd2lkdGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2hlaWdodDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfc2hhZGVyTW9kdWxlOiBHUFVTaGFkZXJNb2R1bGU7XHJcbiAgICBwcml2YXRlIF9idWZmZXJCeXRlTGVuZ3RoOiBudW1iZXI7XHJcblxyXG4gICAgcmVuZGVyRnJhbWU6IChmcmFtZURhdGE6IEltYWdlRGF0YSkgPT4gUHJvbWlzZTxJbWFnZURhdGE+O1xyXG4gICAgXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IFxyXG4gICAgICovXHJcblxyXG4gICAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9kZXZpY2U7XHJcbiAgICAgICAgdGhpcy5fYWRhcHRlcjtcclxuICAgICAgICB0aGlzLl9zaGFkZXJNb2R1bGU7XHJcbiAgICAgICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5fYnVmZmVyQnl0ZUxlbmd0aCA9IHdpZHRoICogaGVpZ2h0ICogNDtcclxuICAgICAgICB0aGlzLnJlbmRlckZyYW1lID0gdGhpcy5fZG9Ob3RoaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5pdCByZW5kZXJlclxyXG4gICAgICogQHJldHVybnMgUHJvbWlzZVxyXG4gICAgICovXHJcbiAgICBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcblxyXG4gICAgICAgICAgICBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKCkudGhlbiggYWRhcHRlciA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll9hZGFwdGVyID0gYWRhcHRlcjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBhZGFwdGVyLnJlcXVlc3REZXZpY2UoKS50aGVuKCBkZXZpY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2RldmljZSA9IGRldmljZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2hhZGVyTW9kdWxlID0gZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdCBVQk8ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IGYzMlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdCBJbWFnZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmdiYTogYXJyYXk8dTMyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuIGYydShmOiBmMzIpIC0+IHUzMiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHUzMihjZWlsKGYpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHN0b3JhZ2UscmVhZD4gaW5wdXRQaXhlbHM6IEltYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhcjxzdG9yYWdlLHJlYWRfd3JpdGU+IG91dHB1dFBpeGVsczogSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ3JvdXAoMCkgQGJpbmRpbmcoMikgdmFyPHVuaWZvcm0+IHVuaWZvcm1zIDogVUJPO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBjb21wdXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAd29ya2dyb3VwX3NpemUoMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuIG1haW4gKEBidWlsdGluKGdsb2JhbF9pbnZvY2F0aW9uX2lkKSBnbG9iYWxfaWQ6IHZlYzM8dTMyPikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbmRleCA6IHUzMiA9IGdsb2JhbF9pZC54ICsgZ2xvYmFsX2lkLnkgKiAke3RoYXQuX3dpZHRofXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBpeGVsQ29sb3IgOiB1MzIgPSBpbnB1dFBpeGVscy5yZ2JhW2luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3BhY2l0eSA6IGYzMiA9IHVuaWZvcm1zLm9wYWNpdHk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhIDogdTMyID0gKHBpeGVsQ29sb3IgPj4gMjR1KSAmIDI1NXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGIgOiB1MzIgPSAocGl4ZWxDb2xvciA+PiAxNnUpICYgMjU1dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZyA6IHUzMiA9IChwaXhlbENvbG9yID4+IDh1KSAmIDI1NXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHIgOiB1MzIgPSAocGl4ZWxDb2xvciAmIDI1NXUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWEgPSBmMnUoZmxvb3IoZjMyKGEpICogb3BhY2l0eSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWNrIDogVG9kbyBmaW5kIHdoeSBmbG9vciBub3Qgd29ya2luZyAoMCAqIGFueXRoaW5nKSBzaG91bGQgZ2l2ZSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wYWNpdHkgPT0gMGYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWEgPSAwdTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFBpeGVscy5yZ2JhW2luZGV4XSA9IChhYSA8PCAyNHUpIHwgKGIgPDwgMTZ1KSB8IChnIDw8IDh1KSB8IHI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGBcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NoYW5nZUFscGhhUmVuZGVyZXI6aW5pdCgpJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3NoYWRlck1vZHVsZS5jb21waWxhdGlvbkluZm8oKS50aGVuKGkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaS5tZXNzYWdlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQ2hhbmdlQWxwaGFSZW5kZXJlcjpjb21waWxhdGlvbkluZm8oKSBcIiwgaS5tZXNzYWdlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW5kZXJGcmFtZSA9IHRoYXQuX2RvUmVuZGVyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICB9KTtcclxuICAgIFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRG8gbm90aGluZyAocGxhY2UgaG9sZGVyIHVudGlsIGluaXQgaXMgZG9uZSB0byBwcmV2ZW50IGhhdmluZyB0byBoYXZlIGEgaWYoKSBpbiBfZG9SZW5kZXJpbmcpXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YX0gZnJhbWVEYXRhIFxyXG4gICAgICogQHJldHVybnMge0ltYWdlRGF0YX1cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfZG9Ob3RoaW5nKGZyYW1lRGF0YTogSW1hZ2VEYXRhKTogUHJvbWlzZTxJbWFnZURhdGE+IHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiSW5pdCBub3QgZG9uZSBjYW5ub3QgYXBwbHkgZmlsdGVyXCIpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+e1xyXG4gICAgICAgICAgICByZXNvbHZlKGZyYW1lRGF0YSk7XHJcbiAgICAgICAgfSk7ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFwcGx5IGZpbHRlciB0byBwcm92aWRlZCBkYXRhIHRoZW4gcmV0dXJuIGFsdGVyZWQgZGF0YVxyXG4gICAgICogQHBhcmFtIHtJbWFnZURhdGF9IGZyYW1lRGF0YSBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcGFjaXR5IFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8SW1hZ2VEYXRhPn1cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfZG9SZW5kZXJpbmcoZnJhbWVEYXRhOiBJbWFnZURhdGEsIG9wYWNpdHk6IG51bWJlcik6IFByb21pc2U8SW1hZ2VEYXRhPiB7XHJcblxyXG4gICAgICAgIHZhciBvID0gb3BhY2l0eSB8fCAxO1xyXG5cclxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgY29uc3QgVUJPQnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIHNpemU6IDQsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdwdUlucHV0QnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX2J1ZmZlckJ5dGVMZW5ndGgsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFXHJcbiAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICBjb25zdCBncHVUZW1wQnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX2J1ZmZlckJ5dGVMZW5ndGgsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkNcclxuICAgICAgICB9KTtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IGdwdU91dHB1dEJ1ZmZlciA9IHRoaXMuX2RldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9idWZmZXJCeXRlTGVuZ3RoLFxyXG4gICAgICAgICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5NQVBfUkVBRFxyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgYmluZEdyb3VwTGF5b3V0ID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XHJcbiAgICAgICAgICAgIGVudHJpZXMgOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInJlYWQtb25seS1zdG9yYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJzdG9yYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDIsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidW5pZm9ybVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgYmluZEdyb3VwID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XHJcbiAgICAgICAgICAgIGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxyXG4gICAgICAgICAgICBlbnRyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXI6IGdwdUlucHV0QnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogZ3B1VGVtcEJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMiwgXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogVUJPQnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9dGhpcy5fZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XHJcbiAgICAgICAgICAgIGxheW91dDogdGhpcy5fZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcclxuICAgICAgICAgICAgICAgIGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBjb21wdXRlOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRoaXMuX3NoYWRlck1vZHVsZSxcclxuICAgICAgICAgICAgICAgIGVudHJ5UG9pbnQ6IFwibWFpblwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBvcmlnaW5hbCBpbWFnZSBkYXRhIGluIHRoZSBpbnB1dCBidWZmZXIgKDI1N3g3OClcclxuICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZ3B1SW5wdXRCdWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKSkuc2V0KG5ldyBVaW50OEFycmF5KGZyYW1lRGF0YS5kYXRhKSk7XHJcbiAgICAgICAgICAgIGdwdUlucHV0QnVmZmVyLnVubWFwKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBXcml0ZSB2YWx1ZXMgdG8gdW5pZm9ybSBidWZmZXIgb2JqZWN0XHJcbiAgICAgICAgICAgIGNvbnN0IHVuaWZvcm1EYXRhID0gW29dO1xyXG4gICAgICAgICAgICBjb25zdCB1bmlmb3JtVHlwZWRBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkodW5pZm9ybURhdGEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKFVCT0J1ZmZlciwgMCwgdW5pZm9ybVR5cGVkQXJyYXkuYnVmZmVyKTtcclxuICAgIFxyXG4gICAgICAgICAgICBjb25zdCBjb21tYW5kRW5jb2RlciA9IHRoYXQuX2RldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXNzRW5jb2RlciA9IGNvbW1hbmRFbmNvZGVyLmJlZ2luQ29tcHV0ZVBhc3MoKTtcclxuXHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xyXG4gICAgICAgICAgICBwYXNzRW5jb2Rlci5kaXNwYXRjaFdvcmtncm91cHModGhhdC5fd2lkdGgsIHRoYXQuX2hlaWdodCk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLmVuZCgpO1xyXG5cclxuICAgICAgICAgICAgY29tbWFuZEVuY29kZXIuY29weUJ1ZmZlclRvQnVmZmVyKGdwdVRlbXBCdWZmZXIsIDAsIGdwdU91dHB1dEJ1ZmZlciwgMCwgdGhhdC5fYnVmZmVyQnl0ZUxlbmd0aCk7XHJcbiAgICBcclxuICAgICAgICAgICAgdGhhdC5fZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZEVuY29kZXIuZmluaXNoKCldKTtcclxuICAgIFxyXG4gICAgICAgICAgICAvLyBSZW5kZXIgRE1EIG91dHB1dFxyXG4gICAgICAgICAgICBncHVPdXRwdXRCdWZmZXIubWFwQXN5bmMoR1BVTWFwTW9kZS5SRUFEKS50aGVuKCAoKSA9PiB7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIC8vIEdyYWIgZGF0YSBmcm9tIG91dHB1dCBidWZmZXJcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsc0J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGdwdU91dHB1dEJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBJbWFnZSBkYXRhIHVzYWJsZSBieSBhIGNhbnZhc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShuZXcgVWludDhDbGFtcGVkQXJyYXkocGl4ZWxzQnVmZmVyKSwgdGhhdC5fd2lkdGgsIHRoYXQuX2hlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRvIGNhbGxlclxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZURhdGEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCB7IENoYW5nZUFscGhhUmVuZGVyZXIgfSIsIlxyXG5pbXBvcnQgeyBJUmVuZGVyZXIgfSBmcm9tIFwiLi9JUmVuZGVyZXJcIjtcclxuaW1wb3J0IHsgRG90U2hhcGUgfSBmcm9tIFwiLi5cIjtcclxuXHJcbmNsYXNzIEdQVVJlbmRlcmVyIGltcGxlbWVudHMgSVJlbmRlcmVyIHtcclxuXHJcbiAgICBwcml2YXRlIF9hZGFwdGVyOiBHUFVBZGFwdGVyO1xyXG4gICAgcHJpdmF0ZSBfZGV2aWNlOiBHUFVEZXZpY2U7XHJcbiAgICBwcml2YXRlIF9kbWRXaWR0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZG1kSGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zY3JlZW5XaWR0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfc2NyZWVuSGVpZ2h0OiBudW1iZXI7XHJcblx0cHJpdmF0ZSBfZG90U3BhY2U6IG51bWJlcjtcclxuXHRwcml2YXRlIF9waXhlbFNpemU6IG51bWJlcjtcclxuXHRwcml2YXRlIF9kb3RTaGFwZTogRG90U2hhcGU7XHJcbiAgICBwcml2YXRlIF9zaGFkZXJNb2R1bGU6IEdQVVNoYWRlck1vZHVsZTtcclxuICAgIHByaXZhdGUgX2RtZEJ1ZmZlckJ5dGVMZW5ndGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX3NjcmVlbkJ1ZmZlckJ5dGVMZW5ndGg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2JnQnJpZ2h0bmVzczogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfYmdDb2xvcjogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfYnJpZ2h0bmVzczogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfYmdIU1A6IG51bWJlcjtcclxuICAgIFxyXG4gICAgcmVuZGVyRnJhbWU6IChmcmFtZURhdGE6IEltYWdlRGF0YSkgPT4gUHJvbWlzZTxJbWFnZURhdGE+O1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRtZFdpZHRoIFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRtZEhlaWdodCBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzY3JlZW5XaWR0aCBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzY3JlZW5IZWlnaHQgXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcGl4ZWxTaXplXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZG90U3BhY2UgXHJcbiAgICAgKiBAcGFyYW0geyp9IGRvdFNoYXBlIFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJnQnJpZ2h0bmVzcyBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBicmlnaHRuZXNzXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIGRtZFdpZHRoOiBudW1iZXIsXHJcbiAgICAgICAgZG1kSGVpZ2h0OiBudW1iZXIsXHJcbiAgICAgICAgc2NyZWVuV2lkdGg6IG51bWJlcixcclxuICAgICAgICBzY3JlZW5IZWlnaHQ6IG51bWJlcixcclxuICAgICAgICBwaXhlbFNpemU6IG51bWJlcixcclxuICAgICAgICBkb3RTcGFjZTogbnVtYmVyLFxyXG4gICAgICAgIGRvdFNoYXBlOiBEb3RTaGFwZSxcclxuICAgICAgICBiZ0JyaWdodG5lc3M6IG51bWJlcixcclxuICAgICAgICBicmlnaHRuZXNzOiBudW1iZXJcclxuICAgICkge1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKGFyZ3VtZW50cyk7XHJcblxyXG4gICAgICAgIHRoaXMuX2RtZFdpZHRoID0gZG1kV2lkdGg7XHJcbiAgICAgICAgdGhpcy5fZG1kSGVpZ2h0ID0gZG1kSGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuX3NjcmVlbldpZHRoID0gc2NyZWVuV2lkdGg7XHJcblx0XHR0aGlzLl9zY3JlZW5IZWlnaHQgPSBzY3JlZW5IZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5fcGl4ZWxTaXplID0gcGl4ZWxTaXplO1xyXG4gICAgICAgIHRoaXMuX2RvdFNwYWNlID0gZG90U3BhY2U7XHJcbiAgICAgICAgdGhpcy5fZG90U2hhcGUgPSBkb3RTaGFwZTtcclxuICAgICAgICB0aGlzLl9kZXZpY2U7XHJcbiAgICAgICAgdGhpcy5fYWRhcHRlcjtcclxuICAgICAgICB0aGlzLl9zaGFkZXJNb2R1bGU7XHJcbiAgICAgICAgdGhpcy5fZG1kQnVmZmVyQnl0ZUxlbmd0aCA9IGRtZFdpZHRoKmRtZEhlaWdodCAqIDQ7XHJcbiAgICAgICAgdGhpcy5fc2NyZWVuQnVmZmVyQnl0ZUxlbmd0aCA9IHNjcmVlbldpZHRoICogc2NyZWVuSGVpZ2h0ICogNDtcclxuICAgICAgICB0aGlzLnJlbmRlckZyYW1lID0gdGhpcy5fZG9Ob3RoaW5nO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5fYmdCcmlnaHRuZXNzID0gMTQ7XHJcbiAgICAgICAgdGhpcy5fYmdDb2xvciA9IDQyNzkxNzY5NzU7XHJcbiAgICAgICAgdGhpcy5fYnJpZ2h0bmVzcyA9IDE7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgYmdCcmlnaHRuZXNzID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYmdCcmlnaHRuZXNzID0gYmdCcmlnaHRuZXNzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYmdDb2xvciA9IHBhcnNlSW50KFwiRkZcIiArIHRoaXMuX2ludDJIZXgoYmdCcmlnaHRuZXNzKSArIHRoaXMuX2ludDJIZXgoYmdCcmlnaHRuZXNzKSArIHRoaXMuX2ludDJIZXgoYmdCcmlnaHRuZXNzKSwgMTYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBiZ0JyaWdodG5lc3MgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QnJpZ2h0bmVzcyhicmlnaHRuZXNzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBiZ3AyID0gdGhpcy5fYmdCcmlnaHRuZXNzKnRoaXMuX2JnQnJpZ2h0bmVzcztcclxuXHJcbiAgICAgICAgdGhpcy5fYmdIU1AgPSBNYXRoLnNxcnQoMC4yOTkgKiBiZ3AyICsgMC41ODcgKiBiZ3AyICsgMC4xMTQgKiBiZ3AyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnQySGV4KG46IG51bWJlcik6IHN0cmluZyB7XHJcbiAgICAgICAgdmFyIGhleCA9IG4udG9TdHJpbmcoMTYpXHJcblxyXG4gICAgICAgIGlmIChoZXgubGVuZ3RoIDwgMikge1xyXG4gICAgICAgICAgICBoZXggPSBcIjBcIiArIGhleDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGhleDtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcblxyXG4gICAgICAgICAgICBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKCkudGhlbiggYWRhcHRlciA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll9hZGFwdGVyID0gYWRhcHRlcjtcclxuXHJcbiAgICAgICAgICAgICAgICBhZGFwdGVyLnJlcXVlc3REZXZpY2UoKS50aGVuKCBkZXZpY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2RldmljZSA9IGRldmljZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2hhZGVyTW9kdWxlID0gZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdCBVQk8ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyaWdodG5lc3M6IGYzMlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdCBJbWFnZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmdiYTogYXJyYXk8dTMyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuIGYyaShmOiBmMzIpIC0+IHUzMiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHUzMihjZWlsKGYpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbiB1MmYodTogdTMyKSAtPiBmMzIge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmMzIodSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDApIHZhcjxzdG9yYWdlLHJlYWQ+IGlucHV0UGl4ZWxzOiBJbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBncm91cCgwKSBAYmluZGluZygxKSB2YXI8c3RvcmFnZSxyZWFkX3dyaXRlPiBvdXRwdXRQaXhlbHM6IEltYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDIpIHZhcjx1bmlmb3JtPiB1bmlmb3JtcyA6IFVCTztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY29tcHV0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHdvcmtncm91cF9zaXplKDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbiBtYWluIChAYnVpbHRpbihnbG9iYWxfaW52b2NhdGlvbl9pZCkgZ2xvYmFsX2lkOiB2ZWMzPHUzMj4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmdCcmlnaHRuZXNzIDogdTMyID0gJHt0aGF0Ll9iZ0JyaWdodG5lc3N9dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggOiB1MzIgPSBnbG9iYWxfaWQueCArIGdsb2JhbF9pZC55ICogICR7dGhhdC5fZG1kV2lkdGh9dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGl4ZWwgOiB1MzIgPSBpbnB1dFBpeGVscy5yZ2JhW2luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYnJpZ2h0bmVzcyA6IGYzMiA9IHVuaWZvcm1zLmJyaWdodG5lc3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJyID0gMHU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJnID0gMHU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJiID0gMHU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGEgOiB1MzIgPSAocGl4ZWwgPj4gMjR1KSAmIDI1NXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGIgOiB1MzIgPSAocGl4ZWwgPj4gMTZ1KSAmIDI1NXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGcgOiB1MzIgPSAocGl4ZWwgPj4gOHUpICYgMjU1dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgciA6IHUzMiA9IChwaXhlbCAmIDI1NXUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBjb21wb25lbnQgaXMgYWJvdmUgZGFya2VzdCBjb2xvciB0aGVuIGFwcGx5IGJyaWdodG5lc3MgbGltaXRlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyID49IGJnQnJpZ2h0bmVzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiciA9IGJnQnJpZ2h0bmVzcyArIGYyaShmMzIociAtIGJnQnJpZ2h0bmVzcykgKiBicmlnaHRuZXNzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGNvbXBvbmVudCBpcyBhYm92ZSBkYXJrZXN0IGNvbG9yIHRoZW4gYXBwbHkgYnJpZ2h0bmVzcyBsaW1pdGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGcgPj0gYmdCcmlnaHRuZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJnID0gYmdCcmlnaHRuZXNzICsgZjJpKGYzMihnIC0gYmdCcmlnaHRuZXNzKSAqIGJyaWdodG5lc3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgY29tcG9uZW50IGlzIGFib3ZlIGRhcmtlc3QgY29sb3IgdGhlbiBhcHBseSBicmlnaHRuZXNzIGxpbWl0ZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYiA+PSBiZ0JyaWdodG5lc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmIgPSBiZ0JyaWdodG5lc3MgKyBmMmkoZjMyKGIgLSBiZ0JyaWdodG5lc3MpICogYnJpZ2h0bmVzcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWNyZWF0ZSBwaXhlbCBjb2xvciBidXQgZm9yY2UgYWxwaGEgdG8gMjU1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGl4ZWwgPSAoMjU1dSA8PCAyNHUpIHwgKGJiIDw8IDE2dSkgfCAoYmcgPDwgOHUpIHwgYnI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0IDogdTMyID0gciArIGcgKyBiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoc3AgOiBmMzIgPSAgc3FydCguMjk5ZiAqIHUyZihyKSAqIHUyZihyKSArIC41ODdmICogdTJmKGcpICogdTJmKGcpICsgLjExNCAqIHUyZihiKSAqIHUyZihiKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQaXhlbHMgdGhhdCBhcmUgdG9vIGRhcmsgd2lsbCBiZSBoYWNrZWQgdG8gZ2l2ZSB0aGUgJ29mZicgZG90IGxvb2sgb2YgdGhlIERNRFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYgKHQgPCBiZ0JyaWdodG5lc3MqM3UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaHNwIC0gOGYgPCAke3RoaXMuX2JnSFNQfWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGl4ZWwgPSAke3RoYXQuX2JnQ29sb3J9dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9waXhlbCA9IDQyOTQ5MDE3NjB1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0IGJ5dGUgaW5kZXggb2YgdGhlIG91dHB1dCBkb3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzaXplZFBpeGVsSW5kZXggOiB1MzIgPSAoZ2xvYmFsX2lkLnggKiAke3RoYXQuX3BpeGVsU2l6ZX11KSAgKyAoZ2xvYmFsX2lkLnggKiAke3RoYXQuX2RvdFNwYWNlfXUpICsgKGdsb2JhbF9pZC55ICogJHt0aGF0Ll9zY3JlZW5XaWR0aH11ICogKCR7dGhhdC5fcGl4ZWxTaXplfXUgKyAke3RoYXQuX2RvdFNwYWNlfXUpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciByb3c6IHUzMiA9IDB1IDsgcm93IDwgJHt0aGF0Ll9waXhlbFNpemV9dTsgcm93ID0gcm93ICsgMXUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBjb2w6IHUzMiA9IDB1IDsgY29sIDwgJHt0aGF0Ll9waXhlbFNpemV9dTsgY29sID0gY29sICsgMXUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQaXhlbHMucmdiYVtyZXNpemVkUGl4ZWxJbmRleF0gPSBwaXhlbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRQaXhlbEluZGV4ID0gcmVzaXplZFBpeGVsSW5kZXggKyAxdTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNpemVkUGl4ZWxJbmRleCA9IHJlc2l6ZWRQaXhlbEluZGV4ICsgJHt0aGF0Ll9zY3JlZW5XaWR0aH11IC0gJHt0aGF0Ll9waXhlbFNpemV9dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGBcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHUFVSZW5kZXJlcjppbml0KClcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRlck1vZHVsZS5jb21waWxhdGlvbkluZm8oKS50aGVuKGk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkubWVzc2FnZXMubGVuZ3RoID4gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignR1BVUmVuZGVyZXI6Y29tcGlsYXRpb25JbmZvKCknLCBpLm1lc3NhZ2VzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbmRlckZyYW1lID0gdGhhdC5fZG9SZW5kZXJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEbyBub3RoaW5nIChwbGFjZSBob2xkZXIgdW50aWwgaW5pdCBpcyBkb25lIHRvIHByZXZlbnQgaGF2aW5nIHRvIGhhdmUgYSBpZigpIGluICNkb1JlbmRlcmluZylcclxuICAgICAqIEBwYXJhbSB7SW1hZ2VEYXRhfSBmcmFtZURhdGFcclxuICAgICAqIEByZXR1cm5zIFxyXG4gICAgICovXHJcbiAgICAgcHJpdmF0ZSBfZG9Ob3RoaW5nKGZyYW1lRGF0YTogSW1hZ2VEYXRhKTogUHJvbWlzZTxJbWFnZURhdGE+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkluaXQgbm90IGRvbmUgY2Fubm90IGFwcGx5IGZpbHRlclwiKTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PntcclxuICAgICAgICAgICAgcmVzb2x2ZShmcmFtZURhdGEpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVyIGEgRE1EIGZyYW1lXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YX0gZnJhbWVEYXRhIFxyXG4gICAgICogQHJldHVybnMge0ltYWdlRGF0YX1cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfZG9SZW5kZXJpbmcoZnJhbWVEYXRhOiBJbWFnZURhdGEpOiBQcm9taXNlPEltYWdlRGF0YT4ge1xyXG5cclxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgY29uc3QgVUJPQnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIHNpemU6IDQsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5VTklGT1JNIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdwdUlucHV0QnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX2RtZEJ1ZmZlckJ5dGVMZW5ndGgsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFXHJcbiAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICBjb25zdCBncHVUZW1wQnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX3NjcmVlbkJ1ZmZlckJ5dGVMZW5ndGgsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkNcclxuICAgICAgICB9KTtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IGdwdU91dHB1dEJ1ZmZlciA9IHRoaXMuX2RldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9zY3JlZW5CdWZmZXJCeXRlTGVuZ3RoLFxyXG4gICAgICAgICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5NQVBfUkVBRFxyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgYmluZEdyb3VwTGF5b3V0ID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XHJcbiAgICAgICAgICAgIGVudHJpZXM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwicmVhZC1vbmx5LXN0b3JhZ2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMSxcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInN0b3JhZ2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMixcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ1bmlmb3JtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgYmluZEdyb3VwID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XHJcbiAgICAgICAgICAgIGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxyXG4gICAgICAgICAgICBlbnRyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXI6IGdwdUlucHV0QnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogZ3B1VGVtcEJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMiwgXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogVUJPQnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBjb21wdXRlUGlwZWxpbmUgPXRoaXMuX2RldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xyXG4gICAgICAgICAgICBsYXlvdXQ6IHRoaXMuX2RldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XHJcbiAgICAgICAgICAgICAgICBiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgY29tcHV0ZToge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0aGlzLl9zaGFkZXJNb2R1bGUsXHJcbiAgICAgICAgICAgICAgICBlbnRyeVBvaW50OiBcIm1haW5cIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7ICAgICAgICBcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHtcclxuXHJcbiAgICAgICAgICAgIC8vbmV3IFVpbnQ4QXJyYXkoZ3B1Q29uZkJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpKS5zZXQobmV3IFVpbnQ4QXJyYXkoW3RoaXMuX2JyaWdodG5lc3NdKSk7XHJcbiAgICAgICAgICAgIC8vZ3B1Q29uZkJ1ZmZlci51bm1hcCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gUHV0IG9yaWdpbmFsIGltYWdlIGRhdGEgaW4gdGhlIGlucHV0IGJ1ZmZlciAoMjU3eDc4KVxyXG4gICAgICAgICAgICBuZXcgVWludDhBcnJheShncHVJbnB1dEJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpKS5zZXQobmV3IFVpbnQ4QXJyYXkoZnJhbWVEYXRhLmRhdGEpKTtcclxuICAgICAgICAgICAgZ3B1SW5wdXRCdWZmZXIudW5tYXAoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdyaXRlIHZhbHVlcyB0byB1bmlmb3JtIGJ1ZmZlciBvYmplY3RcclxuICAgICAgICAgICAgY29uc3QgdW5pZm9ybURhdGEgPSBbdGhpcy5fYnJpZ2h0bmVzc107XHJcbiAgICAgICAgICAgIGNvbnN0IHVuaWZvcm1UeXBlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSh1bmlmb3JtRGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihVQk9CdWZmZXIsIDAsIHVuaWZvcm1UeXBlZEFycmF5LmJ1ZmZlcik7XHJcbiAgICBcclxuICAgICAgICAgICAgY29uc3QgY29tbWFuZEVuY29kZXIgPSB0aGF0Ll9kZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcclxuICAgICAgICAgICAgY29uc3QgcGFzc0VuY29kZXIgPSBjb21tYW5kRW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKCk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xyXG4gICAgICAgICAgICBwYXNzRW5jb2Rlci5kaXNwYXRjaFdvcmtncm91cHModGhhdC5fZG1kV2lkdGgsIHRoYXQuX2RtZEhlaWdodCk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLmVuZCgpO1xyXG4gICAgXHJcbiAgICAgICAgICAgIGNvbW1hbmRFbmNvZGVyLmNvcHlCdWZmZXJUb0J1ZmZlcihncHVUZW1wQnVmZmVyLCAwLCBncHVPdXRwdXRCdWZmZXIsIDAsIHRoYXQuX3NjcmVlbkJ1ZmZlckJ5dGVMZW5ndGgpO1xyXG4gICAgXHJcbiAgICAgICAgICAgIHRoYXQuX2RldmljZS5xdWV1ZS5zdWJtaXQoW2NvbW1hbmRFbmNvZGVyLmZpbmlzaCgpXSk7XHJcbiAgICBcclxuICAgICAgICAgICAgLy8gUmVuZGVyIERNRCBvdXRwdXRcclxuICAgICAgICAgICAgZ3B1T3V0cHV0QnVmZmVyLm1hcEFzeW5jKEdQVU1hcE1vZGUuUkVBRCkudGhlbiggKCkgPT4ge1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAvLyBHcmFiIGRhdGEgZnJvbSBvdXRwdXQgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbHNCdWZmZXIgPSBuZXcgVWludDhBcnJheShncHVPdXRwdXRCdWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKSk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIEltYWdlIGRhdGEgdXNhYmxlIGJ5IGEgY2FudmFzXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKG5ldyBVaW50OENsYW1wZWRBcnJheShwaXhlbHNCdWZmZXIpLCB0aGF0Ll9zY3JlZW5XaWR0aCwgdGhhdC5fc2NyZWVuSGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGltYWdlRGF0YSk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIC8vIHJldHVybiB0byBjYWxsZXJcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoaW1hZ2VEYXRhKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblx0fVxyXG5cclxuICAgIC8qKlxyXG5cdCAqIFNldCBicmlnaHRuZXNzIG9mIHRoZSBkb3RzIGJldHdlZW4gMCBhbmQgMSAoZG9lcyBub3QgYWZmZWN0IHRoZSBiYWNrZ3JvdW5kIGNvbG9yKVxyXG4gICAgICogQHBhcmFtIHtmbG9hdH0gYiBcclxuICAgICAqL1xyXG4gICAgc2V0QnJpZ2h0bmVzcyhiOiBudW1iZXIpIHtcclxuICAgICAgICB2YXIgYiA9IE1hdGgubWF4KDAsIE1hdGgubWluKE51bWJlci5wYXJzZUZsb2F0KGIpLCAxKSk7IC8vIG5vcm1hbGl6ZVxyXG4gICAgICAgIHRoaXMuX2JyaWdodG5lc3MgPSBNYXRoLnJvdW5kKGIgKiAxZTMpIC8gMWUzOyAvLyByb3VuZCB0byAxIGRpZ2l0IGFmdGVyIGRvdFxyXG4gICAgfVxyXG5cclxuICAgIGdldCBicmlnaHRuZXNzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9icmlnaHRuZXNzO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgR1BVUmVuZGVyZXIgfSIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiQHdlYmdwdS90eXBlc1wiIC8+XHJcblxyXG5pbXBvcnQgeyBJUmVuZGVyZXIgfSBmcm9tICcuL0lSZW5kZXJlcic7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xyXG5cclxuY2xhc3MgT3V0bGluZVJlbmRlcmVyIGltcGxlbWVudHMgSVJlbmRlcmVyIHtcclxuXHJcbiAgICBwcml2YXRlIF9hZGFwdGVyOiBHUFVBZGFwdGVyO1xyXG4gICAgcHJpdmF0ZSBfZGV2aWNlOiBHUFVEZXZpY2U7XHJcbiAgICBwcml2YXRlIF93aWR0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfaGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zaGFkZXJNb2R1bGU6IEdQVVNoYWRlck1vZHVsZTtcclxuICAgIHByaXZhdGUgX2J1ZmZlckJ5dGVMZW5ndGg6IG51bWJlcjtcclxuICAgIFxyXG4gICAgcmVuZGVyRnJhbWU6ICAoZnJhbWVEYXRhOiBJbWFnZURhdGEpID0+IFByb21pc2U8SW1hZ2VEYXRhPjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgXHJcbiAgICAgKi9cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RldmljZTtcclxuICAgICAgICB0aGlzLl9hZGFwdGVyO1xyXG4gICAgICAgIHRoaXMuX3NoYWRlck1vZHVsZTtcclxuICAgICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLl9idWZmZXJCeXRlTGVuZ3RoID0gd2lkdGggKiBoZWlnaHQgKiA0O1xyXG4gICAgICAgIHRoaXMucmVuZGVyRnJhbWUgPSB0aGlzLl9kb05vdGhpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG5cclxuICAgICAgICAgICAgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcigpLnRoZW4oIGFkYXB0ZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fYWRhcHRlciA9IGFkYXB0ZXI7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYWRhcHRlci5yZXF1ZXN0RGV2aWNlKCkudGhlbiggZGV2aWNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kZXZpY2UgPSBkZXZpY2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3NoYWRlck1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJ1Y3QgVUJPIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbm5lckNvbG9yOiB1MzIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJDb2xvcjogdTMyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogdTMyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJ1Y3QgSW1hZ2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJnYmE6IGFycmF5PHUzMj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ3JvdXAoMCkgQGJpbmRpbmcoMCkgdmFyPHN0b3JhZ2UscmVhZD4gaW5wdXRQaXhlbHM6IEltYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDEpIHZhcjxzdG9yYWdlLHJlYWRfd3JpdGU+IG91dHB1dFBpeGVsczogSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ3JvdXAoMCkgQGJpbmRpbmcoMikgdmFyPHVuaWZvcm0+IHVuaWZvcm1zIDogVUJPO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBjb21wdXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAd29ya2dyb3VwX3NpemUoMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuIG1haW4gKEBidWlsdGluKGdsb2JhbF9pbnZvY2F0aW9uX2lkKSBnbG9iYWxfaWQ6IHZlYzM8dTMyPikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbmRleCA6IHUzMiA9IGdsb2JhbF9pZC54ICsgZ2xvYmFsX2lkLnkgKiAke3RoYXQuX3dpZHRofXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVTaXplIDogdTMyID0gJHt0aGF0Ll93aWR0aH11O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGl4ZWxDb2xvciA6IHUzMiA9IGlucHV0UGl4ZWxzLnJnYmFbaW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbm5lckNvbG9yIDogdTMyID0gdW5pZm9ybXMuaW5uZXJDb2xvcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3V0ZXJDb2xvciA6IHUzMiA9IHVuaWZvcm1zLm91dGVyQ29sb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVXaWR0aCA6IHUzMiA9IHVuaWZvcm1zLmxpbmVXaWR0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGEgOiB1MzIgPSAocGl4ZWxDb2xvciA+PiAyNHUpICYgMjU1dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgYiA6IHUzMiA9IChwaXhlbENvbG9yID4+IDE2dSkgJiAyNTV1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBnIDogdTMyID0gKHBpeGVsQ29sb3IgPj4gOHUpICYgMjU1dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgciA6IHUzMiA9IChwaXhlbENvbG9yICYgMjU1dSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGlubmVyIGNvbG9yIHBpeGVsIGZvdW5kIGNoZWNrIHBpeGVscyBhcm91bmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGl4ZWxDb2xvciAhPSBpbm5lckNvbG9yKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXJDb2xvckZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsX2lkLnggPiAwdSAmJiBnbG9iYWxfaWQueCA8ICR7dGhhdC5fd2lkdGggLSAxfXUgJiYgZ2xvYmFsX2lkLnkgPiAwdSAmJiBnbG9iYWxfaWQueSA8ICR7dGhhdC5faGVpZ2h0IC0gMX11KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9wUGl4ZWwgPSBpbmRleCAtIGxpbmVTaXplICogbGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvdHRvbVBpeGVsID0gaW5kZXggKyBsaW5lU2l6ZSAqIGxpbmVXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsZWZ0UGl4ZWwgPSBpbmRleCAtIGxpbmVXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByaWdodFBpeGVsID0gaW5kZXggKyBsaW5lV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9wTGVmdFBpeGVsID0gdG9wUGl4ZWwgLSBsaW5lV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9wUmlnaHRQaXhlbCA9IHRvcFBpeGVsICsgbGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvdHRvbUxlZnRQaXhlbCA9IGJvdHRvbVBpeGVsIC0gbGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvdHRvbVJpZ2h0UGl4ZWwgPSBib3R0b21QaXhlbCArIGxpbmVXaWR0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRQaXhlbHMucmdiYVt0b3BQaXhlbF0gPT0gaW5uZXJDb2xvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UGl4ZWxzLnJnYmFbcmlnaHRQaXhlbF0gPT0gaW5uZXJDb2xvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UGl4ZWxzLnJnYmFbYm90dG9tUGl4ZWxdID09IGlubmVyQ29sb3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFBpeGVscy5yZ2JhW2xlZnRQaXhlbF0gPT0gaW5uZXJDb2xvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UGl4ZWxzLnJnYmFbdG9wTGVmdFBpeGVsXSA9PSBpbm5lckNvbG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRQaXhlbHMucmdiYVt0b3BSaWdodFBpeGVsXSA9PSBpbm5lckNvbG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRQaXhlbHMucmdiYVtib3R0b21MZWZ0UGl4ZWxdID09IGlubmVyQ29sb3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFBpeGVscy5yZ2JhW2JvdHRvbVJpZ2h0UGl4ZWxdID09IGlubmVyQ29sb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyQ29sb3JGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5uZXJDb2xvckZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQaXhlbHMucmdiYVtpbmRleF0gPSBvdXRlckNvbG9yOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFBpeGVscy5yZ2JhW2luZGV4XSA9IHBpeGVsQ29sb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL291dHB1dFBpeGVscy5yZ2JhW2luZGV4XSA9IDQyOTQ5NjcwNDB1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFBpeGVscy5yZ2JhW2luZGV4XSA9IHBpeGVsQ29sb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL291dHB1dFBpeGVscy5yZ2JhW2luZGV4XSA9IDQyNzgxOTAzMzV1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdPdXRsaW5lUmVuZGVyZXI6aW5pdCgpJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3NoYWRlck1vZHVsZS5jb21waWxhdGlvbkluZm8oKS50aGVuKGkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaS5tZXNzYWdlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiT3V0bGluZVJlbmRlcmVyOmNvbXBpbGF0aW9uSW5mbygpIFwiLCBpLm1lc3NhZ2VzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbmRlckZyYW1lID0gdGhhdC5fZG9SZW5kZXJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEbyBub3RoaW5nIChwbGFjZSBob2xkZXIgdW50aWwgaW5pdCBpcyBkb25lIHRvIHByZXZlbnQgaGF2aW5nIHRvIGhhdmUgYSBpZigpIGluICNkb1JlbmRlcmluZylcclxuICAgICAqIEBwYXJhbSB7SW1hZ2VEYXRhfSBmcmFtZURhdGFcclxuICAgICAqIEByZXR1cm5zIFByb21pc2U8SW1hZ2VEYXRhPlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9kb05vdGhpbmcoZnJhbWVEYXRhOiBJbWFnZURhdGEpOiBQcm9taXNlPEltYWdlRGF0YT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdCBub3QgZG9uZSBjYW5ub3QgYXBwbHkgZmlsdGVyXCIpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+e1xyXG4gICAgICAgICAgICByZXNvbHZlKGZyYW1lRGF0YSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXIgZnJhbWVcclxuICAgICAqIEBwYXJhbSB7SW1hZ2VEYXRhfSBmcmFtZURhdGEgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5uZXJDb2xvclxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG91dGVyQ29sb3IgXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxJbWFnZURhdGE+fVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9kb1JlbmRlcmluZyhcclxuICAgICAgICBmcmFtZURhdGE6IEltYWdlRGF0YSxcclxuICAgICAgICBpbm5lckNvbG9yOiBzdHJpbmcsXHJcbiAgICAgICAgb3V0ZXJDb2xvcjogc3RyaW5nLFxyXG4gICAgICAgIHdpZHRoOiBudW1iZXJcclxuICAgICk6IFByb21pc2U8SW1hZ2VEYXRhPiB7XHJcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnN0IFVCT0J1ZmZlciA9IHRoaXMuX2RldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICAgICAgICBzaXplOiAzICogNCxcclxuICAgICAgICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3B1SW5wdXRCdWZmZXIgPSB0aGlzLl9kZXZpY2UuY3JlYXRlQnVmZmVyKHtcclxuICAgICAgICAgICAgbWFwcGVkQXRDcmVhdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgc2l6ZTogdGhpcy5fYnVmZmVyQnl0ZUxlbmd0aCxcclxuICAgICAgICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0VcclxuICAgICAgICB9KTtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IGdwdVRlbXBCdWZmZXIgPSB0aGlzLl9kZXZpY2UuY3JlYXRlQnVmZmVyKHtcclxuICAgICAgICAgICAgc2l6ZTogdGhpcy5fYnVmZmVyQnl0ZUxlbmd0aCxcclxuICAgICAgICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQ1xyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgZ3B1T3V0cHV0QnVmZmVyID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICAgICAgICAgIHNpemU6IHRoaXMuX2J1ZmZlckJ5dGVMZW5ndGgsXHJcbiAgICAgICAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLk1BUF9SRUFEXHJcbiAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICBjb25zdCBiaW5kR3JvdXBMYXlvdXQgPSB0aGlzLl9kZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcclxuICAgICAgICAgICAgZW50cmllczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJyZWFkLW9ubHktc3RvcmFnZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic3RvcmFnZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nOiAyLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInVuaWZvcm1cIixcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KTtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IGJpbmRHcm91cCA9IHRoaXMuX2RldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xyXG4gICAgICAgICAgICBsYXlvdXQ6IGJpbmRHcm91cExheW91dCxcclxuICAgICAgICAgICAgZW50cmllczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiBncHVJbnB1dEJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMSxcclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXI6IGdwdVRlbXBCdWZmZXJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDIsIFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBidWZmZXI6IFVCT0J1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBjb21wdXRlUGlwZWxpbmUgPXRoaXMuX2RldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xyXG4gICAgICAgICAgICBsYXlvdXQ6IHRoaXMuX2RldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XHJcbiAgICAgICAgICAgICAgICBiaW5kR3JvdXBMYXlvdXRzOiBbYmluZEdyb3VwTGF5b3V0XVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgY29tcHV0ZToge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0aGlzLl9zaGFkZXJNb2R1bGUsXHJcbiAgICAgICAgICAgICAgICBlbnRyeVBvaW50OiBcIm1haW5cIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7ICAgICAgICBcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBvcmlnaW5hbCBpbWFnZSBkYXRhIGluIHRoZSBpbnB1dCBidWZmZXIgKDI1N3g3OClcclxuICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZ3B1SW5wdXRCdWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKSkuc2V0KG5ldyBVaW50OEFycmF5KGZyYW1lRGF0YS5kYXRhKSk7XHJcbiAgICAgICAgICAgIGdwdUlucHV0QnVmZmVyLnVubWFwKCk7XHJcblxyXG4gICAgXHJcblxyXG4gICAgICAgICAgICAvLyBXcml0ZSB2YWx1ZXMgdG8gdW5pZm9ybSBidWZmZXIgb2JqZWN0XHJcbiAgICAgICAgICAgIGNvbnN0IHVuaWZvcm1EYXRhID0gW1xyXG4gICAgICAgICAgICAgICAgVXRpbHMuaGV4Q29sb3JUb0ludChVdGlscy5yZ2JhMmFiZ3IoaW5uZXJDb2xvcikpLFxyXG4gICAgICAgICAgICAgICAgVXRpbHMuaGV4Q29sb3JUb0ludChVdGlscy5yZ2JhMmFiZ3Iob3V0ZXJDb2xvcikpLFxyXG4gICAgICAgICAgICAgICAgd2lkdGhcclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2codW5pZm9ybURhdGEpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdW5pZm9ybVR5cGVkQXJyYXkgPSBuZXcgSW50MzJBcnJheSh1bmlmb3JtRGF0YSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9kZXZpY2UucXVldWUud3JpdGVCdWZmZXIoVUJPQnVmZmVyLCAwLCB1bmlmb3JtVHlwZWRBcnJheS5idWZmZXIpOyAgICAgICAgICAgIFxyXG4gICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmRFbmNvZGVyID0gdGhhdC5fZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhc3NFbmNvZGVyID0gY29tbWFuZEVuY29kZXIuYmVnaW5Db21wdXRlUGFzcygpO1xyXG5cclxuICAgICAgICAgICAgcGFzc0VuY29kZXIuc2V0UGlwZWxpbmUoY29tcHV0ZVBpcGVsaW5lKTtcclxuICAgICAgICAgICAgcGFzc0VuY29kZXIuc2V0QmluZEdyb3VwKDAsIGJpbmRHcm91cCk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLmRpc3BhdGNoV29ya2dyb3Vwcyh0aGF0Ll93aWR0aCwgdGhhdC5faGVpZ2h0KTtcclxuICAgICAgICAgICAgcGFzc0VuY29kZXIuZW5kKCk7XHJcblxyXG4gICAgICAgICAgICBjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9CdWZmZXIoZ3B1VGVtcEJ1ZmZlciwgMCwgZ3B1T3V0cHV0QnVmZmVyLCAwLCB0aGF0Ll9idWZmZXJCeXRlTGVuZ3RoKTtcclxuICAgIFxyXG4gICAgICAgICAgICB0aGF0Ll9kZXZpY2UucXVldWUuc3VibWl0KFtjb21tYW5kRW5jb2Rlci5maW5pc2goKV0pO1xyXG4gICAgXHJcbiAgICAgICAgICAgIC8vIFJlbmRlciBETUQgb3V0cHV0XHJcbiAgICAgICAgICAgIGdwdU91dHB1dEJ1ZmZlci5tYXBBc3luYyhHUFVNYXBNb2RlLlJFQUQpLnRoZW4oICgpID0+IHtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gR3JhYiBkYXRhIGZyb20gb3V0cHV0IGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxzQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoZ3B1T3V0cHV0QnVmZmVyLmdldE1hcHBlZFJhbmdlKCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIEltYWdlIGRhdGEgdXNhYmxlIGJ5IGEgY2FudmFzXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKG5ldyBVaW50OENsYW1wZWRBcnJheShwaXhlbHNCdWZmZXIpLCB0aGF0Ll93aWR0aCwgdGhhdC5faGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGltYWdlRGF0YS5kYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdG8gY2FsbGVyXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGltYWdlRGF0YSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cdH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IE91dGxpbmVSZW5kZXJlciB9IiwiXHJcbmltcG9ydCB7IElSZW5kZXJlciB9IGZyb20gJy4vSVJlbmRlcmVyJztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XHJcblxyXG5jbGFzcyBSZW1vdmVBbGlhc2luZ1JlbmRlcmVyIGltcGxlbWVudHMgSVJlbmRlcmVyIHtcclxuXHJcbiAgICBwcml2YXRlIF9hZGFwdGVyOiBHUFVBZGFwdGVyO1xyXG4gICAgcHJpdmF0ZSBfZGV2aWNlOiBHUFVEZXZpY2U7XHJcbiAgICBwcml2YXRlIF93aWR0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfaGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zaGFkZXJNb2R1bGU6IEdQVVNoYWRlck1vZHVsZTtcclxuICAgIHByaXZhdGUgX2J1ZmZlckJ5dGVMZW5ndGg6IG51bWJlcjtcclxuXHJcbiAgICByZW5kZXJGcmFtZTogKGZyYW1lRGF0YTogSW1hZ2VEYXRhLCBvdGlvbnM/OiB7fSkgPT4gUHJvbWlzZTxJbWFnZURhdGE+O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgXHJcbiAgICAgKi9cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RldmljZTtcclxuICAgICAgICB0aGlzLl9hZGFwdGVyO1xyXG4gICAgICAgIHRoaXMuX3NoYWRlck1vZHVsZTtcclxuICAgICAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLl9idWZmZXJCeXRlTGVuZ3RoID0gd2lkdGggKiBoZWlnaHQgKiA0O1xyXG4gICAgICAgIHRoaXMucmVuZGVyRnJhbWUgPSB0aGlzLl9kb05vdGhpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG5cclxuICAgICAgICAgICAgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcigpLnRoZW4oIGFkYXB0ZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5fYWRhcHRlciA9IGFkYXB0ZXI7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYWRhcHRlci5yZXF1ZXN0RGV2aWNlKCkudGhlbiggZGV2aWNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kZXZpY2UgPSBkZXZpY2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3NoYWRlck1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJ1Y3QgVUJPIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVzaG9sZCA6IHUzMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlQ29sb3IgOiB1MzJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdCBJbWFnZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmdiYTogYXJyYXk8dTMyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBncm91cCgwKSBAYmluZGluZygwKSB2YXI8c3RvcmFnZSxyZWFkPiBpbnB1dFBpeGVsczogSW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ3JvdXAoMCkgQGJpbmRpbmcoMSkgdmFyPHN0b3JhZ2UscmVhZF93cml0ZT4gb3V0cHV0UGl4ZWxzOiBJbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBncm91cCgwKSBAYmluZGluZygyKSB2YXI8dW5pZm9ybT4gdW5pZm9ybXMgOiBVQk87ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAY29tcHV0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHdvcmtncm91cF9zaXplKDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbiBtYWluIChAYnVpbHRpbihnbG9iYWxfaW52b2NhdGlvbl9pZCkgZ2xvYmFsX2lkOiB2ZWMzPHUzMj4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGluZVNpemUgOiB1MzIgPSAke3RoYXQuX3dpZHRofXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVXaWR0aCA6IHUzMiA9IDF1O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXggOiB1MzIgPSBnbG9iYWxfaWQueCArIGdsb2JhbF9pZC55ICogbGluZVNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBpeGVsQ29sb3IgOiB1MzIgPSBpbnB1dFBpeGVscy5yZ2JhW2luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgYSA6IHUzMiA9IChwaXhlbENvbG9yID4+IDI0dSkgJiAyNTV1OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGIgOiB1MzIgPSAocGl4ZWxDb2xvciA+PiAxNnUpICYgMjU1dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZyA6IHUzMiA9IChwaXhlbENvbG9yID4+IDh1KSAmIDI1NXU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHIgOiB1MzIgPSAocGl4ZWxDb2xvciAmIDI1NXUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQaXhlbHMucmdiYVtpbmRleF0gPSBwaXhlbENvbG9yO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xldCBpbm5lckNvbG9yOiB1MzIgPSAgMjU1dSA8PCAyNHUgfCBhIDw8IDE2dSB8IGcgPDwgOHUgfCByO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbGV0IGlubmVyQ29sb3I6IHUzMiA9IDI1NXUgPDwgMjR1IHwgMHUgPDwgMTZ1IHwgMHUgPDwgOHUgfCAyNTV1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbGV0IGlubmVyQ29sb3I6IHUzMiA9IDI1NXUgPDwgMjR1IHwgMjU1dSA8PCAxNnUgfCAyNTV1IDw8IDh1IHwgMjU1dTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5uZXJDb2xvciA9IHVuaWZvcm1zLmJhc2VDb2xvcjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEgPiAwdSAmJiBwaXhlbENvbG9yICE9IGlubmVyQ29sb3IpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbm5lckNvbG9yRm91bmQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxfaWQueCA+IDB1ICYmIGdsb2JhbF9pZC54IDwgJHt0aGF0Ll93aWR0aCAtIDF9dSAmJiBnbG9iYWxfaWQueSA+IDB1ICYmIGdsb2JhbF9pZC55IDwgJHt0aGF0Ll9oZWlnaHQgLSAxfXUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL291dHB1dFBpeGVscy5yZ2JhW2luZGV4XSA9IDI1NXUgPDwgMjR1IHwgMjU1dSA8PCAxNnUgfCAyNTV1IDw8IDh1IHwgMHU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRvcFBpeGVsID0gaW5kZXggLSBsaW5lU2l6ZSAqIGxpbmVXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3R0b21QaXhlbCA9IGluZGV4ICsgbGluZVNpemUgKiBsaW5lV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGVmdFBpeGVsID0gaW5kZXggLSBsaW5lV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmlnaHRQaXhlbCA9IGluZGV4ICsgbGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRvcExlZnRQaXhlbCA9IHRvcFBpeGVsIC0gbGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRvcFJpZ2h0UGl4ZWwgPSB0b3BQaXhlbCArIGxpbmVXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3R0b21MZWZ0UGl4ZWwgPSBib3R0b21QaXhlbCAtIGxpbmVXaWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3R0b21SaWdodFBpeGVsID0gYm90dG9tUGl4ZWwgKyBsaW5lV2lkdGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UGl4ZWxzLnJnYmFbdG9wUGl4ZWxdID09IGlubmVyQ29sb3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFBpeGVscy5yZ2JhW3JpZ2h0UGl4ZWxdID09IGlubmVyQ29sb3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFBpeGVscy5yZ2JhW2JvdHRvbVBpeGVsXSA9PSBpbm5lckNvbG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRQaXhlbHMucmdiYVtsZWZ0UGl4ZWxdID09IGlubmVyQ29sb3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFBpeGVscy5yZ2JhW3RvcExlZnRQaXhlbF0gPT0gaW5uZXJDb2xvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UGl4ZWxzLnJnYmFbdG9wUmlnaHRQaXhlbF0gPT0gaW5uZXJDb2xvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0UGl4ZWxzLnJnYmFbYm90dG9tTGVmdFBpeGVsXSA9PSBpbm5lckNvbG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRQaXhlbHMucmdiYVtib3R0b21SaWdodFBpeGVsXSA9PSBpbm5lckNvbG9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbm5lckNvbG9yRm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlubmVyQ29sb3JGb3VuZCAmJiBhID49IHVuaWZvcm1zLnRyZXNob2xkICYmIGEgPCAyNTV1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQaXhlbHMucmdiYVtpbmRleF0gPSAoMjU1dSA8PCAyNHUpIHwgKGIgPDwgMTZ1KSB8IChnIDw8IDh1KSB8IHI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQaXhlbHMucmdiYVtpbmRleF0gPSAoMHUgPDwgMjR1KSB8IChiIDw8IDE2dSkgfCAoZyA8PCA4dSkgfCByO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9vdXRwdXRQaXhlbHMucmdiYVtpbmRleF0gPSAyMDB1IDw8IDI0dSB8IDB1IDw8IDE2dSB8IDB1IDw8IDh1IHwgMHU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9vdXRwdXRQaXhlbHMucmdiYVtpbmRleF0gPSAyNTV1IDw8IDI0dSB8IDI1NXUgPDwgMTZ1IHwgMjU1dSA8PCA4dSB8IDI1NXU7XHJcbiAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVtb3ZlQWxpYXNpbmdSZW5kZXJlcjppbml0KCknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2hhZGVyTW9kdWxlLmNvbXBpbGF0aW9uSW5mbygpLnRoZW4oaT0+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaS5tZXNzYWdlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiUmVtb3ZlQWxpYXNpbmdSZW5kZXJlcjpjb21waWxhdGlvbkluZm8oKSBcIiwgaS5tZXNzYWdlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW5kZXJGcmFtZSA9IHRoYXQuX2RvUmVuZGVyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICB9KTtcclxuICAgIFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRG8gbm90aGluZyAocGxhY2UgaG9sZGVyIHVudGlsIGluaXQgaXMgZG9uZSB0byBwcmV2ZW50IGhhdmluZyB0byBoYXZlIGEgaWYoKSBpbiAjZG9SZW5kZXJpbmcpXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YX0gZnJhbWVEYXRhXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfZG9Ob3RoaW5nKGZyYW1lRGF0YTogSW1hZ2VEYXRhKTogUHJvbWlzZTxJbWFnZURhdGE+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkluaXQgbm90IGRvbmUgY2Fubm90IGFwcGx5IGZpbHRlclwiKTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PntcclxuICAgICAgICAgICAgcmVzb2x2ZShmcmFtZURhdGEpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2RvUmVuZGVyaW5nKGZyYW1lRGF0YTogSW1hZ2VEYXRhLCBvcHRpb25zPzoge30pOiBQcm9taXNlPEltYWdlRGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCB0cmVzaG9sZDogbnVtYmVyID0gb3B0aW9uc1t0cmVzaG9sZF0gfHwgMDtcclxuICAgICAgICBjb25zdCBiYXNlQ29sb3I6IHN0cmluZyA9IG9wdGlvbnNbYmFzZUNvbG9yXTtcclxuXHJcblxyXG4gICAgICAgIGNvbnN0IFVCT0J1ZmZlciA9IHRoaXMuX2RldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICAgICAgICBzaXplOiA4LFxyXG4gICAgICAgICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBncHVJbnB1dEJ1ZmZlciA9IHRoaXMuX2RldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICAgICAgICBtYXBwZWRBdENyZWF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9idWZmZXJCeXRlTGVuZ3RoLFxyXG4gICAgICAgICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRVxyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgZ3B1VGVtcEJ1ZmZlciA9IHRoaXMuX2RldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICAgICAgICBzaXplOiB0aGlzLl9idWZmZXJCeXRlTGVuZ3RoLFxyXG4gICAgICAgICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfU1JDXHJcbiAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICBjb25zdCBncHVPdXRwdXRCdWZmZXIgPSB0aGlzLl9kZXZpY2UuY3JlYXRlQnVmZmVyKHtcclxuICAgICAgICAgICAgc2l6ZTogdGhpcy5fYnVmZmVyQnl0ZUxlbmd0aCxcclxuICAgICAgICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuTUFQX1JFQURcclxuICAgICAgICB9KTtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IGJpbmRHcm91cExheW91dCA9IHRoaXMuX2RldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xyXG4gICAgICAgICAgICBlbnRyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxyXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInJlYWQtb25seS1zdG9yYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJzdG9yYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmc6IDIsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidW5pZm9ybVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgYmluZEdyb3VwID0gdGhpcy5fZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XHJcbiAgICAgICAgICAgIGxheW91dDogYmluZEdyb3VwTGF5b3V0LFxyXG4gICAgICAgICAgICBlbnRyaWVzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXI6IGdwdUlucHV0QnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogZ3B1VGVtcEJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZzogMiwgXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogVUJPQnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbXB1dGVQaXBlbGluZSA9dGhpcy5fZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XHJcbiAgICAgICAgICAgIGxheW91dDogdGhpcy5fZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcclxuICAgICAgICAgICAgICAgIGJpbmRHcm91cExheW91dHM6IFtiaW5kR3JvdXBMYXlvdXRdXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBjb21wdXRlOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRoaXMuX3NoYWRlck1vZHVsZSxcclxuICAgICAgICAgICAgICAgIGVudHJ5UG9pbnQ6IFwibWFpblwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoIHJlc29sdmUgPT4ge1xyXG5cclxuICAgICAgICAgICAgLy8gUHV0IG9yaWdpbmFsIGltYWdlIGRhdGEgaW4gdGhlIGlucHV0IGJ1ZmZlciAoMjU3eDc4KVxyXG4gICAgICAgICAgICBuZXcgVWludDhBcnJheShncHVJbnB1dEJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpKS5zZXQobmV3IFVpbnQ4QXJyYXkoZnJhbWVEYXRhLmRhdGEpKTtcclxuICAgICAgICAgICAgZ3B1SW5wdXRCdWZmZXIudW5tYXAoKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAvLyBXcml0ZSB2YWx1ZXMgdG8gdW5pZm9ybSBidWZmZXIgb2JqZWN0XHJcbiAgICAgICAgICAgIGNvbnN0IHVuaWZvcm1EYXRhID0gW3RyZXNob2xkLCBVdGlscy5oZXhDb2xvclRvSW50KFV0aWxzLnJnYmEyYWJncihiYXNlQ29sb3IpKV07XHJcblxyXG4gICAgICAgICAgICBjb25zdCB1bmlmb3JtVHlwZWRBcnJheSA9IG5ldyBJbnQzMkFycmF5KHVuaWZvcm1EYXRhKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2RldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihVQk9CdWZmZXIsIDAsIHVuaWZvcm1UeXBlZEFycmF5LmJ1ZmZlcik7ICAgICAgXHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb21tYW5kRW5jb2RlciA9IHRoYXQuX2RldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXNzRW5jb2RlciA9IGNvbW1hbmRFbmNvZGVyLmJlZ2luQ29tcHV0ZVBhc3MoKTtcclxuXHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLnNldFBpcGVsaW5lKGNvbXB1dGVQaXBlbGluZSk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xyXG4gICAgICAgICAgICBwYXNzRW5jb2Rlci5kaXNwYXRjaFdvcmtncm91cHModGhhdC5fd2lkdGgsIHRoYXQuX2hlaWdodCk7XHJcbiAgICAgICAgICAgIHBhc3NFbmNvZGVyLmVuZCgpO1xyXG5cclxuICAgICAgICAgICAgY29tbWFuZEVuY29kZXIuY29weUJ1ZmZlclRvQnVmZmVyKGdwdVRlbXBCdWZmZXIsIDAsIGdwdU91dHB1dEJ1ZmZlciwgMCwgdGhhdC5fYnVmZmVyQnl0ZUxlbmd0aCk7XHJcbiAgICBcclxuICAgICAgICAgICAgdGhhdC5fZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29tbWFuZEVuY29kZXIuZmluaXNoKCldKTtcclxuICAgIFxyXG4gICAgICAgICAgICAvLyBSZW5kZXIgRE1EIG91dHB1dFxyXG4gICAgICAgICAgICBncHVPdXRwdXRCdWZmZXIubWFwQXN5bmMoR1BVTWFwTW9kZS5SRUFEKS50aGVuKCAoKSA9PiB7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIC8vIEdyYWIgZGF0YSBmcm9tIG91dHB1dCBidWZmZXJcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsc0J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGdwdU91dHB1dEJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBJbWFnZSBkYXRhIHVzYWJsZSBieSBhIGNhbnZhc1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShuZXcgVWludDhDbGFtcGVkQXJyYXkocGl4ZWxzQnVmZmVyKSwgdGhhdC5fd2lkdGgsIHRoYXQuX2hlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhpbWFnZURhdGEuZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRvIGNhbGxlclxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZURhdGEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHR9XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBSZW1vdmVBbGlhc2luZ1JlbmRlcmVyIH0iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnLi9CdWZmZXInO1xuaW1wb3J0IHsgRWFzaW5nIH0gZnJvbSAnLi9FYXNpbmcnO1xuaW1wb3J0IHsgR1BVUmVuZGVyZXIgfSBmcm9tICcuL3JlbmRlcmVycy9HUFVSZW5kZXJlcic7XG5pbXBvcnQgeyBDaGFuZ2VBbHBoYVJlbmRlcmVyIH0gZnJvbSAnLi9yZW5kZXJlcnMvQ2hhbmdlQWxwaGFSZW5kZXJlcic7XG5pbXBvcnQgeyBSZW1vdmVBbGlhc2luZ1JlbmRlcmVyIH0gZnJvbSAnLi9yZW5kZXJlcnMvUmVtb3ZlQWxpYXNpbmdSZW5kZXJlcic7XG5pbXBvcnQgeyBPdXRsaW5lUmVuZGVyZXIgfSBmcm9tICcuL3JlbmRlcmVycy9PdXRsaW5lUmVuZGVyZXInO1xuaW1wb3J0IHsgTGF5ZXJUeXBlIH0gZnJvbSAnLi9CYXNlTGF5ZXInO1xuaW1wb3J0IHsgSUltYWdlTGF5ZXJPcHRpb25zLCBJbWFnZUxheWVyIH0gZnJvbSAnLi9JbWFnZUxheWVyJztcbmltcG9ydCB7IElDYW52YXNMYXllck9wdGlvbnMsIENhbnZhc0xheWVyIH0gZnJvbSAnLi9DYW52YXNMYXllcic7XG5pbXBvcnQgeyBJQW5pbWF0aW9uTGF5ZXJPcHRpb25zLCBBbmltYXRpb25MYXllciB9IGZyb20gJy4vQW5pbWF0aW9uTGF5ZXInO1xuaW1wb3J0IHsgSVZpZGVvTGF5ZXJPcHRpb25zLCBWaWRlb0xheWVyIH0gZnJvbSAnLi9WaWRlb0xheWVyJztcbmltcG9ydCB7IElUZXh0TGF5ZXJPcHRpb25zLCBUZXh0TGF5ZXIgfSBmcm9tICcuL1RleHRMYXllcic7XG5pbXBvcnQgeyBJU3ByaXRlc0xheWVyT3B0aW9ucywgU3ByaXRlc0xheWVyIH0gZnJvbSAnLi9TcHJpdGVzTGF5ZXInO1xuaW1wb3J0IHsgQmFzZUxheWVyIH0gZnJvbSAnLi9CYXNlTGF5ZXInO1xuaW1wb3J0IHsgSVJlbmRlcmVyLCBJUmVuZGVyZXJEaWN0aW9uYXJ5IH0gZnJvbSAnLi9yZW5kZXJlcnMvSVJlbmRlcmVyJztcblxuZW51bSBEb3RTaGFwZSB7IFxuXHRTcXVhcmUsXG5cdENpcmNsZSxcbn1cblxuaW50ZXJmYWNlIElMYXllckRpY3Rpb25uYXJ5IHtcblx0W2luZGV4OiBzdHJpbmddOiBCYXNlTGF5ZXJcbn1cblxuaW50ZXJmYWNlIElMYXllciB7XG5cdGlkOiBzdHJpbmcsXG5cdHpJbmRleDogbnVtYmVyXG59XG5cbmNsYXNzIERNRCB7XG5cblx0cHJpdmF0ZSBvdXRwdXRDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuXHRwcml2YXRlIG91dHB1dENvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcblx0cHJpdmF0ZSB4T2Zmc2V0OiBudW1iZXI7XG5cdHByaXZhdGUgeU9mZnNldDogbnVtYmVyO1xuXHRwcml2YXRlIGxheWVyczogSUxheWVyRGljdGlvbm5hcnk7XG5cdHByaXZhdGUgc29ydGVkTGF5ZXJzOiBJTGF5ZXJbXTtcblx0cHJpdmF0ZSBvdXRwdXRXaWR0aDogbnVtYmVyO1xuXHRwcml2YXRlIG91dHB1dEhlaWdodDogbnVtYmVyO1xuXHRwcml2YXRlIGZyYW1lQnVmZmVyOiBCdWZmZXI7XG5cdHByaXZhdGUgZnBzQm94OiBIVE1MRGl2RWxlbWVudDtcblx0cHJpdmF0ZSB6SW5kZXg6IG51bWJlcjtcblx0cHJpdmF0ZSByZW5kZXJlcjogR1BVUmVuZGVyZXI7XG5cdHByaXZhdGUgaXNSdW5uaW5nOiBib29sZWFuO1xuXHRwcml2YXRlIF9mcHM6IG51bWJlcjtcblx0cHJpdmF0ZSBsYXN0UmVuZGVyVGltZTogbnVtYmVyO1xuXHRwcml2YXRlIGxheWVyUmVuZGVyZXJzOiBJUmVuZGVyZXJEaWN0aW9uYXJ5O1xuXHRwcml2YXRlIGluaXREb25lOiBib29sZWFuO1xuXHRwcml2YXRlIGJhY2tncm91bmRDb2xvcjogc3RyaW5nO1xuXHRwcml2YXRlIHJlbmRlck5leHRGcmFtZTogRnVuY3Rpb247XG5cdHByaXZhdGUgcmVuZGVyRlBTOiBGdW5jdGlvbjtcblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IG91dHB1dENhbnZhcyBEb20gRWxlbWVudCB3aGVyZSB0aGUgRE1EIHdpbGwgYmUgZHJhd2VkXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkb3RTaXplIEhvcml6b250YWwgd2lkdGggb2YgdGhlIHZpcnR1YWwgcGl4ZWxzIChleDogMSBkb3Qgd2lsbCBiZSA0IHBpeGVscyB3aWRlKSBcblx0ICogQHBhcmFtIHtudW1iZXJ9IGRvdFNwYWNlIG51bWJlciBvZiAnYmxhY2snIHBpeGVscyBiZXR3ZWVuIGVhY2ggY29sdW1uICh2ZXJ0aWNhbCBsaW5lcyBiZXR3ZWVuIGRvdHMpXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSB4T2Zmc2V0IC8vIFRPRE8gOiBob3Jpem9udGFsIHNoaWZ0aW5nXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSB5T2Zmc2V0ICAvLyBUT0RPIDogdmVydGljYWwgc2hpZnRpbmdcblx0ICogQHBhcmFtIHtzdHJpbmd9IGRvdFNoYXBlIC8vIFRPRE8oR1BVKSA6IFNoYXBlIG9mIHRoZSBkb3RzIChjYW4gYmUgc3F1YXJlIG9yIGNpcmNsZSlcblx0ICogQHBhcmFtIHtudW1iZXJ9IGJhY2tncm91bmRCcmlnaHRuZXNzIGJyaWdodG5lc3Mgb2YgdGhlIGJhY2tncm91bmQgKGJlbG93IHRoZSBkb3RzKVxuXHQgKiBAcGFyYW0ge251bWJlcn0gYnJpZ2h0bmVzcyBicmlnaHRuZXNzIG9mIHRoZSBkb3RzXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvd0ZQUyBzaG93IEZQUyBjb3VudCBvciBub3Rcblx0ICovXG5cdGNvbnN0cnVjdG9yKFxuXHRcdG91dHB1dENhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsXG5cdFx0ZG90U2l6ZTogbnVtYmVyLFxuXHRcdGRvdFNwYWNlOiBudW1iZXIsXG5cdFx0eE9mZnNldDogbnVtYmVyLFxuXHRcdHlPZmZzZXQ6IG51bWJlcixcblx0XHRkb3RTaGFwZTogRG90U2hhcGUsXG5cdFx0YmFja2dyb3VuZEJyaWdodG5lc3M6IG51bWJlcixcblx0XHRicmlnaHRuZXNzOiBudW1iZXIsXG5cdFx0c2hvd0ZQUzogYm9vbGVhblxuXHQpIHtcblxuXHRcdHRoaXMub3V0cHV0Q2FudmFzID0gb3V0cHV0Q2FudmFzO1xuXHRcdHRoaXMub3V0cHV0Q29udGV4dCA9IHRoaXMub3V0cHV0Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy54T2Zmc2V0ID0geE9mZnNldDtcblx0XHR0aGlzLnlPZmZzZXQgPSB5T2Zmc2V0O1xuXHRcdHRoaXMub3V0cHV0V2lkdGggPSBNYXRoLmZsb29yKHRoaXMub3V0cHV0Q2FudmFzLndpZHRoIC8gKGRvdFNpemUgKyBkb3RTcGFjZSkpO1xuXHRcdHRoaXMub3V0cHV0SGVpZ2h0ID0gTWF0aC5mbG9vcih0aGlzLm91dHB1dENhbnZhcy5oZWlnaHQgLyAoZG90U2l6ZSArIGRvdFNwYWNlKSk7XG5cdFx0dGhpcy5mcmFtZUJ1ZmZlciA9IG5ldyBCdWZmZXIodGhpcy5vdXRwdXRXaWR0aCwgdGhpcy5vdXRwdXRIZWlnaHQsIHRydWUpO1xuXHRcdHRoaXMuekluZGV4ID0gMTtcblx0XHR0aGlzLmxheWVycyA9IHt9IGFzIElMYXllckRpY3Rpb25uYXJ5O1xuXHRcdHRoaXMuc29ydGVkTGF5ZXJzID0gW107XG5cdFx0dGhpcy5yZW5kZXJGUFMgPSBmdW5jdGlvbiAoKSB7IH07IC8vIERvZXMgbm90aGluZ1xuXHRcdHRoaXMuYmFja2dyb3VuZENvbG9yID0gYHJnYmEoMTQsMTQsMTQsMjU1KWA7XG5cdFx0dGhpcy5pc1J1bm5pbmcgPSBmYWxzZTtcblx0XHR0aGlzLl9mcHMgPSAwO1xuXHRcdHRoaXMucmVuZGVyTmV4dEZyYW1lID0gZnVuY3Rpb24oKXt9O1xuXG5cdFx0Y29uc29sZS5sb2coYENyZWF0aW5nIGEgJHt0aGlzLm91dHB1dFdpZHRofXgke3RoaXMub3V0cHV0SGVpZ2h0fSBETUQgb24gYSAke3RoaXMub3V0cHV0Q2FudmFzLndpZHRofXgke3RoaXMub3V0cHV0Q2FudmFzLmhlaWdodH0gY2FudmFzYCk7XG5cblx0XHR0aGlzLnJlbmRlcmVyID0gbmV3IEdQVVJlbmRlcmVyKHRoaXMub3V0cHV0V2lkdGgsIHRoaXMub3V0cHV0SGVpZ2h0LCB0aGlzLm91dHB1dENhbnZhcy53aWR0aCwgdGhpcy5vdXRwdXRDYW52YXMuaGVpZ2h0LCBkb3RTaXplLCBkb3RTcGFjZSwgZG90U2hhcGUgfHwgRG90U2hhcGUuQ2lyY2xlLCBiYWNrZ3JvdW5kQnJpZ2h0bmVzcywgYnJpZ2h0bmVzcyk7XG5cblx0XHQvLyBBZGQgcmVuZGVyZXJzIG5lZWRlZCBmb3IgbGF5ZXJzIHJlbmRlcmluZ1xuXHRcdHRoaXMubGF5ZXJSZW5kZXJlcnMgPSB7XG5cdFx0XHQnb3BhY2l0eScgOiBuZXcgQ2hhbmdlQWxwaGFSZW5kZXJlcih0aGlzLm91dHB1dFdpZHRoLCB0aGlzLm91dHB1dEhlaWdodCksIC8vIHVzZWQgYnkgbGF5ZXIgd2l0aCBvcGFjaXR5IDwgMVxuXHRcdFx0J25vLWFudGlhbGlhc2luZycgOiBuZXcgUmVtb3ZlQWxpYXNpbmdSZW5kZXJlcih0aGlzLm91dHB1dFdpZHRoLCB0aGlzLm91dHB1dEhlaWdodCksIC8vIHVzZWQgYnkgVGV4dExheWVyIGlmIGFudGlhbGlhc2luZyAgPSBmYWxzZVxuXHRcdFx0J291dGxpbmUnIDogbmV3IE91dGxpbmVSZW5kZXJlcih0aGlzLm91dHB1dFdpZHRoLCB0aGlzLm91dHB1dEhlaWdodCkgIC8vIHVzZWQgYnkgVGV4dExheWVyIHdoZW4gb3V0bGluZVdpZHRoID4gMVxuXHRcdH0gYXMgSVJlbmRlcmVyRGljdGlvbmFyeTtcblxuXHRcdHRoaXMuaW5pdERvbmUgPSBmYWxzZTtcblxuXHRcdC8vIElGIG5lZWRlZCBjcmVhdGUgYW5kIHNob3cgZnBzIGRpdiBpbiBodGUgdG9wIHJpZ2h0IGNvcm5lciBvZiB0aGUgc2NyZWVuXG5cdFx0aWYgKCEhc2hvd0ZQUykge1xuXHRcdFx0Ly8gRG9tIGVsZW1lbnQgdG8gb3VwdXQgZnBzIHZhbHVlXG5cdFx0XHQvLyBUT0RPIDogUmVtb3ZlIGxhdGVyXG5cdFx0XHR0aGlzLmZwc0JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0dGhpcy5mcHNCb3guc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0dGhpcy5mcHNCb3guc3R5bGUucmlnaHQgPSAnMCc7XG5cdFx0XHR0aGlzLmZwc0JveC5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHR0aGlzLmZwc0JveC5zdHlsZS56SW5kZXggPSAnOTk5OTknOyAvLyBXVEYgaXMgdGhpcyBhIHN0cmluZyA6IGNoZWNrIGlmL3doZXJlIHdlIGRvIGFkZGl0aW9uL3N1YnN0cmFjdGlvblxuXHRcdFx0dGhpcy5mcHNCb3guc3R5bGUuY29sb3IgPSAncmVkJztcblx0XHRcdHRoaXMuZnBzQm94LnN0eWxlLmJhY2tncm91bmQgPSBcInJnYmEoMjU1LDI1NSwyNTUsMC41KVwiO1xuXHRcdFx0dGhpcy5mcHNCb3guc3R5bGUucGFkZGluZyA9ICc1cHgnO1xuXHRcdFx0dGhpcy5mcHNCb3guc3R5bGUubWluV2lkdGggPSAnNDBweCc7XG5cdFx0XHR0aGlzLmZwc0JveC5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmZwc0JveCk7XG5cblx0XHRcdHRoaXMucmVuZGVyRlBTID0gdGhpcy5fcmVuZGVyRlBTOyAvLyBFbmFibGUgZnBzIHJlbmRlcmluZyBvbiB0b3Agb2YgZG1kXG5cdFx0fVxuXG5cdFx0Ly8gUmVzZXQgbGF5ZXJzXG5cdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEluaXQgRE1EIHJlbmRlcmVyIHRoZW4gYWxsIGxheWVyIHJlbmRlcmVyc1xuXHQgKiBAcmV0dXJucyBQcm9taXNlXG5cdCAqL1xuXHRpbml0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHZhciB0aGF0ID0gdGhpcztcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcblxuXHRcdFx0bGV0IHJlbmRlcmVyczogUHJvbWlzZTx2b2lkPltdID0gW107XG5cblx0XHRcdE9iamVjdC5rZXlzKHRoaXMubGF5ZXJSZW5kZXJlcnMpLmZvckVhY2goaWQgPT4ge1xuXHRcdFx0XHRyZW5kZXJlcnMucHVzaCh0aGlzLmxheWVyUmVuZGVyZXJzW2lkXS5pbml0KCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMucmVuZGVyZXIuaW5pdCgpLnRoZW4oZGV2aWNlID0+IHtcblxuXHRcdFx0XHQvLyBDaGVjayBpZiBpdCBzdGlsbCBiZWhhdmUgbGlrZSBjaGFpblByb21pc2VzXG5cdFx0XHRcdFByb21pc2UuYWxsPHZvaWQ+KHJlbmRlcmVycykudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5pbml0RG9uZSA9IHRydWU7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdC8qVXRpbHMuY2hhaW5Qcm9taXNlcyhyZW5kZXJlcnMpXG5cdFx0XHRcdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5pbml0RG9uZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Ki9cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0IHJlbmRlcmluZyBsYXllcnNcblx0ICovXG5cdHJ1bigpIHtcblx0XHRpZiAoIXRoaXMuaW5pdERvbmUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcImNhbGwgRE1ELmluaXQoKSBmaXJzdFwiKTtcblx0XHR9XG5cblx0XHR0aGlzLmlzUnVubmluZyA9IHRydWU7XG5cdFx0dGhpcy5sYXN0UmVuZGVyVGltZSA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblx0XHR0aGlzLnJlbmRlck5leHRGcmFtZSA9IHRoaXMucmVxdWVzdE5leHRGcmFtZTtcblx0XHR0aGlzLnJlbmRlck5leHRGcmFtZSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3AgRE1EIHJlbmRlcmluZ1xuXHQgKi9cblx0c3RvcCgpIHtcblx0XHR0aGlzLmlzUnVubmluZyA9IGZhbHNlO1xuXHRcdHRoaXMucmVuZGVyTmV4dEZyYW1lID0gZnVuY3Rpb24oKXtjb25zb2xlLmxvZyhcIkRNRCByZW5kZXIgc3RvcHBlZFwiKX07XG5cdH1cblxuXHQvKipcblx0ICogUmVuZGVyIG91dHB1dCBETURcblx0ICovXG5cdHByaXZhdGUgcmVuZGVyRE1EKCkge1xuXHRcdHZhciB0aGF0ID0gdGhpcztcblxuXHRcdC8vIEZpbGwgcmVjdGFuZ2xlIHdpdGggYmFja2dyb3VuZCBjb2xvclxuXHRcdHRoaXMuZnJhbWVCdWZmZXIuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcblx0XHR0aGlzLmZyYW1lQnVmZmVyLmNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy5vdXRwdXRXaWR0aCwgdGhpcy5vdXRwdXRIZWlnaHQpO1xuXG5cdFx0Ly8gRHJhdyBlYWNoIHZpc2libGUgbGF5ZXIgb24gdG9wIG9mIHByZXZpb3VzIG9uZSB0byBjcmVhdGUgdGhlIGZpbmFsIHNjcmVlblxuXHRcdHRoaXMuc29ydGVkTGF5ZXJzLmZvckVhY2gobCA9PiB7XG5cdFx0XHRpZiAodGhpcy5sYXllcnMuaGFzT3duUHJvcGVydHkobC5pZCkpIHtcblx0XHRcdFx0dmFyIGxheWVyID0gdGhpcy5sYXllcnNbbC5pZF07XG5cblx0XHRcdFx0aWYgKGxheWVyLmlzVmlzaWJsZSgpICYmIGxheWVyLmlzTG9hZGVkKCkpIHtcblx0XHRcdFx0XHQvLyBEcmF3IGxheWVyIGNvbnRlbnQgaW50byBhIGJ1ZmZlclxuXHRcdFx0XHRcdHRoaXMuZnJhbWVCdWZmZXIuY29udGV4dC5kcmF3SW1hZ2UobGF5ZXIuY2FudmFzLCAwLCAwKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gR2V0IGRhdGEgZnJvbSB0aGUgbWVyZ2VkIGxheWVycyBjb250ZW50XG5cdFx0dmFyIGZyYW1lSW1hZ2VEYXRhID0gdGhpcy5mcmFtZUJ1ZmZlci5jb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLmZyYW1lQnVmZmVyLndpZHRoLCB0aGlzLmZyYW1lQnVmZmVyLmhlaWdodCk7XG5cblx0XHQvLyBHZW5lcmF0ZSBETUQgZnJhbWVcblx0XHR0aGlzLnJlbmRlcmVyLnJlbmRlckZyYW1lKGZyYW1lSW1hZ2VEYXRhKS50aGVuKGRtZEltYWdlRGF0YSA9PiB7XG5cblx0XHRcdGNyZWF0ZUltYWdlQml0bWFwKGRtZEltYWdlRGF0YSkudGhlbihiaXRtYXAgPT4ge1xuXG5cdFx0XHRcdC8vIENsZWFyIHRhcmdldCBjYW52YXNcblx0XHRcdFx0dGhhdC5vdXRwdXRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGF0Lm91dHB1dENhbnZhcy53aWR0aCwgdGhhdC5vdXRwdXRDYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHQvLyBSZW5kZXIgZmluYWwgRE1EIGltYWdlIG9udG8gdGFyZ2V0IGNhbnZhc1xuXHRcdFx0XHR0aGF0Lm91dHB1dENvbnRleHQuZHJhd0ltYWdlKGJpdG1hcCwgMCwgMCk7XG5cblx0XHRcdFx0Ly8gUmVuZGVyIEZQUyBib3ggaWYgbmVlZGVkXG5cdFx0XHRcdHRoYXQucmVuZGVyRlBTKCk7XG5cblx0XHRcdFx0dmFyIG5vdyA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblx0XHRcdFx0dmFyIGRlbHRhID0gKG5vdyAtIHRoYXQubGFzdFJlbmRlclRpbWUpO1xuXHRcdFx0XHR0aGF0Lmxhc3RSZW5kZXJUaW1lID0gbm93O1xuXG5cdFx0XHRcdC8vIENhbGN1bGF0ZSBGUFNcblx0XHRcdFx0dGhpcy5fZnBzID0gTWF0aC5yb3VuZCgoMTAwMCAvIGRlbHRhKSAqIDFlMikgLyAxZTI7XG5cblx0XHRcdFx0dGhpcy5yZW5kZXJOZXh0RnJhbWUoKTtcblx0XHRcdH0pO1xuXG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogVXBkYXRlIEZQUyBvdXRwdXQgZGl2IHdpdGggY3VycmVudCBmcHMgdmFsdWVcblx0ICovXG5cdHByaXZhdGUgX3JlbmRlckZQUygpIHtcblx0XHR0aGlzLmZwc0JveC5pbm5lckhUTUwgPSBgJHt0aGlzLmZwc30gZnBzYDtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXF1ZXN0IG5leHQgRnJhbWUgcmVuZGVyaW5nIGN5Y2xlXG5cdCAqL1xuXHRwcml2YXRlIHJlcXVlc3ROZXh0RnJhbWUoKSB7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMucmVuZGVyRE1ELmJpbmQodGhpcykpO1xuXHR9XG5cblx0cHJpdmF0ZSBzb3J0TGF5ZXJzKCkge1xuXHRcdHRoaXMuc29ydGVkTGF5ZXJzID0gdGhpcy5zb3J0ZWRMYXllcnMuc29ydCgoYSwgYikgPT4gKGEuekluZGV4ID4gYi56SW5kZXgpID8gMSA6IC0xKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSBuZXcgbGF5ZXIgb2JqZWN0IGFuZCBhZGQgaXQgdG8gdGhlIGxpc3Qgb2YgbGF5ZXJzXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZCA6IG1hbmRhdG9yeVxuXHQgKiBAcGFyYW0ge0xheWVyVHlwZX0gdHlwZSA6IG1hbmRhdG9yeVxuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuXHQgKiBAc2VlIEJhc2VMYXllciBmb3IgYXZhaWxhYmxlIG9wdGlvbnNcblx0ICogQHJldHVybiBsYXllclxuXHQgKi9cblx0cHJpdmF0ZSBfY3JlYXRlTGF5ZXIoXG5cdFx0dHlwZTogTGF5ZXJUeXBlLFxuXHRcdGlkOiBzdHJpbmcsXG5cdFx0b3B0aW9uczogYW55LFxuXHRcdF96SW5kZXg/OiBudW1iZXIsXG5cdFx0X2xheWVyTG9hZGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJPblBsYXlMaXN0ZW5lcj86IEZ1bmN0aW9uLFxuXHRcdF9sYXllck9uUGF1c2VMaXN0ZW5lcj86IEZ1bmN0aW9uLFxuXHRcdF9sYXllck9uU3RvcExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdCkge1xuXG5cdFx0Ly8gYWRkIHpJbmRleCBpZiBub3Qgc3BlY2lmaWVkXG5cdFx0dmFyIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHsgdmlzaWJsZSA6IHRydWUgfSwgb3B0aW9ucyk7XG5cblxuXHRcdGlmICh0eXBlb2YgdGhpcy5sYXllcnNbaWRdID09PSAndW5kZWZpbmVkJykge1xuXG5cdFx0XHR2YXIgbGF5ZXI7XG5cblx0XHRcdHN3aXRjaCh0eXBlKSB7XG5cdFx0XHRcdGNhc2UgTGF5ZXJUeXBlLkltYWdlOlxuXHRcdFx0XHRcdGxheWVyID0gbmV3IEltYWdlTGF5ZXIoaWQsIHRoaXMub3V0cHV0V2lkdGgsIHRoaXMub3V0cHV0SGVpZ2h0LCBvcHRpb25zLCB0aGlzLmxheWVyUmVuZGVyZXJzLCBfbGF5ZXJMb2FkZWRMaXN0ZW5lcixfbGF5ZXJVcGRhdGVkTGlzdGVuZXIpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIExheWVyVHlwZS5DYW52YXM6XG5cdFx0XHRcdFx0bGF5ZXIgPSBuZXcgQ2FudmFzTGF5ZXIoaWQsIHRoaXMub3V0cHV0V2lkdGgsIHRoaXMub3V0cHV0SGVpZ2h0LCBvcHRpb25zLCB0aGlzLmxheWVyUmVuZGVyZXJzLCBfbGF5ZXJMb2FkZWRMaXN0ZW5lcixfbGF5ZXJVcGRhdGVkTGlzdGVuZXIpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIExheWVyVHlwZS5BbmltYXRpb246XG5cdFx0XHRcdFx0bGF5ZXIgPSBuZXcgQW5pbWF0aW9uTGF5ZXIoaWQsIHRoaXMub3V0cHV0V2lkdGgsIHRoaXMub3V0cHV0SGVpZ2h0LCBvcHRpb25zLCB0aGlzLmxheWVyUmVuZGVyZXJzLCBfbGF5ZXJMb2FkZWRMaXN0ZW5lcixfbGF5ZXJVcGRhdGVkTGlzdGVuZXIsIF9sYXllck9uUGxheUxpc3RlbmVyLCBfbGF5ZXJPblBhdXNlTGlzdGVuZXIsIF9sYXllck9uU3RvcExpc3RlbmVyKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBMYXllclR5cGUuVGV4dDpcblx0XHRcdFx0XHRsYXllciA9IG5ldyBUZXh0TGF5ZXIoaWQsIHRoaXMub3V0cHV0V2lkdGgsIHRoaXMub3V0cHV0SGVpZ2h0LCBvcHRpb25zLCB0aGlzLmxheWVyUmVuZGVyZXJzLCBfbGF5ZXJMb2FkZWRMaXN0ZW5lcixfbGF5ZXJVcGRhdGVkTGlzdGVuZXIpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIExheWVyVHlwZS5WaWRlbzpcblx0XHRcdFx0XHRsYXllciA9IG5ldyBWaWRlb0xheWVyKGlkLCB0aGlzLm91dHB1dFdpZHRoLCB0aGlzLm91dHB1dEhlaWdodCwgb3B0aW9ucywgdGhpcy5sYXllclJlbmRlcmVycywgX2xheWVyTG9hZGVkTGlzdGVuZXIsX2xheWVyVXBkYXRlZExpc3RlbmVyLCBfbGF5ZXJPblBsYXlMaXN0ZW5lciwgX2xheWVyT25QYXVzZUxpc3RlbmVyKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBMYXllclR5cGUuU3ByaXRlczpcblx0XHRcdFx0XHRsYXllciA9IG5ldyBTcHJpdGVzTGF5ZXIoaWQsIHRoaXMub3V0cHV0V2lkdGgsIHRoaXMub3V0cHV0SGVpZ2h0LCBvcHRpb25zLCB0aGlzLmxheWVyUmVuZGVyZXJzLCBfbGF5ZXJMb2FkZWRMaXN0ZW5lciwgX2xheWVyVXBkYXRlZExpc3RlbmVyKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIGxheWVyIHR5cGUgOiAke3R5cGV9YCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubGF5ZXJzW2lkXSA9IGxheWVyIGFzIEJhc2VMYXllcjsgLy8gdXNlIGdldFR5cGUoKSB0byByZXRyaWV2ZSB0aGUgdHlwZSBsYXRlciBcblxuXHRcdFx0dmFyIHpJbmRleCA9IHRoaXMuekluZGV4O1xuXG5cdFx0XHRpZiAodHlwZW9mIF96SW5kZXggPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdHpJbmRleCA9IF96SW5kZXg7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnpJbmRleCsrO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBZGQgbmV3IGxheWVyIHRvIHNvcnRlZCBhcnJheVxuXHRcdFx0dGhpcy5zb3J0ZWRMYXllcnMucHVzaCh7IGlkOiBpZCwgekluZGV4OiB6SW5kZXggfSk7XG5cblx0XHRcdC8vIFNvcnQgYnkgekluZGV4IGluY1xuXHRcdFx0dGhpcy5zb3J0TGF5ZXJzKCk7XG5cblx0XHRcdHJldHVybiB0aGlzLmxheWVyc1tpZF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTGF5ZXIgWyR7aWR9XSBhbHJlYWR5IGV4aXN0c2ApO1xuXHRcdH1cblx0fVxuXG5cdGNyZWF0ZUltYWdlTGF5ZXIoXG5cdFx0aWQ6IHN0cmluZyxcblx0XHRfb3B0aW9uczogSUltYWdlTGF5ZXJPcHRpb25zLFxuXHRcdF96SW5kZXg/OiBudW1iZXIsXG5cdFx0X2xheWVyTG9hZGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0KSB7XG5cdFx0dGhpcy5fY3JlYXRlTGF5ZXIoXG5cdFx0XHRMYXllclR5cGUuSW1hZ2UsXG5cdFx0XHRpZCxcblx0XHRcdF9vcHRpb25zLFxuXHRcdFx0X3pJbmRleCxcblx0XHRcdF9sYXllckxvYWRlZExpc3RlbmVyLFxuXHRcdFx0X2xheWVyVXBkYXRlZExpc3RlbmVyXG5cdFx0KVxuXHR9XG5cblx0Y3JlYXRlQ2FudmFzTGF5ZXIoXG5cdFx0aWQ6IHN0cmluZyxcblx0XHRfb3B0aW9uczogSUNhbnZhc0xheWVyT3B0aW9ucyxcblx0XHRfekluZGV4PzogbnVtYmVyLFxuXHRcdF9sYXllckxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdFx0X2xheWVyVXBkYXRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdCkge1xuXHRcdHRoaXMuX2NyZWF0ZUxheWVyKFxuXHRcdFx0TGF5ZXJUeXBlLkNhbnZhcyxcblx0XHRcdGlkLFxuXHRcdFx0X29wdGlvbnMsXG5cdFx0XHRfekluZGV4LFxuXHRcdFx0X2xheWVyTG9hZGVkTGlzdGVuZXIsXG5cdFx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXJcblx0XHQpXG5cdH1cblxuXHRjcmVhdGVWaWRlb0xheWVyKFxuXHRcdGlkOiBzdHJpbmcsXG5cdFx0X29wdGlvbnM6IElWaWRlb0xheWVyT3B0aW9ucyxcblx0XHRfekluZGV4PzogbnVtYmVyLFxuXHRcdF9sYXllckxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdFx0X2xheWVyVXBkYXRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdFx0X2xheWVyT25QbGF5TGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJPblBhdXNlTGlzdGVuZXI/OiBGdW5jdGlvblxuXHRcdC8vIFdoeSBubyBfbGF5ZXJPblN0b3BMaXN0ZW5lciA/XG5cdCkge1xuXHRcdHRoaXMuX2NyZWF0ZUxheWVyKFxuXHRcdFx0TGF5ZXJUeXBlLlZpZGVvLFxuXHRcdFx0aWQsXG5cdFx0XHRfb3B0aW9ucyxcblx0XHRcdF96SW5kZXgsXG5cdFx0XHRfbGF5ZXJMb2FkZWRMaXN0ZW5lcixcblx0XHRcdF9sYXllclVwZGF0ZWRMaXN0ZW5lcixcblx0XHRcdF9sYXllck9uUGxheUxpc3RlbmVyLFxuXHRcdFx0X2xheWVyT25QYXVzZUxpc3RlbmVyXG5cdFx0KVxuXHR9XG5cblx0Y3JlYXRlQW5pbWF0aW9uTGF5ZXIoXG5cdFx0aWQ6IHN0cmluZyxcblx0XHRfb3B0aW9uczogSUFuaW1hdGlvbkxheWVyT3B0aW9ucyxcblx0XHRfekluZGV4PzogbnVtYmVyLFxuXHRcdF9sYXllckxvYWRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdFx0X2xheWVyVXBkYXRlZExpc3RlbmVyPzogRnVuY3Rpb24sXG5cdFx0X2xheWVyT25QbGF5TGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJPblBhdXNlTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJPblN0b3BMaXN0ZW5lcj86IEZ1bmN0aW9uXG5cdCkge1xuXHRcdHRoaXMuX2NyZWF0ZUxheWVyKFxuXHRcdFx0TGF5ZXJUeXBlLkFuaW1hdGlvbixcblx0XHRcdGlkLFxuXHRcdFx0X29wdGlvbnMsXG5cdFx0XHRfekluZGV4LFxuXHRcdFx0X2xheWVyTG9hZGVkTGlzdGVuZXIsXG5cdFx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXIsXG5cdFx0XHRfbGF5ZXJPblBsYXlMaXN0ZW5lcixcblx0XHRcdF9sYXllck9uUGF1c2VMaXN0ZW5lcixcblx0XHRcdF9sYXllck9uU3RvcExpc3RlbmVyXG5cdFx0KVxuXHR9XG5cblx0Y3JlYXRlVGV4dExheWVyKFxuXHRcdGlkOiBzdHJpbmcsXG5cdFx0X29wdGlvbnM6IElUZXh0TGF5ZXJPcHRpb25zLFxuXHRcdF96SW5kZXg/OiBudW1iZXIsXG5cdFx0X2xheWVyTG9hZGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0KSB7XG5cdFx0dGhpcy5fY3JlYXRlTGF5ZXIoXG5cdFx0XHRMYXllclR5cGUuVGV4dCxcblx0XHRcdGlkLFxuXHRcdFx0X29wdGlvbnMsXG5cdFx0XHRfekluZGV4LFxuXHRcdFx0X2xheWVyTG9hZGVkTGlzdGVuZXIsXG5cdFx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXIsXG5cdFx0KVxuXHR9XG5cblx0Y3JlYXRlU3ByaXRlc0xheWVyKFxuXHRcdGlkOiBzdHJpbmcsXG5cdFx0X29wdGlvbnM6IElTcHJpdGVzTGF5ZXJPcHRpb25zLFxuXHRcdF96SW5kZXg/OiBudW1iZXIsXG5cdFx0X2xheWVyTG9hZGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXI/OiBGdW5jdGlvbixcblx0KSB7XG5cdFx0dGhpcy5fY3JlYXRlTGF5ZXIoXG5cdFx0XHRMYXllclR5cGUuU3ByaXRlcyxcblx0XHRcdGlkLFxuXHRcdFx0X29wdGlvbnMsXG5cdFx0XHRfekluZGV4LFxuXHRcdFx0X2xheWVyTG9hZGVkTGlzdGVuZXIsXG5cdFx0XHRfbGF5ZXJVcGRhdGVkTGlzdGVuZXIsXG5cdFx0KVxuXHR9XG5cblxuXG5cdC8qKlxuXHQgKiBBZGQgYW4gZXh0ZXJuYWwgbGF5ZXIgb2JqZWN0IHRvIHRoZSBETURcblx0ICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuXHQgKiBAcGFyYW0ge0Jhc2VMYXllcn0gbGF5ZXJcblx0ICovXG5cdC8qYWRkTGF5ZXIoaWQ6IHN0cmluZywgbGF5ZXI6IEJhc2VMYXllciwgX3pJbmRleDogbnVtYmVyKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmxheWVyc1tpZF0gPT09ICd1bmRlZmluZWQnKSB7XG5cblx0XHRcdGlmICh0eXBlb2YgbGF5ZXIgPT09ICdvYmplY3QnICYmXG5cdFx0XHRcdChcblx0XHRcdFx0XHRsYXllci5jb25zdHJ1Y3RvciA9PT0gQ2FudmFzTGF5ZXIgfHxcblx0XHRcdFx0XHRsYXllci5jb25zdHJ1Y3RvciA9PT0gSW1hZ2VMYXllciB8fFxuXHRcdFx0XHRcdGxheWVyLmNvbnN0cnVjdG9yID09PSBWaWRlb0xheWVyIHx8XG5cdFx0XHRcdFx0bGF5ZXIuY29uc3RydWN0b3IgPT09IFRleHRMYXllciB8fFxuXHRcdFx0XHRcdGxheWVyLmNvbnN0cnVjdG9yID09PSBBbmltYXRpb25MYXllciB8fFxuXHRcdFx0XHRcdGxheWVyLmNvbnN0cnVjdG9yID09PSBTcHJpdGVzTGF5ZXJcblx0XHRcdClcblx0XHRcdCkge1xuXG5cdFx0XHRcdGlmIChsYXllci53aWR0aCA9PT0gdGhpcy5vdXRwdXRDYW52YXMud2lkdGggJiYgbGF5ZXIuaGVpZ2h0ID09PSB0aGlzLm91dHB1dENhbnZhcy5oZWlnaHQgKSB7XG5cblx0XHRcdFx0XHR2YXIgekluZGV4ID0gdGhpcy56SW5kZXg7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIF96SW5kZXggPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdFx0XHR6SW5kZXggPSBfekluZGV4O1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnpJbmRleCsrO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMubGF5ZXJzW2lkXSA9IGxheWVyO1xuXHRcdFx0XHRcdHRoaXMuc29ydGVkTGF5ZXJzLnB1c2goe25hbWUgOiBpZCwgekluZGV4IDogekluZGV4fSk7XG5cdFx0XHRcdFx0dGhpcy5zb3J0TGF5ZXJzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgTGF5ZXJbJHtpZH1dIHdpZHRoL2hlaWdodCBtaXNtYXRjaCA6IEV4cGVjdGVkWyR7dGhpcy5vdXRwdXRDYW52YXMud2lkdGh9eCR7dGhpcy5vdXRwdXRDYW52YXMuaGVpZ2h0fV0gYnV0IHJlY2VpdmVkWyR7bGF5ZXIud2lkdGh9eCR7bGF5ZXIuaGVpZ2h0fV1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcIk9iamVjdCBpcyBub3QgYSB2YWxpZCBsYXllciBvYmplY3RcIiwgbGF5ZXIpO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYEEgbGF5ZXIgbmFtZWQgJyR7aWR9JyBhbHJlYWR5IGV4aXN0c2ApO1xuXHRcdH1cblxuXHR9Ki9cblxuXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBzcGVjaWZpZWQgbGF5ZXJcblx0ICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuXHQgKi9cblx0cmVtb3ZlTGF5ZXIoaWQ6IHN0cmluZykge1xuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLmxheWVyc1tpZF0gIT09ICd1bmRlZmluZWQnKSB7XG5cblx0XHRcdHRoaXMubGF5ZXJzW2lkXS5kZXN0cm95KCk7IC8vIEZvcmNlIHN0b3AgcmVuZGVyaW5nIHNpbmNlIGRlbGV0ZSBkb2VzIHNlZW1zIHRvIEdDXG5cblx0XHRcdC8vIFJlbW92ZSBMYXllciBvYmplY3QgZnJvbSBhcnJheVxuXHRcdFx0ZGVsZXRlIHRoaXMubGF5ZXJzW2lkXTtcblxuXHRcdFx0Ly8gU29ydCBsYXllcnMgd2l0aG91dCBkZWxldGVkIGxheWVyXG5cdFx0XHR0aGlzLnNvcnRlZExheWVycyA9IHRoaXMuc29ydGVkTGF5ZXJzLmZpbHRlcihsID0+IHsgcmV0dXJuIGwuaWQgIT09IGlkIH0pO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhgUmVtb3ZpbmcgbGF5ZXIgOiAke2lkfWApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmxvZygnVGhpcyBsYXllciBkb2VzIG5vdCBleGlzdCcpO1xuXHRcdH1cblx0fVxuXG5cdC8qcmVtb3ZlTGF5ZXIobGF5ZXI6IEJhc2VMYXllcikge1xuXHRcdHRoaXMucmVtb3ZlTGF5ZXIobGF5ZXIuaWQpO1xuXHR9Ki9cblxuXHQvKipcblx0ICogU2hvdy9IaWRlIHNwZWNpZmllZCBsYXllclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gc3RhdGVcblx0ICovXG5cdHNldExheWVyVmlzaWJpbGl0eShpZDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuXHRcdGlmICh0eXBlb2YgdGhpcy5sYXllcnNbaWRdICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhpcy5sYXllcnNbaWRdLnNldFZpc2liaWxpdHkoISFzdGF0ZSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3cvaGlkIGdyb3VwIG9mIGxheWVyc1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcblx0ICogQHBhcmFtIHtib29sZWFufSBzdGF0ZSBcblx0ICovXG5cdHNldExheWVyR3JvdXBWaXNpYmlsaXR5KG5hbWU6IHN0cmluZywgc3RhdGU6IGJvb2xlYW4pIHtcblx0XHRPYmplY3Qua2V5cyh0aGlzLmxheWVycykuZm9yRWFjaChrZXkgPT4ge1xuXHRcdFx0aWYgKHRoaXMubGF5ZXJzW2tleV0uZ3JvdXBzLmluY2x1ZGVzKG5hbWUpKSB7XG5cdFx0XHRcdHRoaXMubGF5ZXJzW2tleV0uc2V0VmlzaWJpbGl0eSghIXN0YXRlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNldCBETURcblx0ICovXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMubGF5ZXJzID0ge30gYXMgSUxheWVyRGljdGlvbm5hcnk7XG5cdFx0dGhpcy5zb3J0ZWRMYXllcnMgPSBbXTtcblx0fVxuXG5cdC8qKlxuXHQgKiBPdXRwdXQgc29tZSBpbmZvIGluIHRoZSBjb25zb2xlXG5cdCAqL1xuXHRkZWJ1ZygpIHtcblx0XHRjb25zb2xlLmxvZyh0aGlzLmxheWVycyk7XG5cdFx0Y29uc29sZS5sb2codGhpcy5zb3J0ZWRMYXllcnMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBzcGVjaWZpZWQgbGF5ZXJcblx0ICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG5cdCAqIEByZXR1cm5zIEJhc2VMYXllclxuXHQgKi9cblx0Z2V0TGF5ZXIobmFtZTogc3RyaW5nKTogQmFzZUxheWVyIHtcblx0XHRpZiAodHlwZW9mIHRoaXMubGF5ZXJzW25hbWVdICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRoaXMubGF5ZXJzW25hbWVdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogRmFzZSBkbWQgYnJpZ2h0bmVzcyBvdXRcblx0ICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIGluIG1zXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcblx0ICovXG5cdGZhZGVPdXQoZHVyYXRpb246IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHZhciBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblx0XHR2YXIgdGhhdCA9IHRoaXM7XG5cblx0XHR2YXIgc3RhcnRCcmlnaHRuZXNzID0gdGhhdC5yZW5kZXJlci5icmlnaHRuZXNzO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuXHRcdFx0dmFyIGNiID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgZGVsdGEgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydDtcblx0XHRcdFx0dmFyIGIgPSBzdGFydEJyaWdodG5lc3MgLSBFYXNpbmcuZWFzZU91dFNpbmUoZGVsdGEsIDAsIHN0YXJ0QnJpZ2h0bmVzcywgZHVyYXRpb24pO1xuXHRcdFx0XHR0aGF0LnJlbmRlcmVyLnNldEJyaWdodG5lc3MoYik7XG5cblx0XHRcdFx0aWYgKHRoYXQucmVuZGVyZXIuYnJpZ2h0bmVzcyA8PSAwIHx8IGRlbHRhID4gZHVyYXRpb24pIHtcblx0XHRcdFx0XHR0aGF0LnJlbmRlcmVyLnNldEJyaWdodG5lc3MoMCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNldFRpbWVvdXQoY2IsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjYigpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEZhZGUgRE1EIGJyaWdodG5lc3MgaW5cblx0ICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIGluIG1zXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuXHQgKi9cblx0ZmFkZUluKGR1cmF0aW9uOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR2YXIgc3RhcnQgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0dmFyIHRoYXQgPSB0aGlzO1xuXG5cdFx0dmFyIHN0YXJ0QnJpZ2h0bmVzcyA9IHRoYXQucmVuZGVyZXIuYnJpZ2h0bmVzcztcblxuXHRcdHZhciBjbnQgPSAwO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuXHRcdFx0dmFyIGNiID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRjbnQrKztcblx0XHRcdFx0dmFyIGRlbHRhID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQ7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coZGVsdGEpO1xuXHRcdFx0XHR2YXIgYiA9IEVhc2luZy5lYXNlT3V0U2luZShkZWx0YSwgc3RhcnRCcmlnaHRuZXNzLCAxLCBkdXJhdGlvbik7XG5cdFx0XHRcdHRoYXQucmVuZGVyZXIuc2V0QnJpZ2h0bmVzcyhiKTtcblxuXHRcdFx0XHRpZiAodGhhdC5yZW5kZXJlci5icmlnaHRuZXNzID49IDEgfHwgZGVsdGEgPiBkdXJhdGlvbikge1xuXHRcdFx0XHRcdHRoYXQucmVuZGVyZXIuc2V0QnJpZ2h0bmVzcygxKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGNudCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNldFRpbWVvdXQoY2IsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjYigpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNldCBETUQgb3BhY2l0eSBiZXR3ZXduIDAgYW5kIDI1NVxuXHQgKiBAcGFyYW0ge251bWJlcn0gYlxuXHQgKi9cblx0c2V0QnJpZ2h0bmVzcyhiOiBudW1iZXIpIHtcblx0XHQvLyBQYXNzIGJyaWdodG5lc3MgdG8gdGhlIHJlbmRlcmVyXG5cdFx0dGhpcy5yZW5kZXJlci5zZXRCcmlnaHRuZXNzKGIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZCBhIHJlbmRlcmVyIGluc3RhbmNlIHRvIHRoZSBETURcblx0ICogVE9ETyA6IENoZWNrIGlmIHJlYWxseSBhIHJlbmRlcmVyIGNsYXNzXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpZCAodW5pcXVlKVxuXHQgKiBAcGFyYW0ge0lSZW5kZXJlcn0gcmVuZGVyZXIgXG5cdCAqL1xuXHRhZGRSZW5kZXJlcihpZDogc3RyaW5nLCByZW5kZXJlcjogSVJlbmRlcmVyKSB7XG5cblx0XHRpZiAodGhpcy5pc1J1bm5pbmcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlJlbmRlcmVycyBtdXN0IGJlIGFkZGVkIGJlZm9yZSBjYWxsaW5nIERNRC5pbml0KClcIilcblx0XHR9XG5cblx0XHQvLyBUT0RPIGNoZWNrIGlmIHJlbmRlcmVyIGlzIGEgcmVuZGVyZXIgY2xhc3Ncblx0XHRpZiAodHlwZW9mIHRoaXMubGF5ZXJSZW5kZXJlcnNbaWRdID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aWYgKHR5cGVvZiByZW5kZXJlciA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHJlbmRlcmVyLnJlbmRlckZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdHRoaXMubGF5ZXJSZW5kZXJlcnNbaWRdID0gcmVuZGVyZXI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJSZW5kZXJlciBvYmplY3QgbWlnaHQgbm90IGJlIGEgUmVuZGVyZXIgY2xhc3NcIik7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgQSByZW5kZXJlciB3aXRoIHRoaXMgaWRbJHtpZH1dIGFscmVhZHkgZXhpc3RzYCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBETUQgYnJpZ2h0bmVzc1xuXHQgKi9cblx0Z2V0IGJyaWdodG5lc3MoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVuZGVyZXIuYnJpZ2h0bmVzcztcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgY2FudmFzXG5cdCAqL1xuXHRnZXQgY2FudmFzKCkge1xuXHRcdHJldHVybiB0aGlzLm91dHB1dENhbnZhcztcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgY2FudmFzIGNvbnRleHRcblx0ICovXG5cdGdldCBjb250ZXh0KCkge1xuXHRcdHJldHVybiB0aGlzLm91dHB1dENvbnRleHQ7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIHdpZHRoIG9mIHRoZSBETkQgKGRvdHMpXG5cdCAqL1xuXHRnZXQgd2lkdGgoKSB7XG5cdFx0cmV0dXJuIHRoaXMub3V0cHV0V2lkdGg7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGhlaWdodCBvZiB0aGUgRE5EIChkb3RzKVxuXHQgKi9cblx0Z2V0IGhlaWdodCgpIHtcblx0XHRyZXR1cm4gdGhpcy5vdXRwdXRIZWlnaHQ7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIHdpZHRoIG9mIHRoZSBjYW52YXMgKHBpeGVscylcblx0ICovXG5cdGdldCBzY3JlZW5XaWR0aCgpIHtcblx0XHRyZXR1cm4gdGhpcy5vdXRwdXRDYW52YXMud2lkdGg7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGhlaWdodCBvZiB0aGUgY2FudmFzIChwaXhlbHMpXG5cdCAqL1xuXHRnZXQgc2NyZWVuSGVpZ2h0KCkge1xuXHRcdHJldHVybiB0aGlzLm91dHB1dENhbnZhcy5oZWlnaHQ7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGN1cnJlbnQgZnBzIHZhbHVlXG5cdCAqL1xuXHRnZXQgZnBzKCkge1xuXHRcdHJldHVybiB0aGlzLl9mcHM7XG5cdH1cbn1cblxuZXhwb3J0IHsgRE1ELCBEb3RTaGFwZSB9OyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==