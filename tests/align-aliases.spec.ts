/**
 * 'start'/'center'/'end' are the preferred spellings of the alignment values, with
 * 'left'/'right', 'top'/'bottom' and 'middle' kept as aliases so existing code keeps working.
 * They must be *exact* synonyms, not merely both accepted - so every test here asserts the
 * alias and the new spelling produce the identical coordinate, at each of the three
 * independent places the library aligns something: a layer in its container, text in a
 * TextLayer, a bitmap in a CanvasLayer.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { CanvasLayer, TextLayer } from '../src/layers'
import { resolveLayerPosition } from '../src/layers/layer-factory'
import { ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer } from '../src/renderers'
import { Options } from '../src/utils'
import type { LayerPosition } from '../src/interfaces'

describe('layer placement (resolveLayerPosition)', () => {
    const resolve = (position: LayerPosition) => resolveLayerPosition('l', position, 20, 8, 100, 40, [], {})

    test("hAlign 'start' matches 'left', 'end' matches 'right'", () => {
        expect(resolve({ hAlign: 'start' })).toEqual(resolve({ hAlign: 'left' }))
        expect(resolve({ hAlign: 'end' })).toEqual(resolve({ hAlign: 'right' }))

        // ...and they are the coordinates you'd expect, not two matching wrong answers.
        expect(resolve({ hAlign: 'start' }).left).toBe(0)
        expect(resolve({ hAlign: 'end' }).left).toBe(80) // 100 - 20
    })

    test("vAlign 'start' matches 'top', 'center' matches 'middle', 'end' matches 'bottom'", () => {
        expect(resolve({ vAlign: 'start' })).toEqual(resolve({ vAlign: 'top' }))
        expect(resolve({ vAlign: 'center' })).toEqual(resolve({ vAlign: 'middle' }))
        expect(resolve({ vAlign: 'end' })).toEqual(resolve({ vAlign: 'bottom' }))

        expect(resolve({ vAlign: 'start' }).top).toBe(0)
        expect(resolve({ vAlign: 'center' }).top).toBe(16) // (40 - 8) / 2
        expect(resolve({ vAlign: 'end' }).top).toBe(32) // 40 - 8
    })

    test('offsets still apply to the new spellings', () => {
        expect(resolve({ hAlign: 'end', hOffset: -5, vAlign: 'start', vOffset: 3 })).toEqual({ left: 75, top: 3 })
    })
})

describe('TextLayer text alignment', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 0),
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    /** Draw 'Hello' with the given alignment and report where fillText put it. */
    const drawnAt = async (align: Record<string, string>): Promise<[number, number]> => {
        const layer = new TextLayer('t', 64, 16, new Options({ text: 'Hello', fontSize: 10, fontUnit: 'px' }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (layer as any)._textBuffer.context as CanvasRenderingContext2D

        ctx.measureText = (() => ({
            width: 40,
            actualBoundingBoxAscent: 9,
            actualBoundingBoxDescent: 3,
        })) as unknown as CanvasRenderingContext2D['measureText']

        const fillText = vi.spyOn(ctx, 'fillText')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options(align))

        expect(fillText).toHaveBeenCalled()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [, x, y] = fillText.mock.calls.at(-1) as any
        return [x, y]
    }

    test("hAlign 'start' matches 'left', 'end' matches 'right'", async () => {
        expect(await drawnAt({ hAlign: 'start' })).toEqual(await drawnAt({ hAlign: 'left' }))
        expect(await drawnAt({ hAlign: 'end' })).toEqual(await drawnAt({ hAlign: 'right' }))

        expect((await drawnAt({ hAlign: 'start' }))[0]).toBe(0)
        expect((await drawnAt({ hAlign: 'end' }))[0]).toBe(24) // 64 - 40
    })

    test("vAlign 'start' matches 'top', 'center' matches 'middle', 'end' matches 'bottom'", async () => {
        expect(await drawnAt({ vAlign: 'start' })).toEqual(await drawnAt({ vAlign: 'top' }))
        expect(await drawnAt({ vAlign: 'center' })).toEqual(await drawnAt({ vAlign: 'middle' }))
        expect(await drawnAt({ vAlign: 'end' })).toEqual(await drawnAt({ vAlign: 'bottom' }))

        expect((await drawnAt({ vAlign: 'start' }))[1]).toBe(9) // ascent
        expect((await drawnAt({ vAlign: 'center' }))[1]).toBe(11) // 16/2 + (9 - 3)/2
        expect((await drawnAt({ vAlign: 'end' }))[1]).toBe(13) // 16 - descent
    })
})

describe('CanvasLayer.drawBitmap alignment', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 0),
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    const img = (w: number, h: number) => {
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        return c as unknown as ImageBitmap
    }

    /** drawBitmap a 20x8 bitmap into a 64x16 layer and report where drawImage put it. */
    const drawnAt = (align: Record<string, string>): [number, number] => {
        const layer = new CanvasLayer('c', 64, 16)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = vi.spyOn((layer as any)._contentBuffer.context, 'drawImage')

        layer.drawBitmap(img(40, 40), new Options({ fit: 'none', width: 20, height: 8, ...align }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const call = spy.mock.calls[0] as any
        return [call[1], call[2]]
    }

    test("hAlign 'start' matches 'left', 'end' matches 'right'", () => {
        expect(drawnAt({ hAlign: 'start' })).toEqual(drawnAt({ hAlign: 'left' }))
        expect(drawnAt({ hAlign: 'end' })).toEqual(drawnAt({ hAlign: 'right' }))

        expect(drawnAt({ hAlign: 'start' })[0]).toBe(0)
        expect(drawnAt({ hAlign: 'end' })[0]).toBe(44) // 64 - 20
    })

    test("vAlign 'start' matches 'top', 'center' matches 'middle', 'end' matches 'bottom'", () => {
        expect(drawnAt({ vAlign: 'start' })).toEqual(drawnAt({ vAlign: 'top' }))
        expect(drawnAt({ vAlign: 'center' })).toEqual(drawnAt({ vAlign: 'middle' }))
        expect(drawnAt({ vAlign: 'end' })).toEqual(drawnAt({ vAlign: 'bottom' }))

        expect(drawnAt({ vAlign: 'start' })[1]).toBe(0)
        expect(drawnAt({ vAlign: 'center' })[1]).toBe(4) // (16 - 8) / 2
        expect(drawnAt({ vAlign: 'end' })[1]).toBe(8) // 16 - 8
    })

    test('an unknown alignment value still warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        drawnAt({ hAlign: 'bogus' })

        expect(warn).toHaveBeenCalled()
    })
})
