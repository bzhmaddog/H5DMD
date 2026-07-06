/**
 * Unit tests for:
 *   - hAlign 'left'/'right' reserving outlineWidth as margin from the layer edge, so the
 *     outline's expansion doesn't get clipped by the canvas bounds.
 *   - TextLayer.adjustDirection ('shrink' | 'expand' | 'both') controlling how the
 *     adjustWidth-computed font size can change across setText() calls.
 *   - setFontSize() replacing the resetFontSize() baseline, and resetFontSize() clearing
 *     adjustWidth shrink/grow memory.
 *
 * measureText is instrumented to return a width proportional to the font's px size and the
 * text length (text.length * px), so the shrink loop's behavior is fully deterministic and
 * the resulting font size can be asserted exactly, instead of depending on the canvas mock's
 * own text metrics.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {TextLayer} from '../src/layers'
import {ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer} from '../src/renderers'
import {Options} from '../src/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const priv = (layer: TextLayer): any => layer as any

const parsePx = (font: string): number => parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 'NaN')

/** The px font size actually used for the layer's most recent draw. */
const usedFontPx = (layer: TextLayer): number => parsePx(priv(layer)._textBuffer.context.font)

describe('TextLayer hAlign + outlineWidth margin / adjustDirection', () => {

    const originalGetContext = HTMLCanvasElement.prototype.getContext

    beforeEach(() => {
        setupVitestCanvasMock()

        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)

        // Deterministic width: proportional to text length and the font's px size, so
        // shrinking the font (and thus measured width) is predictable and testable exactly.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: any[]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx: any = (originalGetContext as any).apply(this, args)
            if (ctx && typeof ctx.measureText !== 'undefined') {
                ctx.measureText = function (this: { font: string }, text: string) {
                    return {width: text.length * parsePx(this.font)} as TextMetrics
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

    // -----------------------------------------------------------------
    // hAlign + outlineWidth margin
    // -----------------------------------------------------------------

    test("hAlign 'right' reserves outlineWidth as margin from the right edge", () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'Hi', fontSize: 20, fontUnit: 'px', hAlign: 'right', outlineWidth: 3
        }))
        const fillSpy = vi.spyOn(priv(layer)._textBuffer.context, 'fillText')
        priv(layer)._drawText()

        const left = fillSpy.mock.calls[0][1]
        // m.width = 'Hi'.length(2) * 20px = 40; left = width - m.width - outlineWidth
        expect(left).toBe(100 - 40 - 3)
    })

    test("hAlign 'left' reserves outlineWidth as margin from the left edge", () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'Hi', fontSize: 20, fontUnit: 'px', hAlign: 'left', outlineWidth: 3
        }))
        const fillSpy = vi.spyOn(priv(layer)._textBuffer.context, 'fillText')
        priv(layer)._drawText()

        const left = fillSpy.mock.calls[0][1]
        expect(left).toBe(3)
    })

    test('no outline means no margin (unchanged from before the fix)', () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'Hi', fontSize: 20, fontUnit: 'px', hAlign: 'right', outlineWidth: 0
        }))
        const fillSpy = vi.spyOn(priv(layer)._textBuffer.context, 'fillText')
        priv(layer)._drawText()

        const left = fillSpy.mock.calls[0][1]
        expect(left).toBe(100 - 40)
    })

    // -----------------------------------------------------------------
    // adjustDirection
    // -----------------------------------------------------------------

    test("adjustDirection 'shrink' never lets the font grow back for a narrower text", () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'WIDE', fontSize: 50, fontUnit: 'px', adjustWidth: true, adjustDirection: 'shrink'
        }))
        const shrunkSize = usedFontPx(layer)
        expect(shrunkSize).toBeLessThan(50)

        layer.setText('W') // would naturally fit at the full 50px - 'shrink' must not grow back
        expect(usedFontPx(layer)).toBe(shrunkSize)
    })

    test("adjustDirection 'both' (default) lets the font grow back for a narrower text", () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'WIDE', fontSize: 50, fontUnit: 'px', adjustWidth: true
        }))
        expect(layer.adjustDirection).toBe('both')
        const shrunkSize = usedFontPx(layer)
        expect(shrunkSize).toBeLessThan(50)

        layer.setText('W')
        expect(usedFontPx(layer)).toBe(50)
    })

    test("adjustDirection 'expand' never shrinks the font below a previous size", () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'W', fontSize: 50, fontUnit: 'px', adjustWidth: true, adjustDirection: 'expand'
        }))
        expect(usedFontPx(layer)).toBe(50)

        layer.setText('WIDE') // would need to shrink to fit - 'expand' keeps it at 50 instead
        expect(usedFontPx(layer)).toBe(50)
    })

    // -----------------------------------------------------------------
    // setFontSize / resetFontSize
    // -----------------------------------------------------------------

    test('resetFontSize restores the construction-time size when setFontSize was never called', () => {
        const layer = new TextLayer('t', 100, 32, new Options({text: 'Hi', fontSize: 20, fontUnit: 'px'}))
        layer.resetFontSize()
        expect(layer.fontSize).toBe(20)
    })

    test('setFontSize replaces the resetFontSize() baseline', () => {
        const layer = new TextLayer('t', 100, 32, new Options({text: 'Hi', fontSize: 20, fontUnit: 'px'}))
        layer.setFontSize(40)
        layer.setFontSize(30)

        layer.resetFontSize()
        expect(layer.fontSize).toBe(30) // the last setFontSize() call, not the construction value
    })

    test('resetFontSize clears adjustWidth shrink memory so the full baseline applies again', () => {
        const layer = new TextLayer('t', 100, 32, new Options({
            text: 'WIDE', fontSize: 50, fontUnit: 'px', adjustWidth: true, adjustDirection: 'shrink'
        }))
        const shrunkSize = usedFontPx(layer)
        expect(shrunkSize).toBeLessThan(50)

        layer.setText('W')
        expect(usedFontPx(layer)).toBe(shrunkSize) // still capped by shrink memory

        layer.resetFontSize()
        // Memory cleared - 'W' is re-measured from the full 50px baseline and fits.
        expect(usedFontPx(layer)).toBe(50)
    })
})
