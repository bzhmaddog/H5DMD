/**
 * Unit + integration tests for sibling-relative alignment constraints
 * (LayerPosition.hAlign/vAlign === 'constraint' + the *To*Of fields):
 *   - resolveLayerPosition() unit tests for all 9 h- and 9 v-constraint fields, against a
 *     plain sortedLayers/layers fixture (no Dmd/LayerGroup needed).
 *   - 'parent' target and unknown-target fallback + console.warn.
 *   - Regression: existing 'left'|'center'|'right'/'top'|'middle'|'bottom' behavior unchanged.
 *   - Integration: Dmd.addLayer and LayerGroup.addLayer resolving a real sibling reference.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {Dmd} from '../src'
import {CanvasLayer, LayerGroup} from '../src/layers'
import {resolveLayerPosition} from '../src/layers/layer-factory'
import type {LayerDictionary} from '../src/layers/layer-factory'
import type {Layer} from '../src/interfaces'
import {ChangeAlphaRenderer, DmdRenderer} from '../src/renderers'
import {Options} from '../src/utils'
import {DotShape} from '../src/enums'

// A fake sibling: only .width/.height are read by resolveLayerPosition/resolveTargetBox.
const fakeLayer = (width: number, height: number) => ({width, height}) as unknown as LayerDictionary[string]

describe('resolveLayerPosition - constraint fields (unit)', () => {

    // A single sibling 'panel' at (left: 10, top: 4), sized 20x8, inside a 100x50 container.
    const sortedLayers: Layer[] = [{id: 'panel', zIndex: 0, top: 4, left: 10}]
    const layers: LayerDictionary = {panel: fakeLayer(20, 8)}
    const CONTAINER_W = 100
    const CONTAINER_H = 50
    const LAYER_W = 6
    const LAYER_H = 3

    const resolve = (position: object) =>
        resolveLayerPosition('me', position, LAYER_W, LAYER_H, CONTAINER_W, CONTAINER_H, sortedLayers, layers)

    test.each([
        ['leftToLeftOf', 10],
        ['leftToRightOf', 30],
        ['leftToCenterOf', 20],
        ['rightToLeftOf', 4],
        ['rightToRightOf', 24],
        ['rightToCenterOf', 14],
        ['hCenterToLeftOf', 7],
        ['hCenterToCenterOf', 17],
        ['hCenterToRightOf', 27],
    ])('hAlign constraint %s resolves left correctly', (field, expected) => {
        const {left} = resolve({hAlign: 'constraint', [field]: 'panel'})
        expect(left).toBe(expected)
    })

    test.each([
        ['topToTopOf', 4],
        ['topToBottomOf', 12],
        ['topToCenterOf', 8],
        ['bottomToTopOf', 1],
        ['bottomToBottomOf', 9],
        ['bottomToCenterOf', 5],
        ['vCenterToTopOf', 2.5],
        ['vCenterToCenterOf', 6.5],
        ['vCenterToBottomOf', 10.5],
    ])('vAlign constraint %s resolves top correctly', (field, expected) => {
        const {top} = resolve({vAlign: 'constraint', [field]: 'panel'})
        expect(top).toBe(expected)
    })

    test('hOffset/vOffset still apply after constraint resolution', () => {
        const {left, top} = resolve({
            hAlign: 'constraint', leftToLeftOf: 'panel', hOffset: 5,
            vAlign: 'constraint', topToTopOf: 'panel', vOffset: 2,
        })
        expect(left).toBe(10 + 5)
        expect(top).toBe(4 + 2)
    })

    test("*CenterToCenterOf: 'parent' matches plain hAlign center / vAlign middle", () => {
        const {left, top} = resolve({
            hAlign: 'constraint', hCenterToCenterOf: 'parent',
            vAlign: 'constraint', vCenterToCenterOf: 'parent',
        })
        expect(left).toBe((CONTAINER_W - LAYER_W) / 2)
        expect(top).toBe((CONTAINER_H - LAYER_H) / 2)
    })

    test("target: 'parent' resolves against the container's own box", () => {
        const {left, top} = resolve({
            hAlign: 'constraint', rightToRightOf: 'parent',
            vAlign: 'constraint', bottomToBottomOf: 'parent',
        })
        expect(left).toBe(CONTAINER_W - LAYER_W)
        expect(top).toBe(CONTAINER_H - LAYER_H)
    })

    test('unknown target id falls back to parent and logs a console warning', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const {left} = resolve({hAlign: 'constraint', leftToLeftOf: 'does-not-exist'})
        expect(left).toBe(0) // parent's left edge
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('does-not-exist'))
        warnSpy.mockRestore()
    })

    test('hAlign/vAlign can reference different siblings independently', () => {
        const otherSiblings: Layer[] = [
            {id: 'panel', zIndex: 0, top: 4, left: 10},
            {id: 'badge', zIndex: 1, top: 20, left: 60},
        ]
        const otherLayers: LayerDictionary = {panel: fakeLayer(20, 8), badge: fakeLayer(5, 5)}
        const {left, top} = resolveLayerPosition('me', {
            hAlign: 'constraint', leftToLeftOf: 'panel',
            vAlign: 'constraint', topToTopOf: 'badge',
        }, LAYER_W, LAYER_H, CONTAINER_W, CONTAINER_H, otherSiblings, otherLayers)
        expect(left).toBe(10) // from 'panel'
        expect(top).toBe(20)  // from 'badge'
    })

    // -----------------------------------------------------------------
    // Regression: existing non-constraint behavior is unaffected
    // -----------------------------------------------------------------

    test('hAlign left/center/right unaffected by the constraint fields being present', () => {
        expect(resolve({hAlign: 'left', hOffset: 3}).left).toBe(3)
        expect(resolve({hAlign: 'center'}).left).toBe((CONTAINER_W - LAYER_W) / 2)
        expect(resolve({hAlign: 'right'}).left).toBe(CONTAINER_W - LAYER_W)
    })

    test('vAlign top/middle/bottom unaffected by the constraint fields being present', () => {
        expect(resolve({vAlign: 'top', vOffset: 2}).top).toBe(2)
        expect(resolve({vAlign: 'middle'}).top).toBe((CONTAINER_H - LAYER_H) / 2)
        expect(resolve({vAlign: 'bottom'}).top).toBe(CONTAINER_H - LAYER_H)
    })

    test('no position at all defaults to {top: 0, left: 0}', () => {
        expect(resolve({})).toEqual({top: 0, left: 0})
    })
})

describe('constraint alignment - Dmd/LayerGroup integration', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(DmdRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.spyOn(ChangeAlphaRenderer.prototype, 'init').mockResolvedValue(undefined)
        vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
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

    test('Dmd: a layer aligns against a previously-added sibling', () => {
        const dmd = makeDmd()
        dmd.addLayer(CanvasLayer, 'panel', new Options({width: 10, height: 5, position: {top: 2, left: 3}}))
        dmd.addLayer(CanvasLayer, 'badge', new Options({
            width: 4, height: 2,
            position: {hAlign: 'constraint', leftToRightOf: 'panel', vAlign: 'constraint', topToTopOf: 'panel'}
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (dmd as any)._sortedLayers.find((l: {id: string}) => l.id === 'badge')
        expect(entry.left).toBe(3 + 10) // panel's left + panel's width
        expect(entry.top).toBe(2)       // panel's top
    })

    test('LayerGroup: a child aligns against a previously-added sibling within the same group', () => {
        const group = new LayerGroup('g', 40, 20)
        group.addLayer(CanvasLayer, 'icon', new Options({width: 8, height: 8, position: {top: 1, left: 1}}))
        const label = group.addLayer(CanvasLayer, 'label', new Options({
            width: 10, height: 8,
            position: {hAlign: 'constraint', leftToRightOf: 'icon', vAlign: 'constraint', topToTopOf: 'icon'}
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = (group as any)._sortedChildren.find((l: {id: string}) => l.id === 'label')
        expect(entry.left).toBe(1 + 8)
        expect(entry.top).toBe(1)
        expect(label).toBeInstanceOf(CanvasLayer)
    })
})
