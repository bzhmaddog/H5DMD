var Utils = (Utils || {});

Utils.str2int = function(str) {
	return parseInt(str.replace('int:',''), 10);
};

Utils.str2value = function(str) {
	if (str.toString().startsWith('int:')) {
		return parseInt(str.replace('int:',''), 10);
	} else if (str.toString().startsWith('float:')) {
		return parseFloat(str.replace('float:',''));
	} else {
		return str.toString();
	}
};