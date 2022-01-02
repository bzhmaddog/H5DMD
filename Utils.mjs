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
}

export { Utils };