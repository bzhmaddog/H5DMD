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
[a relative link](Demo.html)

```

# Install
```
npm install
```

# Build and watch
```
#Transpile all files
./build.sh

#Watch file changes
./watch.sh
```

Note : Files are not bundled into one big file (using webpack for example) because it is not working well with ES modules