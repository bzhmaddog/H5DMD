/**
 * Unit tests for CanvasLayer drawing methods: fillColor, clear, drawRect,
 * drawLine, fillGradient, drawGradientRect, setDrawFunction, and draw().
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { CanvasLayer } from '../src/layers'
import { ChangeAlphaRenderer } from '../src/renderers'

describe('CanvasLayer drawing methods', () => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCtx = (layer: CanvasLayer) => (layer as any)._contentBuffer.context

    test('fillColor sets fillStyle and fills the full layer', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const fillRectSpy = vi.spyOn(ctx, 'fillRect')

        layer.fillColor('#FF0000')

        expect(ctx.fillStyle).toBe('#ff0000')
        expect(fillRectSpy).toHaveBeenCalledWith(0, 0, 64, 16)
    })

    test('clear clears the entire layer', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const clearSpy = vi.spyOn(ctx, 'clearRect')

        layer.clear()

        expect(clearSpy).toHaveBeenCalledWith(0, 0, 64, 16)
    })

    test('drawRect draws a filled rectangle at the specified position', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const fillRectSpy = vi.spyOn(ctx, 'fillRect')

        layer.drawRect(5, 3, 20, 10, '#00FF00')

        expect(ctx.fillStyle).toBe('#00ff00')
        expect(fillRectSpy).toHaveBeenCalledWith(5, 3, 20, 10)
    })

    test('drawLine draws a line with the given color and width', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const moveSpy = vi.spyOn(ctx, 'moveTo')
        const lineSpy = vi.spyOn(ctx, 'lineTo')
        const strokeSpy = vi.spyOn(ctx, 'stroke')

        layer.drawLine(0, 0, 64, 16, '#0000FF', 2)

        expect(ctx.strokeStyle).toBe('#0000ff')
        expect(ctx.lineWidth).toBe(2)
        expect(moveSpy).toHaveBeenCalledWith(0, 0)
        expect(lineSpy).toHaveBeenCalledWith(64, 16)
        expect(strokeSpy).toHaveBeenCalled()
    })

    test('drawLine defaults to lineWidth 1', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)

        layer.drawLine(0, 0, 10, 10, '#FFF')

        expect(ctx.lineWidth).toBe(1)
    })

    test('fillGradient fills the entire layer with a horizontal gradient', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const gradientSpy = vi.spyOn(ctx, 'createLinearGradient')
        const fillRectSpy = vi.spyOn(ctx, 'fillRect')

        layer.fillGradient(['#000', '#FFF'])

        expect(gradientSpy).toHaveBeenCalledWith(0, 0, 64, 0)
        expect(fillRectSpy).toHaveBeenCalledWith(0, 0, 64, 16)
    })

    test('fillGradient vertical creates a top-to-bottom gradient', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const gradientSpy = vi.spyOn(ctx, 'createLinearGradient')

        layer.fillGradient(['#000', '#FFF'], 'vertical')

        expect(gradientSpy).toHaveBeenCalledWith(0, 0, 0, 16)
    })

    test('drawGradientRect draws a gradient inside the given bounds', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const gradientSpy = vi.spyOn(ctx, 'createLinearGradient')
        const fillRectSpy = vi.spyOn(ctx, 'fillRect')

        layer.drawGradientRect(10, 2, 30, 8, ['#F00', '#0F0', '#00F'], 'vertical')

        expect(gradientSpy).toHaveBeenCalledWith(10, 2, 10, 10)
        expect(fillRectSpy).toHaveBeenCalledWith(10, 2, 30, 8)
    })

    test('drawGradientRect defaults to horizontal', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const gradientSpy = vi.spyOn(ctx, 'createLinearGradient')

        layer.drawGradientRect(0, 0, 40, 10, ['#000', '#FFF'])

        expect(gradientSpy).toHaveBeenCalledWith(0, 0, 40, 0)
    })

    test('setDrawFunction + draw() clears the layer and invokes the callback', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const clearSpy = vi.spyOn(ctx, 'clearRect')

        const fn = vi.fn(draw => {
            draw.fillColor('#FF0000')
            expect(draw.width).toBe(64)
            expect(draw.height).toBe(16)
        })

        layer.setDrawFunction(fn)
        layer.draw()

        expect(clearSpy).toHaveBeenCalledWith(0, 0, 64, 16)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    test('draw() without a registered function just clears', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const clearSpy = vi.spyOn(ctx, 'clearRect')

        layer.draw()

        expect(clearSpy).toHaveBeenCalledWith(0, 0, 64, 16)
    })

    test('setDrawFunction(undefined) unregisters the callback', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const fn = vi.fn()

        layer.setDrawFunction(fn)
        layer.setDrawFunction(undefined)
        layer.draw()

        expect(fn).not.toHaveBeenCalled()
    })

    test('draw() drawContext exposes all drawing methods', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const ctx = getCtx(layer)
        const fillRectSpy = vi.spyOn(ctx, 'fillRect')
        const strokeSpy = vi.spyOn(ctx, 'stroke')

        layer.setDrawFunction(draw => {
            draw.drawRect(0, 0, 10, 10, '#F00')
            draw.drawLine(0, 0, 10, 10, '#0F0', 3)
            draw.fillGradient(['#000', '#FFF'])
            draw.drawGradientRect(0, 0, 20, 5, ['#F00', '#00F'], 'vertical')
        })

        layer.draw()

        expect(fillRectSpy).toHaveBeenCalled()
        expect(strokeSpy).toHaveBeenCalled()
    })
})
