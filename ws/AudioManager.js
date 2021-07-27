
const AudioContext = require('web-audio-api').AudioContext,
	    Speaker = require('speaker');


class AudioManager {
  #context;
  #sounds;
  #sources;

  constructor() {
    this.#context = new AudioContext();
    this.#sounds = {};
    this.#sources = [];
    
    this.#context.outStream = new Speaker({
      channels: this.#context.format.numberOfChannels,
      bitDepth: this.#context.format.bitDepth,
      sampleRate: this.#context.sampleRate
    });
  }

  loadSound(data, key) {
    var that = this;
    this.#context.decodeAudioData(
      data,
      function(buffer) {
        console.log('here');
        that.#sounds[key] = buffer;
      },
      function() {
        console.log('there');
        console.log("Error", arguments);
      }
    ); 
  }

  playSound(key) {
    console.log(this.#sounds);
    if (typeof this.#sounds[key] === 'undefined') {
      console.log(`Sound [${key}] is not loaded`);
      return;
    }

    var source = this.#context.createBufferSource();

    this.#sources.push({ 
      'key' : key,
      'source' : source
    });

    source.buffer = this.#sounds[key];
    source.connect(this.#context.destination);

    source.start(0);
  }

  stopSound(key) {
    var s = this.#sources.filter(s => {return s.key === key});

    if (s.length) {
      s[0].source.stop(0);
      // Delete source from array
      this.#sources = this.#sources.filter(source=> { source !== s[0]});
    }
  }

  reset() {
    this.#sources.forEach(s => s.source.stop(0));
    this.#sources = [];
  }

  getContext() {
    return this.#context;
  }

  isLoaded(key) {
    return (typeof this.#sounds[key] !== 'undefined');
  }
}

module.exports = AudioManager;