/**
 * Provide a simple class to build a buffer for our layers and our Dmd
 */
class OffscreenBuffer {
	private _canvas: HTMLCanvasElement
	private _context: CanvasRenderingContext2D

	/**
	* @param width {number} The width of the buffer
	* @param height {number} The height of the buffer
	*/
	constructor(width: number, height: number, willReadFrequently: boolean = true) {
		this._canvas = document.createElement('canvas') // Offscreen canvas
		this._canvas.width = width
		this._canvas.height = height

        let options: CanvasRenderingContext2DSettings | undefined

		if (willReadFrequently) {
			//console.log("Buffer() : Settings willReadyFrequently to true")
			options = { willReadFrequently : true }
		}


		const context = this._canvas.getContext('2d', options)

		if (context === null) {
			throw new Error('OffscreenBuffer: unable to acquire a 2D rendering context')
		}

		this._context = context
	}

	get context() {
		return this._context
	}

	get canvas() {
		return this._canvas
	}

	get width() {
		return this._canvas.width
	}

	get height() {
		return this._canvas.height
	}

	set width(width) {
		this._canvas.width = width
	}

	set height(height) {
		this._canvas.height = height
	}

	clear() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
	}
}

export { OffscreenBuffer }