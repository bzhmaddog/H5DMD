/**
 * Unit tests for the Dmd public API: layer add/get/remove, visibility,
 * custom renderer registration, reset, brightness and the read-only
 * accessors, plus the _addLayer alignment / zIndex bookkeeping, and the dot
 * shape/size/space runtime setters and their getters.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { Dmd } from '../src'
import { AnimationLayer, CanvasLayer, SpritesLayer, TextLayer, VideoLayer } from '../src/layers'
import { ChangeAlphaRenderer, DmdRenderer, OutlineRenderer, RemoveAliasingRenderer } from '../src/renderers'
import { Options } from '../src/utils'
import { DotShape } from '../src/enums'

describe('Dmd public API', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(OutlineRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(RemoveAliasingRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 0),
        )
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
        return new Dmd(canvas, {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS: false,
        })
    }

    test('addLayer registers a retrievable layer', () => {
        const dmd = makeDmd()
        const layer = dmd.addLayer(CanvasLayer, 'bg', new Options())

        expect(layer).toBeInstanceOf(CanvasLayer)
        expect(dmd.getLayer('bg')).toBe(layer)
    })

    test('getLayer returns null for an unknown id', () => {
        const dmd = makeDmd()
        expect(dmd.getLayer('nope')).toBeNull()
    })

    test('adding two layers with the same id throws', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'dup', new Options())
        expect(() => dmd.addLayer(CanvasLayer, 'dup', new Options())).toThrow(/already exists/)
    })

    test('addLayer builds the correct layer type', () => {
        const dmd = makeDmd()
        expect(dmd.addLayer(VideoLayer, 'v', new Options())).toBeInstanceOf(VideoLayer)
        expect(dmd.addLayer(AnimationLayer, 'a', new Options())).toBeInstanceOf(AnimationLayer)
        expect(dmd.addLayer(SpritesLayer, 's', new Options())).toBeInstanceOf(SpritesLayer)
        expect(dmd.addLayer(TextLayer, 't', new Options({ text: 'hi' }))).toBeInstanceOf(TextLayer)
    })

    test('removeLayer deletes a layer and drops it from the sorted list', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'x', new Options())

        dmd.removeLayer('x')

        expect(dmd.getLayer('x')).toBeNull()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'x')).toBeUndefined()
    })

    test('layerIds reports the rendering order and follows moveLayer', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'a', new Options())
        dmd.addLayer(CanvasLayer, 'b', new Options())
        dmd.addLayer(CanvasLayer, 'c', new Options())

        expect(dmd.layerIds).toEqual(['a', 'b', 'c'])

        dmd.moveLayer('a', dmd.layerIds.indexOf('c'))

        expect(dmd.layerIds).toEqual(['b', 'c', 'a'])
    })

    test('removeLayer on a missing id is a no-op', () => {
        const dmd = makeDmd()
        expect(() => dmd.removeLayer('ghost')).not.toThrow()
    })

    test('setLayerVisibility toggles a single layer', () => {
        const dmd = makeDmd()
        const layer = dmd.addLayer(CanvasLayer, 'x', new Options())

        dmd.setLayerVisibility('x', false)

        expect(layer.isVisible()).toBe(false)
    })

    test('addRenderer accepts a valid renderer and rejects duplicates / invalid objects', () => {
        const dmd = makeDmd()
        const renderer = { renderFrame: () => Promise.resolve({} as ImageData) }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => dmd.addRenderer('r', renderer as any)).not.toThrow()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => dmd.addRenderer('r', renderer as any)).toThrow(/already exists/)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => dmd.addRenderer('bad', {} as any)).toThrow(/might not be a Renderer/)
    })

    test('reset clears all layers', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'a', new Options())
        dmd.addLayer(CanvasLayer, 'b', new Options())

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
        expect(dmd.width).toBe(42) // floor(128 / (2 + 1))
        expect(dmd.height).toBe(10) // floor(32 / (2 + 1))
        expect(dmd.fps).toBe(0)
        expect(dmd.version).toBe(Dmd.version)
    })

    test('_addLayer positions a centered/middle layer and records it in the sorted list', () => {
        const dmd = makeDmd()
        dmd.addLayer(
            CanvasLayer,
            'c',
            new Options({ width: 10, height: 5, position: { hAlign: 'center', vAlign: 'middle' } }),
        )

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'c')
        expect(entry.left).toBe(16) // (42 - 10) / 2
        expect(entry.top).toBe(3) // (10 - 5) / 2 = 2.5, rounded: a position is a dot index
    })

    test('an explicit zIndex option is honoured in the sorted list', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'z', new Options({ zIndex: 7 }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'z')
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
        dmd.addLayer(CanvasLayer, 'a', new Options({ width: 10, height: 5, position: { hAlign: 'left', hOffset: 3 } }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'a')
        expect(entry.left).toBe(3)
    })

    test('hAlign right positions at dmd width - layer width', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'a', new Options({ width: 10, height: 5, position: { hAlign: 'right' } }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'a')
        // dmd width = floor(128/3) = 42 → 42 - 10 = 32
        expect(entry.left).toBe(32)
    })

    test('vAlign top positions at vOffset', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'a', new Options({ width: 10, height: 5, position: { vAlign: 'top', vOffset: 2 } }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'a')
        expect(entry.top).toBe(2)
    })

    test('vAlign bottom positions at dmd height - layer height', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'a', new Options({ width: 10, height: 5, position: { vAlign: 'bottom' } }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: { id: string }) => l.id === 'a')
        // dmd height = floor(32/3) = 10 → 10 - 5 = 5
        expect(entry.top).toBe(5)
    })

    test('invalid layer class throws TypeError', () => {
        const dmd = makeDmd()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => (dmd as any).addLayer(class {}, 'bad', {})).toThrow(/Unsupported layer class/)
    })
})

describe('Dmd render loop', () => {
    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 0),
        )
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
        return new Dmd(canvas, {
            dotSize: 2,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 14,
            brightness: 1,
            showFPS,
        })
    }

    test('renderDMD composites visible loaded layers and calls renderFrame', async () => {
        const dmd = makeDmd()
        const layer = dmd.addLayer(CanvasLayer, 'bg', new Options())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(layer as any)._loaded = true // visible by default

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderSpy = vi.spyOn((dmd as any)._renderer, 'renderFrame').mockResolvedValue(undefined)

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

        const fillTextSpy = vi.spyOn(internal._fpsCtx, 'fillText')
        internal.__renderFPS()

        expect(fillTextSpy).toHaveBeenCalledWith(expect.stringContaining('FPS'), expect.any(Number), expect.any(Number))
        expect(fillTextSpy).toHaveBeenCalledWith(expect.stringContaining('min'), expect.any(Number), expect.any(Number))
    })

    test('the FPS canvas is created on construction and removed on stop()', () => {
        const dmd = makeDmd(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = (dmd as any)._fpsCanvas as HTMLElement
        expect(document.body.contains(canvas)).toBe(true)

        dmd.stop()
        expect(document.body.contains(canvas)).toBe(false)
    })
})
