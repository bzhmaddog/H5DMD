/**
 * Unit tests for VideoLayer visibility behaviour:
 *   - a hidden layer must not start playback.
 *   - a visible layer starts playback normally.
 *   - hiding a playing layer pauses it (pauseOnHide default).
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {VideoLayer} from '../src/layers'
import {ChangeAlphaRenderer} from '../src/renderers'
import {Options} from '../src/utils'

describe('VideoLayer visibility', () => {

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

    test('a playing layer pauses when hidden', () => {
        const layer = new VideoLayer('v', 64, 16)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = layer as any
        internal._video = {pause: vi.fn(), play: vi.fn()}
        internal._state = 2 // VideoState.PLAYING
        const pauseSpy = vi.spyOn(internal, '_pause').mockImplementation(() => {})

        layer.setVisibility(false)

        expect(pauseSpy).toHaveBeenCalled()
    })
})

const fakeVideo = () => {
    const video = document.createElement('video')
    video.play = vi.fn().mockResolvedValue(undefined)
    video.pause = vi.fn()
    return video
}

describe('VideoLayer playback control', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    test('setVideo wires the loop option and draws the first frame', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({loop: true}))
        const video = fakeVideo()

        layer.setVideo(video)

        expect(video.loop).toBe(true)
    })

    test('autoplay on a visible layer plays once the video is loaded', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({autoplay: true, visible: true}))
        const video = fakeVideo()

        layer.setVideo(video)

        expect(layer.isPlaying()).toBe(true)
        expect(video.play).toHaveBeenCalled()
    })

    test('pause() pauses a playing video', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true}))
        const video = fakeVideo()
        layer.setVideo(video)
        layer.play()

        layer.pause()

        expect(layer.isPlaying()).toBe(false)
        expect(video.pause).toHaveBeenCalled()
    })

    test('stop() pauses and rewinds the video', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true}))
        const video = fakeVideo()
        layer.setVideo(video)
        layer.play()

        layer.stop()

        expect(layer.isPlaying()).toBe(false)
        expect(video.pause).toHaveBeenCalled()
        expect(video.currentTime).toBe(0)
    })

    test('playing an already-playing video warns and does not replay', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true}))
        const video = fakeVideo()
        layer.setVideo(video)
        layer.play()
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        layer.play()

        expect(warn).toHaveBeenCalled()
        expect((video.play as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    })

    test('pause() without a video warns instead of throwing', () => {
        const layer = new VideoLayer('v', 64, 16)
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        expect(() => layer.pause()).not.toThrow()
        expect(warn).toHaveBeenCalled()
    })

    test('stopOnHide stops the video when the layer is hidden', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true, stopOnHide: true}))
        const video = fakeVideo()
        layer.setVideo(video)
        layer.play()

        layer.setVisibility(false)

        expect(layer.isPlaying()).toBe(false)
        expect(video.currentTime).toBe(0)
    })

    test('loadVideo creates a detached video element with the given source', () => {
        const layer = new VideoLayer('v', 64, 16)

        layer.loadVideo('http://example.test/clip.mp4')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const video = (layer as any)._video as HTMLVideoElement
        expect(video).toBeInstanceOf(HTMLVideoElement)
        expect(video.src).toContain('clip.mp4')
    })

    test('the play event fires the onPlay listener', () => {
        const onPlay = vi.fn()
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true}), undefined, undefined, undefined, onPlay)
        const video = fakeVideo()
        layer.setVideo(video)

        video.dispatchEvent(new Event('play'))

        expect(onPlay).toHaveBeenCalledWith(layer)
    })

    test('the pause event fires the onPause listener', () => {
        const onPause = vi.fn()
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true}), undefined, undefined, undefined, undefined, onPause)
        const video = fakeVideo()
        layer.setVideo(video)

        video.dispatchEvent(new Event('pause'))

        expect(onPause).toHaveBeenCalledWith(layer)
    })

    test('an error event is logged', () => {
        const layer = new VideoLayer('v', 64, 16)
        const err = vi.spyOn(console, 'error').mockImplementation(() => {})

        layer.loadVideo('http://example.test/missing.mp4')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const video = (layer as any)._video as HTMLVideoElement
        video.dispatchEvent(new Event('error'))

        expect(err).toHaveBeenCalled()
    })

    test('an autoplay layer hidden at creation resumes playback when shown', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({autoplay: true, visible: false}))
        const video = fakeVideo()
        layer.setVideo(video)

        expect(layer.isPlaying()).toBe(false)

        layer.setVisibility(true)

        expect(layer.isPlaying()).toBe(true)
        expect(video.play).toHaveBeenCalled()
    })

    test('stop() on a non-playing video warns but still rewinds', () => {
        const layer = new VideoLayer('v', 64, 16, new Options({visible: true}))
        const video = fakeVideo()
        layer.setVideo(video)
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        layer.stop()

        expect(warn).toHaveBeenCalled()
        expect(video.currentTime).toBe(0)
    })
})
