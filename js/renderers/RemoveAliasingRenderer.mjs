import { Utils } from '../Utils.mjs';

class RemoveAliasingRenderer {

    #adapter;
    #device;
    #width;
    #height;
    #shaderModule;
    #bufferByteLength;
    renderFrame;
    
    /**
     * @param {*} _width 
     * @param {*} _height 
     */

    constructor(_width, _height) {
        this.#device;
        this.#adapter;
        this.#shaderModule;
        this.#width = _width;
        this.#height = _height;
        this.#bufferByteLength = _width * _height * 4;
        this.renderFrame = this.#doNothing;
    }

    init() {
        const that = this;

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                that.#adapter = adapter;
            
                adapter.requestDevice().then( device => {
                    that.#device = device;

                    that.#shaderModule = device.createShaderModule({
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
                                let lineSize : u32 = ${that.#width}u;
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

                                    if (global_id.x > 0u && global_id.x < ${that.#width - 1}u && global_id.y > 0u && global_id.y < ${that.#height - 1}u) {

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
                                        outputPixels.rgba[index] = 255u << 24u | b << 16u | g << 8u | r;
                                        //outputPixels.rgba[index] = 255u << 24u | 255u << 16u | 255u << 8u | 0u;
                                    } else {
                                        outputPixels.rgba[index] = 0u << 24u | b << 16u | g << 8u | r;
                                        //outputPixels.rgba[index] = 255u << 24u | 0u << 16u | 0u << 8u | 255u;
                                    }

                                }
                                // else {
                                    //outputPixels.rgba[index] = 200u << 24u | 0u << 16u | 0u << 8u | 0u;
                               // }

                               //outputPixels.rgba[index] = 255u << 24u | 255u << 16u | 255u << 8u | 255u;
             
                            }
                        `
                    });

                    console.log('RemoveAliasingRenderer:init()');

                    that.#shaderModule.compilationInfo().then(i=>{
                        if (i.messages.length > 0 ) {
                            console.warn("RemoveAliasingRenderer:compilationInfo() ", i.messages);
                        }
                    });

                    that.renderFrame = that.#doRendering;
                    resolve();
                });    
            });
       });
    
    }

    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {*} frameDate 
     * @returns 
     */
    #doNothing(frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(resolve =>{
            resolve(frameData);
        });        
    }

    #doRendering(frameData, treshold, baseColor) {
        const that = this;

        const UBOBuffer = this.#device.createBuffer({
            size: 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const gpuInputBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
    
        const gpuTempBuffer = this.#device.createBuffer({
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
    
        const gpuOutputBuffer = this.#device.createBuffer({
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
    
        const bindGroupLayout = this.#device.createBindGroupLayout({
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
        });
    
        const bindGroup = this.#device.createBindGroup({
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
        });

        const computePipeline =this.#device.createComputePipeline({
            layout: this.#device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this.#shaderModule,
                entryPoint: "main"
            }
        });        

        return new Promise( resolve => {

            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData));
            gpuInputBuffer.unmap();
        
           // Write values to uniform buffer object
            const uniformData = [treshold, Utils.hexColorToInt(Utils.rgba2abgr(baseColor))];

            const uniformTypedArray = new Int32Array(uniformData);

            this.#device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);      

            const commandEncoder = that.#device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();

            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that.#width, that.#height);
            passEncoder.end();

            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that.#bufferByteLength);
    
            that.#device.queue.submit([commandEncoder.finish()]);
    
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());

                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that.#width, that.#height);

                //console.log(imageData.data);

                // return to caller
                resolve(imageData);
            });
        });
	}

}

export { RemoveAliasingRenderer }