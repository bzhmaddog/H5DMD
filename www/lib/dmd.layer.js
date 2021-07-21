/**
 * Provide a Layer for the DMD
 */
DMD.Layer = function (width, height, _options) {
	var content,
	defaultOptions = {
		name : 'layer_' + (Math.random(999) + 1),
		type : '',
		transparent : true,
		visible : true,
		opacity : 1
	},
	defaultVideoOptions = {
		loop : false,
		autoplay : true,
		mimeType : 'video/webm'
	},
	defaultTextOptions = {
		top : 0,
		left: 0,
		text: '',
		color: 'white',
		align : 'left',
		fontSize : '12',
		fontFamily : 'Arial',
		textBaseline : 'top',
		xOffset : 0,
		yOffset : 0,
		strokeWidth : 0,
		strokeColor : 'black'
	};

	var options = Object.assign(defaultOptions, _options);

	switch(options.type) {

		case 'image':
			// TODO : Check if options.src is defined
			content = new Image();
			content.addEventListener('load', function () {
				layerLoaded();
			});
			content.src = options.src;

			break;
		case 'video':
			options = Object.assign(defaultVideoOptions, options);

			var videoId = options.name + '_' + options.src;

			// TODO : Check if options.src is defined

			// Subscribe event sent from DMD.video object when video is loaded
			PubSub.subscribe(videoId + '.loaded', function (ev) {
				layerLoaded();
			});
			
			content = new DMD.Video(width, height, videoId);
			content.loop = options.loop;

			// Load video
			content.load(options.src);
			break;
		case 'text':
			options = Object.assign(defaultTextOptions, options);

			var buffer = new DMD.Buffer(width, height);
			var ctx = buffer.context;

			ctx.imageSmoothingEnabled = false;
			
			//console.log(options);

			if (typeof options.text !== '') {
				var left = options.left;
				var top = options.top;
				var m;

				ctx.fillStyle = options.color;
				ctx.textBaseline = options.textBaseline;
				ctx.font = (options.fontSize) + 'px ' + options.fontFamily;

				m = ctx.measureText(options.text);

				if (options.align === 'center') {
					left = (width/2) - (m.width / 2);
				} else if (options.align === 'right') {
					left = width - m.width;
				}

				if (typeof options.vAlign !== 'undefined') {
					// https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
					// Approximation of line height since api doesn't provide native method
					var textHeight = ctx.measureText('M').width;

					switch(options.vAlign) {
						case 'top':
							top = 0;
							break;
						case 'middle':
							top = (height/2) - (textHeight / 2);
							break;
						case 'bottom':
							top = height - textHeight;
							break;
					}
				}


				left += options.xOffset;
				top += options.yOffset;

				if (options.strokeWidth > 0) {
					ctx.strokeStyle = options.strokeColor;
					ctx.lineWidth = options.strokeWidth;
					ctx.strokeText(options.text, left, top);
				}

				ctx.fillText(options.text, left, top);
			}

			content = new Image();
			content.addEventListener('load', function () {
				layerLoaded();
			});

			content.src = buffer.canvas.toDataURL("image/png");
			break;
	}

	function layerLoaded() {
		PubSub.publish('layer.loaded', options);

		// Autoload video if needed
		if (options.type === 'video' && options.autoplay) {
			content.play();
		}
	}
	
	function isVisible() {
		return options.visible;
	}

	function setVisibility(state) {
		visible = !!state;

		PubSub.publish('layer.visibilityChanged', {
			name : options.name,
			isVisible : isVisible()
		})
	}

	function getType() {
		return options.type;
	}

	function getName() {
		return options.name;
	}

	function toggleVisibility() {
		options.visible = ! options.visible;
	}
	
	return {
		content : content,
		isVisible : isVisible,
		getName : getName,
		getType : getType,
		setVisibility : setVisibility,
		toggleVisibility : toggleVisibility
	}
};