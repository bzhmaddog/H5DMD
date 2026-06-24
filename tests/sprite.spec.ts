/**
 * Unit tests for the Sprite animation state machine. requestAnimationFrame is
 * stubbed so the self-scheduling loop does not recurse; the private
 * `_doAnimation` step is driven manually with controlled timestamps to cover the
 * frame-advance, loop-restart and end-of-queue branches.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Sprite} from '../src/utils'
import type {SpriteAnimation} from '../src/interfaces/sprite-animation'

const anim = (over: Partial<SpriteAnimation> = {}): SpriteAnimation => ({
    width: 10,
    height: 10,
    nbFrames: 2,
    xOffset: 0,
    yOffset: 0,
    duration: 100,
    ...over
})

// A real canvas is an accepted drawImage source under the canvas mock.
const fakeSheet = () => document.createElement('canvas') as unknown as ImageBitmap

describe('Sprite', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('addAnimation tracks the maximum width and height', () => {
        const sprite = new Sprite('s', fakeSheet(), 0, 0)

        sprite.addAnimation('walk', anim({width: 10, height: 12}))
        sprite.addAnimation('run', anim({width: 16, height: 8}))

        expect(sprite.width).toBe(16)
        expect(sprite.height).toBe(12)
    })

    test('addAnimation rejects a duplicate id', () => {
        const sprite = new Sprite('s', fakeSheet(), 0, 0)
        sprite.addAnimation('walk', anim())

        expect(() => sprite.addAnimation('walk', anim())).toThrow(/already exists/)
    })

    test('run() starts the queued animation', () => {
        const sprite = new Sprite('s', fakeSheet(), 0, 0)
        sprite.addAnimation('walk', anim())
        sprite.enqueueSingle('walk', 1)

        expect(sprite.isAnimating()).toBe(false)
        sprite.run()
        expect(sprite.isAnimating()).toBe(true)
        expect(requestAnimationFrame).toHaveBeenCalled()
    })

    test('exposes the output buffer canvas and context', () => {
        const sprite = new Sprite('s', fakeSheet(), 0, 0)
        sprite.addAnimation('walk', anim())
        sprite.enqueueSingle('walk', 1)
        sprite.run()

        expect(sprite.data).toBeInstanceOf(HTMLCanvasElement)
        expect(sprite.context).toBeTruthy()
    })

    test('a single-loop animation fires the end-of-queue listener when it completes', () => {
        const sprite = new Sprite('hero', fakeSheet(), 0, 0)
        sprite.addAnimation('walk', anim({nbFrames: 2, duration: 100}))
        sprite.enqueueSingle('walk', 1)

        const endListener = vi.fn()
        sprite.setEndOfQueueListener(endListener)

        sprite.run()

        // frameDuration = 100 / 2 = 50ms. Drive the loop step by step.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const step = (t: number) => (sprite as any)._doAnimation(t)

        step(0)   // frame 0
        step(50)  // frame 1
        step(100) // frame index 2 >= nbFrames → loop ends → queue empties

        expect(endListener).toHaveBeenCalledWith('hero')
        expect(sprite.isAnimating()).toBe(false)
    })

    test('a multi-loop animation restarts instead of ending after one cycle', () => {
        const sprite = new Sprite('hero', fakeSheet(), 0, 0)
        sprite.addAnimation('walk', anim({nbFrames: 2, duration: 100}))
        sprite.enqueueSingle('walk', 2)

        const endListener = vi.fn()
        sprite.setEndOfQueueListener(endListener)

        sprite.run()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const step = (t: number) => (sprite as any)._doAnimation(t)

        step(0)
        step(50)
        step(100) // first cycle done; loop 2 still allowed → restarts

        expect(endListener).not.toHaveBeenCalled()
        expect(sprite.isAnimating()).toBe(true)
    })

    test('enqueueSequence with loop keeps the sprite animating across items', () => {
        const sprite = new Sprite('s', fakeSheet(), 0, 0)
        sprite.addAnimation('a', anim())
        sprite.addAnimation('b', anim())

        sprite.enqueueSequence([{key: 'a', nbLoop: 1}, {key: 'b', nbLoop: 1}], true)
        sprite.run()

        expect(sprite.isAnimating()).toBe(true)
    })

    test('stop() clears the queue and halts animation', () => {
        const sprite = new Sprite('s', fakeSheet(), 0, 0)
        sprite.addAnimation('walk', anim())
        sprite.enqueueSingle('walk', 1)
        sprite.run()

        sprite.stop()

        expect(sprite.isAnimating()).toBe(false)
    })
})
