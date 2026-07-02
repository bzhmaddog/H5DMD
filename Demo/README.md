# H5DMD Demo

An interactive [Vite](https://vitejs.dev/) + TypeScript application that demonstrates the
[H5DMD](../README.md) library — a virtual DMD (Dot Matrix Display) rendered with HTML5 Canvas
and WebGPU.

The demo renders a 256×78 dot display (on a 1280×390 canvas) and stacks several layer types on
top of each other. A tabbed control panel below the canvas lets you tweak every aspect of the
display and each layer in real time.

## Requirements

- A browser with **WebGPU** enabled — see [caniuse.com/webgpu](https://caniuse.com/webgpu).
  The demo checks for `navigator.gpu` and does nothing if WebGPU is unavailable (check the
  browser console for errors).
- [Node.js](https://nodejs.org/) and npm.

## The `h5dmd` dependency

The demo imports the library as a package:

```ts
import { Dmd, DotShape, Options /* … */ } from "h5dmd";
```

This package is **not** listed in `Demo/package.json`, so you must make it resolvable before
running the demo. The recommended way is to build and link the library from the repository root —
see [Running the demo locally](../README.md#running-the-demo-locally) in the root README.

> Alternatively, if you only want to consume the published package, run `npm install h5dmd`
> inside `Demo/` instead of linking the local build.

## Running the demo

From the `Demo/` directory:

```bash
# Install dependencies, link the local h5dmd build, then start the Vite dev server
npm run li && npm run dev

# Start the Vite dev server (h5dmd must already be linked)
npm run dev

# Type-check and build a production bundle into dist/
npm run build

# Preview the production build locally (serves the dist/ folder)
npm run preview
```

Open the URL printed by `npm run dev` (typically http://localhost:5173) in a WebGPU-capable
browser.

## What the demo shows

The whole scene is built in [src/layers.ts](src/layers.ts) after `DOMContentLoaded`. It creates a
`Dmd` bound to the `#output` canvas, calls `dmd.init()`, then `dmd.run()`, and adds layers:

| Layer name        | Type             | Content                                          |
|-------------------|------------------|--------------------------------------------------|
| `bg`              | Canvas layer     | Static background image                          |
| `animation`       | Animation layer  | Looping frame-by-frame WebP animation            |
| `video-transparent` | Video layer    | Transparent WebM video                           |
| `video-chromakey` | Video layer      | WebM video with chroma-key background removal    |
| `matthew`         | Canvas layer     | Aligned character image                          |
| `sprite`          | Sprites layer    | Sprite sheet with queued animation sequences     |
| `text1`–`text4`   | Text layers      | Styled text, some with stroke or a noise effect  |

Image, video, and sprite assets are served from [public/images](public/images).

### Interactive controls

A tabbed control panel below the canvas ([src/controls.ts](src/controls.ts)) exposes:

- **Global (DMD)** tab:
  - Off-dot color picker
  - Brightness slider
  - Dot shape selector with live shape preview, dot size and dot space sliders
  - Fade in/out buttons with easing and duration selectors
  - Monochrome mode toggle — when enabled: HSV color sliders, levels selector, and a color
    palette preview swatch
- **Per-layer** tabs: visibility checkbox, opacity slider, fade in/out buttons (disabled when
  already at target opacity), easing selector, and duration slider
- **Layer-specific** controls: play/pause/stop for animation and video layers, text input and
  color picker for text layers, run/stop for sprite layers

## Project structure

```
Demo/
├── index.html           # HTML shell — canvas and control panel mount points
├── vite.config.js       # Vite config (base '/H5DMD/', tsc-watch plugin)
├── tsconfig.json        # TypeScript (bundler resolution)
├── src/
│   ├── main.ts          # Entry point: creates Dmd, wires up layers and controls
│   ├── layers.ts        # Builds and adds all demo layers to the Dmd instance
│   ├── controls.ts      # Builds the tabbed control panel
│   └── style.scss       # All demo styles (compiled by Vite via sass)
└── public/
    └── images/          # Backgrounds, animations, noises, sprites, video
```
