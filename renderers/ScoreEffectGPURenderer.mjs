import { Buffer } from "../Buffer.mjs";

class ScoreEffectGPURenderer {

    #initDone;
    #adapter;
    #device;
    #width;
    #height;
    #shaderModule;
    #bufferByteLength;
    #counter;
    #noises;

    constructor(_width, _height) {
        this.#initDone = false;
        this.#device;
        this.#adapter;
        this.#shaderModule;
        this.#width = _width;
        this.#height = _height;
        this.#bufferByteLength = _width * _height * 4;
        this.#counter = 0;

        this.#noises = [];

        const that = this;

        // Fill noise array from images
        for (var i = 0 ; i < 10 ; i++) {
            this.#loadNoise(`images/noise-${i}.png`).then( blob => {

                // Temporary buffer to draw noise image and get data array from it
                let tmpBuffer = new Buffer(this.#width, this.#height);

                let img = new Image();

                img.onload = (event) => {
                    URL.revokeObjectURL(event.target.src);

                    tmpBuffer.clear();
                    tmpBuffer.context.drawImage(event.target, 0, 0);
                    let frameData = tmpBuffer.context.getImageData(0, 0, _width, _height).data;
                    that.#noises.push(frameData);
                }

                  // Set the src of the <img> to the object URL so the image displays it
                img.src = URL.createObjectURL(blob);
            });
        }
    }

    /**
     * Fetch image from server
     * @param {string} src 
     * @returns 
     */
    async #loadNoise(src) {
        let response = await fetch(src);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          } else {
            return await response.blob();
          }        
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
                            [[block]] struct Time {
                                value: array<u32>;
                            };
                            [[block]] struct Image {
                                rgba: array<u32>;
                            };
                            [[group(0), binding(0)]] var<storage,read> time: Time;
                            [[group(0), binding(1)]] var<storage,read> noisePixels: Image;
                            [[group(0), binding(2)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(3)]] var<storage,write> outputPixels: Image;
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${that.#width}u;

                                var pixel : u32 = inputPixels.rgba[index];
                                var noise : u32 = noisePixels.rgba[index];
                                
                                let a : u32 = (pixel >> 24u) & 255u;
                                let r : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let b : u32 = (pixel & 255u);
                                //pixel = a << 24u | r << 16u | g << 8u | b;
               
                                if ( r > 200u && g > 200u && b > 200u ) {
                                //if ( pixel == 4294967295u ) {

                                    let na : u32 = (noise >> 24u) & 255u;
                                    let nr : u32 = (noise >> 16u) & 255u;
                                    let ng : u32 = (noise >> 8u) & 255u;
                                    let nb : u32 = (noise & 255u);
    
                                    if ( nr < 200u && ng < 200u && nb < 200u) {
                                        pixel = pixel - 10100u;
                                    }
                                    //pixel = noise;
                                }

                                outputPixels.rgba[index] = pixel;
                            }
                        `
                    });

                    resolve(device);
                });    
            });
       });
    
    }


    renderFrame(frameData) {
        //if (!this.#initDone) return;

        const that = this;

        const gpuTimeBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: 4,
            usage: GPUBufferUsage.STORAGE
        });

        const gpuNoiseBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE
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
                    buffer : {
                        type: "read-only-storage"
                    }
                },            
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer : {
                        type: "read-only-storage"
                    }
                },            
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 3,
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
                        buffer: gpuTimeBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuNoiseBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                }
            ]
        });

        //console.log(this.#shaderModule);
    
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
            //console.log(frameData);


            const frame = Math.floor(this.#counter % 10);

            //console.log(frame);

            //console.log(that.#noises[frame]);


            //console.log(frame);

            new Int32Array(gpuTimeBuffer.getMappedRange()).set(new Uint8Array([frame]));
            gpuTimeBuffer.unmap();

            new Uint8Array(gpuNoiseBuffer.getMappedRange()).set(new Uint8Array(this.#noises[frame]));
            gpuNoiseBuffer.unmap();
            
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
                that.#counter = that.#counter + .50;

    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());

                //console.log(pixelsBuffer);
    
                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that.#width, that.#height);

                //console.log(imageData);
    
                // return to caller
                resolve(imageData);
            });
        });
	}

}

export { ScoreEffectGPURenderer }