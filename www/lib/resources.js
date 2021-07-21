var Resources = (Resources || {});


var Resources = function() {
    var res = {},
        resourcesLoaded = false;

	var xhr = new XMLHttpRequest();
    
    xhr.overrideMimeType("application/json");
    xhr.open('GET', '/res/resources.json', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == "200") {
            res = Object.assign(res, JSON.parse(xhr.responseText));
            resourcesLoaded = true;
            PubSub.publish('resources.loaded');
        }
    };
    xhr.send(null);  


    function getString(key) {
        return (resourcesLoaded && typeof res.strings[key] === 'string') ? res.strings[key] : "String not found or resources not loaded";
    }

    function getMusic(key) {
        if (!resourcesLoaded) {
            console.log("Resources not loaded");
            return null;
        }
        var r = res.musics.filter(m => { return m.key === key });

        if (r.length) {        
            return r[0];
        } else {
            return null;
        }
    }

    function getFont(key) {
        if (!resourcesLoaded) {
            console.log("Resources not loaded");
            return null;
        }

        var r = res.fonts.filter(f => { return f.key === key });

        if (r.length) {        
            return r[0];
        } else {
            return null;
        }
    }

    function getMusics() {
        return res.musics;
    }

    function getFonts() {
        return res.fonts;
    }

    return {
        getString : getString,
        getMusic : getMusic,
        getMusics : getMusics,
        getFont : getFont,
        getFonts : getFonts
    }
};
