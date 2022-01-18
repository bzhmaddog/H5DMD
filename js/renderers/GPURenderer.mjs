
class GPURenderer {

    #adapter;
    #device;
    #dmdWidth;
    #dmdHeight;
    #screenWidth;
    #screenHeight;
	#dotSpace;
	#pixelSize;
	#dotShape;
    #shaderModule;
    #dmdBufferByteLength;
    #screenBufferByteLength;
    #bgBrightness;
    #bgColor;
    #brightness;
    renderFrame;


    /**
     * 
     * @param {number} dmdWidth 
     * @param {number} dmdHeight 
     * @param {number} screenWidth 
     * @param {number} screenHeight 
     * @param {number} pixelSize
     * @param {number} dotSpace 
     * @param {*} dotShape 
     * @param {number} bgBrightness 
     * @param {number} brightness
     */
    constructor(dmdWidth, dmdHeight, screenWidth, screenHeight, pixelSize, dotSpace, dotShape, bgBrightness, brightness) {

        //console.log(arguments);

        this.#dmdWidth = dmdWidth;
        this.#dmdHeight = dmdHeight;
        this.#screenWidth = screenWidth;
		this.#screenHeight = screenHeight;
        this.#pixelSize = pixelSize;
        this.#dotSpace = dotSpace;
        this.#dotShape = dotShape;
        this.#device;
        this.#adapter;
        this.#shaderModule;
        this.#dmdBufferByteLength = dmdWidth*dmdHeight * 4;
        this.#screenBufferByteLength = screenWidth * screenHeight * 4;
        this.renderFrame = this.#doNothing;


        this.#bgBrightness = 14;
        this.#bgColor = 4279176975;
        this.#brightness = 1;

        if (typeof bgBrightness === 'number') {
                this.#bgBrightness = bgBrightness;
                this.#bgColor = parseInt("FF" + this.#int2Hex(bgBrightness) + this.#int2Hex(bgBrightness) + this.#int2Hex(bgBrightness), 16);
        }

        if (typeof bgBrightness === 'number') {
            this.setBrightness(brightness);
        }
    }

    #int2Hex(n) {
        var hex = parseInt(n, 10).toString(16)

        if (hex.length < 2) {
            hex = "0" + hex;
        }
        
        return hex;
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
                            [[block]] struct UBO {
                                brightness: f32;
                            };

                            [[block]] struct Image {
                                rgba: array<u32>;
                            };

                            fn f2i(f: f32) -> u32 {
                                return u32(ceil(f));
                            }

                            [[group(0), binding(0)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(1)]] var<storage,write> outputPixels: Image;
                            [[group(0), binding(2)]] var<uniform> uniforms : UBO;                            
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                var bgBrightness : u32 = ${that.#bgBrightness}u;
                                var index : u32 = global_id.x + global_id.y *  ${that.#dmdWidth}u;
                                var pixel : u32 = inputPixels.rgba[index];
                                var brightness : f32 = uniforms.brightness;
                                var br = 0u;
                                var bg = 0u;
                                var bb = 0u;
                                
                                let a : u32 = (pixel >> 24u) & 255u;
                                let b : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let r : u32 = (pixel & 255u);

                                // If component is above darkest color then apply brightness limiter
                                if (r >= bgBrightness) {
                                    br = bgBrightness + f2i(f32(r - bgBrightness) * brightness);
                                }

                                // If component is above darkest color then apply brightness limiter
                                if (g >= bgBrightness) {
                                    bg = bgBrightness + f2i(f32(g - bgBrightness) * brightness);
                                }

                                // If component is above darkest color then apply brightness limiter
                                if (b >= bgBrightness) {
                                    bb = bgBrightness + f2i(f32(b - bgBrightness) * brightness);
                                }

                                // Recreate pixel color but force alpha to 255
                                pixel = 255u << 24u | bb << 16u | bg << 8u | br;

                                var t : u32 = br + bg + bb;
                
                                // Pixels that are too dark will be hacked to give the 'off' dot look of the DMD
                                //if ( (br < bgBrightness && bg < bgBrightness && bb < bgBrightness) || brightness == 0f) {
                                //    pixel = ${that.#bgColor}u;
                                    //pixel = 4278190335u;
                                //}

                                if (t < bgBrightness*3u) {
                                    pixel = ${that.#bgColor}u;
                                    //pixel = 4294901760u;
                                }
                
                                // First byte index of the output dot
                                var resizedPixelIndex : u32 = (global_id.x * ${that.#pixelSize}u)  + (global_id.x * ${that.#dotSpace}u) + (global_id.y * ${that.#screenWidth}u * (${that.#pixelSize}u + ${that.#dotSpace}u));
                
                                for ( var row: u32 = 0u ; row < ${that.#pixelSize}u; row = row + 1u ) {
                                    for ( var col: u32 = 0u ; col < ${that.#pixelSize}u; col = col + 1u ) {
                                        outputPixels.rgba[resizedPixelIndex] = pixel;
                                        resizedPixelIndex = resizedPixelIndex + 1u;
                                    }
                                    resizedPixelIndex = resizedPixelIndex + ${that.#screenWidth}u - ${that.#pixelSize}u;
                                }
                            }
                        `
                    });

                    console.log("GPURenderer:init()");

                    this.#shaderModule.compilationInfo().then(i=>{
                        if (i.messages.length > 0 ) {
                            console.warn('GPURenderer:compilationInfo()', i.messages);
                        }
                    });

                    that.renderFrame = that.#doRendering;
                    resolve(device);
                });    
            });
       });
    
    }

    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {*} frameData
     * @returns 
     */
     #doNothing(frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(resolve =>{
            resolve(frameData);
        });        
    }

    /**
     * Render a DMD frame
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    #doRendering(frameData) {

        const that = this;

        const UBOBuffer = this.#device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const gpuInputBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: this.#dmdBufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
    
        const gpuTempBuffer = this.#device.createBuffer({
            size: this.#screenBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
    
        const gpuOutputBuffer = this.#device.createBuffer({
            size: this.#screenBufferByteLength,
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

            //new Uint8Array(gpuConfBuffer.getMappedRange()).set(new Uint8Array([this.#brightness]));
            //gpuConfBuffer.unmap();

            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData));
            gpuInputBuffer.unmap();

            // Write values to uniform buffer object
            const uniformData = [this.#brightness];
            const uniformTypedArray = new Float32Array(uniformData);
            this.#device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);            
    
            const commandEncoder = that.#device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatch(that.#dmdWidth, that.#dmdHeight);
            passEncoder.endPass();
    
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that.#screenBufferByteLength);
    
            that.#device.queue.submit([commandEncoder.finish()]);
    
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
    
                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that.#screenWidth, that.#screenHeight);

               // console.log(imageData);
    
                // return to caller
                resolve(imageData);
            });
        });
	}

    /**
	 * Set brightness of the dots between 0 and 1 (does not affect the background color)
     * @param {float} b 
     */
    setBrightness(b) {
        var b = Math.max(0, Math.min(Number.parseFloat(b), 1)); // normalize
        this.#brightness = Math.round(b * 1e3) / 1e3; // round to 1 digit after dot
    }

    get brightness() {
        return this.#brightness;
    }

}

export { GPURenderer }