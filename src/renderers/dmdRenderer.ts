import {Renderer} from "./renderer"
import {DotShape} from "../enums";

class DmdRenderer extends Renderer {

    private _dmdWidth: number
    private _dmdHeight: number
    private _screenWidth: number
    private _screenHeight: number
	private _dotSpace: number
	private _pixelSize: number
	private _dotShape: DotShape
    private _dmdBufferByteLength: number
    private _screenBufferByteLength: number
    private _bgBrightness: number
    private _bgColor: number
    private _brightness: number
    private _bgHSP: number
    
    renderFrame: (frameData: ImageData) => Promise<ImageData>


    /**
     * 
     * @param {number} dmdWidth 
     * @param {number} dmdHeight 
     * @param {number} screenWidth 
     * @param {number} screenHeight 
     * @param {number} pixelSize
     * @param {number} dotSpace 
     * @param {*} dotShape 
     * @param {number} bgBrightness 
     * @param {number} brightness
     */
    constructor(
        dmdWidth: number,
        dmdHeight: number,
        screenWidth: number,
        screenHeight: number,
        pixelSize: number,
        dotSpace: number,
        dotShape: DotShape,
        bgBrightness: number,
        brightness: number
    ) {
        super("DmdRenderer")

        this._dmdWidth = dmdWidth
        this._dmdHeight = dmdHeight
        this._screenWidth = screenWidth
		this._screenHeight = screenHeight
        this._pixelSize = pixelSize
        this._dotSpace = dotSpace
        this._dotShape = dotShape
        this._dmdBufferByteLength = dmdWidth*dmdHeight * 4
        this._screenBufferByteLength = screenWidth * screenHeight * 4
        this.renderFrame = this._doNothing


        this._bgBrightness = 14
        this._bgColor = 4279176975
        this._brightness = 1

        if (typeof bgBrightness === 'number') {
                this._bgBrightness = bgBrightness
                this._bgColor = parseInt("FF" + this._int2Hex(bgBrightness) + this._int2Hex(bgBrightness) + this._int2Hex(bgBrightness), 16)
        }

        if (typeof bgBrightness === 'number') {
            this.setBrightness(brightness)
        }

        const bgp2 = this._bgBrightness * this._bgBrightness

        this._bgHSP = Math.sqrt(0.299 * bgp2 + 0.587 * bgp2 + 0.114 * bgp2)
    }

    private _int2Hex(n: number): string {
        let hex = n.toString(16)

        if (hex.length < 2) {
            hex = "0" + hex
        }
        
        return hex
    }

