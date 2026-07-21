/**
 * Unit tests for ShakyRenderer.
 *
 * GPU-independent paths (constructor, setters, triggerShake, _computeOffset for
 * all seven modes, _smoothNoise, init() rejection) are exercised directly.
 * The GPU success path (init() → _createResources → _doRendering) is covered
 * via a lightweight WebGPU stub that satisfies every API call without a real device.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ShakyRenderer } from '../src/renderers'
import { Renderer } from '../src/renderers/renderer'
import { makeFakeGpu, warnMsg, errorMsg } from './helpers/fake-gpu'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const priv = (r: ShakyRenderer): any => r as any

const computeOffset = (r: ShakyRenderer, elapsedSeconds: number): [number, number] =>
    priv(r)._computeOffset(elapsedSeconds)

const smoothNoise = (r: ShakyRenderer, x: number, seed: number): number => priv(r)._smoothNoise(x, seed)

// ---------------------------------------------------------------------------

describe('ShakyRenderer constructor', () => {
    test('applies default params', () => {
        const r = new ShakyRenderer(32, 16)
        expect(priv(r)._intensity).toBe(4)
        expect(priv(r)._speed).toBe(8)
        expect(priv(r)._mode).toBe('random')
        expect(priv(r)._decayDuration).toBe(0.6)
    })

    test('respects custom params', () => {
        const r = new ShakyRenderer(32, 16, {
            intensity: 10,
            speed: 3,
            mode: 'sine',
            decayDuration: 1.5,
        })
        expect(priv(r)._intensity).toBe(10)
        expect(priv(r)._speed).toBe(3)
        expect(priv(r)._mode).toBe('sine')
        expect(priv(r)._decayDuration).toBe(1.5)
    })

    test('decay trigger starts at -Infinity (not yet triggered)', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'decay' })
        expect(priv(r)._triggerTime).toBe(-Infinity)
    })
})

// ---------------------------------------------------------------------------

describe('ShakyRenderer setters', () => {
    test('setIntensity updates _intensity', () => {
        const r = new ShakyRenderer(32, 16)
        r.setIntensity(7)
        expect(priv(r)._intensity).toBe(7)
    })

    test('setSpeed updates _speed', () => {
        const r = new ShakyRenderer(32, 16)
        r.setSpeed(20)
        expect(priv(r)._speed).toBe(20)
    })

    test('setMode updates _mode', () => {
        const r = new ShakyRenderer(32, 16)
        r.setMode('circular')
        expect(priv(r)._mode).toBe('circular')
    })
})

// ---------------------------------------------------------------------------

describe('ShakyRenderer.triggerShake', () => {
    test('sets _triggerTime to approximately now', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'decay' })
        const before = performance.now()
        r.triggerShake()
        const after = performance.now()
        expect(priv(r)._triggerTime).toBeGreaterThanOrEqual(before)
        expect(priv(r)._triggerTime).toBeLessThanOrEqual(after)
    })

    test('can be called multiple times (re-arms the decay)', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'decay' })
        r.triggerShake()
        const t1 = priv(r)._triggerTime
        r.triggerShake()
        const t2 = priv(r)._triggerTime
        expect(t2).toBeGreaterThanOrEqual(t1)
    })
})

// ---------------------------------------------------------------------------

describe('ShakyRenderer.init — WebGPU unavailable', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = globalThis.navigator as any
    const originalGpu = nav.gpu

    afterEach(() => {
        nav.gpu = originalGpu
        Renderer.releaseSharedDevice()
    })

    test('rejects when navigator.gpu is undefined', async () => {
        nav.gpu = undefined
        const r = new ShakyRenderer(32, 16)
        await expect(r.init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('rejects when requestAdapter returns null', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        const r = new ShakyRenderer(32, 16)
        await expect(r.init()).rejects.toThrow(/no compatible GPU adapter/)
    })
})

// ---------------------------------------------------------------------------

describe('ShakyRenderer._computeOffset', () => {
    test('sine: dx and dy are within [-intensity, +intensity]', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'sine', intensity: 5, speed: 1 })
        for (const t of [0, 0.25, 0.5, 1, 2, 3.14]) {
            const [dx, dy] = computeOffset(r, t)
            expect(Math.abs(dx)).toBeLessThanOrEqual(5 + 1e-10)
            expect(Math.abs(dy)).toBeLessThanOrEqual(5 + 1e-10)
        }
    })

    test('sine: dx = sin(t * speed) * intensity', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'sine', intensity: 3, speed: 4 })
        const [dx] = computeOffset(r, 1)
        expect(dx).toBeCloseTo(Math.sin(4) * 3)
    })

    test('horizontal: dy is always 0', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'horizontal', intensity: 6, speed: 5 })
        for (const t of [0, 0.1, 0.5, 1, 5]) {
            const [, dy] = computeOffset(r, t)
            expect(dy).toBe(0)
        }
    })

    test('horizontal: dx is within [-intensity, +intensity]', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'horizontal', intensity: 4 })
        for (const t of [0, 0.1, 0.5, 1]) {
            const [dx] = computeOffset(r, t)
            expect(Math.abs(dx)).toBeLessThanOrEqual(4 + 1e-10)
        }
    })

    test('vertical: dx is always 0', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'vertical', intensity: 6, speed: 5 })
        for (const t of [0, 0.1, 0.5, 1, 5]) {
            const [dx] = computeOffset(r, t)
            expect(dx).toBe(0)
        }
    })

    test('circular: offset traces a circle of radius intensity', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'circular', intensity: 3, speed: 2 })
        for (const t of [0, 0.1, 0.5, 1, Math.PI]) {
            const [dx, dy] = computeOffset(r, t)
            const radius = Math.sqrt(dx * dx + dy * dy)
            expect(radius).toBeCloseTo(3)
        }
    })

    test('perlin: values within [-intensity, +intensity]', () => {
        const r = new ShakyRenderer(32, 16, { mode: 'perlin', intensity: 5 })
        for (const t of [0, 0.1, 0.5, 1, 2, 10]) {
            const [dx, dy] = computeOffset(r, t)
            expect(Math.abs(dx)).toBeLessThanOrEqual(5 + 1e-10)
            expect(Math.abs(dy)).toBeLessThanOrEqual(5 + 1e-10)
        }
    })

    describe('decay mode', () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })

        test('returns [0,0] before triggerShake is ever called', () => {
            const r = new ShakyRenderer(32, 16, { mode: 'decay' })
            const [dx, dy] = computeOffset(r, 1)
            expect(dx).toBe(0)
            expect(dy).toBe(0)
        })

        test('returns non-zero offset immediately after triggerShake', () => {
            // Simulate: trigger at t=1000ms, then check at t=1001ms (1ms elapsed, well within 1s window)
            let nowValue = 1000
            vi.spyOn(performance, 'now').mockImplementation(() => nowValue)
            const r = new ShakyRenderer(32, 16, { mode: 'decay', intensity: 5, speed: 8, decayDuration: 1 })
            r.triggerShake() // _triggerTime = 1000
            nowValue = 1001 // 1ms later → since = 0.001s < 1s
            const [dx, dy] = computeOffset(r, 0.5)
            expect(Math.abs(dx) + Math.abs(dy)).toBeGreaterThan(0)
        })

        test('returns [0,0] after the decay window has passed', () => {
            // Simulate: trigger at t=0ms, then check at t=600ms (past the 0.5s window)
            let nowValue = 0
            vi.spyOn(performance, 'now').mockImplementation(() => nowValue)
            const r = new ShakyRenderer(32, 16, { mode: 'decay', decayDuration: 0.5 })
            r.triggerShake() // _triggerTime = 0
            nowValue = 600 // 600ms later → since = 0.6s > 0.5s
            const [dx, dy] = computeOffset(r, 1)
            expect(dx).toBe(0)
            expect(dy).toBe(0)
        })
    })

    describe('random mode', () => {
        test('values are within [-intensity, +intensity]', () => {
            const r = new ShakyRenderer(32, 16, { mode: 'random', intensity: 4, speed: 10 })
            for (let t = 0; t < 5; t += 0.17) {
                const [dx, dy] = computeOffset(r, t)
                expect(Math.abs(dx)).toBeLessThanOrEqual(4 + 1e-10)
                expect(Math.abs(dy)).toBeLessThanOrEqual(4 + 1e-10)
            }
        })

        test('same step returns cached values (no re-roll)', () => {
            const r = new ShakyRenderer(32, 16, { mode: 'random', speed: 1 })
            // Two calls with the same elapsed second → same integer step
            const [dx1, dy1] = computeOffset(r, 2.1)
            const [dx2, dy2] = computeOffset(r, 2.9)
            expect(dx1).toBe(dx2)
            expect(dy1).toBe(dy2)
        })

        test('different steps produce a new roll', () => {
            const r = new ShakyRenderer(32, 16, { mode: 'random', speed: 1, intensity: 4 })
            // We can't guarantee they differ (tiny probability), but _lastStep should update
            computeOffset(r, 1.5) // step = 1
            computeOffset(r, 2.5) // step = 2
            expect(priv(r)._lastStep).toBe(2)
        })
    })
})

// ---------------------------------------------------------------------------

describe('ShakyRenderer._smoothNoise', () => {
    test('output is within [-1, +1] scaled by nothing (raw output)', () => {
        const r = new ShakyRenderer(32, 16)
        for (let x = 0; x < 5; x += 0.3) {
            const v = smoothNoise(r, x, 1)
            expect(Math.abs(v)).toBeLessThanOrEqual(1 + 1e-10)
        }
    })

    test('is continuous: midpoint value is between its two neighbors', () => {
        const r = new ShakyRenderer(32, 16)
        const a = smoothNoise(r, 2, 1)
        const b = smoothNoise(r, 3, 1)
        const mid = smoothNoise(r, 2.5, 1)
        // Midpoint must lie between the two endpoint values (smoothstep guarantee)
        const lo = Math.min(a, b) - 1e-10
        const hi = Math.max(a, b) + 1e-10
        expect(mid).toBeGreaterThanOrEqual(lo)
        expect(mid).toBeLessThanOrEqual(hi)
    })

    test('different seeds produce different sequences', () => {
        const r = new ShakyRenderer(32, 16)
        const v1 = smoothNoise(r, 1.5, 1)
        const v2 = smoothNoise(r, 1.5, 2)
        expect(v1).not.toBe(v2)
    })
})

// ---------------------------------------------------------------------------
// GPU success path — stubbed WebGPU device
// ---------------------------------------------------------------------------

describe('ShakyRenderer.init — GPU success path + rendering', () => {
    // Use a tiny canvas so buffer allocations are cheap
    const W = 4,
        H = 4

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = globalThis.navigator as any
    const originalGpu = nav.gpu

    beforeEach(() => {
        // Stub the WebGPU flag constants that the renderer reads at runtime
        vi.stubGlobal('GPUBufferUsage', {
            STORAGE: 0x80,
            COPY_SRC: 0x04,
            COPY_DST: 0x08,
            MAP_READ: 0x01,
            UNIFORM: 0x40,
        })
        vi.stubGlobal('GPUShaderStage', { COMPUTE: 0x4 })
        vi.stubGlobal('GPUMapMode', { READ: 0x1 })
        nav.gpu = makeFakeGpu()
    })

    afterEach(() => {
        nav.gpu = originalGpu
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
        Renderer.releaseSharedDevice()
    })

    test('init() resolves successfully with a stubbed GPU', async () => {
        const r = new ShakyRenderer(W, H)
        await expect(r.init()).resolves.toBeUndefined()
    })

    test('init() logs a warning when shader compilation reports warning messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const r = new ShakyRenderer(W, H)
        await r.init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('init() rejects when the shader has compilation errors', async () => {
        nav.gpu = makeFakeGpu([errorMsg()])
        const r = new ShakyRenderer(W, H)
        await expect(r.init()).rejects.toThrow(/shader compilation failed/)
    })

    test('after init, renderFrame is no longer the _doNothing placeholder', async () => {
        const r = new ShakyRenderer(W, H)
        await r.init()
        expect(priv(r).renderFrame).not.toBe(priv(r)._doNothing)
    })

    test('renderFrame returns an ImageData with correct dimensions', async () => {
        const r = new ShakyRenderer(W, H)
        await r.init()
        const input = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
        const output = await r.renderFrame(input)
        expect(output).toBeInstanceOf(ImageData)
        expect(output.width).toBe(W)
        expect(output.height).toBe(H)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new ShakyRenderer(W, H)
        await r.init()
        // Force the active output buffer into a "mapped" state so _submitAndReadback returns null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(priv(r)._outputBuffers as any)[0].mapState = 'mapped'
        const input = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
        const output = await r.renderFrame(input)
        // Falls back to the original frame data
        expect(output).toBe(input)
    })
})
