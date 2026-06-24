/**
 * REGRESSION TEST — formerly critical bug C2 (fixed)
 *
 * `Renderer.init()` (exercised here via `DmdRenderer`) used to wire no error
 * path: there was no `.catch` and the outer `resolve` was only called on the
 * happy path. When `requestAdapter()` resolved to `null` (no compatible GPU
 * adapter) `adapter.requestDevice()` threw inside a `.then` callback, the outer
 * promise was never settled, and `await dmd.init()` hung forever.
 *
 * The fix guards against a missing `navigator.gpu` and a null adapter, and adds
 * `.catch(reject)` so failures surface. These tests verify `init()` now REJECTS
 * (promptly) instead of hanging.
 */
import {afterEach, describe, expect, test} from 'vitest'

import {DmdRenderer} from '../../src/renderers'
import {DotShape} from '../../src/enums'

describe('C2 — WebGPU init rejects instead of hanging', () => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = globalThis.navigator as any
    const originalGpu = nav.gpu

    afterEach(() => {
        nav.gpu = originalGpu
    })

    test('init() rejects when no GPU adapter is available', async () => {
        // Browser exposes WebGPU but cannot provide an adapter.
        nav.gpu = {
            requestAdapter: () => Promise.resolve(null)
        }

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        await expect(renderer.init()).rejects.toThrow(/no compatible GPU adapter/)
    })

    test('init() rejects when WebGPU is not supported at all', async () => {
        // Simulate an environment without WebGPU.
        nav.gpu = undefined

        const renderer = new DmdRenderer(4, 4, 8, 8, 2, 0, DotShape.Square, 14, 1)

        await expect(renderer.init()).rejects.toThrow(/WebGPU is not available/)
    })

    test('init() settles promptly rather than hanging', async () => {
        nav.gpu = {
            requestAdapter: () => Promise.resolve(null)
        }

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
