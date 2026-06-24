/**
 * Unit tests for AnimationLayer frame control:
 *   - previousFrame() from frame 1 lands on frame 0.
 *   - the per-frame duration is finite even when the duration option is unset.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {AnimationLayer} from '../src/layers'
import {ChangeAlphaRenderer} from '../src/renderers'
import {Options} from '../src/utils'

describe('AnimationLayer frames', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', () => 0)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('previousFrame() from frame 1 lands on frame 0', () => {
        const layer = new AnimationLayer('a', 64, 16)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = layer as any
        internal._images = [{}, {}, {}]
        internal._frameIndex = 1

        layer.previousFrame()

        expect(internal._frameIndex).toBe(0)
    })

    test('frame duration is finite when the duration option is unset', () => {
        const layer = new AnimationLayer('a', 64, 16)
        // Canvas elements are valid drawImage sources in the canvas mock.
        const frame = () => document.createElement('canvas') as unknown as ImageBitmap
        layer.setAnimationData([frame(), frame(), frame()])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(Number.isFinite((layer as any)._frameDuration)).toBe(true)
    })
})

const frames = (n: number) =>
    Array.from({length: n}, () => document.createElement('canvas') as unknown as ImageBitmap)

describe('AnimationLayer playback', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
        // A real canvas doubles as an ImageBitmap; give it a close() for _layerLoaded.
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

    // Mark the layer as loaded without waiting on the constructor's setTimeout.
    const markLoaded = (layer: AnimationLayer) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer as any)._loaded = true
    }

    test('setAnimationData computes the per-frame duration and draws frame 0', () => {
        const layer = new AnimationLayer('a', 64, 16) // default duration 1000
        layer.setAnimationData(frames(4))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._frameDuration).toBe(250)
    })

    test('play() starts a loaded animation and fires the play listener', () => {
        const onPlay = vi.fn()
        const layer = new AnimationLayer('a', 64, 16, undefined, undefined, undefined, undefined, onPlay)
        layer.setAnimationData(frames(3))
        markLoaded(layer)

        layer.play()

        expect(layer.isPlaying).toBe(true)
        expect(onPlay).toHaveBeenCalledWith(layer)
    })

    test('play(loop) overrides the loop flag', () => {
        const layer = new AnimationLayer('a', 64, 16)
        layer.setAnimationData(frames(3))
        markLoaded(layer)

        layer.play(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._loop).toBe(true)
    })

    test('autoplay starts playback once data is set on a loaded layer', () => {
        const layer = new AnimationLayer('a', 64, 16, new Options({autoplay: true}))
        markLoaded(layer)

        layer.setAnimationData(frames(3))

        expect(layer.isPlaying).toBe(true)
    })

    test('stop() halts playback and resets the frame index', () => {
        const onStop = vi.fn()
        const layer = new AnimationLayer('a', 64, 16, undefined, undefined, undefined, undefined, undefined, undefined, onStop)
        layer.setAnimationData(frames(3))
        markLoaded(layer)
        layer.play()

        layer.stop()

        expect(layer.isPlaying).toBe(false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._frameIndex).toBe(0)
        expect(onStop).toHaveBeenCalledWith(layer)
    })

    test('pause() suspends a looping animation', () => {
        const onPause = vi.fn()
        const layer = new AnimationLayer('a', 64, 16, new Options({loop: true}),
            undefined, undefined, undefined, undefined, onPause)
        layer.setAnimationData(frames(3))
        markLoaded(layer)
        layer.play()

        layer.pause()

        expect(layer.isPaused).toBe(true)
        expect(layer.isPlaying).toBe(false)
        expect(onPause).toHaveBeenCalledWith(layer)
    })

    test('pause() on a non-looping animation stops it instead', () => {
        const layer = new AnimationLayer('a', 64, 16, new Options({loop: false}))
        layer.setAnimationData(frames(3))
        markLoaded(layer)
        layer.play()

        layer.pause()

        expect(layer.isPaused).toBe(false)
        expect(layer.isPlaying).toBe(false)
    })

    test('resume() replays a paused animation', () => {
        const layer = new AnimationLayer('a', 64, 16, new Options({loop: true}))
        layer.setAnimationData(frames(3))
        markLoaded(layer)
        layer.play()
        layer.pause()

        layer.resume()

        expect(layer.isPlaying).toBe(true)
        expect(layer.isPaused).toBe(false)
    })

    test('nextFrame wraps from the last frame back to 0', () => {
        const layer = new AnimationLayer('a', 64, 16)
        layer.setAnimationData(frames(3))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any)._frameIndex = 2

        layer.nextFrame()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._frameIndex).toBe(0)
    })

    test('__renderFrame stops a one-shot animation past the last frame', () => {
        const layer = new AnimationLayer('a', 64, 16, new Options({loop: false, duration: 1000}))
        layer.setAnimationData(frames(2)) // frameDuration = 500
        markLoaded(layer)
        layer.play()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const render = (t: number) => (layer as any).__renderFrame(t)
        render(1)    // establishes startTime = 1 (a non-zero, truthy value)
        render(1001) // position 1000 → frameIndex 2 >= length → stop()

        expect(layer.isPlaying).toBe(false)
    })

    test('__renderFrame loops back to frame 0 when looping', () => {
        const layer = new AnimationLayer('a', 64, 16, new Options({loop: true, duration: 1000}))
        layer.setAnimationData(frames(2)) // frameDuration = 500
        markLoaded(layer)
        layer.play()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const render = (t: number) => (layer as any).__renderFrame(t)
        render(1)
        render(1001) // frameIndex 2 >= length → wraps to 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._frameIndex).toBe(0)
        expect(layer.isPlaying).toBe(true)
    })

    test('hiding a playing looping layer pauses it; showing resumes', () => {
        const layer = new AnimationLayer('a', 64, 16, new Options({loop: true}))
        layer.setAnimationData(frames(3))
        markLoaded(layer)
        layer.play()

        layer.setVisibility(false)
        expect(layer.isPaused).toBe(true)

        layer.setVisibility(true)
        expect(layer.isPlaying).toBe(true)
    })
})
