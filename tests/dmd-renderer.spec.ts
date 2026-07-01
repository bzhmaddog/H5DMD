/**
 * Unit tests for DmdRenderer:
 *   - init() rejects (promptly) when WebGPU or a GPU adapter is unavailable.
 *   - the brightness constructor argument is honoured even when the background
 *     brightness argument is omitted.
 *   - _int2Hex clamps to a single byte so it always yields two hex digits.
 *   - setDotSize / setDotSpace / setDotShape runtime behaviour.
 *   - setBrightness clamping and rounding.
 *   - constructor computations (visible dots, padded bytes, etc.).
 *   - getters return expected values.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {DmdRenderer} from '../src/renderers'
import {DotShape} from '../src/enums'

describe('DmdRenderer.init — WebGPU availability', () => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = globalThis.navigator as any
    const originalGpu = nav.gpu

    afterEach(() => {
        nav.gpu = originalGpu
    })

    test('rejects when no GPU adapter is available', async () => {
        nav.gpu = {requestAdapter: () => Promise.resolve(null)}

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        await expect(renderer.init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('rejects when WebGPU is not supported at all', async () => {
        nav.gpu = undefined

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        await expect(renderer.init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('settles promptly rather than hanging', async () => {
        nav.gpu = {requestAdapter: () => Promise.resolve(null)}

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        let settled = false
        const init = renderer.init().catch(() => { /* expected */ }).finally(() => { settled = true })

        await Promise.race([
            init,
            new Promise(resolve => setTimeout(resolve, 50))
        ])

        expect(settled).toBe(true)
    })
})

describe('DmdRenderer — brightness and colour helpers', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('honours the brightness argument when background brightness is omitted', () => {
        const renderer = new DmdRenderer(
            32, 8, 64, 16, 1, 0, DotShape.Square,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            undefined as any,
            0.5
        )
        expect(renderer.brightness).toBe(0.5)
    })

    test('_int2Hex clamps to a single byte (always two hex digits)', () => {
        const renderer = new DmdRenderer(32, 8, 64, 16, 1, 0, DotShape.Square, 0.5, 0.5)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const int2Hex = (n: number) => (renderer as any)._int2Hex(n) as string

        expect(int2Hex(256)).toBe('ff')
        expect(int2Hex(300)).toBe('ff')
        expect(int2Hex(-5)).toBe('00')
        expect(int2Hex(255)).toBe('ff')
        expect(int2Hex(1)).toBe('01')
    })
})

describe('DmdRenderer — constructor computations', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('computes visible dot count from screen size, pixel size, and dot space', () => {
        // screenWidth=100, screenHeight=50, pixelSize=5, dotSpace=1 → cell=6
        // visibleDotsX = floor(100/6) = 16, visibleDotsY = floor(50/6) = 8
        const renderer = new DmdRenderer(16, 8, 100, 50, 5, 1, DotShape.Circle, 14, 1)
        expect(renderer.visibleDotsX).toBe(16)
        expect(renderer.visibleDotsY).toBe(8)
    })

    test('computes padded bytes per row (multiple of 256)', () => {
        // dmdWidth=32 → 32*4=128 bytes → ceil(128/256)*256 = 256
        const renderer = new DmdRenderer(32, 8, 64, 16, 1, 0, DotShape.Square, 14, 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._paddedBytesPerRow).toBe(256)
    })

    test('computes padded bytes per row for wider DMD', () => {
        // dmdWidth=100 → 100*4=400 bytes → ceil(400/256)*256 = 512
        const renderer = new DmdRenderer(100, 30, 200, 60, 1, 0, DotShape.Square, 14, 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._paddedBytesPerRow).toBe(512)
    })

    test('stores dmdWidth and dmdHeight', () => {
        const renderer = new DmdRenderer(128, 32, 256, 64, 2, 0, DotShape.Square, 14, 1)
        expect(renderer.dmdWidth).toBe(128)
        expect(renderer.dmdHeight).toBe(32)
    })

    test('computes max DMD dimensions at dotSize=1', () => {
        // screenWidth=100, dotSpace=2 → maxDmdWidth = floor(100/(1+2)) = 33
        // screenHeight=60, dotSpace=2 → maxDmdHeight = floor(60/(1+2)) = 20
        const renderer = new DmdRenderer(10, 10, 100, 60, 5, 2, DotShape.Circle, 14, 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._maxDmdWidth).toBe(33)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._maxDmdHeight).toBe(20)
    })

    test('background color is computed from bgBrightness', () => {
        const renderer = new DmdRenderer(32, 8, 64, 16, 1, 0, DotShape.Square, 0, 1)
        // bgBrightness=0 → _bgR=_bgG=_bgB=0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._bgR).toBe(0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._bgG).toBe(0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._bgB).toBe(0)
    })

    test('background HSP is computed', () => {
        const renderer = new DmdRenderer(32, 8, 64, 16, 1, 0, DotShape.Square, 0, 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._bgHSP).toBe(0)
    })
})

