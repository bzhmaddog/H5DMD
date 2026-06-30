import {Renderer} from "./renderer"
import {DotShape} from "../enums";

class DmdRenderer extends Renderer {

    private _dmdWidth: number
    private _screenWidth: number
    private _screenHeight: number
	private _dotSpace: number
	private _pixelSize: number
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
    private _sampler: GPUSampler

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

                                // If component is above darkest color then apply brightness limiter
                                if (r >= bgBrightness) {
                                    br = bgBrightness + f2i(f32(r - bgBrightness) * brightness);
                                } else {
                                    br = bgBrightness;
                                }

                                // If component is above darkest color then apply brightness limiter
                                if (g >= bgBrightness) {
                                    bg = bgBrightness + f2i(f32(g - bgBrightness) * brightness);
                                } else {
                                    bg = bgBrightness;
                                }

                                // If component is above darkest color then apply brightness limiter
                                if (b >= bgBrightness) {
                                    bb = bgBrightness + f2i(f32(b - bgBrightness) * brightness);
                                } else {
                                    bb = bgBrightness;
                                }

                                // Recreate pixel color but force alpha to 255
                                pixel = (255u << 24u) | (bb << 16u) | (bg << 8u) | br;

                                var hsp : f32 =  sqrt(.299f * u2f(r) * u2f(r) + .587f * u2f(g) * u2f(g) + .114 * u2f(b) * u2f(b));
                
                                // Pixels that are too dark will be hacked to give the 'off' dot look of the DMD
                                if (hsp - 8f < ${this._bgHSP}f) {
                                    pixel = ${this._bgColor}u;
                                }
                
                                // First byte index of the output dot
                                var resizedPixelIndex : u32 = (pixel_x * ${this._pixelSize}u)  + (pixel_x * ${this._dotSpace}u) + (pixel_y * ${this._screenWidth}u * (${this._pixelSize}u + ${this._dotSpace}u));
                
                                for ( var row: u32 = 0u ; row < ${this._pixelSize}u; row = row + 1u ) {
                                    for ( var col: u32 = 0u ; col < ${this._pixelSize}u; col = col + 1u ) {
                                        outputPixels.rgba[resizedPixelIndex] = pixel;
                                        resizedPixelIndex = resizedPixelIndex + 1u;
                                    }
                                    resizedPixelIndex = resizedPixelIndex + ${this._screenWidth}u - ${this._pixelSize}u;
                                }
                            }
                        `
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
    }

    /**
     * Render a DMD frame directly to the WebGPU canvas (zero readback).
     * 1. Uploads pixel data and runs the compute shader.
     * 2. Copies the compute output buffer to an intermediate texture.
     * 3. Draws a fullscreen triangle sampling that texture onto the canvas.
     * @param {ImageData} frameData
     */
    private _doRendering(frameData: ImageData): Promise<void> {

        // Upload frame pixels into the persistent input buffer
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        // Write brightness uniform
        this._uniformTypedArray[0] = this._brightness
        this._device.queue.writeBuffer(this._uboBuffer, 0, this._uniformTypedArray.buffer)

        const commandEncoder = this._device.createCommandEncoder()

        // --- Compute pass ---
        const computePass = commandEncoder.beginComputePass()
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

        // --- Render pass: fullscreen triangle to canvas ---
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this._canvasContext.getCurrentTexture().createView(),
                loadOp: 'clear' as GPULoadOp,
                storeOp: 'store' as GPUStoreOp,
                clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }]
        })
        renderPass.setPipeline(this._renderPipeline)
        renderPass.setBindGroup(0, this._renderBindGroup)
        renderPass.draw(3)
        renderPass.end()

        this._device.queue.submit([commandEncoder.finish()])

        // Presentation is handled by the GPU — resolve immediately.
        // The browser will present the frame at the next compositor
        // opportunity without any CPU readback.
        return this._device.queue.onSubmittedWorkDone()
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

}

export {DmdRenderer}