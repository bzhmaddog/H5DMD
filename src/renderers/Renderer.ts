import {Options} from "../Options.js"

abstract class Renderer {

    protected _adapter: GPUAdapter
    protected _device: GPUDevice
    protected _shaderModule: GPUShaderModule

    private _name: string
    protected _initDone: boolean

    constructor(name: string) {
        this._name = name
    }


    abstract init(): Promise<void>

    abstract renderFrame(frameData: ImageData, options?: Options): Promise<ImageData>

    get name(): string {
        return this._name
    }
}

interface IRendererDictionary {
    [index: string]: Renderer
}

export { Renderer, IRendererDictionary }