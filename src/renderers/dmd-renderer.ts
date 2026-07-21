import { Renderer } from './renderer'
import { DotShape } from '../enums'

/** Minimum pixelSize for each dot shape to be visually distinguishable. */
const MIN_DOT_SIZE: Record<DotShape, number> = {
    [DotShape.Square]: 1,
    [DotShape.Circle]: 5,
    [DotShape.Diamond]: 5,
    [DotShape.RoundedSquare]: 3,
    [DotShape.Hexagon]: 5,
    [DotShape.Octagon]: 5,
    [DotShape.Star]: 7,
}

/** Minimum dot spacing for each shape to remain visually distinct. */
const MIN_DOT_SPACE: Record<DotShape, number> = {
    [DotShape.Square]: 0,
    [DotShape.Circle]: 1,
    [DotShape.Diamond]: 1,
    [DotShape.RoundedSquare]: 1,
    [DotShape.Hexagon]: 1,
    [DotShape.Octagon]: 1,
    [DotShape.Star]: 1,
}

class DmdRenderer extends Renderer {
    private _dmdWidth: number
    private _dmdHeight: number
    private _visibleDotsX: number
    private _visibleDotsY: number
    private _maxDmdWidth: number
    private _maxDmdHeight: number
    private _maxPaddedBytesPerRow: number
    private _maxBufferByteLength: number
    private _screenWidth: number
    private _screenHeight: number
    private _dotSpace: number
    private _pixelSize: number
    private _dotShape: DotShape
    private _paddedBytesPerRow: number
    private _bgHSP: number
    private _bgR: number
    private _bgG: number
    private _bgB: number
    private _brightness: number
    private _totalPixels: number
    private _workgroupCount: number
    private _monochrome: boolean
    private _monoColorR: number
    private _monoColorG: number
    private _monoColorB: number
    private _monoLevels: number

    private _canvas: HTMLCanvasElement
    private _canvasContext: GPUCanvasContext
    private _canvasFormat: GPUTextureFormat

