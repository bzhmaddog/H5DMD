/**
 * Extended coverage for BaseLayer:
 *   - constructor renderer options (string IDs, active/inactive RendererEntry)
 *   - addRenderer / removeRenderer / deactivateRenderer / activateRenderer / isRendererActive
 *   - _layerLoaded startRenderingLoop path
 *   - _getRendererInstance error throw
 *   - _logDebug / _logWarning / _logError helpers
 *   - _layerUpdated updatedListener callback
 *   - setVisibility with active renderers (start loop)
 *   - fadeIn / fadeOut RAF step continuation
 *   - renderer init failure catch in constructor
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {CanvasLayer} from '../src/layers'
import {ChangeAlphaRenderer, ChromaKeyRenderer} from '../src/renderers'
import {rendererEntry} from '../src/interfaces'
import {Options} from '../src/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const priv = (layer: CanvasLayer): any => layer as any

const makeBitmap = () => {
    const c = document.createElement('canvas')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(c as any).close = vi.fn()
    return c as unknown as ImageBitmap
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

const stdBeforeEach = () => {
    setupVitestCanvasMock()
    vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    vi.stubGlobal('createImageBitmap', () => Promise.resolve(makeBitmap()))
}

const stdAfterEach = () => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
}

// ---------------------------------------------------------------------------
// Constructor — renderer options
// ---------------------------------------------------------------------------

describe('BaseLayer constructor — RendererEntry in options.renderers', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('RendererInstanceEntry (active by default) adds renderer to queue', async () => {
        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [{ id: 'r', instance }]
        }))
        // Queue is built after init resolves — flush the microtask chain
        await Promise.resolve()
        await Promise.resolve()
        expect(priv(layer)._defaultRenderQueue.some((q: {id: string}) => q.id === 'r')).toBe(true)
    })

    test('RendererClassEntry instantiates with layer dimensions and adds to queue', async () => {
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [{ id: 'r', rendererClass: ChangeAlphaRenderer }]
        }))
        expect(priv(layer)._availableRenderers['r']).toBeInstanceOf(ChangeAlphaRenderer)
        // Queue is built after init resolves — flush the microtask chain
        await Promise.resolve()
        await Promise.resolve()
        expect(priv(layer)._defaultRenderQueue.some((q: {id: string}) => q.id === 'r')).toBe(true)
    })

    test('RendererClassEntry params are forwarded to the renderer constructor', () => {
        // Verifies that params reach the renderer — if the field name were wrong
        // the renderer would silently fall back to its defaults.
        vi.spyOn(ChromaKeyRenderer.prototype, 'init').mockResolvedValue(undefined)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [rendererEntry('chroma', ChromaKeyRenderer, { color: [10, 20, 30], threshold: 7 })]
        }))
        const renderer = priv(layer)._availableRenderers['chroma']
        expect(renderer._keyR).toBe(10)
        expect(renderer._keyG).toBe(20)
        expect(renderer._keyB).toBe(30)
        expect(renderer._threshold).toBe(7)
    })

    test('inactive RendererEntry registers renderer but does not queue it', () => {
        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [{ id: 'r', instance, active: false }]
        }))
        expect(priv(layer)._availableRenderers['r']).toBe(instance)
        expect(priv(layer)._defaultRenderQueue.some((q: {id: string}) => q.id === 'r')).toBe(false)
    })
})

describe('BaseLayer constructor — renderer init failure', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('init failure is caught and logged (does not crash the layer)', async () => {
        // Mock ALL init calls to reject so the opacity renderer and RendererEntry
        // renderer both reject, triggering allSettled per-renderer error logging
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockRejectedValue(new Error('GPU gone'))
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const instance = new ChangeAlphaRenderer(4, 4)
        new CanvasLayer('c', 4, 4, new Options({ renderers: [{ id: 'r', instance }] }))

        await vi.waitFor(() => {
            expect(errSpy).toHaveBeenCalledWith(
                expect.stringContaining('init failed'),
                expect.any(Error)
            )
        })
    })
})

// ---------------------------------------------------------------------------
// addRenderer
// ---------------------------------------------------------------------------

describe('BaseLayer.addRenderer', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('adds renderer to available renderers and queue (active by default)', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer)

        expect(priv(layer)._availableRenderers['r']).toBeInstanceOf(ChangeAlphaRenderer)
        expect(layer.isRendererActive('r')).toBe(true)
    })

    test('throws when the same id is registered twice', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer)

        await expect(layer.addRenderer('r', ChangeAlphaRenderer))
            .rejects.toThrow(/already exists in the list of available renderers/)
    })

    test('active:false registers but does not activate the renderer', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer, undefined, false)

        expect(priv(layer)._availableRenderers['r']).toBeInstanceOf(ChangeAlphaRenderer)
        expect(layer.isRendererActive('r')).toBe(false)
    })

    test('starts rendering loop when active and layer is visible', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer)

        expect(raf).toHaveBeenCalled()
    })

    test('does not start rendering loop when layer is hidden', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const layer = new CanvasLayer('c', 4, 4, new Options({ visible: false }))
        raf.mockClear()

        await layer.addRenderer('r', ChangeAlphaRenderer)

        expect(raf).not.toHaveBeenCalled()
    })

    test('rolls back registration when init() rejects', async () => {
        // Create the layer first so the opacity renderer's init() uses the resolved mock.
        // Then override the mock for the next call (inside addRenderer).
        const layer = new CanvasLayer('c', 4, 4)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockRejectedValueOnce(new Error('fail'))

        await expect(layer.addRenderer('r', ChangeAlphaRenderer)).rejects.toThrow('fail')
        expect(priv(layer)._availableRenderers['r']).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// removeRenderer
// ---------------------------------------------------------------------------

describe('BaseLayer.removeRenderer', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('removes renderer from available map and default queue', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer)

        layer.removeRenderer('r')

        expect(priv(layer)._availableRenderers['r']).toBeUndefined()
        expect(priv(layer)._defaultRenderQueue.some((q: {id: string}) => q.id === 'r')).toBe(false)
    })

    test('is a no-op for an unknown id', () => {
        const layer = new CanvasLayer('c', 4, 4)
        expect(() => layer.removeRenderer('ghost')).not.toThrow()
    })
})

// ---------------------------------------------------------------------------
// deactivateRenderer / activateRenderer / isRendererActive
// ---------------------------------------------------------------------------

describe('BaseLayer.deactivateRenderer / activateRenderer / isRendererActive', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('deactivateRenderer marks renderer inactive', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer)

        layer.deactivateRenderer('r')

        expect(layer.isRendererActive('r')).toBe(false)
    })

    test('deactivateRenderer is a no-op for unknown id', () => {
        const layer = new CanvasLayer('c', 4, 4)
        expect(() => layer.deactivateRenderer('ghost')).not.toThrow()
    })

    test('activateRenderer reactivates a deactivated renderer', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer)
        layer.deactivateRenderer('r')

        layer.activateRenderer('r')

        expect(layer.isRendererActive('r')).toBe(true)
    })

    test('activateRenderer appends a renderer registered with active:false', async () => {
        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer, undefined, false)
        expect(layer.isRendererActive('r')).toBe(false)

        layer.activateRenderer('r')

        expect(layer.isRendererActive('r')).toBe(true)
    })

    test('activateRenderer pushes to queue when renderer was never in the queue (options RendererEntry active:false)', () => {
        // active:false RendererEntry registers in _availableRenderers but skips _defaultRenderQueue
        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [{ id: 'r', instance, active: false }]
        }))
        expect(layer.isRendererActive('r')).toBe(false)

        layer.activateRenderer('r')

        expect(layer.isRendererActive('r')).toBe(true)
    })

    test('activateRenderer throws when renderer is not registered', () => {
        const layer = new CanvasLayer('c', 4, 4)
        expect(() => layer.activateRenderer('ghost')).toThrow(/is not registered/)
    })

    test('activateRenderer triggers rendering loop when layer is visible', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const layer = new CanvasLayer('c', 4, 4)
        await layer.addRenderer('r', ChangeAlphaRenderer, undefined, false)
        raf.mockClear()

        layer.activateRenderer('r')

        expect(raf).toHaveBeenCalled()
    })

    test('activateRenderer does not start loop when layer is hidden', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const layer = new CanvasLayer('c', 4, 4, new Options({ visible: false }))
        await layer.addRenderer('r', ChangeAlphaRenderer, undefined, false)
        raf.mockClear()

        layer.activateRenderer('r')

        expect(raf).not.toHaveBeenCalled()
    })

    test('isRendererActive returns false for unknown id', () => {
        const layer = new CanvasLayer('c', 4, 4)
        expect(layer.isRendererActive('ghost')).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// Protected helpers
// ---------------------------------------------------------------------------

describe('BaseLayer protected helpers', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('_getRendererInstance throws for an unregistered id', () => {
        const layer = new CanvasLayer('c', 4, 4)
        expect(() => priv(layer)._getRendererInstance('ghost'))
            .toThrow('This renderer is not available')
    })

    test('_getRendererInstance returns instance for a registered id', () => {
        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [{ id: 'r', instance, active: false }]
        }))
        expect(priv(layer)._getRendererInstance('r')).toBe(instance)
    })

    test('_logDebug calls console.log', () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        const layer = new CanvasLayer('c', 4, 4)
        priv(layer)._logDebug('hello')
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello'))
    })

    test('_logWarning calls console.warn', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const layer = new CanvasLayer('c', 4, 4)
        priv(layer)._logWarning('oops')
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('oops'))
    })

    test('_logError calls console.error', () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const layer = new CanvasLayer('c', 4, 4)
        priv(layer)._logError('bad')
        expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('bad'))
    })

    test('_layerUpdated fires the updatedListener callback', () => {
        const cb = vi.fn()
        // Give the layer a renderer so haveRenderer()=true and _renderFrame is NOT called
        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4,
            new Options({ renderers: [{ id: 'r', instance }] }),
            { updated: cb }
        )
        priv(layer)._layerUpdated()
        expect(cb).toHaveBeenCalledWith(layer)
    })
})

// ---------------------------------------------------------------------------
// _layerLoaded startRenderingLoop
// ---------------------------------------------------------------------------

describe('BaseLayer._layerLoaded', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('starts the rendering loop when layer has active renderers', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            renderers: [{ id: 'r', instance }]   // active: true
        }))
        raf.mockClear()

        priv(layer)._layerLoaded()

        // The queue is populated after init resolves; the loop starts then
        await Promise.resolve()
        await Promise.resolve()

        expect(raf).toHaveBeenCalled()
    })

    test('starts the rendering loop when startRenderingLoop=true even without renderers', () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const layer = new CanvasLayer('c', 4, 4)
        raf.mockClear()

        priv(layer)._layerLoaded(true)

        expect(raf).toHaveBeenCalled()
    })

    test('calls the loadedListener when one is provided', async () => {
        const cb = vi.fn()
        const layer = new CanvasLayer('c', 4, 4, undefined, { loaded: cb })
        // Flush renderer init microtasks so _renderersReady = true before _layerLoaded
        await Promise.resolve()
        await Promise.resolve()
        priv(layer)._layerLoaded()
        expect(cb).toHaveBeenCalledWith(layer)
    })
})

// ---------------------------------------------------------------------------
// setVisibility with active renderers
// ---------------------------------------------------------------------------

describe('BaseLayer.setVisibility with active renderers', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('starting rendering loop when layer becomes visible and has renderers', async () => {
        const raf = vi.fn(() => 0)
        vi.stubGlobal('requestAnimationFrame', raf)

        const instance = new ChangeAlphaRenderer(4, 4)
        const layer = new CanvasLayer('c', 4, 4, new Options({
            visible: true,
            renderers: [{ id: 'r', instance }]
        }))

        // Wait for init so the queue is populated before we test visibility changes
        await Promise.resolve()
        await Promise.resolve()

        layer.setVisibility(false)
        raf.mockClear()

        layer.setVisibility(true)

        expect(raf).toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// fadeIn / fadeOut — RAF step continuation (line 458)
// ---------------------------------------------------------------------------

describe('BaseLayer.fadeIn / fadeOut RAF continuation', () => {

    beforeEach(stdBeforeEach)
    afterEach(stdAfterEach)

    test('fadeIn invokes requestAnimationFrame when the step does not complete immediately', async () => {
        // Advance time by 50ms per performance.now() call so the first step is
        // mid-fade (50 < 100ms duration) and the second step finishes it.
        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (t += 50))

        let calls = 0
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            if (++calls <= 1) cb(0)   // invoke once to let the second step run
            return 0
        })

        const layer = new CanvasLayer('c', 4, 4)
        layer.setOpacity(0)
        await layer.fadeIn(100)

        expect(calls).toBeGreaterThanOrEqual(1)
        expect(layer.opacity).toBe(1)
    })

    test('fadeOut invokes requestAnimationFrame when the step does not complete immediately', async () => {
        let t = 0
        vi.spyOn(window.performance, 'now').mockImplementation(() => (t += 50))

        let calls = 0
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            if (++calls <= 1) cb(0)
            return 0
        })

        const layer = new CanvasLayer('c', 4, 4)
        layer.setOpacity(1)
        await layer.fadeOut(100)

        expect(calls).toBeGreaterThanOrEqual(1)
        expect(layer.opacity).toBe(0)
    })
})
