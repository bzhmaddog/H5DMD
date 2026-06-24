/**
 * REGRESSION TEST — formerly critical bug C1 (fixed)
 *
 * `TextLayer._drawText()` with `adjustWidth: true` used to loop forever when the
 * text was wider than the layer: the `while (!textOk)` loop rebuilt the font from
 * the LOCAL `fontSize` variable but only decremented `options.get('fontSize')`,
 * so the measured width never changed and the exit condition was never met.
 *
 * The fix shrinks the actual `fontSize` used to build the font string and adds a
 * minimum-size floor so the loop always terminates — even when the text can
 * never fully fit.
 *
 * This test instruments `measureText` to ALWAYS report the text as too wide. A
 * correct implementation must still terminate (thanks to the floor) while making
 * visible progress (the font shrinks each iteration).
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {TextLayer} from '../../src/layers'
import {ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer} from '../../src/renderers'
import {Options} from '../../src/utils'

// Generous ceiling: a converging loop for a single short string stays far below this.
const SANITY_CEILING = 200

describe('C1 — TextLayer.adjustWidth terminates and makes progress', () => {

    const originalGetContext = HTMLCanvasElement.prototype.getContext

    let measureCalls = 0
    let seenFonts: string[] = []

    beforeEach(() => {
        setupVitestCanvasMock()

        measureCalls = 0
        seenFonts = []

        // Layer constructor kicks off renderer.init() for the GPU renderers.
        // Stub them so they resolve instead of touching the (absent) WebGPU API.
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)

        // Instrument every 2d context: always report the text as "too wide" and
        // record the font used for each measurement.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: any[]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx: any = (originalGetContext as any).apply(this, args)

            if (ctx && typeof ctx.measureText !== 'undefined') {
                ctx.measureText = function (this: { font: string }) {
                    measureCalls++
                    seenFonts.push(this.font)
                    // Always wider than the layer: the text can never fully fit.
                    return {width: 9999} as TextMetrics
                }
            }

            return ctx
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
    })

    afterEach(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext
        vi.restoreAllMocks()
    })

    test('the loop terminates even when the text never fits', () => {
        // If the bug were present this construction would hang forever.
        new TextLayer(
            'loop',
            64,
            32,
            new Options({text: 'this text is far too wide', adjustWidth: true})
        )

        // Bounded number of measurements => the loop terminated.
        expect(measureCalls).toBeLessThan(SANITY_CEILING)

        // The font changed across iterations => the loop made real progress
        // (it shrank the font size instead of spinning on the same value).
        const fontsDuringLoop = new Set(seenFonts)
        expect(fontsDuringLoop.size).toBeGreaterThan(1)
    })
})
