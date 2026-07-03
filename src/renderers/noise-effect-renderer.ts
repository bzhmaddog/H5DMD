import {LayerRenderer} from "./layer-renderer"

export interface NoiseEffectRendererParams {
    /** Total animation cycle duration in ms. Default: `200`. */
    duration?: number
    /**
     * Pre-loaded noise frames as raw pixel data.
     * Use {@link Utils.bitmapsToPixelData} to convert `ImageBitmap[]`
     * to the required format.
     */
    noises?: Uint8ClampedArray[]
}

class NoiseEffectRenderer extends LayerRenderer {

    private _noises: Uint8ClampedArray[]
    private _startTime: number
    private _frameDuration: number
    private _nbFrames: number

    private _noiseBuffer: GPUBuffer
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline

    /**
     * @param {number} width
     * @param {number} height
     * @param {NoiseEffectRendererParams} params Optional noise frames and intensity.
     */
    constructor(width: number, height: number, params?: NoiseEffectRendererParams) {
        super("NoiseEffectRenderer", width, height)

        this._noises = params?.noises ?? []
        this._nbFrames = this._noises.length
        this._frameDuration = (params?.duration ?? 200) / (this._nbFrames || 1)
    }

    init(): Promise<void> {

        return new Promise((resolve, reject) => {

            if (typeof navigator === 'undefined' || !navigator.gpu) {
                reject(new Error(`${this.name}: WebGPU is not available in this environment (navigator.gpu is undefined)`))
                return
            }

            navigator.gpu.requestAdapter().then( adapter => {
                if (!adapter) {
                    reject(new Error(`${this.name}: no compatible GPU adapter found (requestAdapter() returned null)`))
                    return
                }

                this._adapter = adapter
            
                adapter.requestDevice().then( device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct Image {
                                rgba: array<u32>
                            }
                            @group(0) @binding(0) var<storage,read> noisePixels: Image;
                            @group(0) @binding(1) var<storage,read> inputPixels: Image;
                            @group(0) @binding(2) var<storage,read_write> outputPixels: Image;

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${this._width}u;

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
    
                                    // if finding a dark pixel on the noise buffer for this index
                                    // then alter the current pixel color (white-> blue)
                                    if ( nr < 200u && ng < 200u && nb < 200u) {
                                        pixel = pixel - 10100u;
                                    }
                                }

                                outputPixels.rgba[index] = pixel;
                                //outputPixels.rgba[index] = noise;
                            }
                        `
                    })

                    console.log('NoiseEffectRenderer:init()')

                    this._validateShader(reject).then(valid => {
                        if (!valid) return
                        this._createResources()
                        this.renderFrame = this._doRendering
                        resolve()
                    })
                }).catch(reject)
            }).catch(reject)
       })
    }

    /**
     * Create and cache the GPU resources reused across frames.
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {

        this._noiseBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        this._inputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        this._tempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })

        this._createOutputBuffers()

        const bindGroupLayout = this._device.createBindGroupLayout({
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
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 2,
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
                        buffer: this._noiseBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this._inputBuffer
                    }
                },
                {
                    binding: 2,
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
     * Apply filter to provided ImageData object then return altered data.
     * Reuses the GPU resources created in init() : only per-frame data
     * (noise + pixels) is uploaded each call.
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    private _doRendering(frameData: ImageData): Promise<ImageData> {

        const now = window.performance.now()

        if (!this._startTime) {
            this._startTime = now
        }

        const position = now - this._startTime

        let frameIndex = Math.floor(position / this._frameDuration)

        // Loop back to the first image
        if (frameIndex >= this._nbFrames) {
            this._startTime = null
            frameIndex = 0
        }

        // Upload current noise frame (if loaded) and frame pixels into the persistent buffers
        const noise = this._noises[frameIndex]
        if (noise) {
            this._device.queue.writeBuffer(this._noiseBuffer, 0, noise)
        }
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        const commandEncoder = this._device.createCommandEncoder()
        const passEncoder = commandEncoder.beginComputePass()

        passEncoder.setPipeline(this._computePipeline)
        passEncoder.setBindGroup(0, this._bindGroup)
        passEncoder.dispatchWorkgroups(this._width, this._height)
        passEncoder.end()

        return this._submitAndReadback(this._tempBuffer, commandEncoder) || Promise.resolve(frameData)
	}
}

export { NoiseEffectRenderer }