    init(): Promise<void> {

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                this._adapter = adapter

                adapter.requestDevice().then( device => {
                    this._device = device

                    this._shaderModule = device.createShaderModule({
                        code: `
                            struct UBO {
                                brightness: f32
                            }

                            struct Image {
                                rgba: array<u32>
                            }

                            fn f2i(f: f32) -> u32 {
                                return u32(ceil(f));
                            }

                            fn u2f(u: u32) -> f32 {
                                return f32(u);
                            }

                            @group(0) @binding(0) var<storage,read> inputPixels: Image;
                            @group(0) @binding(1) var<storage,read_write> outputPixels: Image;
                            @group(0) @binding(2) var<uniform> uniforms : UBO;

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                                var bgBrightness : u32 = ${this._bgBrightness}u;
                                var index : u32 = global_id.x + global_id.y *  ${this._dmdWidth}u;
                                var pixel : u32 = inputPixels.rgba[index];
                                var brightness : f32 = uniforms.brightness;
                                var br = 0u;
                                var bg = 0u;
                                var bb = 0u;
                                
                                let a : u32 = (pixel >> 24u) & 255u;
                                let b : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let r : u32 = (pixel & 255u);

                                // If component is above darkest color then apply brightness limiter
                                if (r >= bgBrightness) {
                                    br = bgBrightness + f2i(f32(r - bgBrightness) * brightness);
                                }

                                // If component is above darkest color then apply brightness limiter
                                if (g >= bgBrightness) {
                                    bg = bgBrightness + f2i(f32(g - bgBrightness) * brightness);
                                }

                                // If component is above darkest color then apply brightness limiter
                                if (b >= bgBrightness) {
                                    bb = bgBrightness + f2i(f32(b - bgBrightness) * brightness);
                                }

                                // Recreate pixel color but force alpha to 255
                                pixel = (255u << 24u) | (bb << 16u) | (bg << 8u) | br;

                                var t : u32 = r + g + b;
                                var hsp : f32 =  sqrt(.299f * u2f(r) * u2f(r) + .587f * u2f(g) * u2f(g) + .114 * u2f(b) * u2f(b));
                
                                // Pixels that are too dark will be hacked to give the 'off' dot look of the DMD
                                //if (t < bgBrightness*3u) {
                                if (hsp - 8f < ${this._bgHSP}f) {
                                    pixel = ${this._bgColor}u;
                                    //pixel = 4294901760u;
                                }
                
                                // First byte index of the output dot
                                var resizedPixelIndex : u32 = (global_id.x * ${this._pixelSize}u)  + (global_id.x * ${this._dotSpace}u) + (global_id.y * ${this._screenWidth}u * (${this._pixelSize}u + ${this._dotSpace}u));
                
                                for ( var row: u32 = 0u ; row < ${this._pixelSize}u; row = row + 1u ) {
                                    for ( var col: u32 = 0u ; col < ${this._pixelSize}u; col = col + 1u ) {
                                        outputPixels.rgba[resizedPixelIndex] = pixel;
                                        resizedPixelIndex = resizedPixelIndex + 1u;
                                    }
                                    resizedPixelIndex = resizedPixelIndex + ${this._screenWidth}u - ${this._pixelSize}u;
                                }
                            }
                        `
                    })

                    console.log("GPURenderer:init()")

                    this._shaderModule.getCompilationInfo()?.then(i=>{
                        if (i.messages.length > 0 ) {
                            console.warn('GPURenderer:compilationInfo()', i.messages)
                        }
                    })

                    this.renderFrame = this._doRendering
                    resolve()
                })
            })
       })
    
    }

    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {ImageData} frameData
     * @returns 
     */
     private _doNothing(frameData: ImageData): Promise<ImageData> {
        console.log("Init not done cannot apply filter")
        return new Promise(resolve =>{
            resolve(frameData)
        })
    }

    /**
     * Render a Dmd frame
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    private _doRendering(frameData: ImageData): Promise<ImageData> {

        const UBOBuffer = this._device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        const gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._dmdBufferByteLength,
            usage: GPUBufferUsage.STORAGE
        })
    
        const gpuTempBuffer = this._device.createBuffer({
            size: this._screenBufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        })
    
        const gpuOutputBuffer = this._device.createBuffer({
            size: this._screenBufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        })
    
        const bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                } as GPUBindGroupLayoutEntry,
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                } as GPUBindGroupLayoutEntry,
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                      type: "uniform",
                    }
                } as GPUBindGroupLayoutEntry
            ]
        })
    
        const bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                },
                {
                    binding: 2, 
                    resource: {
                      buffer: UBOBuffer
                    }
                }
            ]
        })

        const computePipeline =this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        })

        return new Promise( resolve => {

            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data))
            gpuInputBuffer.unmap()

            // Write values to uniform buffer object
            const uniformData = [this._brightness]
            const uniformTypedArray = new Float32Array(uniformData)
            this._device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer)

            const commandEncoder = this._device.createCommandEncoder()
            const passEncoder = commandEncoder.beginComputePass()
            passEncoder.setPipeline(computePipeline)
            passEncoder.setBindGroup(0, bindGroup)
            passEncoder.dispatchWorkgroups(this._dmdWidth, this._dmdHeight)
            passEncoder.end()

            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, this._screenBufferByteLength)

            this._device.queue.submit([commandEncoder.finish()])

            // Render Dmd output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange())
    
                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), this._screenWidth, this._screenHeight)

               // console.log(imageData)
    
                // return to caller
                resolve(imageData)
            })
        })
	}

    /**
	 * Set brightness of the dots between 0 and 1 (does not affect the background color)
     * @param {float} b 
     */
    setBrightness(b: number) {
        const brightness = Math.max(0, Math.min(b, 1)) // normalize
        this._brightness = Math.round(brightness * 1e3) / 1e3 // round to 1 digit after dot
    }

    get brightness() {
        return this._brightness
    }

}

export {DmdRenderer}