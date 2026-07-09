# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

H5DMD is a WebGPU-based virtual DMD (dot-matrix display, the segmented pixel displays used on
pinball machines) rendering library for the browser. It's published to npm as `h5dmd`. The
library source lives at the repo root (`src/`); `Demo/` is a separate Vite app that consumes the
built library to showcase it and is not part of the published package.

## Commands

Run from the repo root unless noted:

```
npm run build          # tsc -> dist/
npm run watch          # tsc --watch
npm run lint           # eslint .
npm test               # vitest run
npm run test:watch     # vitest (watch mode)
npm run test:coverage  # vitest run --coverage (thresholds enforced, see vitest.config.ts)
npm run build:docs     # typedoc -> docs/
```

Run a single test file or test case:

```
npx vitest run tests/layer-group.spec.ts
npx vitest run -t "test name substring"
```

Demo app (separate package, in `Demo/`): see [Demo/README.md](Demo/README.md). It imports the
library as the bare `h5dmd` package, so it needs the root library built and linked first
(`npm run build && npm link` at the root, then `npm link h5dmd` inside `Demo/`) before
`cd Demo && npm run dev`.

CI (`.github/workflows/ci.yml`) runs on PRs to `main`: `npm run lint`, `npm run test:coverage`,
`npm run build`. The `release` workflow additionally verifies that the git tag, `package.json`
version, and `Dmd.version` (in `src/dmd.ts`) all match before publishing — see "Releasing" below.

## Architecture

### Layer composition model

`Dmd` (`src/dmd.ts`) owns an output `<canvas>` and a flat, z-ordered set of top-level layers. Each
render tick (`renderDMD()`, driven by `requestAnimationFrame`):

1. Fills a CPU-side `OffscreenBuffer` (`src/utils/offscreen-buffer.ts`) with the background color.
2. Composites every visible+loaded layer's own canvas onto it in zIndex order
   (`compositeSortedLayers`, in `src/layers/layer-factory.ts`).
3. Hands the resulting `ImageData` to `DmdRenderer.renderFrame()`, which runs it through a WebGPU
   compute pass (brightness/off-dot-color remap, then expansion into dot cells) and presents it to
   the canvas. See [rendering.md](rendering.md) for the full per-frame GPU pipeline (sequence
   diagram, compute shader logic, buffer/bind-group layout).

All layer classes (`src/layers/`: `CanvasLayer`, `VideoLayer`, `AnimationLayer`, `SpritesLayer`,
`TextLayer`, `LayerGroup`) extend `BaseLayer` (`src/layers/base-layer.ts`), which owns:

- Its own render loop: draws into a `_contentBuffer`, runs it through that layer's own
  `_defaultRenderQueue` of `LayerRenderer`s (see below), then blits the result — plus optional
  background color/opacity and border — into `_outputBuffer`, whose canvas is what the parent
  composites.
- Visibility/opacity state, including `fadeIn`/`fadeOut` (opacity tweens via `Easing` functions,
  `src/utils/easing.ts`).
- Renderer lifecycle: renderers can be declared up front via the `renderers` option
  (`rendererEntry()` for compile-time-checked params) or attached later with the async
  `addRenderer()`; `deactivateRenderer`/`activateRenderer` pause/resume without destroying state.

`LayerGroup` (`src/layers/layer-group.ts`) is a `BaseLayer` subclass that draws nothing itself:
its `_contentBuffer` is instead recomposited each frame from its own flat set of child layers
(which may themselves be `LayerGroup`s, nesting arbitrarily deep), reusing the exact same
`compositeSortedLayers`/`resolveLayerPosition` helpers `Dmd` uses for its top-level layers. Hiding
a group cascades `setVisibility(false)` to every child (actually pausing e.g. a child
`VideoLayer`, not just hiding it) and restores each child's own prior visibility when the group is
shown again.

