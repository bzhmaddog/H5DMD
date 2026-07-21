/**
 * Unit test for TextLayer.setTextColor — persists the color option and redraws.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { TextLayer } from '../src/layers'
import { ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer } from '../src/renderers'
import { Options } from '../src/utils'

describe('TextLayer.setTextColor', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
    })

    test('persists the new color in the layer options', () => {
        const layer = new TextLayer('t', 128, 32, new Options({ text: 'hello', color: '#FFFFFF' }))

        layer.setTextColor('#FF0000')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((layer as any)._options.get('color')).toBe('#FF0000')
    })

    test('rejects a non-string color', () => {
        const layer = new TextLayer('t', 128, 32, new Options({ text: 'hello' }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => layer.setTextColor(123 as any)).toThrow(TypeError)
    })
})
