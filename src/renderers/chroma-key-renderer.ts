import {Renderer} from "./renderer"
import {LayerRenderer} from "./layer-renderer"

export interface ChromaKeyParams {
    /** RGB key color to make transparent (0–255 each). Default: `[0, 255, 0]` (green). */
    color?: [number, number, number]
    /** Euclidean distance threshold — pixels within this distance become transparent. Default: `50`. */
    threshold?: number
}

class ChromaKeyRenderer extends LayerRenderer {

    private _uboBuffer: GPUBuffer
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline
    private _keyR: number
    private _keyG: number
    private _keyB: number
    private _threshold: number

    /**
     * @param {number} width
     * @param {number} height
     * @param {ChromaKeyParams} params Optional key color and threshold.
     */
    constructor(width: number, height: number, params?: ChromaKeyParams) {
        super("ChromaKeyRenderer", width, height)
        const color = params?.color ?? [0, 255, 0]
        this._keyR = color[0]
        this._keyG = color[1]
        this._keyB = color[2]
        this._threshold = params?.threshold ?? 50
    }

    /**
     * Init renderer
     * @returns Promise
     */
    init(): Promise<void> {

        return new Promise((resolve, reject) => {

            Renderer.requestSharedDevice().then(device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct UBO {
                                keyR: f32,
                                keyG: f32,
                                keyB: f32,
                                tolerance: f32
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
                                let index : u32 = global_id.x + global_id.y * ${this._width}u;
                                let pixelColor : u32 = inputPixels.rgba[index];

                                let a : u32 = (pixelColor >> 24u) & 255u;
                                let b : u32 = (pixelColor >> 16u) & 255u;
                                let g : u32 = (pixelColor >> 8u) & 255u;
                                let r : u32 = (pixelColor & 255u);

                                let dr = f32(r) - uniforms.keyR;
                                let dg = f32(g) - uniforms.keyG;
                                let db = f32(b) - uniforms.keyB;
                                let dist = sqrt(dr * dr + dg * dg + db * db);

                                var newA = a;
                                if (dist <= uniforms.tolerance) {
                                    newA = 0u;
                                }

                                outputPixels.rgba[index] = (newA << 24u) | (b << 16u) | (g << 8u) | r;
                            }
                        `
                    })

                    console.log(`ChromaKeyRenderer:init([${this._keyR}, ${this._keyG}, ${this._keyB}], ${this._threshold})`)

                    this._validateShader(reject).then(valid => {
                        if (!valid) return
                        this._createResources()
                        this.renderFrame = this._doRendering
                        resolve()
                    })
                }).catch(reject)
        })
    }

    /**
     * Create and cache the GPU resources reused across frames.
     */
    private _createResources() {

        this._uboBuffer = this._device.createBuffer({
            size: 16, // 4 floats × 4 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
                    buffer: { type: "read-only-storage" }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "storage" }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: "uniform" }
                }
            ]
        })

        this._bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this._inputBuffer } },
                { binding: 1, resource: { buffer: this._tempBuffer } },
                { binding: 2, resource: { buffer: this._uboBuffer } }
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
     * Apply chroma key to provided data then return altered data.
     * Pixels within the threshold distance from the key color become fully transparent.
     * @param {ImageData} frameData
     * @returns {Promise<ImageData>}
     */
    private _doRendering(frameData: ImageData): Promise<ImageData> {

        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        const uniformTypedArray = new Float32Array([
            this._keyR,
            this._keyG,
            this._keyB,
            this._threshold
        ])
        this._device.queue.writeBuffer(this._uboBuffer, 0, uniformTypedArray.buffer)

        const commandEncoder = this._device.createCommandEncoder()
        const passEncoder = commandEncoder.beginComputePass()

        passEncoder.setPipeline(this._computePipeline)
        passEncoder.setBindGroup(0, this._bindGroup)
        passEncoder.dispatchWorkgroups(this._width, this._height)
        passEncoder.end()

        return this._submitAndReadback(this._tempBuffer, commandEncoder) || Promise.resolve(frameData)
    }
}

export { ChromaKeyRenderer }
