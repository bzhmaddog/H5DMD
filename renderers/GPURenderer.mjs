
class GPURenderer {

    #initDone;
    #adapter;
    #device;
    #dmdWidth;
    #dmdHeight;
    #screenWidth;
    #screenHeight;
	#xSpace;
	#ySpace;
	#pixelWidth;
	#pixelHeight;
	#dotShape;
    #shaderModule;
    #dmdBufferByteLength;
    #screenBufferByteLength;



    constructor(dmdWidth, dmdHeight, screenWidth, screenHeight, pixelWidth, pixelHeight, xSpace, ySpace, dotShape) {
        this.#dmdWidth = dmdWidth;
        this.#dmdHeight = dmdHeight;
        this.#screenWidth = screenWidth;
		this.#screenHeight = screenHeight;
        this.#pixelWidth = pixelWidth;
        this.#pixelHeight = pixelHeight;
        this.#xSpace = xSpace;
        this.#ySpace = ySpace;
        this.#dotShape = dotShape;
        this.#initDone = false;
        this.#device;
        this.#adapter;
        this.#shaderModule;

        this.#dmdBufferByteLength = dmdWidth*dmdHeight * 4;
        this.#screenBufferByteLength = screenWidth * screenHeight * 4;
    }


    init() {
        const that = this;

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                that.#adapter = adapter;
            
                adapter.requestDevice().then( device => {
                    that.#device = device;
                    that.#initDone = true;

                    that.#shaderModule = device.createShaderModule({
                        code: `
                            [[block]] struct Image {
                                rgba: array<u32>;
                            };
                            [[group(0), binding(0)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(1)]] var<storage,write> outputPixels: Image;
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                var index : u32 = global_id.x + global_id.y *  ${that.#dmdWidth}u;
                
                                var pixel : u32 = inputPixels.rgba[index];
                                
                                let a : u32 = (pixel >> 24u) & 255u;
                                let r : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let b : u32 = (pixel & 255u);
                                //pixel = a << 24u | r << 16u | g << 8u | b;
                
                                // Pixels that are too dark will be hacked to look like the background of the DMD
                                if (r < 15u && g < 15u && b < 15u ) {
                                    pixel = 4279176975u;
                                    //pixel = 4278190335u;
                                }
                
                                // First byte index of the output dot
                                var resizedPixelIndex : u32 = (global_id.x * ${that.#pixelWidth}u)  + (global_id.x * ${that.#xSpace}u) + (global_id.y * ${that.#screenWidth}u * (${that.#pixelHeight}u + ${that.#ySpace}u));
                
                                for ( var row: u32 = 0u ; row < ${that.#pixelHeight}u; row = row + 1u) {
                                    for ( var col: u32 = 0u ; col < ${that.#pixelWidth}u; col = col + 1u) {
                                        outputPixels.rgba[resizedPixelIndex] = pixel;
                                        resizedPixelIndex = resizedPixelIndex + 1u;
                                    }
                                    resizedPixelIndex = resizedPixelIndex + ${that.#screenWidth}u - ${that.#pixelWidth}u;
                                }
                            }
                        `
                    });

                    resolve(device);
                });    
            });
       });
    
    }


    renderFrame(frameData) {


        //console.log(frameData);
        //console.log(this.#dmdBufferByteLength);


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
    
                // return to caller
                resolve(imageData);
            });
        });
	}

}

export { GPURenderer }