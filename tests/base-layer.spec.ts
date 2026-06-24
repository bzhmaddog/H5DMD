/**
 * Unit test for BaseLayer frame handling: the final-frame ImageBitmap is closed
 * after being drawn so decoded bitmaps are not leaked. Exercised through
 * CanvasLayer, which inherits BaseLayer's render-queue processing.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {CanvasLayer} from '../src/layers'
import {ChangeAlphaRenderer} from '../src/renderers'

describe('BaseLayer frame handling', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', () => 0)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('the final frame ImageBitmap is closed after being drawn', async () => {
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

        // Empty queue => the "draw final image" branch runs.
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
})
