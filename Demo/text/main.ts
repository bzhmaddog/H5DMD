import '../src/style.scss'
import { startDemo } from '../src/bootstrap'
import { setupTextLayers } from './layers'

// Static showcase - every option is set at construction, so there is no control panel
// on this page: what you see is exactly what the code declares.
startDemo(dmd => setupTextLayers(dmd))
