import './style.scss';
import {Dmd} from "h5dmd";

// Landing/directory page - just links out to the actual demo pages, no Dmd instance needed.
document.addEventListener('DOMContentLoaded', function () {
    const versionElement = document.getElementById('version_value');
    if (versionElement) {
        versionElement.textContent = Dmd.version;
    }
}, false);
