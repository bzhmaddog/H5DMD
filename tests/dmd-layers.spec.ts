/**
 * Unit tests for the Dmd public API: layer add/get/remove, visibility (single and
 * group), custom renderer registration, reset, brightness and the read-only
 * accessors, plus the _addLayer alignment / zIndex bookkeeping, and the dot
 * shape/size/space runtime setters and their getters.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {
    AnimationLayer, CanvasLayer, SpritesLayer, TextLayer, VideoLayer
} from '../src/layers'
import {
    ChangeAlphaRenderer, DmdRenderer, OutlineRenderer, RemoveAliasingRenderer
} from '../src/renderers'
import {Options} from '../src/utils'
import {DotShape} from '../src/enums'

describe('Dmd public API', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
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

    const makeDmd = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 32
        return new Dmd(canvas, 2, 1, DotShape.Square, 14, 1, false)
    }

    test('addCanvasLayer registers a retrievable layer', () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('bg', {}, new Options())

        expect(layer).toBeInstanceOf(CanvasLayer)
        expect(dmd.getLayer('bg')).toBe(layer)
    })

    test('getLayer returns null for an unknown id', () => {
        const dmd = makeDmd()
        expect(dmd.getLayer('nope')).toBeNull()
    })

    test('adding two layers with the same id throws', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('dup', {}, new Options())
        expect(() => dmd.addCanvasLayer('dup', {}, new Options())).toThrow(/already exists/)
    })

    test('each add* helper builds the matching layer type', () => {
        const dmd = makeDmd()
        expect(dmd.addVideoLayer('v', {}, new Options())).toBeInstanceOf(VideoLayer)
        expect(dmd.addAnimationLayer('a', {}, new Options())).toBeInstanceOf(AnimationLayer)
        expect(dmd.addSpritesLayer('s', {}, new Options())).toBeInstanceOf(SpritesLayer)
        expect(dmd.addTextLayer('t', {}, new Options({text: 'hi'}))).toBeInstanceOf(TextLayer)
    })

    test('removeLayer deletes a layer and drops it from the sorted list', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('x', {}, new Options())

        dmd.removeLayer('x')

        expect(dmd.getLayer('x')).toBeNull()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'x')).toBeUndefined()
    })

    test('removeLayer on a missing id is a no-op', () => {
        const dmd = makeDmd()
        expect(() => dmd.removeLayer('ghost')).not.toThrow()
    })

    test('setLayerVisibility toggles a single layer', () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('x', {}, new Options())

        dmd.setLayerVisibility('x', false)

        expect(layer.isVisible()).toBe(false)
    })

    test('setLayerGroupVisibility toggles every layer in the group', () => {
        const dmd = makeDmd()
        const a = dmd.addCanvasLayer('a', {}, new Options({groups: ['hud']}))
        const b = dmd.addCanvasLayer('b', {}, new Options({groups: ['hud']}))
        const c = dmd.addCanvasLayer('c', {}, new Options({groups: ['other']}))

        dmd.setLayerGroupVisibility('hud', false)

        expect(a.isVisible()).toBe(false)
        expect(b.isVisible()).toBe(false)
        expect(c.isVisible()).toBe(true)
    })

    test('addRenderer accepts a valid renderer and rejects duplicates / invalid objects', () => {
        const dmd = makeDmd()
        const renderer = {renderFrame: () => Promise.resolve({} as ImageData)}

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => dmd.addRenderer('r', renderer as any)).not.toThrow()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => dmd.addRenderer('r', renderer as any)).toThrow(/already exists/)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => dmd.addRenderer('bad', {} as any)).toThrow(/might not be a Renderer/)
    })

    test('reset clears all layers', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {}, new Options())
        dmd.addCanvasLayer('b', {}, new Options())

        dmd.reset()

        expect(dmd.getLayer('a')).toBeNull()
        expect(dmd.getLayer('b')).toBeNull()
    })

    test('setBrightness clamps and the brightness getter reflects it', () => {
        const dmd = makeDmd()
        dmd.setBrightness(0.42)
        expect(dmd.brightness).toBe(0.42)
        dmd.setBrightness(5)
        expect(dmd.brightness).toBe(1)
    })

    test('exposes canvas, dimensions and version', () => {
        const dmd = makeDmd()
        expect(dmd.canvas).toBeInstanceOf(HTMLCanvasElement)
        expect(dmd.screenWidth).toBe(128)
        expect(dmd.screenHeight).toBe(32)
        expect(dmd.width).toBe(42)  // floor(128 / (2 + 1))
        expect(dmd.height).toBe(10) // floor(32 / (2 + 1))
        expect(dmd.fps).toBe(0)
        expect(dmd.version).toBe(Dmd.version)
    })

    test('_addLayer positions a centered/middle layer and records it in the sorted list', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('c', {width: 10, height: 5, hAlign: 'center', vAlign: 'middle'}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'c')
        expect(entry.left).toBe(15)  // (42 - 10) / 2 - 1
        expect(entry.top).toBe(1.5)  // (10 - 5) / 2 - 1
    })

    test('an explicit zIndex option is honoured in the sorted list', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('z', {}, new Options({zIndex: 7}))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'z')
        expect(entry.zIndex).toBe(7)
    })

    test('debug() does not throw', () => {
        const dmd = makeDmd()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        expect(() => dmd.debug()).not.toThrow()
    })

    test('setDotShape delegates to renderer and is readable via getter', () => {
        const dmd = makeDmd()
        dmd.setDotShape(DotShape.Circle)
        expect(dmd.dotShape).toBe(DotShape.Circle)
    })

    test('setDotSize delegates to renderer and is readable via getter', () => {
        const dmd = makeDmd()
        dmd.setDotSize(5)
        expect(dmd.dotSize).toBe(5)
    })

    test('setDotSpace delegates to renderer and is readable via getter', () => {
        const dmd = makeDmd()
        dmd.setDotSpace(3)
        expect(dmd.dotSpace).toBe(3)
    })

    test('minDotSpace getter returns correct floor for shape', () => {
        const dmd = makeDmd()
        dmd.setDotShape(DotShape.Circle)
        expect(dmd.minDotSpace).toBe(1)
    })

    test('visibleDotsX and visibleDotsY getters return positive numbers', () => {
        const dmd = makeDmd()
        expect(dmd.visibleDotsX).toBeGreaterThan(0)
        expect(dmd.visibleDotsY).toBeGreaterThan(0)
    })

    test('hAlign left positions at hOffset', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, hAlign: 'left', hOffset: 3}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        expect(entry.left).toBe(3)
    })

    test('hAlign right positions at dmd width - layer width - 1', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, hAlign: 'right'}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        // dmd width = floor(128/3) = 42 → 42 - 10 - 1 = 31
        expect(entry.left).toBe(31)
    })

    test('vAlign top positions at vOffset', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, vAlign: 'top', vOffset: 2}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        expect(entry.top).toBe(2)
    })

    test('vAlign bottom positions at dmd height - layer height - 1', () => {
        const dmd = makeDmd()
        dmd.addCanvasLayer('a', {width: 10, height: 5, vAlign: 'bottom'}, new Options())

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'a')
        // dmd height = floor(32/3) = 10 → 10 - 5 - 1 = 4
        expect(entry.top).toBe(4)
    })

    test('invalid layer type throws TypeError', () => {
        const dmd = makeDmd()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => (dmd as any)._addLayer(999, 'bad', {}, new Options()))
            .toThrow(/Invalid layer type/)
    })
})

describe('Dmd render loop', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
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

    const makeDmd = (showFPS = false) => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 32
        return new Dmd(canvas, 2, 1, DotShape.Square, 14, 1, showFPS)
    }

    test('renderDMD composites visible loaded layers and calls renderFrame', async () => {
        const dmd = makeDmd()
        const layer = dmd.addCanvasLayer('bg', {}, new Options())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any)._loaded = true // visible by default

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderSpy = vi.spyOn((dmd as any)._renderer, 'renderFrame')
            .mockResolvedValue(undefined)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(dmd as any).renderDMD()

        // Flush the renderFrame microtask chain.
        await Promise.resolve()
        await Promise.resolve()

        expect(renderSpy).toHaveBeenCalled()
    })

    test('the FPS overlay renders the current/min/max readout', () => {
        const dmd = makeDmd(true)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internal = dmd as any
        // Seed a full smoothing window so min/max are reported (not "-").
        internal._fpsSamples = new Array(30).fill(16)
        internal._fps = 60
        internal._minFPS = 58
        internal._maxFPS = 62

        internal.__renderFPS()

        expect(internal._fpsBox.textContent).toContain('FPS')
        expect(internal._fpsBox.textContent).toContain('min')
    })

    test('the FPS box is created on construction and removed on stop()', () => {
        const dmd = makeDmd(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const box = (dmd as any)._fpsBox as HTMLElement
        expect(document.body.contains(box)).toBe(true)

        dmd.stop()
        expect(document.body.contains(box)).toBe(false)
    })
})
