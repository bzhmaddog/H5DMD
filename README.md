# H5DMD

A Virtual Dmd (Dot Matrix Display) powered by HTML5 Canvas and WebGPU(optional)

![256x78 Dmd on a 1280x390 display](/logo.png?raw=true "1 dot = 4x4 pixels")

Quick demonstration videos (tests before using mpf):

https://youtu.be/ItiX97USKyU

https://www.youtube.com/watch?v=MtAN4vKRLQ0

https://www.youtube.com/watch?v=MaJZQCTSiOg

https://www.youtube.com/watch?v=q58dZAbNXe8


# Requirements

https://caniuse.com/webgpu

Some experimental flags where used during the development of this project : Some might still need to be enabled
depending on your platform
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
[See Demo.html](https://github.com/bzhmaddog/H5DMD/blob/master/Demo.html)

```

# Install dependencies
```
npm install
```

# Build and watch
```
#Transpile all files
npm run build

#Watch file changes
npm run watch

#Run eslinter
npm run lint

#Run tests
npm run test

#Build documentation
npm run build-documentation
```

# Documentation

[Follow this link](http://bzhmaddog.github.io/h5dmd/docs/index.html)