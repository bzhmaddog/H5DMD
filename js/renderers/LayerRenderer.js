import { Renderer } from "./Renderer.js";
class LayerRenderer extends Renderer {
    constructor(name, width, height) {
        super(name);
        this._width = width;
        this._height = height;
        this._bufferByteLength = width * height * 4;
        this.renderFrame = this._doNothing;
    }
    /**
     * Does nothing except returning passed data (placeholder until init is done)
     * @param {ImageData} frameData
     * @returns {Promise<ImageData>}
     */
    _doNothing(frameData) {
        return new Promise(resolve => {
            resolve(frameData);
        });
    }
}
export { LayerRenderer };
//# sourceMappingURL=LayerRenderer.js.map