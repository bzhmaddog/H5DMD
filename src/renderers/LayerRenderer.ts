import { Renderer } from "./Renderer.js";
import { Options } from "../Options.js";

abstract class LayerRenderer extends Renderer {

    protected _width: number;
    protected _height: number;
    protected _bufferByteLength: number;

    constructor(
        name: string,
        width: number,
        height: number
    ) {
        super(name);
        this._width = width;
        this._height = height;
        this._bufferByteLength = width * height * 4;
        this.renderFrame = this._doNothing;
    }

	abstract init(): Promise<void>;
    renderFrame: (frameData: ImageData, options?: Options) => Promise<ImageData>;

    /**
     * Does nothing except returning passed data (placeholder until init is done)
     * @param {ImageData} frameData 
     * @returns {Promise<ImageData>}
     */
    protected _doNothing(frameData: ImageData): Promise<ImageData> {
        return new Promise(resolve =>{
            resolve(frameData);
        });
    }
}

interface ILayerRendererDictionary {
    [index: string]: LayerRenderer
}

interface ILayerRendererParamDictionary {
	[index: string]: any
}


export { LayerRenderer, ILayerRendererDictionary, ILayerRendererParamDictionary }