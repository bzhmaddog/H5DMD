# H5DMD
A Virtual DMD (Dot Matrix Display) powered by HTML5 Canvas and WebGPU(optional)

![256x78 DMD on a 1280x390 display](/logo.png?raw=true "1 dot = 4x4 pixels")

Quick demonstration videos (tests before using mpf):

https://youtu.be/ItiX97USKyU

https://www.youtube.com/watch?v=MtAN4vKRLQ0

https://www.youtube.com/watch?v=MaJZQCTSiOg

https://www.youtube.com/watch?v=q58dZAbNXe8


# Installation
Put all mjs files in your project


# Example

```
See Demo.html
```

# Other example

```

// Change layer visibilitity
spritesLayer.setVisibility(false);
// or
dmd.setLayerVisibility('test-sprites', {true/false});

// Change Layer group visibility
dmd.setLayerGroupVisibility('mygroup', {true/false});

// Only visible layers are rendered onto the DMD but if you don't need a layer anymore it can be Removed via its name
dmd.removeLayer('test-sprites');
// or its object itself
dmd.removeLayer(spritesLayer);

```

