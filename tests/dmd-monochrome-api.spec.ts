/**
 * Unit tests for Dmd — monochrome and off-dot color API.
 * These tests use a real (non-mocked) DmdRenderer because all exercised methods
 * operate purely in CPU/JS space and do not require a GPU device.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setupVitestCanvasMock } from 'vitest-canvas-mock'

import { Dmd } from '../src'
import { DotShape } from '../src/enums'

describe('Dmd — monochrome and off-dot color API', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 200

    beforeEach(() => {
        setupVitestCanvasMock()
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    function makeDmd(): Dmd {
        return new Dmd(canvas, {
            dotSize: 5,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 0,
            brightness: 1,
            showFPS: false,
        })
    }

    // ── bgHSP / bgBrightness ────────────────────────────────────────────────

    test('bgHSP is 0 when backgroundBrightness is 0', () => {
        const dmd = makeDmd()
        expect(dmd.bgHSP).toBe(0)
    })

    test('bgBrightness is 0 when backgroundBrightness is 0', () => {
        const dmd = makeDmd()
        expect(dmd.bgBrightness).toBe(0)
    })

    // ── setOffDotColor / offDotColor ────────────────────────────────────────

    test('setOffDotColor updates offDotColor', () => {
        const dmd = makeDmd()
        dmd.setOffDotColor(1, 0, 0)
        expect(dmd.offDotColor.r).toBeCloseTo(1, 2)
        expect(dmd.offDotColor.g).toBeCloseTo(0, 2)
        expect(dmd.offDotColor.b).toBeCloseTo(0, 2)
    })

    test('setOffDotColor updates bgHSP to a non-zero value', () => {
        const dmd = makeDmd()
        dmd.setOffDotColor(1, 1, 1)
        expect(dmd.bgHSP).toBeGreaterThan(0)
    })

    // ── setMonochrome / monochrome ──────────────────────────────────────────

    test('monochrome is false by default', () => {
        expect(makeDmd().monochrome).toBe(false)
    })

    test('setMonochrome enables monochrome mode', () => {
        const dmd = makeDmd()
        dmd.setMonochrome(true)
        expect(dmd.monochrome).toBe(true)
    })

    // ── setMonochromeColor / monochromeColor ────────────────────────────────

    test('setMonochromeColor stores the tint color', () => {
        const dmd = makeDmd()
        dmd.setMonochromeColor(1, 0.5, 0)
        const c = dmd.monochromeColor
        expect(c.r).toBeCloseTo(1, 5)
        expect(c.g).toBeCloseTo(0.5, 5)
        expect(c.b).toBeCloseTo(0, 5)
    })

    // ── setMonoLevels / monoLevels ──────────────────────────────────────────

    test('setMonoLevels updates monoLevels', () => {
        const dmd = makeDmd()
        dmd.setMonoLevels(8)
        expect(dmd.monoLevels).toBe(8)
    })

    // ── DmdOptions constructor paths ────────────────────────────────────────

    test('DmdOptions with RgbColor enables monochrome and sets tint', () => {
        const dmd = new Dmd(canvas, {
            dotSize: 5,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 0,
            brightness: 1,
            showFPS: false,
            color: { r: 1, g: 0.5, b: 0 },
        })
        expect(dmd.monochrome).toBe(true)
        expect(dmd.monochromeColor.r).toBeCloseTo(1, 5)
    })

    test('DmdOptions with hex color string enables monochrome', () => {
        const dmd = new Dmd(canvas, {
            dotSize: 5,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 0,
            brightness: 1,
            showFPS: false,
            color: '#FF8000',
        })
        expect(dmd.monochrome).toBe(true)
    })

    test('DmdOptions with monoLevels sets the level', () => {
        const dmd = new Dmd(canvas, {
            dotSize: 5,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 0,
            brightness: 1,
            showFPS: false,
            monoLevels: 4,
        })
        expect(dmd.monoLevels).toBe(4)
    })

    test('DmdOptions with offDotColor as RgbColor sets the off-dot color', () => {
        const dmd = new Dmd(canvas, {
            dotSize: 5,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 0,
            brightness: 1,
            showFPS: false,
            offDotColor: { r: 0.5, g: 0, b: 0 },
        })
        expect(dmd.offDotColor.r).toBeGreaterThan(0.49)
        expect(dmd.offDotColor.r).toBeLessThan(0.51)
    })

    test('DmdOptions with offDotColor as hex string sets the off-dot color', () => {
        const dmd = new Dmd(canvas, {
            dotSize: 5,
            dotSpace: 1,
            dotShape: DotShape.Square,
            backgroundBrightness: 0,
            brightness: 1,
            showFPS: false,
            offDotColor: '#FF0000',
        })
        expect(dmd.offDotColor.r).toBeCloseTo(1, 2)
    })
})
