import {Renderer} from "./renderer";

export abstract class LayerRenderer<O = never> extends Renderer {
    protected _width: number;
    protected _height: number;
    protected _bufferByteLength: number;
    private _outputBuffers: [GPUBuffer, GPUBuffer];
    private _activeOutputIndex: number;

    constructor(name: string, width: number, height: number) {
        super(name);
        this._width = width;
        this._height = height;
        this._bufferByteLength = width * height * 4;
        this._activeOutputIndex = 0;
        this.renderFrame = this._doNothing;
    }

    abstract init(): Promise<void>;

    renderFrame: (frameData: ImageData, options?: O extends never ? never : O) => Promise<ImageData>;

    /**
     * Create the double-buffered output buffers. Must be called in _createResources()
     * after the device is available.
     */
    protected _createOutputBuffers() {
        this._outputBuffers = [
            this._device.createBuffer({
                size: this._bufferByteLength,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            }),
            this._device.createBuffer({
                size: this._bufferByteLength,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            })
        ];
    }

    /**
     * Submit GPU work and read back the result using double-buffered output.
     * Returns null if the current output buffer is still mapped (caller should
     * return the unmodified frameData in that case).
     *
     * Usage in _doRendering:
     *   const result = this._submitAndReadback(tempBuffer, commandEncoder);
     *   if (!result) return Promise.resolve(frameData);
     *   return result;
     *
     * @param {GPUBuffer} tempBuffer the storage buffer the compute shader wrote to
     * @param {GPUCommandEncoder} commandEncoder the encoder with the compute pass already ended
     * @returns {Promise<ImageData> | null} null if the buffer is busy
     */
    protected _submitAndReadback(
        tempBuffer: GPUBuffer,
        commandEncoder: GPUCommandEncoder
    ): Promise<ImageData> | null {
        const outputBuffer = this._outputBuffers[this._activeOutputIndex];

        if (outputBuffer.mapState !== 'unmapped') {
            return null;
        }

        this._activeOutputIndex = 1 - this._activeOutputIndex;

        commandEncoder.copyBufferToBuffer(tempBuffer, 0, outputBuffer, 0, this._bufferByteLength);
        this._device.queue.submit([commandEncoder.finish()]);

        return outputBuffer.mapAsync(GPUMapMode.READ).then(() => {
            const pixelsBuffer = new Uint8Array(outputBuffer.getMappedRange());
            const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), this._width, this._height);
            outputBuffer.unmap();
            return imageData;
        });
    }

    /**
     * Validate the compiled shader module and reject if there are any errors.
     * Warnings are logged but do not prevent initialisation.
     *
     * Call this inside init() immediately after createShaderModule(), before
     * _createResources() and resolve().  Returns a Promise that resolves when
     * the check is done (the caller should chain .then(() => { _createResources(); resolve() })).
     *
     * @param reject the reject callback from the surrounding Promise constructor
     * @returns Promise<boolean> — true if the shader is valid, false if it was rejected
     */
    protected async _validateShader(reject: (reason: Error) => void): Promise<boolean> {
        const info = await this._shaderModule.getCompilationInfo?.()
        if (!info) return true

        const errors = info.messages.filter((m: GPUCompilationMessage) => m.type === 'error')
        if (errors.length > 0) {
            const details = errors.map((e: GPUCompilationMessage) =>
                `line ${e.lineNum}: ${e.message}`
            ).join('\n')
            reject(new Error(`${this.name}: shader compilation failed\n${details}`))
            return false
        }

        const warnings = info.messages.filter((m: GPUCompilationMessage) => m.type === 'warning' || m.type === 'info')
        if (warnings.length > 0) {
            console.warn(`${this.name}: shader compilation warnings`, warnings)
        }
        return true
    }

    /* @param {ImageData} frameData
     * @returns {Promise<ImageData>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _doNothing(frameData: ImageData): Promise<ImageData> {
        return new Promise((resolve) => {
            resolve(frameData);
        })
    }
}