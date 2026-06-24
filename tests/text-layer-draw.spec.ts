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
