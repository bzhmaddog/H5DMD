/**
 * Provide a simple class to build a buffer for our layers and our DMD
 */
class OffscreenBuffer {
    /**
    * @param width {integer} The width of the buffer
    * @param height {integer} The height of the buffer
    */
    constructor(width, height, willReadFrequently = true) {
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
    get context() {
        return this._context;
    }
    get canvas() {
        return this._canvas;
    }
    get width() {
        return this._canvas.width;
    }
    get height() {
        return this._canvas.height;
    }
    set width(width) {
        this._canvas.width = width;
    }
    set height(height) {
        this._canvas.height = height;
    }
    clear() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}
export { OffscreenBuffer };
//# sourceMappingURL=OffscreenBuffer.js.map