/**
 * PROOF / REGRESSION TESTS — High-priority behavioural bugs H1–H6.
 *
 * Each test fails against the buggy source and passes once the corresponding fix
 * is applied. They double as regression guards afterwards.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../../src'
import {AnimationLayer, VideoLayer} from '../../src/layers'
import {ChangeAlphaRenderer, DmdRenderer} from '../../src/renderers'
import {Easing} from '../../src/utils'
import {DotShape} from '../../src/enums'

describe('High-priority bug fixes', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', () => 0)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    // ── H1 ──────────────────────────────────────────────────────────────────
    test('H1 — fadeIn eases by (1 - startBrightness), not 1', async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16

        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)

        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, false)

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

    // ── H2 ──────────────────────────────────────────────────────────────────
    test('H2 — DmdRenderer applies the brightness argument', () => {
        // bgBrightness omitted (undefined) but brightness provided: the renderer
        // must still honour the brightness argument.
        const renderer = new DmdRenderer(
            32, 8, 64, 16, 1, 0, DotShape.Square,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            undefined as any,
            0.5
        )
        expect(renderer.brightness).toBe(0.5)
    })

    // ── H3 ──────────────────────────────────────────────────────────────────
    test('H3 — previousFrame from frame 1 lands on frame 0', () => {
        const layer = new AnimationLayer('a', 64, 16)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = layer as any
        internal._images = [{}, {}, {}]
        internal._frameIndex = 1

        layer.previousFrame()

        expect(internal._frameIndex).toBe(0)
    })

    // ── H5 ──────────────────────────────────────────────────────────────────
    test('H5 — frame duration is finite when duration option is unset', () => {
        const layer = new AnimationLayer('a', 64, 16)
        // Canvas elements are valid drawImage sources in the canvas mock.
        const frame = () => document.createElement('canvas') as unknown as ImageBitmap
        layer.setAnimationData([frame(), frame(), frame()])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(Number.isFinite((layer as any)._frameDuration)).toBe(true)
    })

    // ── H4 ──────────────────────────────────────────────────────────────────
    test('H4 — a playing video pauses when hidden (pauseOnHide default)', () => {
        const layer = new VideoLayer('v', 64, 16)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = layer as any
        internal._video = {pause: vi.fn(), play: vi.fn()}
        internal._state = 2 // VideoState.PLAYING
        const pauseSpy = vi.spyOn(internal, '_pause').mockImplementation(() => {})

        layer.setVisibility(false)

        expect(pauseSpy).toHaveBeenCalled()
    })

    // ── H6 ──────────────────────────────────────────────────────────────────
    test('H6 — equal z-index layers keep insertion order (stable sort)', () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 16

        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)

        const dmd = new Dmd(canvas, 2, 1, 1, 1, DotShape.Square, 14, 1, false)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = dmd as any
        internal._sortedLayers = ['a', 'b', 'c', 'd', 'e'].map(id => ({
            id,
            zIndex: 1,
            top: 0,
            left: 0
        }))

        internal.sortLayers()

        expect(internal._sortedLayers.map((l: {id: string}) => l.id))
            .toEqual(['a', 'b', 'c', 'd', 'e'])
    })
})
