import {Renderer} from "./renderer"
import {LayerRenderer} from "./layer-renderer"
import {Options} from "../utils"

type ShakyMode = "random" | "sine" | "perlin" | "circular" | "horizontal" | "vertical" | "decay"

interface ShakyEffectParams {
    /** Max pixel displacement in either axis. Default 4. */
    intensity?: number
    /** How fast the shake evolves per second. Default 8. */
    speed?: number
    /**
     * "random"     = jump between random offsets (mechanical jitter)
     * "sine"       = smooth wobble on both axes (loose panel / handheld feel)
     * "perlin"     = smooth organic non-repeating drift (gentle handheld camera)
     * "circular"   = offset traces a circle, the whole frame orbits
     * "horizontal" = shake locked to the X axis only
     * "vertical"   = shake locked to the Y axis only
     * "decay"      = one-shot impact: strong at the trigger, settles to still.
     *                Re-fire it with triggerShake(). Default "random".
     */
    mode?: ShakyMode
    /**
     * For "decay" mode only: how long (seconds) one impact takes to settle.
     * Default 0.6.
     */
    decayDuration?: number
}

class ShakyEffectRenderer extends LayerRenderer {

    private _inputBuffer: GPUBuffer
    private _tempBuffer: GPUBuffer
    private _uniformBuffer: GPUBuffer
    private _bindGroup: GPUBindGroup
    private _computePipeline: GPUComputePipeline

    private _intensity: number
    private _speed: number
    private _mode: ShakyMode
    private _startTime: number
    private _decayDuration: number

    // "random" mode holds one offset for a burst, then jumps to a new one.
    // These cache the current target so we don't re-roll every frame.
    private _lastStep: number = -1
    private _currentDx: number = 0
    private _currentDy: number = 0

    // "decay" mode measures elapsed time from the last trigger. -Infinity means
    // "never triggered", so the effect sits at rest until triggerShake() is called.
    private _triggerTime: number = -Infinity

    /**
     * @param {number} width
     * @param {number} height
     * @param {ShakyEffectParams} params
     */
    constructor(width: number, height: number, params: ShakyEffectParams = {}) {
        super("ShakyRenderer", width, height)
        this._intensity = params.intensity ?? 4
        this._speed = params.speed ?? 8
        this._mode = params.mode ?? "random"
        this._decayDuration = params.decayDuration ?? 0.6
        this._startTime = performance.now()
    }

    setIntensity(intensity: number): void {
        this._intensity = intensity
    }

    setSpeed(speed: number): void {
        this._speed = speed
    }

    setMode(mode: ShakyMode): void {
        this._mode = mode
    }

    /**
     * Fire a one-shot impact for "decay" mode. Resets the decay envelope so the
     * shake kicks to full intensity and settles again over decayDuration seconds.
     * Has no visible effect in the continuous modes.
     */
    triggerShake(): void {
        this._triggerTime = performance.now()
    }

