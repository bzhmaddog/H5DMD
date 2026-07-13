/**
 * Unit tests for TextLayer._drawText branch coverage (alignment, percentage
 * positions/offsets, stroke, outline and no-antialiasing paths) plus the public
 * setText / setAdjustWidth / setVisibility surface.
 *
 * The GPU renderFrame passes are stubbed to echo their input and createImageBitmap
 * is faked, so the pure layout/branch logic runs under jsdom.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {TextLayer} from '../src/layers'
import {ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer} from '../src/renderers'
import {Options} from '../src/utils'

describe('TextLayer._drawText branches', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)

        // With init() mocked, each renderer's renderFrame stays the inherited
        // _doNothing placeholder, which echoes the supplied image data — exactly
        // what we want so the layout/branch logic runs without WebGPU.
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
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

    const layerWith = (over: Record<string, unknown> = {}) =>
        new TextLayer('t', 64, 16, new Options({text: 'Hello', ...over}))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const draw = (layer: TextLayer, opts?: Options) => (layer as any)._drawText(opts) as Promise<void>

    test('renders with horizontal and vertical alignment', async () => {
        const layer = layerWith()
        await expect(draw(layer, new Options({hAlign: 'center', vAlign: 'middle'}))).resolves.toBeUndefined()
        await expect(draw(layer, new Options({hAlign: 'right', vAlign: 'bottom'}))).resolves.toBeUndefined()
        await expect(draw(layer, new Options({hAlign: 'left', vAlign: 'top'}))).resolves.toBeUndefined()
    })

    test('resolves percentage positions and offsets', async () => {
        const layer = layerWith()
        await expect(draw(layer, new Options({
            left: '25%', top: '50%', hOffset: '10%', vOffset: '20%'
        }))).resolves.toBeUndefined()
    })

    test('draws a stroke when strokeWidth > 0', async () => {
        const layer = layerWith()
        await expect(draw(layer, new Options({strokeWidth: 2, strokeColor: '#FF0000'}))).resolves.toBeUndefined()
    })

    test('outline path runs with antialiasing enabled', async () => {
        const layer = layerWith({antialiasing: true, outlineWidth: 2})
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const outline = (layer as any)._availableRenderers['outline']
        const spy = vi.spyOn(outline, 'renderFrame')
        await draw(layer)
        expect(spy).toHaveBeenCalled()
    })

    test('no-antialiasing path runs the aliasing renderer', async () => {
        const layer = layerWith({antialiasing: false})
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aa = (layer as any)._availableRenderers['no-antialiasing']
        const spy = vi.spyOn(aa, 'renderFrame')
        await draw(layer)
        expect(spy).toHaveBeenCalled()
    })

    test('outline + no-antialiasing chains both renderers', async () => {
        const layer = layerWith({antialiasing: false, outlineWidth: 2})
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderers = (layer as any)._availableRenderers
        const aaSpy = vi.spyOn(renderers['no-antialiasing'], 'renderFrame')
        const outlineSpy = vi.spyOn(renderers['outline'], 'renderFrame')
        await draw(layer)
        expect(aaSpy).toHaveBeenCalled()
        expect(outlineSpy).toHaveBeenCalled()
    })
})

/**
 * measureText() reports fractional metrics for real fonts, and every alignment branch
 * derives left/top from them (m.width, ascent, descent) - so without rounding the text
 * is drawn at a sub-pixel offset and the rasteriser spreads each glyph edge across two
 * dots. On a dot display a glyph's position is a dot index; it cannot be a half.
 */
describe('TextLayer draws at whole-dot coordinates', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
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

    /**
     * Build a layer whose text buffer reports deliberately fractional metrics, so every
     * alignment branch would land on a fractional coordinate if it weren't rounded.
     * Returns the fillText/strokeText spies to assert against.
     */
    const layerWithFractionalMetrics = (over: Record<string, unknown> = {}) => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello', ...over}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (layer as any)._textBuffer.context as CanvasRenderingContext2D

        ctx.measureText = (() => ({
            width: 41.328,
            actualBoundingBoxAscent: 9.371,
            actualBoundingBoxDescent: 2.617
        })) as unknown as CanvasRenderingContext2D['measureText']

        return {
            layer,
            fillText: vi.spyOn(ctx, 'fillText'),
            strokeText: vi.spyOn(ctx, 'strokeText')
        }
    }

    const drawn = (spy: ReturnType<typeof vi.spyOn>) => {
        expect(spy).toHaveBeenCalled()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return spy.mock.calls.map(([, x, y]: any) => [x, y] as [number, number])
    }

    test.each([
        ['center', 'middle'],
        ['center', 'top'],
        ['right', 'bottom'],
        ['left', 'middle'],
    ])('fillText gets integer coordinates for hAlign=%s vAlign=%s', async (hAlign, vAlign) => {
        const {layer, fillText} = layerWithFractionalMetrics()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({hAlign, vAlign}))

        for (const [x, y] of drawn(fillText)) {
            expect(Number.isInteger(x), `x=${x} is not a whole dot`).toBe(true)
            expect(Number.isInteger(y), `y=${y} is not a whole dot`).toBe(true)
        }
    })

    test('the stroke is drawn at the same whole-dot coordinates as the fill', async () => {
        const {layer, fillText, strokeText} = layerWithFractionalMetrics({
            hAlign: 'center', vAlign: 'middle', strokeWidth: 2
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText()

        const strokes = drawn(strokeText)
        const fills = drawn(fillText)

        for (const [x, y] of strokes) {
            expect(Number.isInteger(x)).toBe(true)
            expect(Number.isInteger(y)).toBe(true)
        }
        // Stroke and fill must coincide, or the outline sits half a dot off its glyph.
        expect(strokes.at(-1)).toEqual(fills.at(-1))
    })

    test('fractional hOffset/vOffset are rounded too', async () => {
        const {layer, fillText} = layerWithFractionalMetrics()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({
            hAlign: 'left', vAlign: 'top', hOffset: 1.5, vOffset: 2.25
        }))

        for (const [x, y] of drawn(fillText)) {
            expect(Number.isInteger(x)).toBe(true)
            expect(Number.isInteger(y)).toBe(true)
        }
    })
})

