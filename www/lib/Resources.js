
class Resources {
    #res;
    #resourcesLoaded;
    #resFile;

    constructor(_file) {
        this.#res = {};
        this.#resourcesLoaded = false;
        this.#resFile = _file;
    }

    load(listener) {
	    var xhr = new XMLHttpRequest();
        var that = this; // Kee[ ref of this for use inside onReadyStateChange
    
        xhr.overrideMimeType("application/json");
        xhr.open('GET', this.#resFile, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == "200") {
                that.#res = Object.assign(that.#res, JSON.parse(xhr.responseText));
                that.#resourcesLoaded = true;
                if (typeof listener === 'function') {
                    listener();
                }
                PubSub.publish('resources.loaded', that);
            }  
        }
        xhr.send(null);  
    }

    getString(key) {
        return (this.#resourcesLoaded && typeof this.#res.strings[key] === 'string') ? this.#res.strings[key] : "String not found or resources not loaded";
    }

    getMusic(key) {
        if (!this.#resourcesLoaded) {
            console.log("Resources not loaded");
            return null;
        }
        var r = this.#res.musics.filter(m => { return m.key === key });

        if (r.length) {        
            return r[0];
        } else {
            return null;
        }
    }

    getFont(key) {
        if (!this.#resourcesLoaded) {
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

    getMusics() {
        return this.#res.musics;
    }

    getFonts() {
        return this.#res.fonts;
    }
}
