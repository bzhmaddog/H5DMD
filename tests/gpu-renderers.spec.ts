/**
 * Unit tests for all WebGPU compute renderers.
 *
 * Each renderer is tested via a lightweight WebGPU stub that satisfies every
 * GPU API call without a real device — the same technique used for ShakyRenderer.
 * This covers init() success paths, _createResources(), _doRendering(), and any
 * renderer-specific constructor params or rendering options.
 *
 * init() rejection paths (no navigator.gpu, no adapter) are identical across all
 * renderers; only ChangeAlphaRenderer is tested exhaustively for those since the
 * DmdRenderer spec already proves the pattern works.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {
    ChangeAlphaRenderer,
    ChromaKeyRenderer,
    DummyRenderer,
    NoiseEffectRenderer,
    OutlineRenderer,
    RemoveAliasingRenderer,
    RemoveAlphaRenderer,
} from '../src/renderers'
import {Renderer} from '../src/renderers/renderer'
import {Options, Utils} from '../src/utils'
import {errorMsg, makeFakeGpu, warnMsg} from './helpers/fake-gpu'

// ---------------------------------------------------------------------------
// Shared GPU stub
// ---------------------------------------------------------------------------

const W = 4, H = 4

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nav = globalThis.navigator as any
let savedGpu: unknown

function stubGpu() {
    savedGpu = nav.gpu
    vi.stubGlobal('GPUBufferUsage', { STORAGE: 0x80, COPY_SRC: 0x04, COPY_DST: 0x08, MAP_READ: 0x01, UNIFORM: 0x40 })
    vi.stubGlobal('GPUShaderStage', { COMPUTE: 0x4 })
    vi.stubGlobal('GPUMapMode',     { READ: 0x1 })
    nav.gpu = makeFakeGpu()
}

function restoreGpu() {
    nav.gpu = savedGpu
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    Renderer.releaseSharedDevice()
}

const makeImageData = () => new ImageData(new Uint8ClampedArray(W * H * 4), W, H)

// ---------------------------------------------------------------------------

describe('ChangeAlphaRenderer', () => {

    beforeEach(stubGpu)
    afterEach(restoreGpu)

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new ChangeAlphaRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new ChangeAlphaRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU', async () => {
        await expect(new ChangeAlphaRenderer(W, H).init()).resolves.toBeUndefined()
    })

    test('init() rejects when the shader has compilation errors', async () => {
        nav.gpu = makeFakeGpu([errorMsg()])
        await expect(new ChangeAlphaRenderer(W, H).init()).rejects.toThrow(/shader compilation failed/)
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new ChangeAlphaRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData', async () => {
        const r = new ChangeAlphaRenderer(W, H)
        await r.init()
        const out = await r.renderFrame(makeImageData(), new Options({ opacity: 0.5 }))
        expect(out).toBeInstanceOf(ImageData)
    })

    test('renderFrame works without explicit opacity option', async () => {
        const r = new ChangeAlphaRenderer(W, H)
        await r.init()
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new ChangeAlphaRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        expect(await r.renderFrame(input)).toBe(input)
    })

    test('a busy drop after a completed frame returns the last PROCESSED frame, not the input', async () => {
        const r = new ChangeAlphaRenderer(W, H)
        await r.init()

        // One successful pass populates the last-readback cache (and flips the
        // double-buffer index to 1).
        const firstOut = await r.renderFrame(makeImageData(), new Options({ opacity: 0.5 }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[1].mapState = 'mapped'
        const input = makeImageData()
        const out = await r.renderFrame(input, new Options({ opacity: 0.4 }))

        // Returning the raw input here would flash the layer at full opacity in the
        // middle of a fade - the stale processed frame is the correct fallback.
        expect(out).not.toBe(input)
        expect(out).toBe(firstOut)
    })
})

// ---------------------------------------------------------------------------

describe('ChromaKeyRenderer', () => {

    beforeEach(stubGpu)
    afterEach(restoreGpu)

    test('stores default color and threshold', () => {
        const r = new ChromaKeyRenderer(W, H)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = r as any
        expect(p._keyR).toBe(0)
        expect(p._keyG).toBe(255)
        expect(p._keyB).toBe(0)
        expect(p._threshold).toBe(50)
    })

    test('stores custom color and threshold', () => {
        const r = new ChromaKeyRenderer(W, H, { color: [255, 0, 128], threshold: 30 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = r as any
        expect(p._keyR).toBe(255)
        expect(p._keyG).toBe(0)
        expect(p._keyB).toBe(128)
        expect(p._threshold).toBe(30)
    })

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new ChromaKeyRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new ChromaKeyRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU', async () => {
        await expect(new ChromaKeyRenderer(W, H).init()).resolves.toBeUndefined()
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new ChromaKeyRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData', async () => {
        const r = new ChromaKeyRenderer(W, H, { color: [0, 255, 0], threshold: 50 })
        await r.init()
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new ChromaKeyRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        expect(await r.renderFrame(input)).toBe(input)
    })
})

// ---------------------------------------------------------------------------

describe('DummyRenderer', () => {

    beforeEach(stubGpu)
    afterEach(restoreGpu)

    test('applies default params', () => {
        const r = new DummyRenderer(W, H)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._exampleOption).toBe(false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._exampleValue).toBe(0)
    })

    test('respects custom params', () => {
        const r = new DummyRenderer(W, H, { exampleOption: true, exampleValue: 42 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._exampleOption).toBe(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._exampleValue).toBe(42)
    })

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new DummyRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new DummyRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU and logs a warning', async () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        await expect(new DummyRenderer(W, H).init()).resolves.toBeUndefined()
        expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Are you sure'))
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new DummyRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const r = new DummyRenderer(W, H)
        await r.init()
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const r = new DummyRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        expect(await r.renderFrame(input)).toBe(input)
    })
})

// ---------------------------------------------------------------------------

describe('NoiseEffectRenderer', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        stubGpu()
    })
    afterEach(restoreGpu)

    test('constructor accepts empty params', () => {
        expect(() => new NoiseEffectRenderer(W, H)).not.toThrow()
    })

    test('constructor stores pre-loaded noise frames', () => {
        const noises = [new Uint8ClampedArray(W * H * 4)]
        const r = new NoiseEffectRenderer(W, H, { noises, duration: 400 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._noises).toBe(noises)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._frameDuration).toBe(400)
    })

    test('fromBitmaps moved to Utils.bitmapsToPixelData — converts ImageBitmaps to pixel arrays', () => {
        const fakeBitmap = document.createElement('canvas') as unknown as ImageBitmap
        const result = Utils.bitmapsToPixelData([fakeBitmap], W, H)
        expect(result).toHaveLength(1)
        expect(result[0]).toBeInstanceOf(Uint8ClampedArray)
        expect(result[0].length).toBe(W * H * 4)
    })

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new NoiseEffectRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new NoiseEffectRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU', async () => {
        await expect(new NoiseEffectRenderer(W, H).init()).resolves.toBeUndefined()
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new NoiseEffectRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData with empty noise list', async () => {
        const r = new NoiseEffectRenderer(W, H)
        await r.init()
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame uploads noise data when a noise frame is loaded', async () => {
        const r = new NoiseEffectRenderer(W, H, { noises: [new Uint8ClampedArray(W * H * 4)] })
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const writeSpy = vi.spyOn((r as any)._device.queue, 'writeBuffer')
        await r.renderFrame(makeImageData())
        expect(writeSpy).toHaveBeenCalled()
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new NoiseEffectRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        expect(await r.renderFrame(input)).toBe(input)
    })
})

// ---------------------------------------------------------------------------

describe('OutlineRenderer', () => {

    beforeEach(stubGpu)
    afterEach(restoreGpu)

    test('stores default constructor params', () => {
        const r = new OutlineRenderer(W, H)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = r as any
        expect(p._innerColor).toBe('FFFFFFFF')
        expect(p._outerColor).toBe('000000FF')
        expect(p._outlineWidth).toBe(1)
    })

    test('stores custom constructor params', () => {
        const r = new OutlineRenderer(W, H, { innerColor: 'FF0000FF', outerColor: 'AABBCCFF', width: 3 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = r as any
        expect(p._innerColor).toBe('FF0000FF')
        expect(p._outerColor).toBe('AABBCCFF')
        expect(p._outlineWidth).toBe(3)
    })

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new OutlineRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new OutlineRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU', async () => {
        await expect(new OutlineRenderer(W, H).init()).resolves.toBeUndefined()
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new OutlineRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData with valid outline options', async () => {
        const r = new OutlineRenderer(W, H)
        await r.init()
        await expect(r.renderFrame(makeImageData(), { innerColor: 'FF0000FF', outerColor: '000000FF', width: 1 })).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame uses constructor defaults when no options are passed', async () => {
        const r = new OutlineRenderer(W, H, { innerColor: 'FF0000FF', outerColor: '000000FF', width: 2 })
        await r.init()
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new OutlineRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        const opts = new Options({ innerColor: 'FF0000FF', outerColor: '000000FF', width: 1 })
        expect(await r.renderFrame(input, opts)).toBe(input)
    })
})

// ---------------------------------------------------------------------------

describe('RemoveAliasingRenderer', () => {

    beforeEach(stubGpu)
    afterEach(restoreGpu)

    test('stores default constructor params', () => {
        const r = new RemoveAliasingRenderer(W, H)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._threshold).toBe(0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._baseColor).toBe('FFFFFFFF')
    })

    test('stores custom constructor params', () => {
        const r = new RemoveAliasingRenderer(W, H, { threshold: 10, baseColor: 'FF0000FF' })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._threshold).toBe(10)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((r as any)._baseColor).toBe('FF0000FF')
    })

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new RemoveAliasingRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new RemoveAliasingRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU', async () => {
        await expect(new RemoveAliasingRenderer(W, H).init()).resolves.toBeUndefined()
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new RemoveAliasingRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData with default options', async () => {
        const r = new RemoveAliasingRenderer(W, H)
        await r.init()
        // _doRendering has built-in defaults for threshold and baseColor
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new RemoveAliasingRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        expect(await r.renderFrame(input)).toBe(input)
    })
})

// ---------------------------------------------------------------------------

describe('RemoveAlphaRenderer', () => {

    beforeEach(stubGpu)
    afterEach(restoreGpu)

    test('init() rejects when navigator.gpu is absent', async () => {
        nav.gpu = undefined
        await expect(new RemoveAlphaRenderer(W, H).init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() rejects when no GPU adapter is found', async () => {
        nav.gpu = { requestAdapter: () => Promise.resolve(null) }
        await expect(new RemoveAlphaRenderer(W, H).init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() resolves with a stubbed GPU', async () => {
        await expect(new RemoveAlphaRenderer(W, H).init()).resolves.toBeUndefined()
    })

    test('init() warns when shader compilation reports messages', async () => {
        nav.gpu = makeFakeGpu([warnMsg()])
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        await new RemoveAlphaRenderer(W, H).init()
        await Promise.resolve()
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shader compilation warnings'), expect.anything())
    })

    test('renderFrame returns ImageData', async () => {
        const r = new RemoveAlphaRenderer(W, H)
        await r.init()
        await expect(r.renderFrame(makeImageData())).resolves.toBeInstanceOf(ImageData)
    })

    test('renderFrame falls back to input when output buffer is busy', async () => {
        const r = new RemoveAlphaRenderer(W, H)
        await r.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(r as any)._outputBuffers[0].mapState = 'mapped'
        const input = makeImageData()
        expect(await r.renderFrame(input)).toBe(input)
    })
})