describe('DmdRenderer — setDotSize', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('updates pixel size and recalculates visible dots', () => {
        // screen=100x50, initial pixelSize=2, dotSpace=1 → cell=3 → visible=33x16
        const renderer = new DmdRenderer(33, 16, 100, 50, 2, 1, DotShape.Square, 14, 1)
        expect(renderer.dotSize).toBe(2)
        expect(renderer.visibleDotsX).toBe(33)

        renderer.setDotSize(5)
        expect(renderer.dotSize).toBe(5)
        // cell=5+1=6 → visible=floor(100/6)=16
        expect(renderer.visibleDotsX).toBe(16)
        expect(renderer.visibleDotsY).toBe(Math.floor(50 / 6))
    })

    test('clamps to minimum dot size for the current shape', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Circle, 14, 1)
        renderer.setDotSize(2) // min for circle is 5
        expect(renderer.dotSize).toBe(5)
    })

    test('rounds to nearest integer', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        renderer.setDotSize(3.7)
        expect(renderer.dotSize).toBe(4)
    })

    test('no-op when size does not change', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Circle, 14, 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniformsBefore = (renderer as any)._renderUniformData[0]
        renderer.setDotSize(5) // same as current
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((renderer as any)._renderUniformData[0]).toBe(uniformsBefore)
    })
})

describe('DmdRenderer — setDotSpace', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('updates dot space and recalculates visible dots', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        expect(renderer.dotSpace).toBe(0)
        expect(renderer.visibleDotsX).toBe(20) // floor(100/5)

        renderer.setDotSpace(2)
        expect(renderer.dotSpace).toBe(2)
        // cell=5+2=7 → floor(100/7)=14
        expect(renderer.visibleDotsX).toBe(14)
    })

    test('clamps to minimum dot space for the current shape', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Circle, 14, 1)
        renderer.setDotSpace(0) // min for circle is 1
        expect(renderer.dotSpace).toBe(1)
    })

    test('allows 0 for square shape', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Square, 14, 1)
        renderer.setDotSpace(0)
        expect(renderer.dotSpace).toBe(0)
    })

    test('rounds to nearest integer', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        renderer.setDotSpace(2.6)
        expect(renderer.dotSpace).toBe(3)
    })

    test('no-op when space does not change', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 2, DotShape.Square, 14, 1)
        renderer.setDotSpace(2)
        // visibleDotsX should still be consistent
        expect(renderer.visibleDotsX).toBe(Math.floor(100 / 7))
    })
})

describe('DmdRenderer — setDotShape', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('changes the shape', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Square, 14, 1)
        renderer.setDotShape(DotShape.Circle)
        expect(renderer.dotShape).toBe(DotShape.Circle)
    })

    test('enforces minimum dot size for the new shape', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 2, 0, DotShape.Square, 14, 1)
        expect(renderer.dotSize).toBe(2)
        renderer.setDotShape(DotShape.Circle) // min size 5
        expect(renderer.dotSize).toBe(5)
    })

    test('enforces minimum dot space for the new shape', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        expect(renderer.dotSpace).toBe(0)
        renderer.setDotShape(DotShape.Circle) // min space 1
        expect(renderer.dotSpace).toBe(1)
    })

    test('no-op when shape does not change', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Circle, 14, 1)
        renderer.setDotShape(DotShape.Circle)
        expect(renderer.dotShape).toBe(DotShape.Circle)
    })

    test('does not downgrade dot size if already above minimum', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 10, 2, DotShape.Square, 14, 1)
        renderer.setDotShape(DotShape.Circle) // min size 5, current 10
        expect(renderer.dotSize).toBe(10)
    })

    test('does not downgrade dot space if already above minimum', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 3, DotShape.Square, 14, 1)
        renderer.setDotShape(DotShape.Diamond) // min space 1, current 3
        expect(renderer.dotSpace).toBe(3)
    })
})

describe('DmdRenderer — setBrightness', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('stores brightness value', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 0.8)
        expect(renderer.brightness).toBe(0.8)
    })

    test('clamps to 0–1 range', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        renderer.setBrightness(1.5)
        expect(renderer.brightness).toBe(1)
        renderer.setBrightness(-0.5)
        expect(renderer.brightness).toBe(0)
    })

    test('rounds to 3 decimal places', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        renderer.setBrightness(0.12345)
        expect(renderer.brightness).toBe(0.123)
    })
})

describe('DmdRenderer — minDotSpace getter', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('returns 0 for Square', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        expect(renderer.minDotSpace).toBe(0)
    })

    test('returns 1 for Circle', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 1, DotShape.Circle, 14, 1)
        expect(renderer.minDotSpace).toBe(1)
    })

    test('updates after shape change', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        expect(renderer.minDotSpace).toBe(0)
        renderer.setDotShape(DotShape.Hexagon)
        expect(renderer.minDotSpace).toBe(1)
    })
})

describe('DmdRenderer — gpuFrameTime getter', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    test('returns 0 before any rendering', () => {
        const renderer = new DmdRenderer(10, 10, 100, 50, 5, 0, DotShape.Square, 14, 1)
        expect(renderer.gpuFrameTime).toBe(0)
    })
})
