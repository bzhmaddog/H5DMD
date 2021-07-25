class Utils {

	static str2int(str) {
		return parseInt(str.replace('int:',''), 10);
	};

	static str2value(str) {
		if (str.toString().startsWith('int:')) {
			return parseInt(str.replace('int:',''), 10);
		} else if (str.toString().startsWith('float:')) {
			return parseFloat(str.replace('float:',''));
		} else {
			return str.toString();
		}
	}

	static createEnum(values) {
		const enumObject = {};
		for (const val of values) {
			enumObject[val] = val;
		}
		return Object.freeze(enumObject);
	}
}

export { Utils };