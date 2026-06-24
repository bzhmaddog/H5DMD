/**
 * Unit tests for CanvasLayer.drawBitmap / _computeDimensions and the BaseLayer
 * accessor & visibility branches it inherits. A real <canvas> is used as the
 * ImageBitmap source (accepted by the canvas mock).
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {CanvasLayer, LayerType} from '../src/layers'
import {ChangeAlphaRenderer} from '../src/renderers'
import {Options} from '../src/utils'

const img = (w: number, h: number) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c as unknown as ImageBitmap
}

describe('CanvasLayer.drawBitmap dimensions', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    const drawSpy = (layer: CanvasLayer) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn((layer as any)._contentBuffer.context, 'drawImage')

    test('fit + keepAspectRatio with a square image uses the smallest layer side', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(20, 20))

        expect(spy).toHaveBeenCalledWith(expect.anything(), 0, 0, 16, 16)
    })

    test('fit + keepAspectRatio with a wide image fits the width', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 10))

        // w = layer width (64), h = round(64 * 10 / 40) = 16
        expect(spy).toHaveBeenCalledWith(expect.anything(), 0, 0, 64, 16)
    })

    test('fit + keepAspectRatio with a tall image fits the height', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(10, 40))

        // h = layer height (16); does not throw and draws once
        const call = spy.mock.calls[0]
        expect(call[2]).toBe(0) // top
        expect(call[4]).toBe(16) // height
    })

    test('fit without keepAspectRatio stretches to the layer size', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 40), new Options({keepAspectRatio: false}))

        expect(spy).toHaveBeenCalledWith(expect.anything(), 0, 0, 64, 16)
    })

    test('explicit numeric width and height are honoured', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 40), new Options({fit: false, width: 30, height: 8}))

        expect(spy).toHaveBeenCalledWith(expect.anything(), 0, 0, 30, 8)
    })

    test('percentage width and height are resolved against the layer size', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 40), new Options({fit: false, width: '50%', height: '50%'}))

        // 50% of 64 = 32, 50% of 16 = 8
        expect(spy).toHaveBeenCalledWith(expect.anything(), 0, 0, 32, 8)
    })

    test('hAlign/vAlign position the bitmap', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 40), new Options({
            fit: false, width: 20, height: 8, hAlign: 'right', vAlign: 'bottom'
        }))

        const call = spy.mock.calls[0]
        // right: left = 64 - 20 = 44 ; bottom: top = 16 - 8 = 8
        expect(call[1]).toBe(44)
        expect(call[2]).toBe(8)
    })

    test('percentage top/left offsets are resolved against the layer size', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(10, 10), new Options({fit: false, width: 10, height: 10, left: '25%', top: '50%'}))

        const call = spy.mock.calls[0]
        expect(call[1]).toBe(16) // 25% of 64
        expect(call[2]).toBe(8)  // 50% of 16
    })

    test('keepAspectRatio derives the missing height from a given width', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 20), new Options({fit: false, keepAspectRatio: true, width: 20}))

        // h = round(width(20) * imgHeight(20) / imgWidth(40)) = 10
        const call = spy.mock.calls[0]
        expect(call[3]).toBe(20)
        expect(call[4]).toBe(10)
    })

    test('keepAspectRatio derives the missing width from a given height', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)

        layer.drawBitmap(img(40, 20), new Options({fit: false, keepAspectRatio: true, height: 10}))

        // w = round(height(10) * imgWidth(40) / imgHeight(20)) = 20
        const call = spy.mock.calls[0]
        expect(call[3]).toBe(20)
        expect(call[4]).toBe(10)
    })

    test('an invalid hAlign / vAlign value warns and leaves the position untouched', () => {
        const layer = new CanvasLayer('c', 64, 16)
        const spy = drawSpy(layer)
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        layer.drawBitmap(img(40, 40), new Options({
            fit: false, width: 10, height: 10, hAlign: 'bogus', vAlign: 'bogus'
        }))

        expect(warn).toHaveBeenCalled()
        const call = spy.mock.calls[0]
        expect(call[1]).toBe(0)
        expect(call[2]).toBe(0)
    })
})

describe('CanvasLayer inherited BaseLayer behaviour', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    test('reports its layer type, id and dimensions', () => {
        const layer = new CanvasLayer('hud', 64, 16)
        expect(layer.layerType).toBe(LayerType.Canvas)
        expect(layer.id).toBe('hud')
        expect(layer.width).toBe(64)
        expect(layer.height).toBe(16)
        expect(layer.canvas).toBeInstanceOf(HTMLCanvasElement)
    })

    test('defaults to the "default" group and exposes its options', () => {
        const layer = new CanvasLayer('c', 64, 16)
        expect(layer.groups).toEqual(['default'])
        expect(layer.options).toBeInstanceOf(Options)
    })

    test('toggleVisibility flips and returns the new state', () => {
        const layer = new CanvasLayer('c', 64, 16)
        expect(layer.isVisible()).toBe(true)

        expect(layer.toggleVisibility()).toBe(false)
        expect(layer.isVisible()).toBe(false)

        expect(layer.toggleVisibility()).toBe(true)
        expect(layer.isVisible()).toBe(true)
    })

    test('setVisibility to the current value is a no-op', () => {
        const layer = new CanvasLayer('c', 64, 16)
        // Already visible → early return, no throw, state unchanged.
        layer.setVisibility(true)
        expect(layer.isVisible()).toBe(true)
    })

    test('haveRenderer is false without a default render queue', () => {
        const layer = new CanvasLayer('c', 64, 16)
        expect(layer.haveRenderer()).toBe(false)
    })

    test('destroy() does not throw', () => {
        const layer = new CanvasLayer('c', 64, 16)
        expect(() => layer.destroy()).not.toThrow()
    })
})
