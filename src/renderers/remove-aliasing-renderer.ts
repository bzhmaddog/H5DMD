import {Renderer} from './renderer'
import {LayerRenderer} from './layer-renderer'
import {Utils} from '../utils'

export interface RemoveAliasingRendererParams {
    /** Alpha threshold — semi-transparent pixels above this value are fully opaqued. Default: `0`. */
    threshold?: number
    /** Inner base color (RRGGBBAA hex string) used to detect the text boundary. Default: `'FFFFFFFF'`. */
    baseColor?: string
}

class RemoveAliasingRenderer extends LayerRenderer<RemoveAliasingRendererParams> {

    private _threshold: number
    private _baseColor: string
    private _uboBuffer: GPUBuffer
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline

    /**
     * @param {number} width
     * @param {number} height
     * @param {RemoveAliasingRendererParams} params Optional defaults for threshold and baseColor.
     */
    constructor(width: number, height: number, params?: RemoveAliasingRendererParams) {
        super("RemoveAliasingRenderer", width, height)
        this._threshold = params?.threshold ?? 0
        this._baseColor  = params?.baseColor  ?? 'FFFFFFFF'
    }

    init(): Promise<void> {

        return new Promise((resolve, reject) => {

            Renderer.requestSharedDevice().then( device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct UBO {
                                threshold : u32,
                                baseColor : u32
                            }
                            struct Image {
                                rgba: array<u32>
                            }

                            @group(0) @binding(0) var<storage,read> inputPixels: Image;
                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;
                            @group(0) @binding(2) var<uniform> uniforms : UBO;

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                                let lineSize : u32 = ${this._width}u;
                                let lineWidth : u32 = 1u;

                                let index : u32 = global_id.x + global_id.y * lineSize;
                                var pixelColor : u32 = inputPixels.rgba[index];
                                
                                let a : u32 = (pixelColor >> 24u) & 255u;
                                let b : u32 = (pixelColor >> 16u) & 255u;
                                let g : u32 = (pixelColor >> 8u) & 255u;
                                let r : u32 = (pixelColor & 255u);

                                outputPixels.rgba[index] = pixelColor;

                                //let innerColor: u32 =  255u << 24u | a << 16u | g << 8u | r;
                                //let innerColor: u32 = 255u << 24u | 0u << 16u | 0u << 8u | 255u;
                                //let innerColor: u32 = 255u << 24u | 255u << 16u | 255u << 8u | 255u;
                                let innerColor = uniforms.baseColor;

                                if (a > 0u && pixelColor != innerColor) {

                                    var innerColorFound = false;

                                    if (global_id.x > 0u && global_id.x < ${this._width - 1}u && global_id.y > 0u && global_id.y < ${this._height - 1}u) {

                                        //outputPixels.rgba[index] = 255u << 24u | 255u << 16u | 255u << 8u | 0u;

                                        let topPixel = index - lineSize * lineWidth;
                                        let bottomPixel = index + lineSize * lineWidth;
                                        let leftPixel = index - lineWidth;
                                        let rightPixel = index + lineWidth;
                                        let topLeftPixel = topPixel - lineWidth;
                                        let topRightPixel = topPixel + lineWidth;
                                        let bottomLeftPixel = bottomPixel - lineWidth;
                                        let bottomRightPixel = bottomPixel + lineWidth;

                                        if (
                                            inputPixels.rgba[topPixel] == innerColor ||
                                            inputPixels.rgba[rightPixel] == innerColor ||
                                            inputPixels.rgba[bottomPixel] == innerColor ||
                                            inputPixels.rgba[leftPixel] == innerColor ||
                                            inputPixels.rgba[topLeftPixel] == innerColor ||
                                            inputPixels.rgba[topRightPixel] == innerColor ||
                                            inputPixels.rgba[bottomLeftPixel] == innerColor ||
                                            inputPixels.rgba[bottomRightPixel] == innerColor
                                        ) {
                                            innerColorFound = true;
                                        }
                                    }


                                    if (innerColorFound && a >= uniforms.threshold && a < 255u) {
                                        outputPixels.rgba[index] = (255u << 24u) | (b << 16u) | (g << 8u) | r;
                                    } else {
                                        outputPixels.rgba[index] = (0u << 24u) | (b << 16u) | (g << 8u) | r;
                                    }

                                }
                                // else {
                                    //outputPixels.rgba[index] = 200u << 24u | 0u << 16u | 0u << 8u | 0u;
                               // }

                               //outputPixels.rgba[index] = 255u << 24u | 255u << 16u | 255u << 8u | 255u;
             
                            }
                        `
                    })

                    console.log('RemoveAliasingRenderer:init()')

                    this._validateShader(reject).then(valid => {
                        if (!valid) return
                        this._createResources()
                        this.renderFrame = this._doRendering
                        resolve()
                    })
                }).catch(reject)
       })
    
    }

    /**
     * Create and cache the GPU resources reused across frames.
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {

        this._uboBuffer = this._device.createBuffer({
            size: 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        this._inputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        this._tempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })

        this._createOutputBuffers()

        const bindGroupLayout = this._device.createBindGroupLayout({
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
        })

        this._bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._inputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this._tempBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                      buffer: this._uboBuffer
                    }
                }
            ]
        })

        this._computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        })
    }

    /**
     * Apply filter to provided data then return altered data.
     * Reuses the GPU resources created in init() : only per-frame data
     * (pixels + uniforms) is uploaded each call.
     * @param {ImageData} frameData
     * @param {Options} _options
     * @returns {Promise<ImageData>}
     */
    private _doRendering(frameData: ImageData, options?: RemoveAliasingRendererParams): Promise<ImageData> {

        const threshold = options?.threshold ?? this._threshold
        const baseColor  = options?.baseColor  ?? this._baseColor

        // Upload frame pixels into the persistent input buffer
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        // Write values to uniform buffer object
        const uniformData = [threshold, Utils.hexColorToInt(Utils.rgba2abgr(baseColor))]
        const uniformTypedArray = new Int32Array(uniformData)
        this._device.queue.writeBuffer(this._uboBuffer, 0, uniformTypedArray.buffer)

        const commandEncoder = this._device.createCommandEncoder()
        const passEncoder = commandEncoder.beginComputePass()

        passEncoder.setPipeline(this._computePipeline)
        passEncoder.setBindGroup(0, this._bindGroup)
        passEncoder.dispatchWorkgroups(this._width, this._height)
        passEncoder.end()

        return this._submitAndReadback(this._tempBuffer, commandEncoder) || Promise.resolve(frameData)
	}

}

export { RemoveAliasingRenderer }