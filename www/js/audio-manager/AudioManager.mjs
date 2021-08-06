
class AudioManager {
  #context;
  #sounds;
  #sources;

  constructor() {
    this.#context = new AudioContext();
    this.#sounds = {};
    this.#sources = {};

    window.audioManager = this;
  }

  loadSound(url, key) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      var that = this;
    
      // Decode asynchronously
      xhr.onload = function() {
        that.#context.decodeAudioData(
          xhr.response,
          function(buffer) {
            that.#sounds[key] = buffer;
            PubSub.publish('sound.' + key + '.loaded');
          },
          function() {
            logger.log("Error", arguments);
          }
        ); 
      }
      xhr.send();
  }

  playSound(key, pKey, loop, onEndedListener) {
	var that = this;
  var playKey = pKey;

    if (typeof playKey === 'undefined') {
      playKey = key;
    }
    
	  if (typeof this.#sounds[key] === 'undefined') {
      logger.log(`Sound [${key}] is not loaded`);
      return;
    }

    if (typeof this.#sources[playKey] !== 'undefined') {
      logger.log(`Sound [${playKey}] is already beeing played`);
      return;
    }

    var source = this.#context.createBufferSource();

    source.loop = !!loop;

	// Sound finished player then delete it from sources list
	// and call external listener if provided
    source.onended = function() {
		var endedListener = onEndedListener;

		delete that.#sources[playKey];

		if (typeof endedListener === 'function') {
			endedListener();
		}
	}

    this.#sources[playKey] = source;

    source.buffer = this.#sounds[key];
    source.connect(this.#context.destination);

    source.start(0);
  }

  stopSound(pKey) {
    if (typeof this.#sources[pKey] === 'undefined') {
      logger.log(`Sound [${pKey}] is not beeing played`);
      return;
    }

    this.#sources[pKey].stop(0);
    delete this.#sources[pKey];
  }

  reset() {
    Object.keys(this.#sources).forEach(s => s.stop(0));
    this.#sources = {};
  }

  getContext() {
    return this.#context;
  }

  isLoaded(key) {
    return (typeof this.#sounds[key] !== 'undefined');
  }

  getSources() {
    return this.#sources;
  }
}

export { AudioManager };