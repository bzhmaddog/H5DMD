/**
 * PROOF / REGRESSION TESTS — Medium-priority robustness/resource bugs M1–M6.
 *
 * Each test fails against the buggy source and passes once the corresponding fix
 * is applied. They double as regression guards afterwards.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../../src'
import {CanvasLayer} from '../../src/layers'
import {ChangeAlphaRenderer, DmdRenderer} from '../../src/renderers'
import {OffscreenBuffer} from '../../src/utils'
import {DotShape} from '../../src/enums'

describe('Medium-priority bug fixes', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', () => 0)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    // ── M1 ────────────────────────────────────────────────────────────────────
    test('M1 — OffscreenBuffer throws when no 2D context is available', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

        expect(() => new OffscreenBuffer(16, 16)).toThrow(/2D rendering context/)
    })

    // ── M2 ────────────────────────────────────────────────────────────────────
    test('M2 — final frame ImageBitmap is closed after being drawn', async () => {
        const layer = new CanvasLayer('c', 64, 16)

        // A real canvas is an accepted drawImage source; attach a close() spy to it.
        const fakeBitmap = document.createElement('canvas')
        const closeSpy = vi.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(fakeBitmap as any).close = closeSpy
        vi.stubGlobal(
            'createImageBitmap',
            () => Promise.resolve(fakeBitmap as unknown as ImageBitmap)
        )

        // Empty queue → the "draw final image" branch runs.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any)._renderQueue = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any)._renderNextFrame = () => {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any)._processRenderQueue({} as ImageData)

        // Flush the createImageBitmap microtask chain.
        await Promise.resolve()
        await Promise.resolve()

        expect(closeSpy).toHaveBeenCalledTimes(1)
    })

    // ── M3 ────────────────────────────────────────────────────────────────────
    test('M3 — FPS box is removed from the DOM on stop()', () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16

        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, true)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const box = (dmd as any)._fpsBox as HTMLElement
        expect(document.body.contains(box)).toBe(true)

        dmd.stop()

        expect(document.body.contains(box)).toBe(false)
    })

    // ── M4 ────────────────────────────────────────────────────────────────────
    test('M4 — _int2Hex clamps to a single byte (always two hex digits)', () => {
        const renderer = new DmdRenderer(32, 8, 64, 16, 1, 0, DotShape.Square, 0.5, 0.5)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const int2Hex = (n: number) => (renderer as any)._int2Hex(n) as string

        expect(int2Hex(256)).toBe('ff')
        expect(int2Hex(300)).toBe('ff')
        expect(int2Hex(-5)).toBe('00')
        expect(int2Hex(255)).toBe('ff')
        expect(int2Hex(1)).toBe('01')
    })

    // ── M5 ────────────────────────────────────────────────────────────────────
    test('M5 — fades schedule with requestAnimationFrame, not setTimeout', () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16

        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)

        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, false)

        // Fake renderer so the fade actually steps (brightness stays > 0).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._renderer = {
            brightness: 0.5,
            setBrightness(b: number) { this.brightness = b }
        }

        // start = 0, first step delta = 10 (< duration) so the loop schedules a next frame.
        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => {
            const v = t
            t += 10
            return v
        })

        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

        // Not awaited: the promise never resolves because raf never invokes the callback.
        void dmd.fadeOut(1000)

        expect(raf).toHaveBeenCalledTimes(1)
        expect(setTimeoutSpy).not.toHaveBeenCalled()
    })

    // ── M6 ────────────────────────────────────────────────────────────────────
    test('M6 — addRenderer guard message refers to Dmd.run()', () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16

        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, false)

        // Simulate a running Dmd.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._isRunning = true

        expect(() => dmd.addRenderer('x', {} as never))
            .toThrow('Renderers must be added before calling Dmd.run()')
    })
})
