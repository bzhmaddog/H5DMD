DMD.Layer = (function (){

 function _layer(name, type, src, mimeType, width, height, transparent, visible, autoplay, loop) {
	var type = type,
		name = name,
		content,
		visible = visible,
		autoplay = !!autoplay,
		loop = loop;

	console.log(arguments);
		
	switch(type) {
		case 'image':
			content = new Image();
			content.addEventListener('load', function () {
				layerLoaded();
			});
			content.src = src;
		break;
		case 'video':
			PubSub.subscribe('video.loaded', function (ev, video){
				if (video === content) {
					layerLoaded();
				}
			});
			
			content = new DMD.Video(width,height);
			//document.body.appendChild(content);
			content.loop = loop;
			content.load(src);
			break;
	}

	function layerLoaded() {
	
		if (type === 'video' && autoplay) {
			content.play();
		}
	
		PubSub.publish('layer.loaded', {
			name : name,
			type : type
		});
	}
	
	function isVisible() {
		return visible;
	}

	function setVisibility(state) {
		visible = !!state;
	}
	
	return {
		content : content,
		isVisible : isVisible,
		setVisibility : setVisibility
	}
};
	function Layer(args) {
		return _layer.apply(this, args);
	}
	
	return function (args) {
		return new Layer(args);
	}

})();