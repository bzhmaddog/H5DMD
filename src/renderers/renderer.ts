export abstract class Renderer {
    protected _device: GPUDevice
    protected _shaderModule: GPUShaderModule

    private static _sharedAdapter: GPUAdapter | null = null
    private static _sharedDevice: GPUDevice | null = null

    private readonly _name: string
    protected _initDone: boolean

    protected constructor(name: string) {
        this._name = name
        this._initDone = false
    }

    /**
     * Returns a shared GPUDevice, initialising it on the first call.
     * All renderers share the same adapter and device to avoid exhausting
     * browser GPU resource limits.
     * The device is requested with `timestamp-query` enabled if the adapter
     * supports it, so profiling-capable renderers (e.g. DmdRenderer) can use
     * that feature without a separate device request.
     */
    static async requestSharedDevice(): Promise<GPUDevice> {
        if (typeof navigator === 'undefined' || !navigator.gpu) {
            throw new Error('WebGPU is not available in this environment (navigator.gpu is undefined)')
        }

        if (Renderer._sharedDevice) {
            return Renderer._sharedDevice
        }

        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
            throw new Error('no compatible GPU adapter found (requestAdapter() returned null)')
        }

        Renderer._sharedAdapter = adapter

        const features: GPUFeatureName[] = []
        if (adapter.features?.has('timestamp-query')) {
            features.push('timestamp-query')
        }

        const device = await adapter.requestDevice({ requiredFeatures: features })
        Renderer._sharedDevice = device
        return device
    }

    /** Clear the cached adapter and device. Call this during cleanup or in tests. */
    static releaseSharedDevice(): void {
        Renderer._sharedDevice = null
        Renderer._sharedAdapter = null
    }

    abstract init(): Promise<void>

    abstract renderFrame(frameData: ImageData, options?: unknown): Promise<ImageData | void>

    get name(): string {
        return this._name
    }
}
