/**
 * Unit tests for BaseLayer fadeIn / fadeOut.
 *   - fadeIn eases opacity from its current value to 1.
 *   - fadeOut eases opacity from its current value to 0.
 *   - Both step via requestAnimationFrame (not setTimeout).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { CanvasLayer } from '../src/layers'
import { ChangeAlphaRenderer } from '../src/renderers'
import { Easing } from '../src/utils'

describe('BaseLayer fades', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('fadeIn eases by (1 - startOpacity)', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(0.3)

        let n = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (n++ === 0 ? 0 : 1000))

        const easeSpy = vi.spyOn(Easing, 'easeOutSine')

        await layer.fadeIn(100)

        const changeArgs = easeSpy.mock.calls.map(c => c[2])
        expect(changeArgs).toContain(1 - 0.3)
    })

    test('fadeIn resolves with opacity 1', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(0)

        let n = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (n++ === 0 ? 0 : 1000))

        await layer.fadeIn(100)

        expect(layer.opacity).toBe(1)
    })

    test('fadeOut eases by startOpacity', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(0.8)

        let n = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (n++ === 0 ? 0 : 1000))

        const easeSpy = vi.spyOn(Easing, 'easeOutSine')

        await layer.fadeOut(100)

        const changeArgs = easeSpy.mock.calls.map(c => c[2])
        expect(changeArgs).toContain(0.8)
    })

    test('fadeOut resolves with opacity 0', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0)

        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(1)

        let n = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (n++ === 0 ? 0 : 1000))

        await layer.fadeOut(100)

        expect(layer.opacity).toBe(0)
    })

    test('fades schedule with requestAnimationFrame, not setTimeout', () => {
        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(0.5)

        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => {
            const v = t
            t += 10
            return v
        })

        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

        void layer.fadeOut(1000)

        expect(raf).toHaveBeenCalledTimes(1)
        expect(setTimeoutSpy).not.toHaveBeenCalled()
    })
})
