/**
 * REGRESSION TEST — formerly critical bug C3 (already fixed in current source)
 *
 * `VideoLayer._play()` used to guard a hidden layer with `if (!this.isVisible)`,
 * negating a METHOD reference (always truthy) instead of its return value, so the
 * early-return was dead code and hidden layers were played anyway.
 *
 * The current source correctly calls `if (!this.isVisible())`. These tests lock
 * that behaviour in so the regression cannot silently come back.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {VideoLayer} from '../../src/layers'
import {ChangeAlphaRenderer} from '../../src/renderers'
import {Options} from '../../src/utils'

describe('C3 — VideoLayer must not play while hidden', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        // BaseLayer constructor calls the opacity renderer's init(); stub it.
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        // jsdom may not implement requestAnimationFrame; stub it.
        vi.stubGlobal('requestAnimationFrame', vi.fn())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    test('play() on a hidden layer is a no-op', () => {
        const layer = new VideoLayer('hidden', 32, 32, new Options({visible: false}))

        const video = document.createElement('video')
        video.play = vi.fn().mockResolvedValue(undefined)
        video.pause = vi.fn()
        layer.setVideo(video)

        expect(layer.isVisible()).toBe(false)
        expect(layer.isPlaying()).toBe(false)

        layer.play()

        // The visibility guard must prevent playback.
        expect(layer.isPlaying()).toBe(false)
        expect(video.play).not.toHaveBeenCalled()
    })

    test('play() on a visible layer starts playback', () => {
        const layer = new VideoLayer('shown', 32, 32, new Options({visible: true}))

        const video = document.createElement('video')
        video.play = vi.fn().mockResolvedValue(undefined)
        video.pause = vi.fn()
        layer.setVideo(video)

        layer.play()

        expect(layer.isPlaying()).toBe(true)
        expect(video.play).toHaveBeenCalled()
    })
})
