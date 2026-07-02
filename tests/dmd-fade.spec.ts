/**
 * Unit tests for Dmd fades:
 *   - fadeIn eases by (1 - startBrightness) so it reaches full brightness from
 *     any starting point.
 *   - fades step via requestAnimationFrame (not setTimeout).
 *   - fadeLayerIn / fadeLayerOut reject for unknown layers and perform the fade.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers'
import {Easing, Options} from '../src/utils'
import {DotShape} from '../src/enums'

describe('Dmd fades', () => {

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

    test('fadeIn eases by (1 - startBrightness), not 1', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const dmd = new Dmd(makeCanvas(), { dotSize: 2, dotSpace: 1, dotShape: DotShape.Square, backgroundBrightness: 14, brightness: 1, showFPS: false })

        const startBrightness = 0.4
        // Replace the GPU renderer with a lightweight fake exposing brightness.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any)._renderer = {brightness: startBrightness, setBrightness: vi.fn()}

        // Make the fade loop run exactly one easing step then finish.
        let n = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (n++ === 0 ? 0 : 1000))

        const easeSpy = vi.spyOn(Easing, 'easeOutSine')

        await dmd.fadeIn(100)

        const changeArgs = easeSpy.mock.calls.map(c => c[2])
        expect(changeArgs).toContain(1 - startBrightness)
    })

    test('fades schedule with requestAnimationFrame, not setTimeout', () => {
        const dmd = new Dmd(makeCanvas(), { dotSize: 2, dotSpace: 1, dotShape: DotShape.Square, backgroundBrightness: 14, brightness: 1, showFPS: false })

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
})

describe('Dmd layer fades', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    const makeDmd = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16
        return new Dmd(canvas, { dotSize: 2, dotSpace: 1, dotShape: DotShape.Square, backgroundBrightness: 14, brightness: 1, showFPS: false })
    }

    test('fadeLayerIn rejects for an unknown layer id', async () => {
        const dmd = makeDmd()
        await expect(dmd.fadeLayerIn('ghost', 100)).rejects.toThrow(/does not exist/)
    })

    test('fadeLayerIn makes a hidden layer visible at opacity 0 then fades to 1', async () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('x', {}, new Options())
        layer.setVisibility(false)

        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => { const v = t; t += 500; return v })

        await dmd.fadeLayerIn('x', 100)

        expect(layer.isVisible()).toBe(true)
        expect(layer.opacity).toBe(1)
    })

    test('fadeLayerOut rejects for an unknown layer id', async () => {
        const dmd = makeDmd()
        await expect(dmd.fadeLayerOut('ghost', 100)).rejects.toThrow(/does not exist/)
    })

    test('fadeLayerOut fades opacity to 0 then hides the layer', async () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('x', {}, new Options())

        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => { const v = t; t += 500; return v })

        await dmd.fadeLayerOut('x', 100)

        expect(layer.isVisible()).toBe(false)
    })
})
