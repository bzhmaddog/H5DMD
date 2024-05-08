import {LayerRenderer} from './layerRenderer'
import {Options, Utils} from '../utils'

class RemoveAliasingRenderer extends LayerRenderer {

    /**
     * @param {number} width 
     * @param {number} height 
     */
    constructor(width: number, height: number) {
        super("RemoveAliasingRenderer", width, height)
    }

    init(): Promise<void> {

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                this._adapter = adapter
            
                adapter.requestDevice().then( device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct UBO {
                                treshold : u32,
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


                                    if (innerColorFound && a >= uniforms.treshold && a < 255u) {
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

                    this._shaderModule.getCompilationInfo()?.then(i => {
                        if (i.messages.length > 0 ) {
                            console.warn("RemoveAliasingRenderer:compilationInfo() ", i.messages)
                        }
                    })

                    this.renderFrame = this._doRendering
                    resolve()
                })
            })
       })
    
    }

    private _doRendering(frameData: ImageData, _options?: Options): Promise<ImageData> {

        const options = new Options({
            treshold: 0,
            baseColor: 'FFFFFFFF' // Check Impact
        }).merge(_options)

        const UBOBuffer = this._device.createBuffer({
            size: 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

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
                },
                {
                    binding: 2, 
                    resource: {
                      buffer: UBOBuffer
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
        
           // Write values to uniform buffer object
            const uniformData = [options.get('treshold'), Utils.hexColorToInt(Utils.rgba2abgr(options.get('baseColor')))]

            const uniformTypedArray = new Int32Array(uniformData)

            this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer)

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

export { RemoveAliasingRenderer }