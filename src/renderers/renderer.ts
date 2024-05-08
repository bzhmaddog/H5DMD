import {Options} from "../utils"

export abstract class Renderer {

    protected _adapter: GPUAdapter
    protected _device: GPUDevice
    protected _shaderModule: GPUShaderModule

    private readonly _name: string
    protected _initDone: boolean

    protected constructor(name: string) {
        this._name = name
        this._initDone = false
    }


    abstract init(): Promise<void>

    abstract renderFrame(frameData: ImageData, options?: Options): Promise<ImageData>

    get name(): string {
        return this._name
    }
}