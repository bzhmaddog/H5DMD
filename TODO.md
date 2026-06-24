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

- ⬜ **M1 — `OffscreenBuffer` ignores null context** · `src/utils/offscreen-buffer.ts`
- ⬜ **M2 — `ImageBitmap` objects never `.close()`d** · `base-layer.ts`, `dmd.ts`
- ⬜ **M3 — FPS box never removed from DOM** · `src/dmd.ts`
- ⬜ **M4 — `_int2Hex` not clamped to 0–255** · `src/renderers/dmd-renderer.ts`
- ⬜ **M5 — `fadeIn`/`fadeOut` use `setTimeout(cb, 1)`** · `src/dmd.ts`
- ⬜ **M6 — `addRenderer` guard message misleading** · `src/dmd.ts`

---

## 🟢 Low (cleanliness / type hygiene)

- ⬜ **L1 — Dead no-op string statements** · `src/layers/video-layer.ts`
- ⬜ **L2 — `_isRunning` set but never checked** · `src/dmd.ts`
- ⬜ **L3 — `_startTime` typed `number | undefined` but compared `=== null`** · `src/utils/sprite.ts`
- ⬜ **L4 — Spelling (`Dictionnary`, `beeing`, `treshold`, ...)** · multiple
- ⬜ **L5 — Magic `-1` offsets & large commented-out blocks** · `dmd.ts`, `text-layer.ts`
- ⬜ **L6 — `Options.merge` is shallow (shared refs)** · `src/utils/options.ts`
- ⬜ **L7 — `Dmd.version` duplicated (static + getter, manual sync)** · `src/dmd.ts`
