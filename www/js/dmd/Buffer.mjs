/**
 * Provide a simple class to build a buffer for our layers and our DMD
 * @param width {integer} The width of the buffer
 * @param height {integer} The height of the buffer
 */
class Buffer {
	#canvas;
	#context;

	constructor(width, height) {
		this.#canvas = document.createElement('canvas');
		this.#canvas.width = width;
		this.#canvas.height = height;

		this.#context = this.#canvas.getContext('2d');
	}

	get context() {
		return this.#context
	}

	get canvas() {
		return this.#canvas
	}

	get width() {
		return this.#canvas.width
	}

	get height() {
		return this.#canvas.height
	}

	set width(width) {
		this.#canvas.width = width;
	}

	set height(height) {
		this.#canvas.height = height;
	}

	clear() {
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}
}

export { Buffer };