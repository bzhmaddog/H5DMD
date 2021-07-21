var Fonts = function(_fonts) {
    var fonts = {};

    _fonts.forEach(font => {
        fonts[font.key] = new FontFace(font.name, 'url(' + font.url + ')');
    });

	function getFont(key) {
        if (typeof fonts[key] !== 'undefined') {
		    return fonts[key];
        }
	}

    return {
        getFont : getFont
    }
}