import {LayerRenderer} from "./layer-renderer"

class RemoveAlphaRenderer extends LayerRenderer {

    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _outputBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline

    /**
     * @param {number} width 
     * @param {number} height 
     */
    constructor(width: number, height: number) {
        super("RemoveAlphaRenderer", width, height)
    }

    init(): Promise<void> {

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                this._adapter = adapter
            
                adapter.requestDevice().then( device => {
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
                        `
                    })

                    console.log('RemoveAlphaRenderer:init()')

                    this._shaderModule.getCompilationInfo()?.then(i => {
                        if (i.messages.length > 0 ) {
                            console.warn("RemoveAlphaRenderer:compilationInfo() ", i.messages)
                        }
                    })

                    this._createResources()

                    this.renderFrame = this._doRendering
                    resolve()
                })
            })
       })
    
    }

    /**
     * Create and cache the GPU resources reused across frames.
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {

        this._inputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        this._tempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })

        this._outputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        })

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

        commandEncoder.copyBufferToBuffer(this._tempBuffer, 0, this._outputBuffer, 0, this._bufferByteLength)

        this._device.queue.submit([commandEncoder.finish()])

        return new Promise( resolve => {

            // Render Dmd output
            this._outputBuffer.mapAsync(GPUMapMode.READ).then( () => {

                // Grab data from output buffer (copy out before unmapping)
                const pixelsBuffer = new Uint8Array(this._outputBuffer.getMappedRange())

                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), this._width, this._height)

                // Release the mapping so the buffer can be reused next frame
                this._outputBuffer.unmap()

                // return to caller
                resolve(imageData)
            })
        })
	}

}

export { RemoveAlphaRenderer }