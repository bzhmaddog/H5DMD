# H5DMD

![CI](https://github.com/bzhmaddog/h5dmd/actions/workflows/ci.yml/badge.svg)

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

https://bzhmaddog.github.io/H5DMD/index.html

If it doesn't load check the developer console for errors

# Examples

```ts
import { Dmd, DmdOptions, DotShape, Easing, Options } from "h5dmd";

const canvas = document.getElementById("output") as HTMLCanvasElement;

const dmd = new Dmd({
    outputCanvas: canvas,
    dotSize: 4,
    dotSpace: 1,
    dotShape: DotShape.Square,
    backgroundBrightness: 14,
    brightness: 1,
    showFPS: true,
} as DmdOptions);

await dmd.init(); // set up the renderers (WebGPU when available)
dmd.run();        // start the render loop

// Add a canvas layer and draw an image into it
dmd.addCanvasLayer("bg", {}, {} as Options, {}, (layer) => {
    fetch("background.png")
        .then((response) => response.blob())
        .then(createImageBitmap)
        .then((bitmap) => layer.setDrawFunction(({ drawBitmap }) => drawBitmap(bitmap)));
});

// Fade a layer in/out (operates on layer opacity)
const layer = dmd.getLayer("bg");
await layer.fadeOut(1000);                       // fade out over 1s (default easing: easeOutSine)
await layer.fadeIn(500, Easing.easeInSine);      // fade in with custom easing

// Or use the Dmd convenience methods (handles visibility automatically)
await dmd.fadeLayerOut("bg", 1000);
await dmd.fadeLayerIn("bg", 500);

// Fade the entire DMD brightness
await dmd.fadeOut(1000);
await dmd.fadeIn(1000);
```

For a complete example see [Demo/src/main.ts](https://github.com/bzhmaddog/H5DMD/blob/main/Demo/src/main.ts).

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
npm run build:docs
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

[Follow this link](http://bzhmaddog.github.io/H5DMD/docs/index.html)

# Releasing

The version number lives in `package.json`, in `src/dmd.ts` (`Dmd.version`) and in the
git release tag. Use `npm version` to bump all of them in one step — a `version`
lifecycle script (`scripts/sync-version.mjs`) rewrites `Dmd.version` and stages it so it
lands in the same commit as `package.json`:

```
# bump patch / minor / major (creates the commit and the vX.Y.Z tag)
npm version patch

# push the commit and the tag
git push --follow-tags
```

Then publish a GitHub Release pointing at the new tag. That triggers the
[Release workflow](.github/workflows/release.yml), which verifies that the tag,
`package.json` and `Dmd.version` all match before publishing to npm.
