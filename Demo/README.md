# H5DMD Demo

An interactive [Vite](https://vitejs.dev/) + TypeScript application that demonstrates the
[H5DMD](../README.md) library — a virtual DMD (Dot Matrix Display) rendered with HTML5 Canvas
and WebGPU.

This is a Vite multi-page app (not an SPA): [index.html](index.html) is a small landing page
that links out to three standalone demo pages, each with its own `Dmd` instance and canvas:

- **[simple.html](simple.html)** — the main demo. Renders a 256×78 dot display (on a
  1280×390 canvas) and stacks several layer types on top of each other, with a tabbed
  control panel below the canvas to tweak every aspect of the display and each layer in
  real time.
- **[advanced.html](advanced.html)** — showcases the `LayerGroup` feature (see
  [Advanced demo: Layer Groups](#advanced-demo-layer-groups) below).
- **[scoreboard.html](scoreboard.html)** — a pinball-style scoreboard built entirely out of
  `LayerGroup`s (see [Pinball scoreboard demo](#pinball-scoreboard-demo) below).

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
browser — that's the landing page; follow the links to `simple.html`, `advanced.html` or
`scoreboard.html`.

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
| `text1`–`text4`   | Text layers      | Styled text — `text2` with noise effect, `text3` with shaky effect |

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

## Advanced demo: Layer Groups

[advanced.html](advanced.html) showcases `LayerGroup`, reachable from the landing page or via
the link next to the version number on `simple.html`. It's built in
[src/advanced-layers.ts](src/advanced-layers.ts) /
[src/advanced-controls.ts](src/advanced-controls.ts) with a simpler, focused control panel
(no tabs) instead of the main demo's full per-layer panel machinery. It adds three
independent top-level `LayerGroup`s:

The DMD is tiled into four quadrants (top-left/top-right/bottom-left/bottom-right), each
one group with a distinct translucent background color so its bounds are visible:

| Group (quadrant)            | Demonstrates                                                                 |
|------------------------------|-------------------------------------------------------------------------------|
| `video-panel` (top-left, red) | Hiding the group cascades `setVisibility(false)` to a child `VideoLayer`, actually pausing playback rather than just hiding it visually. Also has a `ChromaKeyRenderer` on the video child. |
| `hud` (top-right, green)     | Background color/opacity, a group-level renderer (`ShakyRenderer` — shakes the composited label *and* nested badge together), and one level of nesting via a `badge` subgroup (hidden by default, to show the visibility cascade restoring each child's own prior state). |
| `sandbox` (bottom-left, yellow) | `addLayer`/`removeLayer`/`getLayer` driven live from buttons (add a randomly placed/colored box, remove the last one added). |
| `info` (bottom-right, blue)  | A minimal group: just dimensioned/positioned with a background and a single `TextLayer` child. |

The control panel (`Demo/src/advanced-controls.ts`) lays its sections out in a 2×2 grid
matching the DMD's own quadrant layout, with each section's border tinted to match.

## Pinball scoreboard demo

[scoreboard.html](scoreboard.html) is a second `LayerGroup` showcase, framed as a realistic
use case rather than an abstract feature list: a pinball-style scoreboard where each visual
element is a compound graphic made of several `TextLayer`s that need to move, show/hide, or
fade together as a single unit — exactly the problem `LayerGroup` solves. Built in
[src/scoreboard-layers.ts](src/scoreboard-layers.ts) /
[src/scoreboard-controls.ts](src/scoreboard-controls.ts):

| Group    | Content                                    | Demonstrates |
|----------|---------------------------------------------|--------------|
| `score`  | One outlined `TextLayer` (score digits)      | A single-child group used purely for positioning/visibility/fade of a styled compound element. |
| `player` | Two `TextLayer`s: "P" label + player number   | A 2-`TextLayer` compound element ("P1") updated and shown/hidden as one unit. |
| `ball`   | Two `TextLayer`s: "BALL" label + ball number | Same pattern as `player`, for the ball indicator ("BALL 1"). |

The control panel exposes, per group: a visibility checkbox and the relevant content
buttons (`+100`/`+1000`/`Reset` for the score, `Next player`/`Next ball` for the other two).

## Project structure

```
Demo/
├── index.html            # Landing page — links to simple.html, advanced.html, scoreboard.html
├── simple.html           # HTML shell for the main demo — canvas and control panel mounts
├── advanced.html         # HTML shell for the Layer Groups showcase page
├── scoreboard.html       # HTML shell for the pinball scoreboard showcase page
├── vite.config.js        # Vite config (base '/H5DMD/', tsc-watch plugin, multi-page build)
├── tsconfig.json         # TypeScript (bundler resolution)
├── src/
│   ├── landing.ts             # Entry point for index.html (just displays the version)
│   ├── main.ts                # Entry point for simple.html: creates Dmd, wires up layers and controls
│   ├── layers.ts               # Builds and adds all demo layers to the Dmd instance
│   ├── controls.ts             # Builds the tabbed control panel
│   ├── advanced-main.ts        # Entry point for advanced.html
│   ├── advanced-layers.ts      # Builds the video-panel/hud/sandbox/info LayerGroups
│   ├── advanced-controls.ts    # Builds the showcase page's focused control panel
│   ├── scoreboard-main.ts      # Entry point for scoreboard.html
│   ├── scoreboard-layers.ts    # Builds the score/player/ball LayerGroups
│   ├── scoreboard-controls.ts  # Builds the scoreboard page's focused control panel
│   └── style.scss             # All demo styles (compiled by Vite via sass)
└── public/
    └── images/          # Backgrounds, animations, noises, sprites, video
```
