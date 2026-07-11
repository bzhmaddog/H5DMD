/**
 * Unit tests for LayerGroup:
 *   - inherits BaseLayer dimensioning/position/opacity/background/renderer/visibility, and
 *     exposes no draw* methods
 *   - addLayer/getLayer/removeLayer/moveLayer parity with Dmd
 *   - compositing children at their relative position, in zIndex order
 *   - recompositing on child update (batched) for a static group, and every render pass
 *     for a group with an active renderer
 *   - 3-level nesting (Dmd -> group -> subgroup -> leaf layer)
 *   - visibility cascade (hide/restore) and destroy cascade
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {CanvasLayer, LayerGroup} from '../src/layers'
import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers'
import {Options} from '../src/utils'
import {DotShape} from '../src/enums'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const priv = (obj: unknown): any => obj as any

const markLoaded = (layer: CanvasLayer | LayerGroup) => {
    priv(layer)._loaded = true
}

describe('LayerGroup', () => {

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

    const makeDmd = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 32
        return new Dmd(canvas, {dotSize: 2, dotSpace: 1, dotShape: DotShape.Square, backgroundBrightness: 14, brightness: 1, showFPS: false})
    }

    test('inherits BaseLayer dimensioning/position/opacity/background/visibility', () => {
        const group = new LayerGroup('g', 32, 16, new Options({
            visible: false, opacity: 0.5, backgroundColor: '#112233', backgroundOpacity: 0.4
        }))

        expect(group.width).toBe(32)
        expect(group.height).toBe(16)
        expect(group.isVisible()).toBe(false)
        expect(group.opacity).toBe(0.5)
        expect(group.backgroundColor).toBe('#112233')
        expect(group.backgroundOpacity).toBe(0.4)
    })

    test('exposes no draw* methods', () => {
        const group = new LayerGroup('g', 32, 16)
        expect(typeof priv(group).fillColor).toBe('undefined')
        expect(typeof priv(group).drawRect).toBe('undefined')
        expect(typeof priv(group).drawBitmap).toBe('undefined')
    })

    test('addLayer/getLayer/removeLayer/moveLayer mirror Dmd', () => {
        const group = new LayerGroup('g', 32, 16)

        const a = group.addLayer(CanvasLayer, 'a', new Options())
        expect(a).toBeInstanceOf(CanvasLayer)
        expect(group.getLayer('a')).toBe(a)
        expect(group.getLayer('missing')).toBeNull()

        expect(() => group.addLayer(CanvasLayer, 'a', new Options())).toThrow(/already exists/)

        group.addLayer(CanvasLayer, 'b', new Options())
        group.moveLayer('b', 0)
        expect(priv(group)._sortedChildren[0].id).toBe('b')

        group.removeLayer('a')
        expect(group.getLayer('a')).toBeNull()
    })

    test('composites visible+loaded children at their relative position, in zIndex order', () => {
        const group = new LayerGroup('g', 64, 32)

        const back = group.addLayer(CanvasLayer, 'back', new Options({position: {top: 1, left: 2}}))
        const front = group.addLayer(CanvasLayer, 'front', new Options({position: {top: 3, left: 4}}))
        markLoaded(back)
        markLoaded(front)

        const drawSpy = vi.spyOn(priv(group)._contentBuffer.context, 'drawImage')
        priv(group)._prepareFrame()

        expect(drawSpy).toHaveBeenCalledTimes(2)
        expect(drawSpy).toHaveBeenNthCalledWith(1, back.canvas, 2, 1)
        expect(drawSpy).toHaveBeenNthCalledWith(2, front.canvas, 4, 3)
    })

    test('skips children that are hidden or not yet loaded', () => {
        const group = new LayerGroup('g', 64, 32)

        const hidden = group.addLayer(CanvasLayer, 'hidden', new Options({visible: false}))
        group.addLayer(CanvasLayer, 'not-loaded', new Options()) // left unloaded on purpose
        markLoaded(hidden) // loaded but hidden - still skipped

        const drawSpy = vi.spyOn(priv(group)._contentBuffer.context, 'drawImage')
        priv(group)._prepareFrame()

        expect(drawSpy).not.toHaveBeenCalled()
    })

    test('a static group (no renderers, opacity 1) recomposites once per batch of child updates', async () => {
        const group = new LayerGroup('g', 32, 16)
        const child = group.addLayer(CanvasLayer, 'c', new Options())
        markLoaded(child)
        markLoaded(group)

        const prepareSpy = vi.spyOn(priv(group), '_prepareFrame')

        // Two synchronous child updates in the same tick...
        priv(child)._layerUpdated()
        priv(child)._layerUpdated()
        expect(prepareSpy).not.toHaveBeenCalled() // batched - not yet flushed

        await Promise.resolve() // flush the scheduled microtask
        await Promise.resolve()

        // ...collapse into a single recomposite.
        expect(prepareSpy).toHaveBeenCalledTimes(1)
    })

    test('a group with an active renderer recomposites on every render pass', () => {
        const group = new LayerGroup('g', 32, 16, new Options({
            renderers: [{id: 'alpha', instance: new ChangeAlphaRenderer(32, 16)}]
        }))
        markLoaded(group)

        const prepareSpy = vi.spyOn(priv(group), '_prepareFrame')

        priv(group)._renderFrame()
        priv(group)._renderFrame()

        expect(prepareSpy).toHaveBeenCalledTimes(2)
    })

    test('3-level nesting composes recursively (Dmd -> group -> subgroup -> leaf)', () => {
        const dmd = makeDmd()
        const group = dmd.addLayerGroup('group', new Options({width: 40, height: 20}))
        const subgroup = group.addLayerGroup('subgroup', new Options({width: 20, height: 10, position: {top: 1, left: 2}}))
        const leaf = subgroup.addLayer(CanvasLayer, 'leaf', new Options({position: {top: 3, left: 4}}))
        markLoaded(leaf)
        markLoaded(subgroup)
        markLoaded(group)

        const subgroupDrawSpy = vi.spyOn(priv(subgroup)._contentBuffer.context, 'drawImage')
        priv(subgroup)._prepareFrame()
        expect(subgroupDrawSpy).toHaveBeenCalledWith(leaf.canvas, 4, 3)

        const groupDrawSpy = vi.spyOn(priv(group)._contentBuffer.context, 'drawImage')
        priv(group)._prepareFrame()
        expect(groupDrawSpy).toHaveBeenCalledWith(subgroup.canvas, 2, 1)
    })

    test('hiding cascades visibility to children and restores their prior state on show', () => {
        const group = new LayerGroup('g', 32, 16)
        const a = group.addLayer(CanvasLayer, 'a', new Options())
        const b = group.addLayer(CanvasLayer, 'b', new Options({visible: false}))

        expect(a.isVisible()).toBe(true)
        expect(b.isVisible()).toBe(false)

        group.setVisibility(false)
        expect(a.isVisible()).toBe(false)
        expect(b.isVisible()).toBe(false)

        group.setVisibility(true)
        expect(a.isVisible()).toBe(true)
        expect(b.isVisible()).toBe(false) // restored to its own prior state, not forced true
    })

    test('a child added to an already-hidden group starts hidden', () => {
        const group = new LayerGroup('g', 32, 16)
        group.setVisibility(false)

        const child = group.addLayer(CanvasLayer, 'c', new Options({visible: true}))
        expect(child.isVisible()).toBe(false)

        group.setVisibility(true)
        expect(child.isVisible()).toBe(true) // restored to its own configured state
    })

    test('destroy cascades to every child', () => {
        const group = new LayerGroup('g', 32, 16)
        const a = group.addLayer(CanvasLayer, 'a', new Options())
        const b = group.addLayer(CanvasLayer, 'b', new Options())

        const aDestroy = vi.spyOn(a, 'destroy')
        const bDestroy = vi.spyOn(b, 'destroy')

        group.destroy()

        expect(aDestroy).toHaveBeenCalled()
        expect(bDestroy).toHaveBeenCalled()
    })

    test('Dmd.addLayerGroup works at the top level, without a deprecation warning', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const dmd = makeDmd()
        const group = dmd.addLayerGroup('g', new Options())

        expect(group).toBeInstanceOf(LayerGroup)
        expect(dmd.getLayer('g')).toBe(group)
        expect(warnSpy).not.toHaveBeenCalled()
        warnSpy.mockRestore()
    })

    test('deprecated Dmd.addLayer(LayerGroup, ...) still works but warns', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const dmd = makeDmd()
        const group = dmd.addLayer(LayerGroup, 'g', new Options())

        expect(group).toBeInstanceOf(LayerGroup)
        expect(dmd.getLayer('g')).toBe(group)
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('addLayerGroup'))
        warnSpy.mockRestore()
    })

    test('deprecated LayerGroup.addLayer(LayerGroup, ...) still works but warns', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const group = new LayerGroup('g', 32, 16)
        const nested = group.addLayer(LayerGroup, 'nested', new Options({width: 10, height: 10}))

        expect(nested).toBeInstanceOf(LayerGroup)
        expect(group.getLayer('nested')).toBe(nested)
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('addLayerGroup'))
        warnSpy.mockRestore()
    })

    test('non-group layers via addLayer do not warn', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const group = new LayerGroup('g', 32, 16)
        group.addLayer(CanvasLayer, 'leaf', new Options())

        expect(warnSpy).not.toHaveBeenCalled()
        warnSpy.mockRestore()
    })
})
