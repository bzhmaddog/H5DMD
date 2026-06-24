/**
 * Unit test for the BaseLayer opacity accessor (used by the demo control panel).
 * `setOpacity` clamps to the 0–1 range and `opacity` reflects the stored value.
 */
import {beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {CanvasLayer} from '../src/layers'
import {ChangeAlphaRenderer} from '../src/renderers'

describe('BaseLayer opacity', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
    })

    test('defaults to 1', () => {
        const layer = new CanvasLayer('c', 64, 16)
        expect(layer.opacity).toBe(1)
    })

    test('setOpacity stores the value', () => {
        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(0.5)
        expect(layer.opacity).toBe(0.5)
    })

    test('setOpacity clamps to the 0–1 range', () => {
        const layer = new CanvasLayer('c', 64, 16)
        layer.setOpacity(2)
        expect(layer.opacity).toBe(1)
        layer.setOpacity(-1)
        expect(layer.opacity).toBe(0)
    })
})
