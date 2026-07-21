import '../src/style.scss'
import { Dmd, DotShape } from 'h5dmd'
import { setupScoreboardLayers } from './layers'
import { buildScoreboardControlPanel } from './controls'

// When dom is loaded create the objects and bind the events
document.addEventListener(
    'DOMContentLoaded',
    function () {
        const imagesPath = `${import.meta.env.BASE_URL}images`

        // Display the H5DMD library version
        const versionElement = document.getElementById('version_value')
        if (versionElement) {
            versionElement.textContent = Dmd.version
        }

        // Check if webgpu is supported
        if ('gpu' in navigator) {
            const output = document.getElementById('output') as HTMLCanvasElement
            const dmd = new Dmd(output, {
                dotSize: 2,
                dotSpace: 1,
                dotShape: DotShape.Square,
                backgroundBrightness: 14,
                brightness: 1,
                showFPS: true,
            })

            // Init Dmd then
            Promise.all([dmd.init()]).then(() => {
                // Start rendering dmd
                dmd.run()

                // Add the scoreboard LayerGroups, then build its control panel
                setupScoreboardLayers(dmd, imagesPath).then(() => {
                    buildScoreboardControlPanel(dmd)
                })
            }) // Dmd.init()
        } else {
            alert('Sorry your browser does not support WEBGPU (or the feature is not enabled)')
        }
    },
    false,
) // DOM loaded
