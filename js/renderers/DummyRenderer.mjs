class DummyRenderer {

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
                            [[block]] struct Image {
                                rgba: array<u32>;
                            };

                            [[group(0), binding(0)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(1)]] var<storage,write> outputPixels: Image;
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${that.#width}u;
                                let pixelColor : u32 = inputPixels.rgba[index];
                                outputPixels.rgba[index] = pixelColor;
                            }
                        `
                    });

                    console.warn('ChangeAlphaRenderer:init() : Are you sure you wanted to use this renderer ?');

                    this.#shaderModule.compilationInfo().then(i => {
                        if (i.messages.length > 0 ) {
                            console.warn("ChangeAlphaRenderer:compilationInfo() ", i.messages);
                        }
                    });

                    that.#renderFrame = that.#doRendering;
                    resolve();
                });    
            });
       });
    
    }

    /**
     * Does nothing except returning passed data (placeholder until init is done)
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    #doNothing(frameData) {
        return new Promise(resolve =>{
            resolve(frameData);
        });
    }

    /**
     * This renderer serve as a template for other renderers. It does nothing but returning the exact array of pixels it was provided
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    #doRendering(frameData) {
        const that = this;

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

            const commandEncoder = that.#device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();

            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatch(that.#width, that.#height);
            passEncoder.endPass();

            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that.#bufferByteLength);
    
            that.#device.queue.submit([commandEncoder.finish()]);
    
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());

                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that.#width, that.#height);


                // return to caller
                resolve(imageData);
            });
        });
	}

}

export { DummyRenderer }