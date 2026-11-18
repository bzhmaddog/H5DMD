import '../src/style.scss'
import { startDemo } from '../src/bootstrap'
import { setupAdvancedLayers } from './layers'
import { buildAdvancedControlPanel } from './controls'

// Add all demo layers, then build the control panel for them
startDemo((dmd, imagesPath) => {
    setupAdvancedLayers(dmd, imagesPath)
    buildAdvancedControlPanel(dmd)
})
