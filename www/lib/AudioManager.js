
class AudioManager {
  #context;
  #sounds;
  #sources;

  constructor() {
    this.#context = new AudioContext();
    this.#sounds = {};
    this.#sources = [];
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
            console.log('Error');
            console.log(arguments);
          }
        ); 
      }
      xhr.send();
  }

  playSound(key) {
    if (typeof this.#sounds[key] === 'undefined') {
      console.log('Sound "' + key + '" is not loaded');
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