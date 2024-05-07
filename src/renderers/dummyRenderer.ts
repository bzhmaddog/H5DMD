import {LayerRenderer} from "./layerRenderer"

class DummyRenderer extends LayerRenderer {


    /**
     * @param {number} width 
     * @param {number} height 
     */

    constructor(width: number, height: number) {
        super("DummyRenderer", width, height)
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
                                let pixelColor : u32 = inputPixels.rgba[index];
                                outputPixels.rgba[index] = pixelColor;
                            }
                        `
                    })

                    console.error('DummyRenderer:init() : Are you sure you wanted to use this renderer ?')

                    this._shaderModule.getCompilationInfo()?.then(i => {
                        if (i.messages.length > 0 ) {
                            console.warn("DummyRenderer:compilationInfo() ", i.messages)
                        }
                    })

                    this.renderFrame = this._doRendering
                    resolve()
                })
            })
       })
    
    }



    /**
     * This renderer serve as a template for other renderers. It does nothing but returning the exact array of pixels it was provided
     * @param {ImageData} frameData 
     * @returns {Promise<ImageData>}
     */
    private _doRendering(frameData: ImageData): Promise<ImageData> {

        const gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        })
    
        const gpuTempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })
    
        const gpuOutputBuffer = this._device.createBuffer({
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
    
        const bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                }
            ]
        })

        const computePipeline =this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        })


        return new Promise( resolve => {
         
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data))
            gpuInputBuffer.unmap()

            const commandEncoder = this._device.createCommandEncoder()
            const passEncoder = commandEncoder.beginComputePass()

            passEncoder.setPipeline(computePipeline)
            passEncoder.setBindGroup(0, bindGroup)
            passEncoder.dispatchWorkgroups(this._width, this._height)
            passEncoder.end()

            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, this._bufferByteLength)

            this._device.queue.submit([commandEncoder.finish()])

            // Render Dmd output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange())

                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), this._width, this._height)


                // return to caller
                resolve(imageData)
            })
        })
	}

}

export { DummyRenderer }