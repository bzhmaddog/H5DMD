# H5DMD — Bug & Improvement Tracker

Status legend: ⬜ not started · 🟦 in progress · ✅ done · 🧪 proof test written

---

## 🔴 Critical (freezes, broken features, hangs)

- ✅ **C1 — `adjustWidth` infinite loop** · `src/layers/text-layer.ts`
  Fixed: the loop now decrements the `fontSize` value actually used to build the
  font string, with a minimum-size floor guaranteeing termination even when the
  text can never fully fit.
  _Regression test:_ `tests/bugs/text-layer.bug.spec.ts`

- ✅ **C2 — WebGPU init can hang / no fallback** · `src/renderers/*`, `src/dmd.ts`
  Fixed: all 7 renderer `init()` methods now guard a missing `navigator.gpu` and a
  null adapter, and add `.catch(reject)` so failures surface. `Dmd.init()`
  propagates the rejection and `BaseLayer` logs renderer-init failures.
  _Regression test:_ `tests/bugs/renderer-init.bug.spec.ts`

- ✅ **C3 — `VideoLayer` visibility guard** · `src/layers/video-layer.ts`
  Already fixed in the current source (`if (!this.isVisible())`). The earlier
  analysis was based on a stale version. Locked in by a regression test.
  _Regression test:_ `tests/bugs/video-layer.bug.spec.ts`

- ✅ **C4 — `AnimationLayer` registers wrong layer type** · `src/layers/animation-layer.ts`
  Fixed: constructor now passes `LayerType.Animation` to `super()`.
  _Regression test:_ `tests/layer-type.spec.ts` (covers all 5 layer types)

---

## 🟠 High (incorrect behavior)

- ✅ **H1 — `fadeIn` easing uses wrong delta** · `src/dmd.ts`
  Fixed: change arg is now `1 - startBrightness` so the fade lands on full
  brightness instead of overshooting (and finishing early).
- ✅ **H2 — `DmdRenderer` ignores `brightness` arg** · `src/renderers/dmd-renderer.ts`
  Fixed: the second guard now tests `typeof brightness === 'number'`.
- ✅ **H3 — `previousFrame` skips frame 0** · `src/layers/animation-layer.ts`
  Fixed: wrap condition is now `prevFrame < 0`.
- ✅ **H4 — `pauseOnHide` typo (`pausepOnHide`)** · `src/layers/video-layer.ts`
  Fixed: visibility guard now reads `pauseOnHide`.
- ✅ **H5 — Missing `duration` default for animations** · `src/layers/animation-layer.ts`
  Fixed: layer options default `duration: 1000`, so `_frameDuration` is finite.
- ✅ **H6 — Unstable layer sort** · `src/dmd.ts`
  Fixed: comparator is now `a.zIndex - b.zIndex` (returns 0 for ties).

_Regression tests:_ `tests/bugs/high-priority.bug.spec.ts`

---

## 🟡 Medium (robustness, resources, memory)

- ✅ **M1 — `OffscreenBuffer` ignores null context** · `src/utils/offscreen-buffer.ts`
  Fixed: the constructor now throws if `getContext('2d')` returns `null` instead
  of silently storing a null context.
- ✅ **M2 — `ImageBitmap` objects never `.close()`d** · `base-layer.ts`, `dmd.ts`
  Fixed: every per-frame `createImageBitmap` result is now `.close()`d right after
  it is drawn into its buffer, freeing the bitmap each frame.
- ✅ **M3 — FPS box never removed from DOM** · `src/dmd.ts`
  Fixed: box creation is extracted to a helper; `stop()` removes it from the DOM
  and `run()` recreates it when `showFPS` is enabled.
- ✅ **M4 — `_int2Hex` not clamped to 0–255** · `src/renderers/dmd-renderer.ts`
  Fixed: the value is rounded and clamped to 0–255 so the result is always exactly
  two hex digits.
- ✅ **M5 — `fadeIn`/`fadeOut` use `setTimeout(cb, 1)`** · `src/dmd.ts`
  Fixed: both fades now schedule the next step with `requestAnimationFrame`.
- ✅ **M6 — `addRenderer` guard message misleading** · `src/dmd.ts`
  Fixed: the message now refers to `Dmd.run()` (the actual `_isRunning` trigger).

_Regression tests:_ `tests/bugs/medium-priority.bug.spec.ts`

---

## 🟢 Low (cleanliness / type hygiene)

- ✅ **L1 — Dead no-op string statements** · `src/layers/video-layer.ts`
  Fixed: the `function(){"End of video rendering"}` no-op bodies in `_pause`/`_stop`
  are now empty functions.
