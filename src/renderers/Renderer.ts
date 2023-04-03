
abstract class Renderer {

    protected _adapter: GPUAdapter
    protected _device: GPUDevice
    protected _shaderModule: GPUShaderModule

    private _name: String
    protected _initDone: Boolean

    constructor(name: String) {
        this._name = name
    }


    abstract init(): Promise<void>
    abstract renderFrame(frameData: ImageData, options?: {}): Promise<ImageData>

    getName(): String {
        return this._name
    }
}

interface IRendererDictionary {
    [index: string]: Renderer
}

export { Renderer, IRendererDictionary }