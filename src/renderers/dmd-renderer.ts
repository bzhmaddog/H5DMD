import {Renderer} from "./renderer"
import {DotShape} from "../enums";

class DmdRenderer extends Renderer {

    private _dmdWidth: number
    private _screenWidth: number
    private _screenHeight: number
	private _dotSpace: number
	private _pixelSize: number
	private _dotShape: DotShape
    private _dmdBufferByteLength: number
    private _screenBufferByteLength: number
    private _bgBrightness: number
    private _bgColor: number
    private _brightness: number
    private _bgHSP: number
    private _totalPixels: number
    private _workgroupCount: number

    private _canvas: HTMLCanvasElement
    private _canvasContext: GPUCanvasContext
    private _canvasFormat: GPUTextureFormat

    private _uboBuffer: GPUBuffer
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline
    private _uniformTypedArray: Float32Array

    private _renderTexture: GPUTexture
    private _renderPipeline: GPURenderPipeline
    private _renderBindGroup: GPUBindGroup
    private _renderBundle: GPURenderBundle
    private _sampler: GPUSampler

    private _hasTimestampQuery: boolean
    private _querySet: GPUQuerySet
    private _queryResolveBuffer: GPUBuffer
    private _queryResultBuffer: GPUBuffer
    private _lastGpuFrameTime: number

    renderFrame: (frameData: ImageData) => Promise<void>


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
     * @param {HTMLCanvasElement} canvas
     */
    constructor(
        dmdWidth: number,
        dmdHeight: number,
        screenWidth: number,
        screenHeight: number,
        pixelSize: number,
        dotSpace: number,
        dotShape: DotShape,
        bgBrightness: number,
        brightness: number,
        canvas: HTMLCanvasElement
    ) {
        super("DmdRenderer")

        this._dmdWidth = dmdWidth
        this._screenWidth = screenWidth
		this._screenHeight = screenHeight
        this._pixelSize = pixelSize
        this._dotSpace = dotSpace
        this._dotShape = dotShape
        this._dmdBufferByteLength = dmdWidth*dmdHeight * 4
        this._screenBufferByteLength = screenWidth * screenHeight * 4
        this._canvas = canvas
        this.renderFrame = this._doNothing


        this._bgBrightness = 14
        this._bgColor = 4279176975
        this._brightness = 1
        this._uniformTypedArray = new Float32Array(1)
        this._totalPixels = dmdWidth * dmdHeight
        this._workgroupCount = Math.ceil(this._totalPixels / 64)
        this._hasTimestampQuery = false
        this._lastGpuFrameTime = 0

        if (typeof bgBrightness === 'number') {
                this._bgBrightness = bgBrightness
                this._bgColor = parseInt("FF" + this._int2Hex(bgBrightness) + this._int2Hex(bgBrightness) + this._int2Hex(bgBrightness), 16)
        }

        if (typeof brightness === 'number') {
            this.setBrightness(brightness)
        }

        const bgp2 = this._bgBrightness * this._bgBrightness

        this._bgHSP = Math.sqrt(0.299 * bgp2 + 0.587 * bgp2 + 0.114 * bgp2)
    }

    private _int2Hex(n: number): string {
        // Clamp to a single byte (0–255) so the result is always exactly two hex
        // digits; out-of-range values would otherwise corrupt the packed color.
        const clamped = Math.max(0, Math.min(255, Math.round(n)))
        let hex = clamped.toString(16)

        if (hex.length < 2) {
            hex = "0" + hex
        }
        
        return hex
    }

