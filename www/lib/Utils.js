class Utils {

	str2int(str) {
		return parseInt(str.replace('int:',''), 10);
	};

	str2value(str) {
		if (str.toString().startsWith('int:')) {
			return parseInt(str.replace('int:',''), 10);
		} else if (str.toString().startsWith('float:')) {
			return parseFloat(str.replace('float:',''));
		} else {
			return str.toString();
		}
	}
}