import { LayerRenderer } from "./LayerRenderer.js";
class ChangeAlphaRenderer extends LayerRenderer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        super("ChangeAlphaRenderer", width, height);
    }
    /**
     * Init renderer
     * @returns Promise
     */
    init() {
        const that = this;
        return new Promise(resolve => {
            navigator.gpu.requestAdapter().then(adapter => {
                that._adapter = adapter;
                adapter.requestDevice().then(device => {
                    that._device = device;
                    that._shaderModule = device.createShaderModule({
                        code: `
                            struct UBO {
                                opacity: f32
                            }

                            struct Image {
                                rgba: array<u32>
                            }

                            fn f2u(f: f32) -> u32 {
                                return u32(ceil(f));
                            }

                            @group(0) @binding(0) var<storage,read> inputPixels: Image;
                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;
                            @group(0) @binding(2) var<uniform> uniforms : UBO;

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${that._width}u;
                                let pixelColor : u32 = inputPixels.rgba[index];
                                let opacity : f32 = uniforms.opacity;

                                
                                var a : u32 = (pixelColor >> 24u) & 255u;
                                let b : u32 = (pixelColor >> 16u) & 255u;
                                let g : u32 = (pixelColor >> 8u) & 255u;
                                let r : u32 = (pixelColor & 255u);

                                var aa = f2u(floor(f32(a) * opacity));

                                // Hack : Todo find why floor not working (0 * anything) should give 0
                                if (opacity == 0f) {
                                    aa = 0u;
                                }

                                outputPixels.rgba[index] = (aa << 24u) | (b << 16u) | (g << 8u) | r;
                            }
                        `
                    });
                    console.log('ChangeAlphaRenderer:init()');
                    that._shaderModule.compilationInfo().then(i => {
                        if (i.messages.length > 0) {
                            console.warn("ChangeAlphaRenderer:compilationInfo() ", i.messages);
                        }
                    });
                    that.renderFrame = that._doRendering;
                    resolve();
                });
            });
        });
    }
    /**
     * Apply filter to provided data then return altered data
     * @param {ImageData} frameData
     * @param {Options} options
     * @returns {Promise<ImageData>}
     */
    _doRendering(frameData, options) {
        var o = options.get('opacity', 1);
        const that = this;
        const UBOBuffer = this._device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        const gpuTempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        const gpuOutputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
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
        });
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
        });
        const computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        });
        return new Promise(resolve => {
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data));
            gpuInputBuffer.unmap();
            // Write values to uniform buffer object
            const uniformData = [o];
            const uniformTypedArray = new Float32Array(uniformData);
            this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);
            const commandEncoder = that._device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that._width, that._height);
            passEncoder.end();
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that._bufferByteLength);
            that._device.queue.submit([commandEncoder.finish()]);
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then(() => {
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that._width, that._height);
                // return to caller
                resolve(imageData);
            });
        });
    }
}
export { ChangeAlphaRenderer };
//# sourceMappingURL=ChangeAlphaRenderer.js.map