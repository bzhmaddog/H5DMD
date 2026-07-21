/**
 * Unit tests for Dmd run/stop lifecycle and layer ordering:
 *   - run() is idempotent: a second call does not start a second render loop.
 *   - run() throws if called before init().
 *   - run() re-creates the FPS box after a stop().
 *   - stop() removes the FPS overlay from the DOM.
 *   - stop() sets _renderNextFrame to a no-op logger.
 *   - addRenderer() rejects once the DMD is running, pointing at Dmd.run().
 *   - layers with equal z-index keep their insertion order (stable sort).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { Dmd } from '../src'
import { ChangeAlphaRenderer, DmdRenderer } from '../src/renderers'
import { DotShape } from '../src/enums'

describe('Dmd lifecycle and layer ordering', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    const makeCanvas = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16
        return canvas
    }

    test('calling run() twice does not start a second render loop', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: false,
        })
        await dmd.init()

        dmd.run()
        dmd.run()

        expect(raf).toHaveBeenCalledTimes(1)
    })

    test('stop() removes the FPS canvas from the DOM', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: true,
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = (dmd as any)._fpsCanvas as HTMLElement
        expect(document.body.contains(canvas)).toBe(true)

        dmd.stop()

        expect(document.body.contains(canvas)).toBe(false)
    })

    test('addRenderer() while running rejects, pointing at Dmd.run()', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: false,
        })

        // Simulate a running Dmd.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._isRunning = true

        expect(() => dmd.addRenderer('x', {} as never)).toThrow('Renderers must be added before calling Dmd.run()')
    })

    test('equal z-index layers keep their insertion order (stable sort)', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: false,
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = dmd as any
        internal._sortedLayers = ['a', 'b', 'c', 'd', 'e'].map(id => ({
            id,
            zIndex: 1,
            top: 0,
            left: 0,
        }))

        internal.sortLayers()

        expect(internal._sortedLayers.map((l: { id: string }) => l.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
    })

    test('run() before init() throws', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)
        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: false,
        })
        expect(() => dmd.run()).toThrow('call Dmd.init() first')
    })

    test('run() re-creates the FPS canvas after stop()', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)
        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: true,
        })
        await dmd.init()

        dmd.run()
        dmd.stop()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((dmd as any)._fpsCanvas).toBeUndefined()

        dmd.run()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((dmd as any)._fpsCanvas).toBeDefined()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(document.body.contains((dmd as any)._fpsCanvas)).toBe(true)
    })

    test('stop() sets _renderNextFrame to a no-op logger', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        const dmd = new Dmd(makeCanvas(), {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: false,
        })

        dmd.stop()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._renderNextFrame()

        expect(logSpy).toHaveBeenCalledWith('Dmd render stopped')
    })
})