`src/layers/layer-factory.ts` is shared, container-agnostic logic used by both `Dmd` and
`LayerGroup`: `createLayerInstance` (the `layerClass === XLayer` switch backing `addLayer()`),
`resolveLayerPosition` (turns `hAlign`/`vAlign`/`*To*Of` constraint fields into absolute
top/left — constraints position a layer against a sibling or `'parent'`), and
`compositeSortedLayers`.

### Renderer model (GPU effects)

`src/renderers/renderer.ts` (`Renderer`) is the abstract base for anything that touches the GPU.
All renderer instances share one lazily-initialized `GPUDevice`/`GPUAdapter`
(`Renderer.requestSharedDevice()`) to avoid exhausting browser GPU resource limits.

`src/renderers/layer-renderer.ts` (`LayerRenderer<O>`) extends `Renderer` for per-layer effects
(`ChromaKeyRenderer`, `ShakyRenderer`, `NoiseEffectRenderer`, `OutlineRenderer`,
`RemoveAliasingRenderer`, `RemoveAlphaRenderer`, `ChangeAlphaRenderer` — all in `src/renderers/`).
Each processes a frame via a WebGPU compute shader and reads the result back through
double-buffered `GPUBuffer`s (`_submitAndReadback`) so a still-mapped buffer from the prior frame
doesn't stall the render loop (in that case the frame is dropped, not blocked on). A `LayerRenderer`
is constructed with the *owning layer's* width/height so its buffers always match the frames it
receives — this is why `addRenderer()` callers never pass dimensions themselves.

`DmdRenderer` (`src/renderers/dmd-renderer.ts`) is the top-level, non-layer renderer that turns
the fully-composited DMD-resolution frame into the final on-screen dot grid (brightness,
off-dot-color, monochrome mode, dot shape/size/spacing) — see [rendering.md](rendering.md).

### Options

`Options` (`src/utils/options.ts`) is a typed `Map` subclass used for all layer/DMD constructor
options: `merge()` returns a new `Options` (never mutates the receiver), and array values are
copied on merge so instances never share a mutable reference. Layer option interfaces
(`src/interfaces/*layer-options.ts`) parametrize `Options<T>` for compile-time key/value checking.

### Public API surface

`src/index.ts` re-exports everything (`dmd`, `enums`, `interfaces`, `layers`, `renderers`,
`utils`) — that barrel is the package's public API (`main`/`types` in `package.json` point at the
built `dist/index.js`/`dist/index.d.ts`). When adding a new public class/type, export it from the
relevant subdirectory's own `index.ts` so it's picked up here.

## Testing

- Vitest + `jsdom` environment; `tests/**/*.{test,spec}.ts` mirror `src/` structure roughly
  one-to-one per class.
- No real GPU in CI: `tests/helpers/fake-gpu.ts` provides `makeFakeDevice`/`makeFakeGpu` stubs
  covering the WebGPU calls `LayerRenderer`/`Renderer` subclasses make (shader compilation,
  buffers, bind groups, compute pipeline, command encoder). Use these instead of hand-rolling GPU
  mocks in new renderer tests.
- `vitest-canvas-mock` (wired in `vitest.setup.ts`) stubs 2D canvas operations.
- Coverage thresholds are enforced in `vitest.config.ts` (currently ~88%/78%/87%/88% for
  statements/branches/functions/lines) and CI fails the build if a change drops below them.

## TypeScript strictness

`tsconfig.json` has `strict: true` but explicitly defers `strictNullChecks`,
`strictPropertyInitialization`, and `strictFunctionTypes` (see the comment in that file) — a
pre-existing decision to tighten incrementally, not an oversight. Don't "fix" this by enabling
them repo-wide as a drive-by; that's a deliberate, separate migration.

## Releasing

Version lives in three places that must agree: `package.json`, `Dmd.version` in `src/dmd.ts`, and
the git tag. Use `npm version patch|minor|major` — the `version` lifecycle script
(`scripts/sync-version.mjs`) rewrites and stages `src/dmd.ts` automatically so both land in the
same commit — then `git push --follow-tags` and publish a GitHub Release against the new tag,
which triggers `.github/workflows/release.yml`.