    /**
     * Generate the WGSL `isInsideDot` function for the current dot shape.
     * Called once at shader compilation time — the shape is baked into the shader.
     */
    private _generateShapeFn(): string {
        switch (this._dotShape) {
            case DotShape.Circle:
                return `
                            fn isInsideDot(row: u32, col: u32, size: u32) -> bool {
                                let center = f32(size - 1u) * 0.5;
                                let dx = f32(col) - center;
                                let dy = f32(row) - center;
                                let radius = center + 0.5;
                                return (dx * dx + dy * dy) <= radius * radius;
                            }
                `
            case DotShape.Diamond:
                return `
                            fn isInsideDot(row: u32, col: u32, size: u32) -> bool {
                                let center = f32(size - 1u) * 0.5;
                                let dx = abs(f32(col) - center);
                                let dy = abs(f32(row) - center);
                                return (dx + dy) <= center + 0.5;
                            }
                `
            case DotShape.Square:
            default:
                return `
                            fn isInsideDot(row: u32, col: u32, size: u32) -> bool {
                                return true;
                            }
                `
        }
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

                // Request timestamp-query feature if supported for GPU profiling
                const features: GPUFeatureName[] = []
                if (adapter.features.has('timestamp-query')) {
                    features.push('timestamp-query')
                }

                adapter.requestDevice({ requiredFeatures: features }).then( device => {
                    this._device = device
                    this._hasTimestampQuery = device.features.has('timestamp-query')

                    this._shaderModule = device.createShaderModule({
                        code: this._buildComputeShaderCode()
                    })

                    console.log("GPURenderer:init()")

                    this._shaderModule.getCompilationInfo()?.then(i=>{
                        if (i.messages.length > 0 ) {
                            console.warn('GPURenderer:compilationInfo()', i.messages)
                        }
                    })

                    this._createResources()

                    this.renderFrame = this._doRendering
                    resolve()
                }).catch(reject)
            }).catch(reject)
       })
    
    }

    /**
     * Build the WGSL compute shader source code.
     * All constants (dimensions, shape, colors) are baked in as literals.
     */
    private _buildComputeShaderCode(): string {
        return `
            struct UBO {
                brightness: f32
            }

            struct Image {
                rgba: array<u32>
            }

            fn f2i(f: f32) -> u32 {
                return u32(ceil(f));
            }

            fn u2f(u: u32) -> f32 {
                return f32(u);
            }
            ${this._generateShapeFn()}
            @group(0) @binding(0) var<storage,read> inputPixels: Image;
            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;
            @group(0) @binding(2) var<uniform> uniforms : UBO;

            @compute
            @workgroup_size(64)
            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                let index : u32 = global_id.x;
                if (index >= ${this._totalPixels}u) {
                    return;
                }

                let pixel_x : u32 = index % ${this._dmdWidth}u;
                let pixel_y : u32 = index / ${this._dmdWidth}u;

                var bgBrightness : u32 = ${this._bgBrightness}u;
                var pixel : u32 = inputPixels.rgba[index];
                var brightness : f32 = uniforms.brightness;
                var br = 0u;
                var bg = 0u;
                var bb = 0u;

                let a : u32 = (pixel >> 24u) & 255u;
                let b : u32 = (pixel >> 16u) & 255u;
                let g : u32 = (pixel >> 8u) & 255u;
                let r : u32 = (pixel & 255u);

                if (r >= bgBrightness) {
                    br = bgBrightness + f2i(f32(r - bgBrightness) * brightness);
                } else {
                    br = bgBrightness;
                }

                if (g >= bgBrightness) {
                    bg = bgBrightness + f2i(f32(g - bgBrightness) * brightness);
                } else {
                    bg = bgBrightness;
                }

                if (b >= bgBrightness) {
                    bb = bgBrightness + f2i(f32(b - bgBrightness) * brightness);
                } else {
                    bb = bgBrightness;
                }

                pixel = (255u << 24u) | (bb << 16u) | (bg << 8u) | br;

                var hsp : f32 = sqrt(.299f * u2f(r) * u2f(r) + .587f * u2f(g) * u2f(g) + .114 * u2f(b) * u2f(b));

                if (hsp - 8f < ${this._bgHSP}f) {
                    pixel = ${this._bgColor}u;
                }

                var resizedPixelIndex : u32 = (pixel_x * ${this._pixelSize}u) + (pixel_x * ${this._dotSpace}u) + (pixel_y * ${this._screenWidth}u * (${this._pixelSize}u + ${this._dotSpace}u));

                for ( var row: u32 = 0u ; row < ${this._pixelSize}u; row = row + 1u ) {
                    for ( var col: u32 = 0u ; col < ${this._pixelSize}u; col = col + 1u ) {
                        if (isInsideDot(row, col, ${this._pixelSize}u)) {
                            outputPixels.rgba[resizedPixelIndex] = pixel;
                        } else {
                            outputPixels.rgba[resizedPixelIndex] = 4278190080u;
                        }
                        resizedPixelIndex = resizedPixelIndex + 1u;
                    }
                    resizedPixelIndex = resizedPixelIndex + ${this._screenWidth}u - ${this._pixelSize}u;
                }
            }
        `
    }

    /**
     * Do nothing (placeholder until init is done)
     * @param {ImageData} frameData
     */
     private _doNothing(_frameData: ImageData): Promise<void> {
        console.log("Init not done cannot apply filter")
        return Promise.resolve()
    }

    /**
     * Create and cache the GPU resources reused across frames.
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {

        // --- Compute pipeline resources ---

        this._uboBuffer = this._device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        this._inputBuffer = this._device.createBuffer({
            size: this._dmdBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        this._tempBuffer = this._device.createBuffer({
            size: this._screenBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })

        const computeBindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                } as GPUBindGroupLayoutEntry,
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                } as GPUBindGroupLayoutEntry,
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                      type: "uniform",
                    }
                } as GPUBindGroupLayoutEntry
            ]
        })

        this._bindGroup = this._device.createBindGroup({
            layout: computeBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._inputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this._tempBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                      buffer: this._uboBuffer
                    }
                }
            ]
        })

        this._computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [computeBindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        })

        // --- Render-to-texture resources (P4/P5: zero readback) ---

        // Configure the WebGPU canvas context
        this._canvasFormat = navigator.gpu.getPreferredCanvasFormat()
        this._canvasContext = this._canvas.getContext('webgpu') as GPUCanvasContext
        this._canvasContext.configure({
            device: this._device,
            format: this._canvasFormat,
            alphaMode: 'opaque'
        })

        // Intermediate texture: compute buffer → texture copy target, sampled in render pass
        this._renderTexture = this._device.createTexture({
            size: { width: this._screenWidth, height: this._screenHeight },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
        })

        this._sampler = this._device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest'
        })

        // Fullscreen triangle render pipeline
        const renderShaderModule = this._device.createShaderModule({
            code: `
                struct VertexOutput {
                    @builtin(position) position: vec4f,
                    @location(0) uv: vec2f,
                }

                @vertex
                fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                    // Fullscreen triangle covering clip space
                    var pos = array<vec2f, 3>(
                        vec2f(-1.0, -1.0),
                        vec2f( 3.0, -1.0),
                        vec2f(-1.0,  3.0)
                    );

                    var output: VertexOutput;
                    output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
                    // Clip space → UV (0..1), flip Y for texture coordinates
                    output.uv = pos[vertexIndex] * 0.5 + 0.5;
                    output.uv.y = 1.0 - output.uv.y;
                    return output;
                }

                @group(0) @binding(0) var texSampler: sampler;
                @group(0) @binding(1) var tex: texture_2d<f32>;

                @fragment
                fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
                    return textureSample(tex, texSampler, uv);
                }
            `
        })

        const renderBindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float' }
                }
            ]
        })

        this._renderBindGroup = this._device.createBindGroup({
            layout: renderBindGroupLayout,
            entries: [
                { binding: 0, resource: this._sampler },
                { binding: 1, resource: this._renderTexture.createView() }
            ]
        })

        this._renderPipeline = this._device.createRenderPipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [renderBindGroupLayout]
            }),
            vertex: {
                module: renderShaderModule,
                entryPoint: 'vs'
            },
            fragment: {
                module: renderShaderModule,
                entryPoint: 'fs',
                targets: [{ format: this._canvasFormat }]
            },
            primitive: {
                topology: 'triangle-list'
            }
        })

        // --- P9: Pre-record the render pass as a render bundle ---
        const bundleEncoder = this._device.createRenderBundleEncoder({
            colorFormats: [this._canvasFormat]
        })
        bundleEncoder.setPipeline(this._renderPipeline)
        bundleEncoder.setBindGroup(0, this._renderBindGroup)
        bundleEncoder.draw(3)
        this._renderBundle = bundleEncoder.finish()

        // --- P7: Timestamp query resources (optional, only if GPU supports it) ---
        if (this._hasTimestampQuery) {
            this._querySet = this._device.createQuerySet({
                type: 'timestamp',
                count: 2
            })
            this._queryResolveBuffer = this._device.createBuffer({
                size: 16, // 2 × BigUint64
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
            })
            this._queryResultBuffer = this._device.createBuffer({
                size: 16,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            })
        }
    }

    /**
     * Render a DMD frame directly to the WebGPU canvas (zero readback).
     * 1. Uploads pixel data and runs the compute shader.
     * 2. Copies the compute output buffer to an intermediate texture.
     * 3. Executes a pre-recorded render bundle to present the texture.
     * Optionally writes GPU timestamps for profiling.
     * @param {ImageData} frameData
     */
    private _doRendering(frameData: ImageData): Promise<void> {

        // Upload frame pixels into the persistent input buffer
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        // Write brightness uniform
        this._uniformTypedArray[0] = this._brightness
        this._device.queue.writeBuffer(this._uboBuffer, 0, this._uniformTypedArray.buffer)

        const commandEncoder = this._device.createCommandEncoder()

        // --- Compute pass (with optional timestamps) ---
        const computePassDescriptor: GPUComputePassDescriptor = {}
        if (this._hasTimestampQuery) {
            computePassDescriptor.timestampWrites = {
                querySet: this._querySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1
            }
        }
        const computePass = commandEncoder.beginComputePass(computePassDescriptor)
        computePass.setPipeline(this._computePipeline)
        computePass.setBindGroup(0, this._bindGroup)
        computePass.dispatchWorkgroups(this._workgroupCount)
        computePass.end()

        // --- Copy buffer → texture ---
        commandEncoder.copyBufferToTexture(
            {
                buffer: this._tempBuffer,
                bytesPerRow: this._screenWidth * 4,
                rowsPerImage: this._screenHeight
            },
            { texture: this._renderTexture },
            { width: this._screenWidth, height: this._screenHeight }
        )

        // --- Render pass: execute pre-recorded bundle ---
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this._canvasContext.getCurrentTexture().createView(),
                loadOp: 'clear' as GPULoadOp,
                storeOp: 'store' as GPUStoreOp,
                clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }]
        })
        renderPass.executeBundles([this._renderBundle])
        renderPass.end()

        // --- Resolve timestamp queries ---
        if (this._hasTimestampQuery) {
            commandEncoder.resolveQuerySet(this._querySet, 0, 2, this._queryResolveBuffer, 0)
            commandEncoder.copyBufferToBuffer(this._queryResolveBuffer, 0, this._queryResultBuffer, 0, 16)
        }

        this._device.queue.submit([commandEncoder.finish()])

        // Read back GPU timestamps (non-blocking, updates _lastGpuFrameTime)
        if (this._hasTimestampQuery && this._queryResultBuffer.mapState === 'unmapped') {
            this._queryResultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                const times = new BigUint64Array(this._queryResultBuffer.getMappedRange())
                this._lastGpuFrameTime = Number(times[1] - times[0]) / 1_000_000 // ns → ms
                this._queryResultBuffer.unmap()
            }).catch(() => { /* mapping failed — skip this sample */ })
        }

        return this._device.queue.onSubmittedWorkDone()
	}

    /**
     * Change the dot shape at runtime. Recompiles the compute shader and
     * recreates the compute pipeline (lightweight GPU operation).
     * @param {DotShape} shape
     */
    setDotShape(shape: DotShape) {
        if (shape === this._dotShape) return
        this._dotShape = shape

        this._shaderModule = this._device.createShaderModule({
            code: this._buildComputeShaderCode()
        })

        // Recreate compute pipeline with the new shader (reuses existing layout)
        const layout = this._computePipeline.getBindGroupLayout(0)
        this._computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [layout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        })
    }

    get dotShape(): DotShape {
        return this._dotShape
    }

    /**
	 * Set brightness of the dots between 0 and 1 (does not affect the background color)
     * @param {float} b 
     */
    setBrightness(b: number) {
        const brightness = Math.max(0, Math.min(b, 1)) // normalize
        this._brightness = Math.round(brightness * 1e3) / 1e3 // round to 1 digit after dot
    }

    get brightness() {
        return this._brightness
    }

    get canvasContext(): GPUCanvasContext {
        return this._canvasContext
    }

    /**
     * Last measured GPU compute pass execution time in milliseconds.
     * Returns 0 if timestamp queries are not supported or no measurement is available yet.
     */
    get gpuFrameTime(): number {
        return this._lastGpuFrameTime
    }

}

export {DmdRenderer}