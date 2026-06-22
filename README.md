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

WebGPU now ships by default in modern browsers (Chrome/Edge 113+), so the GPU-enabling flags that
were once required (such as `--enable-unsafe-webgpu`, `--enable-features=Vulkan,UseSkiaRenderer`,
`--enable-gpu-rasterization`) are no longer needed.

The demo plays a video without a user gesture, so depending on your platform you may still want to
launch the browser with autoplay enabled:

```
--autoplay-policy=no-user-gesture-required
--ignore-autoplay-restrictions
```

# Live demo

https://bzhmaddog.github.io/h5dmd/index.html

If it doesn't load check the developer console for errors

# Examples

```
[See main.ts](https://github.com/bzhmaddog/H5DMD/blob/master/Demo/src/main.ts)

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

# Running the demo locally

The [Demo](Demo) app imports this library as the `h5dmd` package. To run it against your local
build, expose the library through a global link:

```
# From the repository root: build the library so dist/ exists, then link it
npm install
npm run build
npm link
```

Then link it inside the demo and start the dev server:

```
cd Demo
npm install
npm link h5dmd
npm run dev
```

See [Demo/README.md](Demo/README.md) for more details.

# Documentation

[Follow this link](http://bzhmaddog.github.io/h5dmd/docs/index.html)