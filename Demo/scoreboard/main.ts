import '../src/style.scss'
import { startDemo } from '../src/bootstrap'
import { setupScoreboardLayers } from './layers'
import { buildScoreboardControlPanel } from './controls'

// Add the scoreboard LayerGroups, then build its control panel
startDemo(async (dmd, imagesPath) => {
    await setupScoreboardLayers(dmd, imagesPath)
    buildScoreboardControlPanel(dmd)
})
