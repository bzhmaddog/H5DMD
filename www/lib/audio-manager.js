
var AudioManager = function() {
    var context = new AudioContext();
    var sounds = {};
    var sources = [];


    function loadSound(url, key) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
      
        // Decode asynchronously
        xhr.onload = function() {
          context.decodeAudioData(xhr.response, function(buffer) {
            sounds[key] = buffer;
            PubSub.publish('sound.' + key + '.loaded');
          }, onError); 
        }
        xhr.send();
    }

    function onError() {
      console.log('Error');
      console.log(arguments);
    }

    function playSound(key) {
      if (typeof sounds[key] === 'undefined') {
        console.log('Sound "' + key + '" is not loaded');
        return;
      }

      var source = context.createBufferSource();

      sources.push({ 
        'key' : key,
        'source' : source
      });

      source.buffer = sounds[key];
      source.connect(context.destination);

      source.start(0);
    }

    function stopSound(key) {
      var s = sources.filter(s => {return s.key === key});

      if (s.length) {
        s[0].source.stop(0);
        // Delete source from array
        sources = sources.filter(source=> { source !== s[0]});
      }
    }

    function stopAll() {
      sources.forEach(s => s.source.stop(0));
      sources = [];
    }

    function reset() {
      stopAll();
    }

    function getContext() {
        return context;
    }

    function isLoaded(key) {
      return (typeof sounds[key] !== 'undefined');
    }

    return {
        getContext : getContext,
        loadSound : loadSound,
        playSound : playSound,
        isLoaded : isLoaded,
        stopSound : stopSound,
        stopAll : stopAll,
        reset : reset
    }

}