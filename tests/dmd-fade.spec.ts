/**
 * Unit tests for Dmd fades:
 *   - fadeIn eases by (1 - startBrightness) so it reaches full brightness from
 *     any starting point.
 *   - fades step via requestAnimationFrame (not setTimeout).
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers'
import {Easing} from '../src/utils'
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

        const dmd = new Dmd(makeCanvas(), 2, 1, 1, 1, DotShape.Square, 14, 1, false)

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
        const dmd = new Dmd(makeCanvas(), 2, 1, 1, 1, DotShape.Square, 14, 1, false)

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
