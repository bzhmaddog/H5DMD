# H5DMD Demo

An interactive [Vite](https://vitejs.dev/) + TypeScript application that demonstrates the
[H5DMD](../README.md) library — a virtual DMD (Dot Matrix Display) rendered with HTML5 Canvas
and WebGPU.

The demo renders a 256×78 dot display (on a 1280×390 canvas) and stacks several layer types on
top of each other. Checkboxes below the canvas let you toggle each layer on and off in real time.

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
# Start the Vite dev server with hot reload
npm run dev

# Type-check and build a production bundle into dist/
npm run build

# Preview the production build locally
npm run preview
```

Open the URL printed by `npm run dev` (typically http://localhost:5173) in a WebGPU-capable
browser.

## What the demo shows

The whole scene is built in [src/main.ts](src/main.ts) after `DOMContentLoaded`. It creates a
`Dmd` bound to the `#output` canvas, calls `dmd.init()`, then `dmd.run()`, and adds layers:

| Layer name  | Type             | Content                                            |
|-------------|------------------|----------------------------------------------------|
| `bg`        | Canvas layer     | Static background image                             |
| `animation` | Animation layer  | Looping frame-by-frame WebP animation              |
| `video`     | Video layer      | Transparent WebM video                             |
| `matthew`   | Canvas layer     | Aligned character image                            |
| `sprite`    | Sprites layer    | Sprite sheet with queued animation sequences       |
| `text1`–`4` | Text layers      | Styled text, some with stroke or a noise effect    |

Image, video, and sprite assets are served from [public/images](public/images).

### Interactive controls

A tabbed control panel below the canvas ([src/controls.ts](src/controls.ts)) provides per-layer
controls:

- **Global (DMD)** tab: brightness slider, fade in/out buttons with easing and duration selectors
- **Per-layer** tabs: visibility checkbox, opacity slider, fade in/out buttons (disabled when
  already at target opacity), easing selector, and duration slider
- **Layer-specific** controls: play/pause/stop for animation and video layers, text input and
  color picker for text layers, run/stop for sprite layers

## Project structure

```
Demo/
├── index.html        # Canvas + checkbox controls
├── vite.config.js    # Vite config (base './', tsc-watch plugin)
├── tsconfig.json     # TypeScript (bundler resolution)
├── src/
│   └── main.ts       # Demo logic: builds the Dmd and its layers
└── public/
    └── images/       # Backgrounds, animations, noises, sprites, video
```
