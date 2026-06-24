/**
 * Unit tests for DmdRenderer:
 *   - init() rejects (promptly) when WebGPU or a GPU adapter is unavailable.
 *   - the brightness constructor argument is honoured even when the background
 *     brightness argument is omitted.
 *   - _int2Hex clamps to a single byte so it always yields two hex digits.
 */
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {setupVitestCanvasMock} from 'vitest-canvas-mock'

import {DmdRenderer} from '../src/renderers'
import {DotShape} from '../src/enums'

describe('DmdRenderer.init — WebGPU availability', () => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = globalThis.navigator as any
    const originalGpu = nav.gpu

    afterEach(() => {
        nav.gpu = originalGpu
    })

    test('rejects when no GPU adapter is available', async () => {
        nav.gpu = {requestAdapter: () => Promise.resolve(null)}

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        await expect(renderer.init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('rejects when WebGPU is not supported at all', async () => {
        nav.gpu = undefined

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        await expect(renderer.init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('settles promptly rather than hanging', async () => {
        nav.gpu = {requestAdapter: () => Promise.resolve(null)}

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        let settled = false
        const init = renderer.init().catch(() => { /* expected */ }).finally(() => { settled = true })

        await Promise.race([
            init,
            new Promise(resolve => setTimeout(resolve, 50))
        ])

        expect(settled).toBe(true)
    })
})

describe('DmdRenderer — brightness and colour helpers', () => {

    beforeEach(() => {
        setupVitestCanvasMock()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('honours the brightness argument when background brightness is omitted', () => {
        const renderer = new DmdRenderer(
            32, 8, 64, 16, 1, 0, DotShape.Square,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            undefined as any,
            0.5
        )
        expect(renderer.brightness).toBe(0.5)
    })

    test('_int2Hex clamps to a single byte (always two hex digits)', () => {
        const renderer = new DmdRenderer(32, 8, 64, 16, 1, 0, DotShape.Square, 0.5, 0.5)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const int2Hex = (n: number) => (renderer as any)._int2Hex(n) as string

        expect(int2Hex(256)).toBe('ff')
        expect(int2Hex(300)).toBe('ff')
        expect(int2Hex(-5)).toBe('00')
        expect(int2Hex(255)).toBe('ff')
        expect(int2Hex(1)).toBe('01')
    })
})
