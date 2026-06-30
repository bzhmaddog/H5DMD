/**
 * Unit tests covering the remaining dmd.ts branches:
 *   - run() before init throws
 *   - run() re-creates FPS box after stop()
 *   - fadeLayerIn / fadeLayerOut
 *   - setDotShape / setDotSize / setDotSpace delegating to renderer
 *   - dotShape / dotSize / dotSpace / minDotSpace / visibleDotsX / visibleDotsY getters
 *   - _addLayer alignment: hAlign left/right, vAlign top/bottom
 *   - _addLayer with invalid layer type throws TypeError
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers'
import {Options} from '../src/utils'
import {DotShape} from '../src/enums'

describe('Dmd — uncovered branches', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
        vi.stubGlobal('createImageBitmap', () => {
            const c = document.createElement('canvas')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(c as any).close = () => {}
            return Promise.resolve(c as unknown as ImageBitmap)
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    const makeDmd = (showFPS = false) => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 32
        return new Dmd(canvas, 2, 1, DotShape.Square, 14, 1, showFPS)
    }

    test('run() before init throws', () => {
        const dmd = makeDmd()
        expect(() => dmd.run()).toThrow('call Dmd.init() first')
    })

    test('run() re-creates FPS box after stop()', async () => {
        const dmd = makeDmd(true)
        await dmd.init()

        dmd.run()
        dmd.stop()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((dmd as any)._fpsBox).toBeUndefined()

        dmd.run()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((dmd as any)._fpsBox).toBeDefined()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(document.body.contains((dmd as any)._fpsBox)).toBe(true)
    })

    test('stop() sets _renderNextFrame to a no-op logger', () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        const dmd = makeDmd()

        dmd.stop()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._renderNextFrame()

        expect(logSpy).toHaveBeenCalledWith('Dmd render stopped')
    })

    test('setDotShape delegates to renderer', () => {
        const dmd = makeDmd()
        dmd.setDotShape(DotShape.Circle)
        expect(dmd.dotShape).toBe(DotShape.Circle)
    })

    test('setDotSize delegates to renderer', () => {
        const dmd = makeDmd()
        dmd.setDotSize(5)
        expect(dmd.dotSize).toBe(5)
    })

    test('setDotSpace delegates to renderer', () => {
        const dmd = makeDmd()
        dmd.setDotSpace(3)
        expect(dmd.dotSpace).toBe(3)
    })

    test('minDotSpace getter delegates to renderer', () => {
        const dmd = makeDmd()
        dmd.setDotShape(DotShape.Circle)
        expect(dmd.minDotSpace).toBe(1)
    })

    test('visibleDotsX / visibleDotsY getters delegate to renderer', () => {
        const dmd = makeDmd()
        expect(dmd.visibleDotsX).toBeGreaterThan(0)
        expect(dmd.visibleDotsY).toBeGreaterThan(0)
    })

    test('fadeLayerIn rejects for unknown layer', async () => {
        const dmd = makeDmd()
        await expect(dmd.fadeLayerIn('ghost', 100)).rejects.toThrow(/does not exist/)
    })

    test('fadeLayerIn makes hidden layer visible at opacity 0 then fades', async () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('x', {}, new Options())

        layer.setVisibility(false)

        // Make performance.now advance past duration so the fade resolves immediately
        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => {
            const v = t
            t += 500
            return v
        })

        await dmd.fadeLayerIn('x', 100)

        expect(layer.isVisible()).toBe(true)
        expect(layer.opacity).toBe(1)
    })

    test('fadeLayerOut rejects for unknown layer', async () => {
        const dmd = makeDmd()
        await expect(dmd.fadeLayerOut('ghost', 100)).rejects.toThrow(/does not exist/)
    })

    test('fadeLayerOut fades opacity to 0 then hides', async () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('x', {}, new Options())

        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => {
            const v = t
            t += 500
            return v
        })

        await dmd.fadeLayerOut('x', 100)

        expect(layer.isVisible()).toBe(false)
    })
})

describe('Dmd _addLayer alignment branches', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    const makeDmd = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 32
        return new Dmd(canvas, 2, 1, DotShape.Square, 14, 1, false)
    }

    test('hAlign left positions at hOffset', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, hAlign: 'left', hOffset: 3}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        expect(entry.left).toBe(3)
    })

    test('hAlign right positions at dmd width - layer width - 1', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, hAlign: 'right'}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        // dmd width = floor(128/3) = 42 → 42 - 10 - 1 = 31
        expect(entry.left).toBe(31)
    })

    test('vAlign top positions at vOffset', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, vAlign: 'top', vOffset: 2}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        expect(entry.top).toBe(2)
    })

    test('vAlign bottom positions at dmd height - layer height - 1', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, vAlign: 'bottom'}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        // dmd height = floor(32/3) = 10 → 10 - 5 - 1 = 4
        expect(entry.top).toBe(4)
    })

    test('invalid layer type throws TypeError', () => {
        const dmd = makeDmd()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => (dmd as any)._addLayer(999, 'bad', {}, new Options()))
            .toThrow(/Invalid layer type/)
    })
})
