# H5DMD
A Virtual DMD (Dot Matrix Display) powered by HTML5 Canvas and WebGPU(optional)

![256x78 DMD on a 1280x390 display](/logo.png?raw=true "1 dot = 4x4 pixels")

Quick demonstration videos (tests before using mpf):

https://youtu.be/ItiX97USKyU

https://www.youtube.com/watch?v=MtAN4vKRLQ0

https://www.youtube.com/watch?v=MaJZQCTSiOg

https://www.youtube.com/watch?v=q58dZAbNXe8


# Requirements
This project uses a lot of experimental features and has been tested with chromium 105+ Linux/Windows and Chrome Canary on MacOS

It requires some experimental flags to be enabled
```
--use-gl=desktop
--ignore-gpu-blocklist
--enable-gpu-rasterization
--enable-zero-copy
--enable-features=VaapiVideoDecoder,Vulkan,UseSkiaRenderer
--enable-accelerated-2d-canvas
--enable-user-stylesheet
--autoplay-policy=no-user-gesture-required
--ignore-autoplay-restrictions
--disk-cache-dir=/dev/null
--disk-cache-size=1
--enable-unsafe-webgpu
```

# Live demo
https://bzhmaddog.github.io/h5dmd/Demo.html

If it doesn't load look at the console to see errors

# Examples

```
See insode Demo.html
```

# Install
```
npm install
```

# Build
```
#Transpile all files
./node_modules/typescript/bin/tsc

#Watch file changes
./node_modules/typescript/bin/tsc --watch
```
Note : Files are not bundled into one big file (using webpack for example) because it is not working well with ES modules


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

