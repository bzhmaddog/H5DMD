/**
 * Unit tests for SpritesLayer: sprite creation/registration (including percentage
 * and numeric positioning), visibility, run/stop bookkeeping, sequence queueing
 * and the end-of-queue rendering shutdown.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {SpritesLayer} from '../src/layers'
import {ChangeAlphaRenderer} from '../src/renderers'
import {Sprite} from '../src/utils'
import type {SpriteAnimationItem} from '../src/interfaces/sprite-animation-item'

const sheet = () => document.createElement('canvas') as unknown as ImageBitmap

const animations: SpriteAnimationItem[] = [
    {key: 'walk', animationParams: {width: 10, height: 10, nbFrames: 2, xOffset: 0, yOffset: 0, duration: 100}}
]

describe('SpritesLayer', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('createSprite resolves with a Sprite and registers it', async () => {
        const layer = new SpritesLayer('s', 64, 16)

        const sprite = await layer.createSprite('hero', sheet(), 0, 0, animations, '0', '0')

        expect(sprite).toBeInstanceOf(Sprite)
    })

    test('createSprite rejects when no animations are provided', async () => {
        const layer = new SpritesLayer('s', 64, 16)

        await expect(layer.createSprite('hero', sheet(), 0, 0, [], '0', '0'))
            .rejects.toMatch(/No animations/)
    })

    test('createSprite rejects a duplicate id', async () => {
        const layer = new SpritesLayer('s', 64, 16)
        await layer.createSprite('hero', sheet(), 0, 0, animations, '0', '0')

        await expect(layer.createSprite('hero', sheet(), 0, 0, animations, '0', '0'))
            .rejects.toMatch(/already exists/)
    })

    test('addSprite resolves percentage positions against the layer size', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('p', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)

        expect(layer.addSprite('p', sprite, '50%', '50%')).toBe(true)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stored = (layer as any)._sprites['p']
        expect(stored.x).toBe(32) // 50% of 64
        expect(stored.y).toBe(8)  // 50% of 16
    })

    test('addSprite parses numeric string positions', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('n', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)

        layer.addSprite('n', sprite, '12', '4')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stored = (layer as any)._sprites['n']
        expect(stored.x).toBe(12)
        expect(stored.y).toBe(4)
    })

    test('addSprite refuses a non-Sprite object', () => {
        const layer = new SpritesLayer('s', 64, 16)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(layer.addSprite('x', {} as any, '0', '0')).toBe(false)
    })

    test('addSprite refuses a duplicate id', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('d', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)

        expect(layer.addSprite('d', sprite, '0', '0')).toBe(true)
        expect(layer.addSprite('d', sprite, '0', '0')).toBe(false)
    })

    test('setSpriteVisibility toggles the stored flag', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('v', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)
        layer.addSprite('v', sprite, '0', '0')

        layer.setSpriteVisibility('v', false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._sprites['v'].visible).toBe(false)
    })

    test('setSpriteVisibility on a missing sprite logs an error and does not throw', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const err = vi.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => layer.setSpriteVisibility('nope', true)).not.toThrow()
        expect(err).toHaveBeenCalled()
    })

    test('run() starts the sprite and schedules rendering', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('r', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)
        sprite.enqueueSingle('walk', 1)
        layer.addSprite('r', sprite, '0', '0')

        layer.run('r')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._runningSprites).toBe(1)
        expect(sprite.isAnimating()).toBe(true)
    })

    test('run() on a missing sprite logs an error', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const err = vi.spyOn(console, 'error').mockImplementation(() => {})

        layer.run('ghost')
        expect(err).toHaveBeenCalled()
    })

    test('stop() decrements the running count and halts the sprite', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('r', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)
        sprite.enqueueSingle('walk', 1)
        layer.addSprite('r', sprite, '0', '0')

        layer.run('r')
        layer.stop('r')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._runningSprites).toBe(0)
        expect(sprite.isAnimating()).toBe(false)
    })

    test('run() after stop() restarts the sprite', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('r', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)
        sprite.enqueueSingle('walk', 1)
        layer.addSprite('r', sprite, '0', '0')

        layer.run('r')
        layer.stop('r')
        layer.run('r')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._runningSprites).toBe(1)
        expect(sprite.isAnimating()).toBe(true)
    })

    test('setVisibility(true) restarts the render loop while sprites are running', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('r', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)
        sprite.enqueueSingle('walk', 1)
        layer.addSprite('r', sprite, '0', '0')
        layer.run('r')

        layer.setVisibility(false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startSpy = vi.spyOn(layer as any, '_startRendering')
        layer.setVisibility(true)

        expect(startSpy).toHaveBeenCalled()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._isRenderLoopActive()).toBe(true)
    })

    test('enqueueSequence forwards to the sprite', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const sprite = new Sprite('q', sheet(), 0, 0)
        sprite.addAnimation('walk', animations[0].animationParams)
        layer.addSprite('q', sprite, '0', '0')

        const seqSpy = vi.spyOn(sprite, 'enqueueSequence')
        layer.enqueueSequence('q', [{key: 'walk', nbLoop: 1}], true)

        expect(seqSpy).toHaveBeenCalledWith([{key: 'walk', nbLoop: 1}], true)
    })

    test('__renderFrame draws visible sprites only', () => {
        const layer = new SpritesLayer('s', 64, 16)
        const visible = new Sprite('vis', sheet(), 0, 0)
        const hidden = new Sprite('hid', sheet(), 0, 0)
        visible.addAnimation('walk', animations[0].animationParams)
        hidden.addAnimation('walk', animations[0].animationParams)
        layer.addSprite('vis', visible, '0', '0')
        layer.addSprite('hid', hidden, '0', '0', false)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (layer as any)._contentBuffer.context
        const drawSpy = vi.spyOn(ctx, 'drawImage')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any).__renderFrame()

        // Only the visible sprite is drawn.
        expect(drawSpy).toHaveBeenCalledTimes(1)
    })
})
