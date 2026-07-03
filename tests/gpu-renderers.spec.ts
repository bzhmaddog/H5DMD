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
import {Options} from '../src/utils'

// ---------------------------------------------------------------------------
// Shared GPU stub
// ---------------------------------------------------------------------------

const W = 4, H = 4

type FakeMessage = { type: 'error' | 'warning' | 'info'; message: string; lineNum: number }

const warnMsg  = (): FakeMessage => ({ type: 'warning', message: 'unused variable', lineNum: 1 })
const errorMsg = (): FakeMessage => ({ type: 'error',   message: 'undefined symbol', lineNum: 2 })

/** Build a fake GPUDevice that satisfies every API call made by LayerRenderer subclasses. */
function makeFakeDevice(compilationMessages: FakeMessage[] = []) {
    const byteLength = W * H * 4

    const makeBuffer = () => ({
        mapState: 'unmapped' as const,
        mapAsync: () => Promise.resolve(),
        getMappedRange: () => new ArrayBuffer(byteLength),
        unmap: vi.fn(),
    })

    return {
        createShaderModule: () => ({
            getCompilationInfo: () => Promise.resolve({ messages: compilationMessages })
        }),
        createBuffer: () => makeBuffer(),
        createBindGroupLayout: () => ({}),
        createBindGroup: () => ({}),
        createComputePipeline: () => ({}),
        createPipelineLayout: () => ({}),
        queue: { writeBuffer: vi.fn(), submit: vi.fn() },
        createCommandEncoder: () => ({
            beginComputePass: () => ({
                setPipeline: vi.fn(),
                setBindGroup: vi.fn(),
                dispatchWorkgroups: vi.fn(),
                end: vi.fn(),
            }),
            copyBufferToBuffer: vi.fn(),
            finish: () => ({}),
        }),
    }
}

const makeFakeGpu = (compilationMessages: FakeMessage[] = []) => ({
    requestAdapter: () => Promise.resolve({
        requestDevice: () => Promise.resolve(makeFakeDevice(compilationMessages))
    })
})

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

    test('constructor accepts empty noises array without fetching', () => {
        expect(() => new NoiseEffectRenderer(W, H)).not.toThrow()
    })

    test('constructor rejects non-array noises', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => new NoiseEffectRenderer(W, H, { noises: 'bad' as any })).toThrow(TypeError)
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
        const r = new NoiseEffectRenderer(W, H)
        await r.init()
        // Inject a noise frame so the `if (noise)` branch is taken
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = r as any
        p._noises = [new Uint8ClampedArray(W * H * 4)]
        p._nbFrames = 1
        const writeSpy = vi.spyOn(p._device.queue, 'writeBuffer')
        await r.renderFrame(makeImageData())
        expect(writeSpy).toHaveBeenCalled()
    })

    test('_getImageData draws bitmap and returns pixel data', async () => {
        const r = new NoiseEffectRenderer(W, H)
        const fakeBitmap = document.createElement('canvas') as unknown as ImageBitmap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fakeBitmap as any).close = () => {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await (r as any)._getImageData(fakeBitmap)
        expect(data).toBeInstanceOf(Uint8ClampedArray)
        expect(data.length).toBe(W * H * 4)
    })

    test('_loadNoise resolves with blob on a successful fetch', async () => {
        const fakeBlob = new Blob()
        vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, blob: () => Promise.resolve(fakeBlob) }))
        const r = new NoiseEffectRenderer(W, H)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await expect((r as any)._loadNoise('noise.png')).resolves.toBe(fakeBlob)
        vi.unstubAllGlobals()
    })

    test('_loadNoise rejects on a failed fetch', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve({ ok: false, status: 404 }))
        const r = new NoiseEffectRenderer(W, H)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await expect((r as any)._loadNoise('noise.png')).rejects.toThrow(/HTTP error/)
        vi.unstubAllGlobals()
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
        const opts = new Options({ innerColor: 'FF0000FF', outerColor: '000000FF', width: 1 })
        await expect(r.renderFrame(makeImageData(), opts)).resolves.toBeInstanceOf(ImageData)
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
