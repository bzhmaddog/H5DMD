var fs = require('fs');

var col = 0;
var index = 0;

var pixels = [];

for (var c = 0 ; c < 19840 ; c++) {
	
	pixels.push(index);
	

	col++;
	
	if (col > 320) {
		col = 0;
		index += 1280*4;
	} else {
		index += 16;
	}
}


fs.writeFile('map.json', JSON.stringify(pixels), function (err) {
	if (err) {
		console.log(err);
	}
});