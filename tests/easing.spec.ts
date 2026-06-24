/**
 * Unit tests for the Easing helpers — pure math, exercised at their boundary
 * points (t = 0 and t = d) where the closed forms are exact.
 */
import {describe, expect, test} from 'vitest'

import {Easing} from '../src/utils'

describe('Easing', () => {

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
})
