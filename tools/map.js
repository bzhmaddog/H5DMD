var fs = require('fs');

var index = 0;
var pixels = [];

for (var row = 0 ; row < 62 ; row++) {
	var newRow = [];
	
	for (var col = 0 ; col < 320 ; col++) {
		newRow.push(index);
		index += 16;
	}
	pixels.push(newRow);
	index += 1280*4 + 4;
}


fs.writeFile('map.json', JSON.stringify(pixels), function (err) {
	if (err) {
		console.log(err);
	}
});