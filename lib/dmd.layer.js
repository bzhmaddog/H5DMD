/**
 * Provide a Layer for the DMD
 */
DMD.Layer = function (name, type, width, height, src, mimeType, transparent, visible, extra) {
	var type = type,
		name = name,
		content,
		visible = visible,
		transparent = transparent,
		autoplay = false,
		loop = false,
		text;

	//console.log(arguments);

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
			
			content = new DMD.Video(width, height);

			if (typeof extra !== 'undefined') {
				if (typeof extra.loop !== 'undefined') {
					content.loop = !!extra.loop;
				}

				if (typeof extra.loop !== 'undefined') {
				autoplay =  !!extra.autoplay;
				}
			}

			content.load(src);
			break;
		case 'text':
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

		PubSub.publish('layer.visibilityChanged', {
			name : name,
			isVisible : visible
		})
	}

	function getType() {
		return type;
	}
	
	return {
		content : content,
		isVisible : isVisible,
		getType : getType,
		setVisibility : setVisibility
	}
};