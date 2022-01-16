class Utils {

	static createEnum(values) {
		const enumObject = {};
		for (const val of values) {
			enumObject[val] = val;
		}
		return Object.freeze(enumObject);
	}

	/**
	 * Process an array of Promise
	 * TODO : handle errors
	 * @param {Array} promises 
	 * @returns 
	 */
	 static chainPromises(promises) {
		return new Promise(resolve => {

			var queue = [...promises];

			var processQueue = function() {
				if (queue.length) {
					var promise = queue.shift();
					promise.then(() => {
						processQueue();
					});

				// finished	
				} else {
					resolve();
				}
			}

			// start process
			processQueue();
		});
	}

	/**
	 * Add alpha component to a RGB string
	 * @param {string} str 
	 * @param {string of number} alpha 
	 * @returns {string}
	 */
	static hexRGBToHexRGBA(str, alpha) {
		if (typeof alpha === 'number' && alpha >= 0 && alpha <= 255) {
			return str + alpha.toString(16);
		} else if (typeof alpha === 'string' && alpha.match(/[0-9a-f][0-9a-f]/gi)) {
			return str + alpha;
		} else {
			throw new TypeError("alpha must be an int between 0 and 255 or a an hex string between 00 and FF");
		}
	}

	/**
	 * Return int value of an hax color
	 * @param {string} str 
	 * @param {*} prefix 
	 * @returns {number}
	 */
	static hexColorToInt(str, prefix) {
		var p = prefix || "";

		return parseInt(str.replace(/^#/gi, p), 16);
	}

	/**
	 * Revert RGBA components
	 * @param {string} rgba 
	 * @returns {string} abgr string
	 */
	static rgba2abgr(rgba) {
		var arr = rgba.match(/.{2}/g);
		return arr[3] + arr[2] + arr[1] + arr[0];
	}

	/**
	 * Convert an hexadecimal string to an array of hex byte
	 * @param {*} hex 
	 * @returns {array<string>}
	 */
	static hexToArray(hex) {
		return hex.match(/.{2}/g);
	}
}

export { Utils };