import {Renderer} from "../src/renderers/Renderer"

class MockRenderer extends Renderer {

    renderFrame: (frameData: ImageData) => Promise<ImageData>


    /**
     * @param {number} width
     * @param {number} height
     */

    constructor() {
        super("MockRenderer")
    }

    init(): Promise<void> {

        return new Promise(resolve => {
            console.log("Mocked init done")
            this.renderFrame = this._doRendering
            resolve()
        })

    }

    /**
     * This renderer serve as a template for other renderers. It does nothing but returning the exact array of pixels it was provided
     * @param {ImageData} frameData
     * @returns {Promise<ImageData>}
     */
    private _doRendering(frameData: ImageData): Promise<ImageData> {
        return new Promise(resolve => {
            console.log("Mocked rendering done")
            resolve(frameData)
        })
    }

}

export {MockRenderer}