import {Renderer} from "./renderer";
import {Options} from "../utils";

export abstract class LayerRenderer extends Renderer {
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

    renderFrame: (frameData: ImageData, options?: Options) => Promise<ImageData>;

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
     * Does nothing except returning passed data (placeholder until init is done)
     * @param {ImageData} frameData
     * @returns {Promise<ImageData>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _doNothing(frameData: ImageData): Promise<ImageData> {
        return new Promise((resolve) => {
            resolve(frameData);
        })
    }
}