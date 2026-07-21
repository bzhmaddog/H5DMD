/**
 * Unit tests for TextLayer waiting on the CSS Font Loading API before drawing.
 *
 * Canvas measureText()/fillText() silently fall back to a default font while a custom
 * font is still loading, so _drawText must await document.fonts.load() (which also
 * triggers the download) before measuring - otherwise the %-fontSize math sizes the
 * text for the wrong font's glyphs and never corrects itself.
 *
 *   - load() is called with the configured style/family and the layer's text, and no
 *     text is drawn until it resolves.
 *   - a rejected load() still draws (canvas fallback font) instead of never drawing.
 *   - absent FontFaceSet (e.g. jsdom) draws immediately (no-op guard).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { TextLayer } from '../src/layers'
import { ChangeAlphaRenderer, OutlineRenderer, RemoveAliasingRenderer } from '../src/renderers'

const flush = () => new Promise(resolve => setTimeout(resolve, 5))

describe('TextLayer - font loading', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext

    let fillTextCalls = 0

    beforeEach(() => {
        setupVitestCanvasMock()

        fillTextCalls = 0

        // Layer constructor kicks off renderer.init() for the GPU renderers.
        // Stub them so they resolve instead of touching the (absent) WebGPU API.
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)

        // Instrument every 2d context to count fillText calls (i.e. actual text draws).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: any[]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx: any = (originalGetContext as any).apply(this, args)
            if (ctx && typeof ctx.fillText !== 'undefined') {
                ctx.fillText = function () {
                    fillTextCalls++
                }
            }
            return ctx
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
    })

    afterEach(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (document as any).fonts
        vi.restoreAllMocks()
    })

    const stubFonts = (
        load: (font: string, text?: string) => Promise<unknown>,
        check?: (font: string, text?: string) => boolean,
    ) => {
        Object.defineProperty(document, 'fonts', { value: { load, check }, configurable: true })
    }

    test('awaits document.fonts.load with the configured style/family before drawing', async () => {
        let resolveLoad!: () => void
        const loadGate = new Promise<FontFace[]>(resolve => {
            resolveLoad = () => resolve([])
        })
        const load = vi.fn(() => loadGate)
        stubFonts(load)

        new TextLayer('t', 40, 10, { text: 'SCORE', fontFamily: 'Dusty', fontStyle: 'italic' })
        await flush()

        expect(load).toHaveBeenCalledWith('italic 100px Dusty', 'SCORE')
        // The draw is gated on the font: nothing rendered yet.
        expect(fillTextCalls).toBe(0)

        resolveLoad()
        await flush()
        expect(fillTextCalls).toBeGreaterThan(0)
    })

    test('an already-loaded font (fonts.check true) draws without calling load', async () => {
        const load = vi.fn()
        const check = vi.fn(() => true)
        stubFonts(load, check)

        new TextLayer('t', 40, 10, { text: 'SCORE', fontFamily: 'Dusty' })
        await flush()

        expect(check).toHaveBeenCalledWith('normal 100px Dusty', 'SCORE')
        expect(load).not.toHaveBeenCalled()
        expect(fillTextCalls).toBeGreaterThan(0)
    })

    test('a rejected load still draws, with the canvas fallback font', async () => {
        stubFonts(vi.fn(() => Promise.reject(new Error('font download failed'))))

        new TextLayer('t', 40, 10, { text: 'X', fontFamily: 'Missing' })
        await flush()

        expect(fillTextCalls).toBeGreaterThan(0)
    })

    test('absent FontFaceSet (e.g. jsdom) draws immediately', async () => {
        new TextLayer('t', 40, 10, { text: 'X' })
        await flush()

        expect(fillTextCalls).toBeGreaterThan(0)
    })
})
