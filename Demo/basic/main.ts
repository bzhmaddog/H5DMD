import '../src/style.scss'
import { startDemo } from '../src/bootstrap'
import { setupBasicLayers } from './layers'
import { buildBasicControlPanel } from './controls'

// Add the LayerGroup showcase, then build its control panel
startDemo((dmd, imagesPath) => {
    setupBasicLayers(dmd, imagesPath)
    buildBasicControlPanel(dmd)
})
