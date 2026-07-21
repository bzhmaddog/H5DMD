import { Renderer } from './renderer'
import { LayerRenderer } from './layer-renderer'

class RemoveAlphaRenderer extends LayerRenderer {
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline

    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width: number, height: number) {
        super('RemoveAlphaRenderer', width, height)
    }

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            Renderer.requestSharedDevice()
                .then(device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct Image {
                                rgba: array<u32>
                            }

                            @group(0) @binding(0) var<storage,read> inputPixels: Image;
                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${this._width}u;

                                var pixel : u32 = inputPixels.rgba[index];
                                
                                //let a : u32 = (pixel >> 24u) & 255u;
                                let b : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let r : u32 = (pixel & 255u);
               
                                outputPixels.rgba[index] = 255u << 24u | b << 16u | g << 8u | r;
                            }
                        `,
                    })

                    console.log('RemoveAlphaRenderer:init()')

                    this._validateShader(reject).then(valid => {
                        if (!valid) return
                        this._createResources()
                        this.renderFrame = this._doRendering
                        resolve()
                    })
                })
                .catch(reject)
        })
    }

    /**
     * Create and cache the GPU resources reused across frames.
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {
        this._inputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })

        this._tempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        })

        this._createOutputBuffers()

        const bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: 'read-only-storage',
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: 'storage',
                    },
                },
            ],
        })

        this._bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._inputBuffer,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this._tempBuffer,
                    },
                },
            ],
        })

        this._computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout],
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: 'main',
            },
        })
    }

    /**
     * Apply filter to provided data then return altered data.
     * Reuses the GPU resources created in init() : only per-frame pixels
     * are uploaded each call.
     * @param {ImageData} frameData
     * @returns {Promise<ImageData>}
     */
    private _doRendering(frameData: ImageData): Promise<ImageData> {
        // Upload frame pixels into the persistent input buffer
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        const commandEncoder = this._device.createCommandEncoder()
        const passEncoder = commandEncoder.beginComputePass()

        passEncoder.setPipeline(this._computePipeline)
        passEncoder.setBindGroup(0, this._bindGroup)
        passEncoder.dispatchWorkgroups(this._width, this._height)
        passEncoder.end()

        return this._submitAndReadback(this._tempBuffer, commandEncoder) || Promise.resolve(frameData)
    }
}

export { RemoveAlphaRenderer }
