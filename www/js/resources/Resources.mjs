
class Resources {
    #res;
    #resourcesLoaded;
    #resFile;

    constructor(_file) {
        this.#res = {};
        this.#resourcesLoaded = false;
        this.#resFile = _file;
    }

    load() {
        var that = this; // Keep ref of this for use inside onReadyStateChange

        return new Promise((resolve, reject) => {

            var xhr = new XMLHttpRequest();
        
            xhr.overrideMimeType("application/json");
            xhr.open('GET', this.#resFile, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    that.#res = Object.assign(that.#res, JSON.parse(xhr.responseText));
                    that.#resourcesLoaded = true;
                    resolve(that);
                }  
            }
            xhr.onerror = reject;
            xhr.send(null);  
        });
    }

    #getResource(key, prefix) {
        if (typeof this.#res[prefix] === 'undefined') {
            return null;
        }

        var r = this.#res[prefix].filter(m => { return m.key === key });

        return (r.length) ? r[0]: null;
    }

    getMusic(key) {
        return this.#getResource(key, 'musics');
    }

    getSound(key) {
        return this.#getResource(key, 'sounds');
    }


    getString(key) {
        return (this.#resourcesLoaded && typeof this.#res.strings[key] === 'string') ? this.#res.strings[key] : "String not found or resources not loaded";
    }

    getFont(key) {
        if (!this.#resourcesLoaded) {
            logger.log("Resources not loaded");
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

    getSounds() {
        return this.#res.sounds;
    }

    getFonts() {
        return this.#res.fonts;
    }

    getStrings() {
        return this.#res.strings;
    }
}

export { Resources };
