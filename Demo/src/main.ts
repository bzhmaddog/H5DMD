import {
    Dmd,
    DotShape
} from "h5dmd";
import {setupLayers} from "./layers";
import {buildControlPanel} from "./controls";

// When dom is loaded create the objects and bind the events
document.addEventListener('DOMContentLoaded', function () {

    const imagesPath = document.baseURI.replace('index.html', '') + 'images';

    // Display the H5DMD library version
    const versionElement = document.getElementById('version_value');
    if (versionElement) {
        versionElement.textContent = Dmd.version;
    }

    // Check if webgpu is supported
    if ("gpu" in navigator) {

        const output = document.getElementById('output') as HTMLCanvasElement;
        const dmd = new Dmd(output, 2, 1, DotShape.Square, 14, 1, true);

        // Init Dmd then
        dmd.init().then(() => {
            // Start rendering dmd
            dmd.run();

            // Add all demo layers, then build the control panel for them
            setupLayers(dmd, imagesPath);
            buildControlPanel(dmd);

        }); // Dmd.init()

    } else {
        alert('Sorry your browser does not support WEBGPU (or the feature is not enabled)');
    }
}, false); // DOM loaded