    init(): Promise<void> {

        return new Promise((resolve, reject) => {

            Renderer.requestSharedDevice().then( device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct Image {
                                rgba: array<u32>
                            }

                            struct Params {
                                dx: f32,
                                dy: f32
                            }

                            @group(0) @binding(0) var<storage,read> inputPixels: Image;
                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;
                            @group(0) @binding(2) var<uniform> params: Params;

                            fn unpack(c: u32) -> vec4<f32> {
                                return vec4<f32>(
                                    f32(c & 0xffu),
                                    f32((c >> 8u) & 0xffu),
                                    f32((c >> 16u) & 0xffu),
                                    f32((c >> 24u) & 0xffu)
                                );
                            }

                            fn pack(c: vec4<f32>) -> u32 {
                                let r = u32(clamp(c.x, 0.0, 255.0) + 0.5);
                                let g = u32(clamp(c.y, 0.0, 255.0) + 0.5);
                                let b = u32(clamp(c.z, 0.0, 255.0) + 0.5);
                                let a = u32(clamp(c.w, 0.0, 255.0) + 0.5);
                                return r | (g << 8u) | (b << 16u) | (a << 24u);
                            }

                            fn sampleAt(px: i32, py: i32, w: i32, h: i32) -> vec4<f32> {
                                let cx = clamp(px, 0, w - 1);
                                let cy = clamp(py, 0, h - 1);
                                return unpack(inputPixels.rgba[u32(cx) + u32(cy) * u32(w)]);
                            }

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {

                                // dx/dy are computed once per frame on the CPU (see _doRendering)
                                // and are identical for every invocation - this is a pure
                                // whole-frame translate, never a per-pixel offset.
                                let width : i32 = ${this._width};
                                let height : i32 = ${this._height};

                                // Fractional source position. Bilinear blend of the four
                                // straddling pixels lets sub-pixel (fractional intensity)
                                // shifts actually register instead of rounding to zero.
                                let srcXf : f32 = f32(global_id.x) + params.dx;
                                let srcYf : f32 = f32(global_id.y) + params.dy;

                                let x0 : i32 = i32(floor(srcXf));
                                let y0 : i32 = i32(floor(srcYf));
                                let fx : f32 = srcXf - f32(x0);
                                let fy : f32 = srcYf - f32(y0);

                                let c00 = sampleAt(x0,     y0,     width, height);
                                let c10 = sampleAt(x0 + 1, y0,     width, height);
                                let c01 = sampleAt(x0,     y0 + 1, width, height);
                                let c11 = sampleAt(x0 + 1, y0 + 1, width, height);

                                let top = mix(c00, c10, fx);
                                let bottom = mix(c01, c11, fx);
                                let color = mix(top, bottom, fy);

                                let dstIndex : u32 = global_id.x + global_id.y * u32(width);
                                outputPixels.rgba[dstIndex] = pack(color);
                            }
                        `
                    })

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
     * Done once after init to avoid per-frame allocations (memory leak / GC churn).
     */
    private _createResources() {

        this._inputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        this._tempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })

        // dx, dy — 2 x f32, padded to 16 bytes to satisfy uniform buffer alignment
        this._uniformBuffer = this._device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })

        this._createOutputBuffers()

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
                        type: "uniform"
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
                        buffer: this._uniformBuffer
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
     * 1D smooth value noise: interpolates between per-integer random values with a
     * smoothstep, giving a continuous non-repeating wander. Deterministic for a
     * given (x, seed) so both axes stay independent but stable frame to frame.
     */
    private _smoothNoise(x: number, seed: number): number {
        const i = Math.floor(x)
        const f = x - i
        const rand = (n: number) => {
            const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453
            return (s - Math.floor(s)) * 2 - 1 // -1..1
        }
        const a = rand(i)
        const b = rand(i + 1)
        const u = f * f * (3 - 2 * f) // smoothstep
        return a + (b - a) * u
    }

    /**
     * Computes a single dx/dy offset for the whole frame, one value per call - the
     * shader never makes this decision itself. Behaviour depends on the current mode.
     * @param {number} elapsedSeconds
     * @returns {[number, number]}
     */
    private _computeOffset(elapsedSeconds: number): [number, number] {
        const t = elapsedSeconds * this._speed

        switch (this._mode) {

            case "sine":
                return [
                    Math.sin(t) * this._intensity,
                    Math.cos(t * 1.3) * this._intensity
                ]

            case "perlin":
                return [
                    this._smoothNoise(t, 1) * this._intensity,
                    this._smoothNoise(t, 2) * this._intensity
                ]

            case "circular":
                return [
                    Math.cos(t) * this._intensity,
                    Math.sin(t) * this._intensity
                ]

            case "horizontal":
                return [
                    Math.sin(t) * this._intensity,
                    0
                ]

            case "vertical":
                return [
                    0,
                    Math.sin(t) * this._intensity
                ]

            case "decay": {
                // One-shot: normalized progress 0..1 since the last trigger.
                const since = (performance.now() - this._triggerTime) / 1000
                if (since >= this._decayDuration || !isFinite(since)) {
                    return [0, 0]
                }
                // Fast oscillation whose amplitude falls off linearly to zero.
                const envelope = 1 - since / this._decayDuration
                const osc = t * 3
                return [
                    Math.sin(osc) * this._intensity * envelope,
                    Math.cos(osc * 1.3) * this._intensity * envelope
                ]
            }

            case "random":
            default: {
                const step = Math.floor(t)
                if (step !== this._lastStep) {
                    this._lastStep = step
                    this._currentDx = (Math.random() - 0.5) * 2 * this._intensity
                    this._currentDy = (Math.random() - 0.5) * 2 * this._intensity
                }
                return [this._currentDx, this._currentDy]
            }
        }
    }

    /**
     * Shifts the whole frame by a small, time-varying offset to simulate a shaking
     * panel. Reuses the GPU resources created in init(): only the per-frame pixels
     * and the uniform params are uploaded each call.
     * @param {ImageData} frameData
     * @param {Options} [options] currently unused - reserved for per-call overrides
     * @returns {Promise<ImageData>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _doRendering(frameData: ImageData, _options?: Options): Promise<ImageData> {

        this._device.queue.writeBuffer(this._inputBuffer, 0, frameData.data)

        const elapsedSeconds = (performance.now() - this._startTime) / 1000
        const [dx, dy] = this._computeOffset(elapsedSeconds)
        const uniformData = new Float32Array([dx, dy, 0, 0])
        this._device.queue.writeBuffer(this._uniformBuffer, 0, uniformData.buffer)

        const commandEncoder = this._device.createCommandEncoder()
        const passEncoder = commandEncoder.beginComputePass()

        passEncoder.setPipeline(this._computePipeline)
        passEncoder.setBindGroup(0, this._bindGroup)
        passEncoder.dispatchWorkgroups(this._width, this._height)
        passEncoder.end()

        return this._submitAndReadback(this._tempBuffer, commandEncoder) || Promise.resolve(frameData)
    }

}

export { ShakyEffectRenderer as ShakyRenderer }
export type { ShakyEffectParams, ShakyMode }
