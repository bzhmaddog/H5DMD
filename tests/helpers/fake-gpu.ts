/**
 * Shared WebGPU stub helpers used across renderer test suites.
 * Provides a fake GPUDevice and fake navigator.gpu that satisfy every API call
 * made by LayerRenderer subclasses without requiring a real GPU.
 */
import {vi} from 'vitest'

export type FakeMessage = { type: 'error' | 'warning' | 'info'; message: string; lineNum: number }

export const warnMsg  = (): FakeMessage => ({ type: 'warning', message: 'unused variable', lineNum: 1 })
export const errorMsg = (): FakeMessage => ({ type: 'error',   message: 'undefined symbol', lineNum: 2 })

/**
 * Build a fake GPUDevice that satisfies every API call made by LayerRenderer subclasses.
 * @param compilationMessages  Messages returned by getCompilationInfo(). Default: none.
 * @param byteLength           Size of fake mapped buffers in bytes. Default: 64 (4×4 RGBA).
 */
export function makeFakeDevice(compilationMessages: FakeMessage[] = [], byteLength = 64) {
    const makeBuffer = () => ({
        mapState: 'unmapped' as const,
        mapAsync: () => Promise.resolve(),
        getMappedRange: () => new ArrayBuffer(byteLength),
        unmap: vi.fn(),
    })

    return {
        createShaderModule: () => ({
            getCompilationInfo: () => Promise.resolve({ messages: compilationMessages })
        }),
        createBuffer: () => makeBuffer(),
        createBindGroupLayout: () => ({}),
        createBindGroup: () => ({}),
        createComputePipeline: () => ({}),
        createPipelineLayout: () => ({}),
        queue: { writeBuffer: vi.fn(), submit: vi.fn() },
        createCommandEncoder: () => ({
            beginComputePass: () => ({
                setPipeline: vi.fn(),
                setBindGroup: vi.fn(),
                dispatchWorkgroups: vi.fn(),
                end: vi.fn(),
            }),
            copyBufferToBuffer: vi.fn(),
            finish: () => ({}),
        }),
    }
}

/** Build a fake navigator.gpu object that resolves to makeFakeDevice(compilationMessages). */
export const makeFakeGpu = (compilationMessages: FakeMessage[] = []) => ({
    requestAdapter: () => Promise.resolve({
        features: { has: () => false },
        requestDevice: () => Promise.resolve(makeFakeDevice(compilationMessages))
    })
})
