/**
 * Unit tests for Dmd run/stop lifecycle and layer ordering:
 *   - run() is idempotent: a second call does not start a second render loop.
 *   - stop() removes the FPS overlay from the DOM.
 *   - addRenderer() rejects once the DMD is running, pointing at Dmd.run().
 *   - layers with equal z-index keep their insertion order (stable sort).
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers'
import {DotShape} from '../src/enums'

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

        const dmd = new Dmd(makeCanvas(), 2, 1, DotShape.Square, 14, 1, false)
        await dmd.init()

        dmd.run()
        dmd.run()

        expect(raf).toHaveBeenCalledTimes(1)
    })

    test('stop() removes the FPS box from the DOM', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), 2, 1, DotShape.Square, 14, 1, true)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const box = (dmd as any)._fpsBox as HTMLElement
        expect(document.body.contains(box)).toBe(true)

        dmd.stop()

        expect(document.body.contains(box)).toBe(false)
    })

    test('addRenderer() while running rejects, pointing at Dmd.run()', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), 2, 1, DotShape.Square, 14, 1, false)

        // Simulate a running Dmd.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._isRunning = true

        expect(() => dmd.addRenderer('x', {} as never))
            .toThrow('Renderers must be added before calling Dmd.run()')
    })

    test('equal z-index layers keep their insertion order (stable sort)', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), 2, 1, DotShape.Square, 14, 1, false)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = dmd as any
        internal._sortedLayers = ['a', 'b', 'c', 'd', 'e'].map(id => ({
            id,
            zIndex: 1,
            top: 0,
            left: 0
        }))

        internal.sortLayers()

        expect(internal._sortedLayers.map((l: {id: string}) => l.id))
            .toEqual(['a', 'b', 'c', 'd', 'e'])
    })
})