    private _uboBuffer: GPUBuffer
    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline
    private _uboData: ArrayBuffer
    private _uboF32: Float32Array
    private _uboU32: Uint32Array
    private _renderUniformBuffer: GPUBuffer
    private _renderUniformData: Float32Array

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
     * @param {DotShape} dotShape
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
        canvas: HTMLCanvasElement,
    ) {
        super('DmdRenderer')

        this._dmdWidth = dmdWidth
        this._dmdHeight = dmdHeight
        this._screenWidth = screenWidth
        this._screenHeight = screenHeight
        this._pixelSize = pixelSize
        this._dotSpace = dotSpace
        this._dotShape = dotShape
        this._paddedBytesPerRow = Math.ceil((dmdWidth * 4) / 256) * 256

        // Visible dot count on screen (changes with dot size)
        this._visibleDotsX = Math.floor(screenWidth / (pixelSize + dotSpace))
        this._visibleDotsY = Math.floor(screenHeight / (pixelSize + dotSpace))

        // Max DMD resolution (at dotSize=1) — used for GPU buffer/texture allocation
        this._maxDmdWidth = Math.floor(screenWidth / (1 + dotSpace))
        this._maxDmdHeight = Math.floor(screenHeight / (1 + dotSpace))
        this._maxPaddedBytesPerRow = Math.ceil((this._maxDmdWidth * 4) / 256) * 256
        this._maxBufferByteLength = this._maxPaddedBytesPerRow * this._maxDmdHeight

        this._canvas = canvas
        this.renderFrame = this._doNothing

        this._bgR = 14
        this._bgG = 14
        this._bgB = 14
        this._brightness = 1
        this._monochrome = false
        this._monoColorR = 1.0
        this._monoColorG = 0.5
        this._monoColorB = 0.0
        this._monoLevels = 16
        // Compute UBO: [brightness(f32), totalPixels(u32), dmdWidth(u32), paddedWidth(u32), monochrome(u32), monoR(f32), monoG(f32), monoB(f32), monoLevels(u32), bgR(u32), bgG(u32), bgB(u32), bgHSP(f32), pad, pad, pad]
        this._uboData = new ArrayBuffer(64)
        this._uboF32 = new Float32Array(this._uboData)
        this._uboU32 = new Uint32Array(this._uboData)
        // Render uniforms: [pixelSize, dotSpace, dotShape, dmdWidth, dmdHeight, pad, pad, pad]
        this._renderUniformData = new Float32Array(8)
        this._totalPixels = dmdWidth * dmdHeight
        this._workgroupCount = Math.ceil(this._totalPixels / 64)
        this._hasTimestampQuery = false
        this._lastGpuFrameTime = 0

        if (typeof bgBrightness === 'number') {
            this._bgR = Math.max(0, Math.min(255, Math.round(bgBrightness)))
            this._bgG = this._bgR
            this._bgB = this._bgR
        }

        if (typeof brightness === 'number') {
            this.setBrightness(brightness)
        }

        this._bgHSP = Math.sqrt(0.299 * this._bgR ** 2 + 0.587 * this._bgG ** 2 + 0.114 * this._bgB ** 2)
    }

    private _int2Hex(n: number): string {
        // Clamp to a single byte (0–255) so the result is always exactly two hex
        // digits; out-of-range values would otherwise corrupt the packed color.
        const clamped = Math.max(0, Math.min(255, Math.round(n)))
        let hex = clamped.toString(16)

        if (hex.length < 2) {
            hex = '0' + hex
        }

        return hex
    }

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            Renderer.requestSharedDevice()
                .then(device => {
                    this._device = device
                    this._hasTimestampQuery = device.features.has('timestamp-query')

                    this._shaderModule = device.createShaderModule({
                        code: this._buildComputeShaderCode(),
                    })

                    console.log('GPURenderer:init()')

                    this._shaderModule.getCompilationInfo()?.then(i => {
                        if (i.messages.length > 0) {
                            console.warn('GPURenderer:compilationInfo()', i.messages)
                        }
                    })

                    this._createResources()

                    this.renderFrame = this._doRendering
                    resolve()
                })
                .catch(reject)
        })
    }

    /**
     * Build the WGSL compute shader source code.
     * Outputs one color per DMD dot (no pixel grid expansion).
     */
    /* c8 ignore start — GPU pipeline code unreachable without a real device */
    private _buildComputeShaderCode(): string {
        return `
            struct UBO {
                brightness: f32,
                totalPixels: u32,
                dmdWidth: u32,
                paddedWidth: u32,
                monochrome: u32,
                monoR: f32,
                monoG: f32,
                monoB: f32,
                monoLevels: u32,
                bgR: u32,
                bgG: u32,
                bgB: u32,
                bgHSP: f32,
                _pad0: u32,
                _pad1: u32,
                _pad2: u32,
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
                if (index >= uniforms.totalPixels) {
                    return;
                }

                var pixel : u32 = inputPixels.rgba[index];
                var brightness : f32 = uniforms.brightness;
                var br = 0u;
                var bg = 0u;
                var bb = 0u;

                let b : u32 = (pixel >> 16u) & 255u;
                let g : u32 = (pixel >> 8u) & 255u;
                let r : u32 = (pixel & 255u);

                if (uniforms.monochrome == 1u) {
                    // Monochrome mode: quantize luminance to monoLevels levels
                    let maxLevel = uniforms.monoLevels - 1u;
                    let lum = 0.299 * u2f(r) + 0.587 * u2f(g) + 0.114 * u2f(b);
                    let level = clamp(u32(lum * f32(maxLevel) / 255.0), 0u, maxLevel);
                    let scale = f32(level) / f32(maxLevel) * brightness;
                    br = u32(uniforms.monoR * scale * 255.0);
                    bg = u32(uniforms.monoG * scale * 255.0);
                    bb = u32(uniforms.monoB * scale * 255.0);
                    pixel = (255u << 24u) | (bb << 16u) | (bg << 8u) | br;
                    // Off-dot: same background check as RGB mode so off dots look identical
                    var hsp : f32 = sqrt(.299f * u2f(r) * u2f(r) + .587f * u2f(g) * u2f(g) + .114f * u2f(b) * u2f(b));
                    if (hsp - 8f < uniforms.bgHSP) {
                        pixel = (255u << 24u) | (uniforms.bgB << 16u) | (uniforms.bgG << 8u) | uniforms.bgR;
                    }
                } else {
                    if (r >= uniforms.bgR) {
                        br = uniforms.bgR + f2i(f32(r - uniforms.bgR) * brightness);
                    } else {
                        br = uniforms.bgR;
                    }

                    if (g >= uniforms.bgG) {
                        bg = uniforms.bgG + f2i(f32(g - uniforms.bgG) * brightness);
                    } else {
                        bg = uniforms.bgG;
                    }

                    if (b >= uniforms.bgB) {
                        bb = uniforms.bgB + f2i(f32(b - uniforms.bgB) * brightness);
                    } else {
                        bb = uniforms.bgB;
                    }

                    pixel = (255u << 24u) | (bb << 16u) | (bg << 8u) | br;

                    var hsp : f32 = sqrt(.299f * u2f(r) * u2f(r) + .587f * u2f(g) * u2f(g) + .114f * u2f(b) * u2f(b));

                    if (hsp - 8f < uniforms.bgHSP) {
                        pixel = (255u << 24u) | (uniforms.bgB << 16u) | (uniforms.bgG << 8u) | uniforms.bgR;
                    }
                }

                // Write one pixel per dot with row padding for 256-byte alignment
                let x = index % uniforms.dmdWidth;
                let y = index / uniforms.dmdWidth;
                outputPixels.rgba[y * uniforms.paddedWidth + x] = pixel;
            }
        `
    }

    /**
     * Do nothing (placeholder until init is done)
     * @param {ImageData} _frameData
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _doNothing(_frameData: ImageData): Promise<void> {
        console.log('Init not done cannot apply filter')
        return Promise.resolve()
    }

    /**
     * Create and cache the GPU resources reused across frames.
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {
        // --- Compute pipeline resources ---

        this._uboBuffer = this._device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        this._inputBuffer = this._device.createBuffer({
            size: this._maxBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })

        // Output at max DMD resolution (allocated for largest possible grid)
        this._tempBuffer = this._device.createBuffer({
            size: this._maxBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        })

        const computeBindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage' },
                } as GPUBindGroupLayoutEntry,
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' },
                } as GPUBindGroupLayoutEntry,
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' },
                } as GPUBindGroupLayoutEntry,
            ],
        })

        this._bindGroup = this._device.createBindGroup({
            layout: computeBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this._inputBuffer } },
                { binding: 1, resource: { buffer: this._tempBuffer } },
                { binding: 2, resource: { buffer: this._uboBuffer } },
            ],
        })

        this._computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [computeBindGroupLayout],
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: 'main',
            },
        })

        // --- Render-to-canvas resources ---

        // Configure the WebGPU canvas context
        this._canvasFormat = navigator.gpu.getPreferredCanvasFormat()
        this._canvasContext = this._canvas.getContext('webgpu') as GPUCanvasContext
        this._canvasContext.configure({
            device: this._device,
            format: this._canvasFormat,
            alphaMode: 'opaque',
        })

        // DMD-resolution texture (allocated at max size; only active portion is used)
        this._renderTexture = this._device.createTexture({
            size: { width: this._maxDmdWidth, height: this._maxDmdHeight },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        })

        this._sampler = this._device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        })

        // Render uniform buffer: [pixelSize, dotSpace, dotShape, visibleDotsX, visibleDotsY, pad, pad, pad]
        this._renderUniformBuffer = this._device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this._renderUniformData[0] = this._pixelSize
        this._renderUniformData[1] = this._dotSpace
        this._renderUniformData[2] = this._dotShape
        this._renderUniformData[3] = this._visibleDotsX
        this._renderUniformData[4] = this._visibleDotsY
        this._renderUniformData[5] = 0
        this._renderUniformData[6] = 0
        this._renderUniformData[7] = 0
        this._device.queue.writeBuffer(this._renderUniformBuffer, 0, this._renderUniformData.buffer)

        // Fragment shader: upscales DMD texture to canvas with dot grid + shape SDF
        const renderShaderModule = this._device.createShaderModule({
            code: `
                struct RenderUniforms {
                    pixelSize: f32,
                    dotSpace: f32,
                    dotShape: f32,
                    visibleDotsX: f32,
                    visibleDotsY: f32,
                    _pad1: f32,
                    _pad2: f32,
                    _pad3: f32,
                }

                struct VertexOutput {
                    @builtin(position) position: vec4f,
                    @location(0) uv: vec2f,
                }

                @vertex
                fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                    var pos = array<vec2f, 3>(
                        vec2f(-1.0, -1.0),
                        vec2f( 3.0, -1.0),
                        vec2f(-1.0,  3.0)
                    );
                    var output: VertexOutput;
                    output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
                    output.uv = pos[vertexIndex] * 0.5 + 0.5;
                    output.uv.y = 1.0 - output.uv.y;
                    return output;
                }

                @group(0) @binding(0) var texSampler: sampler;
                @group(0) @binding(1) var tex: texture_2d<f32>;
                @group(0) @binding(2) var<uniform> ru: RenderUniforms;

                @fragment
                fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
                    let screenSize = vec2f(${this._screenWidth}.0, ${this._screenHeight}.0);
                    let visibleDots = vec2f(ru.visibleDotsX, ru.visibleDotsY);
                    let baseSize = vec2f(${this._dmdWidth}.0, ${this._dmdHeight}.0);
                    let texSize = vec2f(${this._maxDmdWidth}.0, ${this._maxDmdHeight}.0);

                    let pixelSize = ru.pixelSize;
                    let dotSpace = ru.dotSpace;
                    let cellSize = pixelSize + dotSpace;

                    // Center the dot grid within the canvas
                    let gridSize = visibleDots * cellSize;
                    let margin = floor((screenSize - gridSize) * 0.5);

                    // Pixel coordinate offset by centering margin
                    let pixelCoord = uv * screenSize - margin;

                    // Outside the grid area → black
                    if (pixelCoord.x < 0.0 || pixelCoord.y < 0.0) {
                        return vec4f(0.0, 0.0, 0.0, 1.0);
                    }

                    // Which dot cell does this pixel belong to?
                    let cell = floor(pixelCoord / cellSize);

                    // Clamp to valid visible area
                    if (cell.x >= visibleDots.x || cell.y >= visibleDots.y) {
                        return vec4f(0.0, 0.0, 0.0, 1.0);
                    }

                    // Map cell to base-resolution texture UV
                    // (rescales content to fill all visible dots regardless of dot size)
                    let normalizedUV = (cell + 0.5) / visibleDots;
                    let dotTexUV = normalizedUV * baseSize / texSize;
                    let dotColor = textureSampleLevel(tex, texSampler, dotTexUV, 0.0);

                    // Position within the cell (0..cellSize)
                    let localPos = pixelCoord - cell * cellSize;

                    // If in the gap between dots, return black
                    if (localPos.x >= pixelSize || localPos.y >= pixelSize) {
                        return vec4f(0.0, 0.0, 0.0, 1.0);
                    }

                    // Normalized position within the dot (0..1)
                    let dotUV = localPos / pixelSize;
                    let centered = dotUV - 0.5;

                    // Shape SDF test (0 = square, 1 = circle, 2 = diamond, 3 = rounded square, 4 = hexagon)
                    var inside = true;
                    let shape = u32(ru.dotShape);
                    if (shape == 1u) {
                        // Circle: distance from center <= 0.5
                        inside = (centered.x * centered.x + centered.y * centered.y) <= 0.25;
                    } else if (shape == 2u) {
                        // Diamond: manhattan distance from center <= 0.5
                        inside = (abs(centered.x) + abs(centered.y)) <= 0.5;
                    } else if (shape == 3u) {
                        // Rounded square: box SDF with corner radius
                        let r = 0.15;
                        let d = abs(centered) - vec2f(0.5 - r);
                        let outside_dist = length(max(d, vec2f(0.0))) - r;
                        inside = outside_dist <= 0.0;
                    } else if (shape == 4u) {
                        // Hexagon: flat-top, test against 3 half-plane pairs
                        let p = abs(centered);
                        inside = (p.x <= 0.5) && (p.y + p.x * 0.577350269) <= 0.5;
                    } else if (shape == 5u) {
                        // Octagon: square with clipped corners (diagonal test)
                        let p = abs(centered);
                        inside = (p.x <= 0.5) && (p.y <= 0.5) && (p.x + p.y) <= 0.6464;
                    } else if (shape == 6u) {
                        // Star: 4-pointed star using product of two rotated diamond tests
                        let p = abs(centered);
                        let d1 = p.x + p.y;          // diamond axis 1
                        let d2 = max(p.x, p.y);      // square axis
                        // Blend: inside if either the diamond or the cross arm contains the point
                        inside = min(d1 * 0.75, d2) <= 0.25;
                    }
                    // shape == 0: square, always inside

                    if (!inside) {
                        return vec4f(0.0, 0.0, 0.0, 1.0);
                    }

                    return dotColor;
                }
            `,
        })

        const renderBindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float' },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' },
                },
            ],
        })

        this._renderBindGroup = this._device.createBindGroup({
            layout: renderBindGroupLayout,
            entries: [
                { binding: 0, resource: this._sampler },
                { binding: 1, resource: this._renderTexture.createView() },
                { binding: 2, resource: { buffer: this._renderUniformBuffer } },
            ],
        })

        this._renderPipeline = this._device.createRenderPipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [renderBindGroupLayout],
            }),
            vertex: {
                module: renderShaderModule,
                entryPoint: 'vs',
            },
            fragment: {
                module: renderShaderModule,
                entryPoint: 'fs',
                targets: [{ format: this._canvasFormat }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        })

        // --- P9: Pre-record the render pass as a render bundle ---
        const bundleEncoder = this._device.createRenderBundleEncoder({
            colorFormats: [this._canvasFormat],
        })
        bundleEncoder.setPipeline(this._renderPipeline)
        bundleEncoder.setBindGroup(0, this._renderBindGroup)
        bundleEncoder.draw(3)
        this._renderBundle = bundleEncoder.finish()

        // --- P7: Timestamp query resources (optional, only if GPU supports it) ---
        if (this._hasTimestampQuery) {
            this._querySet = this._device.createQuerySet({
                type: 'timestamp',
                count: 2,
            })
            this._queryResolveBuffer = this._device.createBuffer({
                size: 16, // 2 × BigUint64
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
            })
            this._queryResultBuffer = this._device.createBuffer({
                size: 16,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            })
        }
    }

    /**
     * Render a DMD frame directly to the WebGPU canvas (zero readback).
     * 1. Uploads pixel data and runs the compute shader (outputs DMD-res buffer).
     * 2. Copies the buffer to a DMD-resolution texture.
     * 3. Uploads render uniforms (dotShape can change at runtime).
     * 4. Executes a pre-recorded render bundle that upscales with dot grid + shape SDF.
     * @param {ImageData} frameData
     */
    private _doRendering(frameData: ImageData): Promise<void> {
        // Upload frame pixels into the persistent input buffer
        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        // Write compute UBO: [brightness(f32), totalPixels(u32), dmdWidth(u32), paddedWidth(u32), monochrome(u32), monoR(f32), monoG(f32), monoB(f32)]
        this._uboF32[0] = this._brightness
        this._uboU32[1] = this._totalPixels
        this._uboU32[2] = this._dmdWidth
        this._uboU32[3] = this._paddedBytesPerRow / 4
        this._uboU32[4] = this._monochrome ? 1 : 0
        this._uboF32[5] = this._monoColorR
        this._uboF32[6] = this._monoColorG
        this._uboF32[7] = this._monoColorB
        this._uboU32[8] = this._monoLevels
        this._uboU32[9] = this._bgR
        this._uboU32[10] = this._bgG
        this._uboU32[11] = this._bgB
        this._uboF32[12] = this._bgHSP
        this._device.queue.writeBuffer(this._uboBuffer, 0, this._uboData)

        // Write render uniforms (dotShape/dotSize/dmdSize may have changed)
        this._device.queue.writeBuffer(this._renderUniformBuffer, 0, this._renderUniformData.buffer)

        const commandEncoder = this._device.createCommandEncoder()

        // --- Compute pass (with optional timestamps) ---
        const computePassDescriptor: GPUComputePassDescriptor = {}
        if (this._hasTimestampQuery) {
            computePassDescriptor.timestampWrites = {
                querySet: this._querySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1,
            }
        }
        const computePass = commandEncoder.beginComputePass(computePassDescriptor)
        computePass.setPipeline(this._computePipeline)
        computePass.setBindGroup(0, this._bindGroup)
        computePass.dispatchWorkgroups(this._workgroupCount)
        computePass.end()

        // --- Copy buffer → DMD-resolution texture ---
        commandEncoder.copyBufferToTexture(
            {
                buffer: this._tempBuffer,
                bytesPerRow: this._paddedBytesPerRow,
                rowsPerImage: this._dmdHeight,
            },
            { texture: this._renderTexture },
            { width: this._dmdWidth, height: this._dmdHeight },
        )

        // --- Render pass: execute pre-recorded bundle ---
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this._canvasContext.getCurrentTexture().createView(),
                    loadOp: 'clear' as GPULoadOp,
                    storeOp: 'store' as GPUStoreOp,
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
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
            this._queryResultBuffer
                .mapAsync(GPUMapMode.READ)
                .then(() => {
                    const times = new BigUint64Array(this._queryResultBuffer.getMappedRange())
                    this._lastGpuFrameTime = Number(times[1] - times[0]) / 1_000_000 // ns → ms
                    this._queryResultBuffer.unmap()
                })
                .catch(() => {
                    /* mapping failed — skip this sample */
                })
        }

        return this._device.queue.onSubmittedWorkDone()
    }
    /* c8 ignore stop */

    /**
     * Change the dot shape at runtime. Enforces minimum dot size for the shape.
     * @param {DotShape} shape
     */
    setDotShape(shape: DotShape) {
        if (shape === this._dotShape) return
        this._dotShape = shape
        this._renderUniformData[2] = shape
        // Enforce minimum dot size for the new shape
        const minSize = MIN_DOT_SIZE[shape]
        if (this._pixelSize < minSize) {
            this.setDotSize(minSize)
        }
        // Enforce minimum dot space for the new shape
        const minSpace = MIN_DOT_SPACE[shape]
        if (this._dotSpace < minSpace) {
            this.setDotSpace(minSpace)
        }
    }

    /**
     * Change the dot size at runtime. Recalculates visible dot count.
     * Layers stay at base resolution; the fragment shader rescales content.
     * @param {number} size
     */
    setDotSize(size: number) {
        const minSize = MIN_DOT_SIZE[this._dotShape]
        const clamped = Math.max(minSize, Math.round(size))
        if (clamped === this._pixelSize) return
        this._pixelSize = clamped
        // Recalculate visible dot count (base resolution and compute stay unchanged)
        this._visibleDotsX = Math.floor(this._screenWidth / (clamped + this._dotSpace))
        this._visibleDotsY = Math.floor(this._screenHeight / (clamped + this._dotSpace))
        // Update render uniforms
        this._renderUniformData[0] = clamped
        this._renderUniformData[3] = this._visibleDotsX
        this._renderUniformData[4] = this._visibleDotsY
    }

    get dmdWidth(): number {
        return this._dmdWidth
    }

    get dmdHeight(): number {
        return this._dmdHeight
    }

    get visibleDotsX(): number {
        return this._visibleDotsX
    }

    get visibleDotsY(): number {
        return this._visibleDotsY
    }

    /**
     * Change dot spacing at runtime. Recalculates visible dot count.
     * @param {number} space
     */
    setDotSpace(space: number) {
        const minSpace = MIN_DOT_SPACE[this._dotShape]
        const clamped = Math.max(minSpace, Math.round(space))
        if (clamped === this._dotSpace) return
        this._dotSpace = clamped
        this._visibleDotsX = Math.floor(this._screenWidth / (this._pixelSize + clamped))
        this._visibleDotsY = Math.floor(this._screenHeight / (this._pixelSize + clamped))
        this._renderUniformData[1] = clamped
        this._renderUniformData[3] = this._visibleDotsX
        this._renderUniformData[4] = this._visibleDotsY
    }

    get dotSpace(): number {
        return this._dotSpace
    }

    get minDotSpace(): number {
        return MIN_DOT_SPACE[this._dotShape]
    }

    /** Perceptual brightness (HSP) of the off-dot background color. */
    get bgHSP(): number {
        return this._bgHSP
    }

    /** Raw brightness value of the off-dot background (0–255). Returns average of R/G/B channels. */
    get bgBrightness(): number {
        return Math.round((this._bgR + this._bgG + this._bgB) / 3)
    }

    /** Set the off-dot color (RGB, each component 0–1). */
    setOffDotColor(r: number, g: number, b: number) {
        this._bgR = Math.round(Math.max(0, Math.min(1, r)) * 255)
        this._bgG = Math.round(Math.max(0, Math.min(1, g)) * 255)
        this._bgB = Math.round(Math.max(0, Math.min(1, b)) * 255)
        this._bgHSP = Math.sqrt(0.299 * this._bgR ** 2 + 0.587 * this._bgG ** 2 + 0.114 * this._bgB ** 2)
    }

    /** Get the current off-dot color (RGB, each component 0–1). */
    get offDotColor(): { r: number; g: number; b: number } {
        return { r: this._bgR / 255, g: this._bgG / 255, b: this._bgB / 255 }
    }

    get dotSize(): number {
        return this._pixelSize
    }

    get dotShape(): DotShape {
        return this._dotShape
    }

    /**
     * Set brightness of the dots between 0 and 1 (does not affect the background color)
     * @param {number} b
     */
    setBrightness(b: number) {
        const brightness = Math.max(0, Math.min(b, 1)) // normalize
        this._brightness = Math.round(brightness * 1e3) / 1e3 // round to 3 decimal places
    }

    get brightness() {
        return this._brightness
    }

    /**
     * Enable or disable monochrome mode (16 brightness levels, single tint color).
     * @param {boolean} enabled
     */
    setMonochrome(enabled: boolean) {
        this._monochrome = enabled
    }

    get monochrome(): boolean {
        return this._monochrome
    }

    /**
     * Set the monochrome tint color (RGB, each component 0–1).
     * Only affects rendering when monochrome mode is enabled.
     * @param {number} r Red component (0–1)
     * @param {number} g Green component (0–1)
     * @param {number} b Blue component (0–1)
     */
    setMonochromeColor(r: number, g: number, b: number) {
        const r255 = Math.max(0, Math.min(1, r)) * 255
        const g255 = Math.max(0, Math.min(1, g)) * 255
        const b255 = Math.max(0, Math.min(1, b)) * 255
        const hsp = Math.sqrt(0.299 * r255 * r255 + 0.587 * g255 * g255 + 0.114 * b255 * b255)
        if (hsp <= this._bgHSP) {
            throw new RangeError(
                `Monochrome color is too dark (HSP ${hsp.toFixed(2)} ≤ background HSP ${this._bgHSP.toFixed(2)}). ` +
                    `Choose a brighter color so lit dots remain distinguishable from off dots.`,
            )
        }
        this._monoColorR = r255 / 255
        this._monoColorG = g255 / 255
        this._monoColorB = b255 / 255
    }

    get monochromeColor(): { r: number; g: number; b: number } {
        return { r: this._monoColorR, g: this._monoColorG, b: this._monoColorB }
    }

    /**
     * Set the number of monochrome brightness levels (must be even, between 2 and 16).
     * @param {number} levels
     */
    setMonoLevels(levels: number) {
        const valid = [4, 8, 16]
        if (!valid.includes(levels)) {
            throw new RangeError(`monoLevels must be one of: ${valid.join(', ')}`)
        }
        this._monoLevels = levels
    }

    get monoLevels(): number {
        return this._monoLevels
    }

    /* c8 ignore next 3 — requires GPU init */
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

export { DmdRenderer }
