# H5DMD
A Virtual DMD (Dot Matrix Display) powered by HTML5 Canvas and WebGPU(optional)

![256x78 DMD on a 1280x390 display](/dmd-256x78-mp-logo.jpg?raw=true "1 dot = 4x4 pixels")

Quick demonstration videos (tests before using mpf):

https://youtu.be/ItiX97USKyU

https://www.youtube.com/watch?v=MtAN4vKRLQ0

https://www.youtube.com/watch?v=MaJZQCTSiOg


# Installation
Put all mjs files in your project


# Example

```
import { DMD } from './dmd/DMD.mjs';

// Output canvas
let canvas = document.getElementById('my-canvas');

/**
 * DMD(
     {number of horizontal dots},
     {number of vertical dots},
     {canvas width},
     {canvas height},
     {width of dot},
     {height of dot},
     {horizontal space between dots},
     {vertical space between dots},
     {horizontal offset},
     {vertical offset},
     {dot shape},
     {output canvas},
     {show FPS info);
 */

let dmd = new DMD(256, 78, 1280, 390, 4, 4, 1, 1, 1, 1, DMD.DotShape.Square, canvas, true);

// Add Image layer
dmd.addLayer({
    name :'logo',
    type : 'image',
    src : 'images/logo.webp',
    mimeType : 'image/webp',
});

// Start rendering
dmd.run();


```

