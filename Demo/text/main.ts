import '../src/style.scss';
import {
    Dmd,
    DotShape
} from "h5dmd";
import {setupTextLayers} from "./layers";

// When dom is loaded create the objects and bind the events
document.addEventListener('DOMContentLoaded', function () {

    // Display the H5DMD library version
    const versionElement = document.getElementById('version_value');
    if (versionElement) {
        versionElement.textContent = Dmd.version;
    }

    // Check if webgpu is supported
    if ("gpu" in navigator) {

        const output = document.getElementById('output') as HTMLCanvasElement;
        const dmd = new Dmd(
                            output,
                            {
                                dotSize: 2,
                                dotSpace: 1,
                                dotShape: DotShape.Square,
                                backgroundBrightness: 14,
                                brightness: 1,
                                showFPS: true
                            }
                        );

        // Init Dmd then
        Promise.all([dmd.init()]).then(() => {
            // Start rendering dmd
            dmd.run();

            // Static showcase - every option below is set at construction, so there is no
            // control panel on this page: what you see is exactly what the code declares.
            setupTextLayers(dmd);

        }); // Dmd.init()

    } else {
        alert('Sorry your browser does not support WEBGPU (or the feature is not enabled)');
    }
}, false); // DOM loaded
