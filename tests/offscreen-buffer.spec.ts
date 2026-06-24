/**
 * Unit test for OffscreenBuffer: construction must fail loudly (rather than
 * proceed with a null context) when a 2D rendering context cannot be acquired.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {OffscreenBuffer} from '../src/utils'

describe('OffscreenBuffer', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('throws when no 2D context is available', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

        expect(() => new OffscreenBuffer(16, 16)).toThrow(/2D rendering context/)
    })

    test('exposes its canvas, context and dimensions', () => {
        const buffer = new OffscreenBuffer(32, 16)

        expect(buffer.canvas).toBeInstanceOf(HTMLCanvasElement)
        expect(buffer.context).toBeTruthy()
        expect(buffer.width).toBe(32)
        expect(buffer.height).toBe(16)
    })

    test('width and height setters resize the underlying canvas', () => {
        const buffer = new OffscreenBuffer(8, 8)

        buffer.width = 64
        buffer.height = 24

        expect(buffer.width).toBe(64)
        expect(buffer.height).toBe(24)
        expect(buffer.canvas.width).toBe(64)
        expect(buffer.canvas.height).toBe(24)
    })

    test('clear() clears the whole buffer', () => {
        const buffer = new OffscreenBuffer(16, 16)
        const clearRect = vi.spyOn(buffer.context, 'clearRect')

        buffer.clear()

        expect(clearRect).toHaveBeenCalledWith(0, 0, 16, 16)
    })

    test('can be constructed without the willReadFrequently hint', () => {
        const buffer = new OffscreenBuffer(4, 4, false)

        expect(buffer.context).toBeTruthy()
    })
})
