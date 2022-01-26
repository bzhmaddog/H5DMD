
class UpScaler {

    #adapter;
    #device;
    #dmdWidth;
    #dmdHeight;
    #screenWidth;
    #screenHeight;
	#pixelSize;
    #shaderModule;
    #dmdBufferByteLength;
    #screenBufferByteLength;

    /**
     * 
     * @param {number} dmdWidth 
     * @param {number} dmdHeight 
     * @param {number} screenWidth 
     * @param {number} screenHeight 
     * @param {number} pixelSize
     */
    constructor(dmdWidth, dmdHeight, screenWidth, screenHeight, pixelSize) {

        console.log(arguments);

        this.#dmdWidth = dmdWidth;
        this.#dmdHeight = dmdHeight;
        this.#screenWidth = screenWidth;
		this.#screenHeight = screenHeight;
        this.#pixelSize = pixelSize;
        this.#device;
        this.#adapter;
        this.#shaderModule;
        this.#dmdBufferByteLength = dmdWidth*dmdHeight * 4;
        this.#screenBufferByteLength = screenWidth * screenHeight * 4;
        this.resize = this.#doNothing;
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

                            fn f2i(f: f32) -> u32 {
                                return u32(ceil(f));
                            }

                            [[group(0), binding(0)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(1)]] var<storage,write> outputPixels: Image;
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                var index : u32 = global_id.x + global_id.y *  ${that.#dmdWidth}u;
                                var pixel : u32 = inputPixels.rgba[index];

                                if (pixel == 4286775086u) {
                                    pixel = 0u;
                                }

                
                                // First byte index of the output dot
                                var resizedPixelIndex : u32 = global_id.x * ${that.#pixelSize}u  + global_id.y * ${that.#screenWidth}u * ${that.#pixelSize}u;
                
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

                    that.resize = that.#doResize;
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
    #doResize(frameData) {

        const that = this;

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
}

export { UpScaler }