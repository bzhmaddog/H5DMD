/**
 * Unit tests for the Easing helpers — pure math, exercised at their boundary
 * points (t = 0 and t = d) where the closed forms are exact, as well as
 * mid-point behaviour to verify each curve has a distinct shape.
 */
import {describe, expect, test} from 'vitest'

import {Easing} from '../src/utils'

describe('Easing', () => {

    // --- Boundary tests (t = 0 and t = d) ---

    test('easeLinear interpolates proportionally', () => {
        expect(Easing.easeLinear(0, 0, 10, 10)).toBe(0)
        expect(Easing.easeLinear(5, 0, 10, 10)).toBe(5)
        expect(Easing.easeLinear(10, 0, 10, 10)).toBe(10)
        // Non-zero base offset.
        expect(Easing.easeLinear(5, 3, 10, 10)).toBe(8)
    })

    test('easeOutQuad starts at b and reaches b + c', () => {
        expect(Easing.easeOutQuad(0, 0, 10, 10)).toBe(0)
        expect(Easing.easeOutQuad(10, 0, 10, 10)).toBe(10)
    })

    test('easeOutSine starts at b and reaches b + c', () => {
        expect(Easing.easeOutSine(0, 0, 10, 10)).toBeCloseTo(0)
        expect(Easing.easeOutSine(10, 0, 10, 10)).toBeCloseTo(10)
    })

    test('easeInSine starts at b and reaches b + c', () => {
        expect(Easing.easeInSine(0, 0, 10, 10)).toBeCloseTo(0)
        expect(Easing.easeInSine(10, 0, 10, 10)).toBeCloseTo(10)
    })

    // --- Mid-point shape tests ---
    // All curves go from 0 to 1 over duration 1 (b=0, c=1, d=1).
    // At t=0.5 each curve should produce a distinct value.

    test('easeLinear is exactly 0.5 at the midpoint', () => {
        expect(Easing.easeLinear(0.5, 0, 1, 1)).toBeCloseTo(0.5)
    })

    test('easeOutQuad is above 0.5 at the midpoint (starts fast, slows down)', () => {
        const mid = Easing.easeOutQuad(0.5, 0, 1, 1)
        expect(mid).toBeGreaterThan(0.5)
        expect(mid).toBeCloseTo(0.75)
    })

    test('easeOutSine is above 0.5 at the midpoint (starts fast, slows down)', () => {
        const mid = Easing.easeOutSine(0.5, 0, 1, 1)
        expect(mid).toBeGreaterThan(0.5)
        expect(mid).toBeCloseTo(Math.sin(Math.PI / 4)) // ≈ 0.7071
    })

    test('easeInSine is below 0.5 at the midpoint (starts slow, speeds up)', () => {
        const mid = Easing.easeInSine(0.5, 0, 1, 1)
        expect(mid).toBeLessThan(0.5)
        expect(mid).toBeCloseTo(1 - Math.cos(Math.PI / 4)) // ≈ 0.2929
    })

    test('all four easings produce different values at the midpoint', () => {
        const t = 0.5, b = 0, c = 1, d = 1
        const values = [
            Easing.easeLinear(t, b, c, d),
            Easing.easeOutQuad(t, b, c, d),
            Easing.easeOutSine(t, b, c, d),
            Easing.easeInSine(t, b, c, d),
        ]
        // Every pair should differ
        for (let i = 0; i < values.length; i++) {
            for (let j = i + 1; j < values.length; j++) {
                expect(values[i]).not.toBeCloseTo(values[j], 2)
            }
        }
    })

    // --- Monotonicity: values increase over time ---

    test.each([
        ['easeLinear', Easing.easeLinear],
        ['easeOutQuad', Easing.easeOutQuad],
        ['easeOutSine', Easing.easeOutSine],
        ['easeInSine', Easing.easeInSine],
    ])('%s is monotonically increasing from 0 to 1', (_name, fn) => {
        const steps = 20
        let prev = fn(0, 0, 1, 1)
        for (let i = 1; i <= steps; i++) {
            const t = i / steps
            const val = fn(t, 0, 1, 1)
            expect(val).toBeGreaterThanOrEqual(prev)
            prev = val
        }
        expect(prev).toBeCloseTo(1)
    })
})