/**
 * hAlign/vAlign default to 'center'/'middle', so before this they ran on every draw and
 * overwrote left/top - making both options (and textBaseline, whose only effect is on what
 * an explicit top anchors) impossible to use. An explicit coordinate now wins on its axis.
 */
describe('TextLayer explicit top/left override the alignment', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    /** Layer whose metrics are known, so the aligned position is predictable. */
    const layerAt = (over: Record<string, unknown> = {}) => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello', ...over}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (layer as any)._textBuffer.context as CanvasRenderingContext2D

        ctx.measureText = (() => ({
            width: 40,
            actualBoundingBoxAscent: 9,
            actualBoundingBoxDescent: 3
        })) as unknown as CanvasRenderingContext2D['measureText']

        return {layer, fillText: vi.spyOn(ctx, 'fillText')}
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastDrawnAt = (spy: any) => {
        expect(spy).toHaveBeenCalled()
        const [, x, y] = spy.mock.calls.at(-1)
        return [x, y]
    }

    test('left/top are used verbatim, in place of hAlign/vAlign', async () => {
        const {layer, fillText} = layerAt()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({left: 7, top: 3}))

        expect(lastDrawnAt(fillText)).toEqual([7, 3])
    })

    test('the two axes are independent: hAlign still centers when only top is set', async () => {
        const {layer, fillText} = layerAt()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({hAlign: 'center', top: 3}))

        // centered: (64 / 2) - (40 / 2) = 12
        expect(lastDrawnAt(fillText)).toEqual([12, 3])
    })

    test('a percentage left/top overrides the alignment too', async () => {
        const {layer, fillText} = layerAt()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({left: '25%', top: '50%'}))

        // 25% of 64 = 16, 50% of 16 = 8
        expect(lastDrawnAt(fillText)).toEqual([16, 8])
    })

    test('offsets still apply on top of an explicit coordinate', async () => {
        const {layer, fillText} = layerAt()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({left: 7, top: 3, hOffset: 2, vOffset: 1}))

        expect(lastDrawnAt(fillText)).toEqual([9, 4])
    })

    test('without left/top, alignment places the text as before', async () => {
        const {layer, fillText} = layerAt()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (layer as any)._drawText(new Options({hAlign: 'left', vAlign: 'top'}))

        // hAlign 'left' -> outline margin (0), vAlign 'top' -> ascent (9)
        expect(lastDrawnAt(fillText)).toEqual([0, 9])
    })
})

describe('TextLayer public API', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('setText updates the current text', () => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello'}))
        layer.setText('World')
        expect(layer.text).toBe('World')
    })

    test('setText rejects a non-string', () => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello'}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => layer.setText(42 as any)).toThrow(TypeError)
    })

    test('setText with the same value is a no-op', () => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello'}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = vi.spyOn(layer as any, '_drawText')
        layer.setText('Hello')
        expect(spy).not.toHaveBeenCalled()
    })

    test('setAdjustWidth toggles the option and exposes it via the getter', () => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello'}))
        expect(layer.adjustWidth).toBe(false)
        layer.setAdjustWidth(true)
        expect(layer.adjustWidth).toBe(true)
    })

    test('setAdjustWidth rejects a non-boolean', () => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello'}))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => layer.setAdjustWidth('yes' as any)).toThrow(TypeError)
    })

    test('constructing with a non-string text throws', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => new TextLayer('t', 64, 16, new Options({text: 123 as any}))).toThrow(TypeError)
    })

    test('setVisibility delegates without throwing', () => {
        const layer = new TextLayer('t', 64, 16, new Options({text: 'Hello'}))
        expect(() => layer.setVisibility(false)).not.toThrow()
        expect(layer.isVisible()).toBe(false)
    })
})
