import {Renderer} from './renderer'
import {LayerRenderer} from './layer-renderer'
import {Utils} from '../utils'

export interface OutlineRendererParams {
    /** Fill color of the inner text region (RRGGBBAA hex string). Default: `'FFFFFFFF'`. */
    innerColor?: string
    /** Outline color (RRGGBBAA hex string). Default: `'000000FF'`. */
    outerColor?: string
    /** Outline thickness in pixels. Default: `1`. */
    width?: number
}

class OutlineRenderer extends LayerRenderer<OutlineRendererParams> {

    private _innerColor: string
    private _outerColor: string
    private _outlineWidth: number
    private _uboBuffer: GPUBuffer
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline

    /**
     * @param {number} width
     * @param {number} height
     * @param {OutlineRendererParams} params Optional defaults for colors and outline thickness.
     */
    constructor(width: number, height: number, params?: OutlineRendererParams) {
        super("OutlineRenderer", width, height)
        this._innerColor   = params?.innerColor ?? 'FFFFFFFF'
        this._outerColor   = params?.outerColor ?? '000000FF'
        this._outlineWidth = params?.width      ?? 1
    }

    init(): Promise<void> {

        return new Promise((resolve, reject) => {

            Renderer.requestSharedDevice().then( device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct UBO {
                                innerColor: u32,
                                outerColor: u32,
                                lineWidth: u32
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
                                let index : u32 = global_id.x + global_id.y * ${this._width}u;
                                let lineSize : u32 = ${this._width}u;

                                let pixelColor : u32 = inputPixels.rgba[index];
                                let innerColor : u32 = uniforms.innerColor;
                                let outerColor : u32 = uniforms.outerColor;
                                let lineWidth : u32 = uniforms.lineWidth;

                                
                                var a : u32 = (pixelColor >> 24u) & 255u;
                                let b : u32 = (pixelColor >> 16u) & 255u;
                                let g : u32 = (pixelColor >> 8u) & 255u;
                                let r : u32 = (pixelColor & 255u);
                                

                                // if inner color pixel found check pixels around
                                if (pixelColor != innerColor) {

                                    var innerColorFound = false;
                                    
                                    if (global_id.x >= lineWidth && global_id.x < ${this._width}u - lineWidth && global_id.y >= lineWidth && global_id.y < ${this._height}u - lineWidth) {
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


                                    if (innerColorFound) {
                                        outputPixels.rgba[index] = outerColor;
                                    } else {
                                        outputPixels.rgba[index] = pixelColor;
                                        //outputPixels.rgba[index] = 4294967040u;
                                    }

                                } else {
                                    outputPixels.rgba[index] = pixelColor;
                                }

                                //outputPixels.rgba[index] = 4278190335u;
                            }
                        `
                    })

                    console.log('OutlineRenderer:init()')

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
            size: 3 * 4,
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
     * Render frame.
     * Reuses the GPU resources created in init() : only per-frame data
     * (pixels + uniforms) is uploaded each call.
     * @param {ImageData} frameData 
     * @param {OutlineRendererParams} options
     * @returns {Promise<ImageData>}
     */
    private _doRendering(frameData: ImageData, options?: OutlineRendererParams): Promise<ImageData> {

        // Upload frame pixels into the persistent input buffer
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        // Write values to uniform buffer object — per-call options override constructor defaults
        const innerColor   = options?.innerColor   ?? this._innerColor
        const outerColor   = options?.outerColor   ?? this._outerColor
        const outlineWidth = options?.width        ?? this._outlineWidth

        const uniformData = [
            Utils.hexColorToInt(Utils.rgba2abgr(innerColor)),
            Utils.hexColorToInt(Utils.rgba2abgr(outerColor)),
            outlineWidth
        ]
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

export { OutlineRenderer }