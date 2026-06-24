/**
 * Every concrete layer must report the matching `LayerType`.
 *
 * This invariant was once broken (critical bug C4): `AnimationLayer` called
 * `super(... LayerType.Video ...)`, so its `layerType` reported `Video` instead
 * of `Animation`. Covering every layer here guards against the same copy/paste
 * slip in any subclass.
 */
import {beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {
    AnimationLayer,
    CanvasLayer,
    LayerType,
    SpritesLayer,
    TextLayer,
    VideoLayer
} from '../src/layers'
import {ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer} from '../src/renderers'
import {Options} from '../src/utils'

const WIDTH = 128
const HEIGHT = 32

describe('every concrete layer reports the matching LayerType', () => {

    beforeEach(() => {
        setupVitestCanvasMock()

        // Layer constructors kick off renderer.init() for their GPU renderers.
        // Stub them so they resolve instead of touching the (absent) WebGPU API.
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
    })

    test.each([
        ['CanvasLayer', () => new CanvasLayer('c', WIDTH, HEIGHT), LayerType.Canvas],
        ['TextLayer', () => new TextLayer('t', WIDTH, HEIGHT, new Options()), LayerType.Text],
        ['VideoLayer', () => new VideoLayer('v', WIDTH, HEIGHT), LayerType.Video],
        ['AnimationLayer', () => new AnimationLayer('a', WIDTH, HEIGHT), LayerType.Animation],
        ['SpritesLayer', () => new SpritesLayer('s', WIDTH, HEIGHT), LayerType.Sprites]
    ])('%s -> %s', (_name, build, expected) => {
        const layer = build()
        expect(layer.layerType).toBe(expected)
    })
})