- ✅ **L2 — `_isRunning` set but never checked** · `src/dmd.ts`
  Fixed: `run()` now returns early when `_isRunning` is already true, preventing a
  second render loop.
- ✅ **L3 — `_startTime` typed `number | undefined` but compared `=== null`** · `src/utils/sprite.ts`
  Fixed: the sentinel is now `undefined` everywhere, matching the optional type.
- ✅ **L4 — Spelling (`Dictionnary`, `beeing`, `treshold`, ...)** · multiple
  Fixed: internal type names (`*Dictionnary` → `*Dictionary`), the two interface
  file names, `treshold` → `threshold` (WGSL field + option key), and assorted
  comment/log typos (`beeing`, `autplay`, `ouput`, `betwewn`, `Fase`).
- ✅ **L5 — Magic `-1` offsets & large commented-out blocks** · `dmd.ts`, `text-layer.ts`
  Fixed: removed the dead commented-out debug blocks in `renderDMD`.
- ✅ **L6 — `Options.merge` is shallow (shared refs)** · `src/utils/options.ts`
  Fixed: array values are now cloned on merge/copy so merged Options never share a
  mutable reference with their source.
- ✅ **L7 — `Dmd.version` duplicated (static + getter, manual sync)** · `src/dmd.ts`
  Fixed: the literal lives only in the static `version`; the instance getter
  delegates to it (single source of truth, documented).
- ✅ **L8 — `getContext('2d')` overload not resolved (returns `RenderingContext`)** · `src/utils/offscreen-buffer.ts`
  Fixed: `options` is now typed `CanvasRenderingContext2DSettings | undefined`
  (was inferred `any` from `let options = null`), so the `'2d'` overload is
  selected and the context narrows to `CanvasRenderingContext2D`.

_Regression tests:_ `tests/bugs/low-priority.bug.spec.ts` (L2, L6)

---

## ⚡ Performance — DmdRenderer Optimization

### Phase 1: Quick Wins ✅
- ✅ **P1 — Remove dead shader variable** · `src/renderers/dmd-renderer.ts`
  Fixed: removed unused `var t : u32 = r + g + b` from the WGSL compute shader.
- ✅ **P2 — Pre-allocate uniform Float32Array** · `src/renderers/dmd-renderer.ts`
  Fixed: `_uniformTypedArray` is allocated once in the constructor; `_doRendering`
  now writes `[0]` each frame instead of allocating a new `Float32Array`.

### Phase 2: Double-Buffered Output ✅
- ✅ **P3 — Alternate output buffers** · `src/renderers/dmd-renderer.ts`
  Fixed: two MAP_READ buffers are created; `_doRendering` alternates between them
  each frame (`_currentBufferIndex` flips 0↔1), allowing the GPU to write to one
  buffer while the CPU reads from the other.

### Phase 3: Render-to-Texture (zero readback) ⬜
- ⬜ **P4 — WebGPU canvas context** · `src/dmd.ts`, `src/renderers/dmd-renderer.ts`
  Configure output canvas with `getContext('webgpu')` instead of `'2d'`.
  Requires the Dmd class to pass the canvas differently to the renderer.
- ⬜ **P5 — Fullscreen render pass** · `src/renderers/dmd-renderer.ts`
  Add a vertex + fragment shader that draws the compute output buffer as a
  fullscreen textured quad. Present via `getCurrentTexture()`.
  Eliminates: `mapAsync`, `Uint8ClampedArray` copy, `ImageData`, `drawImage`.
- ⬜ **P6 — Remove readback path** · `src/renderers/dmd-renderer.ts`
  Once P4+P5 are stable, remove the `_outputBuffer` MAP_READ buffer and the
  `mapAsync` code path entirely.

### Phase 4: Future / Polish ⬜
- ⬜ **P7 — Timestamp queries** · `src/renderers/dmd-renderer.ts`
  Add `timestamp-query` feature + `GPUQuerySet` to measure actual GPU execution
  time per frame for profiling.
- ⬜ **P8 — Texture sampling for dot spacing** · `src/renderers/dmd-renderer.ts`
  Evaluate replacing the inner write loop with a texture sample approach —
  compute shader writes to a texture, render pass samples with nearest filtering
  and a dot-mask texture/pattern.
- ⬜ **P9 — Render bundles** · `src/renderers/dmd-renderer.ts`
  Pre-record the fullscreen quad draw call in a render bundle to reduce per-frame
  CPU overhead.
