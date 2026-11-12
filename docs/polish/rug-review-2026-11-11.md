# Living Room GP (rug) - Polish Assessment, Phase 1

Date 2026-11-11. Reviewer: automated polish pass. Game folder: `/Users/sharajrewoo/DemoReposQA/arcadeShop/rug`. Read-only review; no game files changed.
Shots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/rug-*.png` (prefix `rug-desk-*` = 1280x800, `rug-ph-*` = 400x860 touch). Scripts in the scratchpad `pwtools/rug-*.mjs`.
Hard constraint for every item: `window.__rug.sim()` finish times on the 6 original maps stay bit-identical (sol 31.954166666665174, sol-twist 36.39583333333533, sol-mirror 34.0958333333335, claude 29.11249999999867, claude-bend 31.591666666665194, claude-wild 32.46249999999887). Baseline re-measured this session on the default map: `sim()` = 32.46249999999887 (matches).

## Scorecard (1-5)

| Area | Score | Reason |
|---|---|---|
| UI | 4 | Cohesive toy/LEGO identity and clear desktop HUD; but HUD text is ~8px on a phone and a few overlaps remain. |
| UX | 3 | Menus are quick, but Esc / the phone menu button forfeits a race instantly with no pause, and the first-run hint omits steering. |
| Gameplay | 4 | Rich model (nitro, drift mini-turbo, ghost, 8 car tunings, 4 AI levels, 0-5 opponents); human difficulty curve could not be measured headless. |
| Graphics | 4 | Strong rug/diorama look, themes, bloom, sparks; Round/Runner rugs look empty and the Maps panel hides the preview. |
| Audio | 3 | Pure-synth engine/jump/hit/boost are solid, but lap, split, drift, wrong-way, nitro-ready and UI have no sound; one master slider only. |
| Accessibility | 2 | No reduced-motion, no colour-blind or HUD-scale options, touch targets 27-39px, tiny phone HUD text, no text plates under some HUD text. |
| Performance | 3 | Could not measure real GPU fps (software GL only); static review shows a single 806 kB chunk and per-frame allocations. Adaptive resolution exists. |
| Robustness | 4 | Corrupt localStorage, key-mashing across all modes, and 1280<->400 resize produced zero page errors; no pause/auto-pause and debug hooks ship in prod. |

## Top 3 ("if you only do three")

1. RUG-01: Add a real pause (Esc/P/phone menu button) with Resume / Restart / Quit and auto-pause on tab hide; today Esc or the 39px menu button silently forfeits the race.
2. RUG-02 + RUG-03: Make the phone UI usable: >=44px touch targets everywhere and a floor of ~11px on HUD text (currently ~8px derived from `--u`).
3. RUG-04: Honour `prefers-reduced-motion` and add a "Reduce motion" setting (infinite CSS animations and camera shake currently ignore it).

## Method notes

- Library checklists (ux-review, playtest-report, balance-check; ux-designer, art-director, technical-artist, sound-designer, game-designer, accessibility-specialist, qa-lead; ui-code and gameplay-code rules) were distilled into: UI never owns state, all strings centralised, motion skippable, UI sounds through an audio event layer, scalable text and colour-blind modes, gameplay values from config, delta-time use, 4.5:1 / 3:1 contrast, 44px targets, pause always available, full keyboard path, separate volume channels, and perf budgets. Godot/Unity/Unreal-specific parts were ignored.
- Played with an isolated Playwright 1.48.2 Chromium (SwiftShader software GL, `--use-gl=swiftshader`), real keyboard/mouse/touch. Title, settings, maps (8 of 9 previews), garage (random and classic), intro, countdown, race, drift, boost, camera change, Esc-to-grab, finish/results (phone, autopilot at timeScale 12), corrupted-storage reload, key mashing, resize.
- Software GL gave 1.7 fps in-race (max frame 766 ms), so FPS numbers are NOT representative of real devices; they are reported only as a limitation.
- Console during all runs: 0 page errors, 0 failed requests. Warnings only: SwiftShader "GPU stall due to ReadPixels" (x4) and "KHR_parallel_shader_compile not supported" (software GL artefacts).

## Full prioritised list

Severity: S1 broken, S2 significant, S3 polish-worthy, S4 nice-to-have. Effort S/M/L.

### S2

**RUG-01 | UX / Robustness | S2 | Esc and the phone menu button abandon the race instantly (no pause)**
- Evidence: `src/main/input.js:159` (`(mode==="race"||mode==="intro") && pressed("Escape")) startGrab()`), `src/input/touchControls.js:23` (`t-menu` sends `Escape`), measured `.t-menu` 39x39px at (345,11) next to the minimap. Screenshot `rug-desk-11-esc.png` (grab hand removes the car, mode goes `grab` -> `outro` -> `title`, observed `afterEsc: "grab"`). The only pause is the debug flag `window.__rug.pause`. Key-mash run: Enter -> Esc 120 ms later returns to title.
- Change: add a `paused` mode: Esc / P / the menu button open a modal (Resume, Restart, Quit to menu, Settings). While paused, skip `updateMode`/sim stepping (dt = 0, same path as the debug pause), duck engine gain to 0 via `sfx.engine({active:false})`. Quit goes to the existing grab sequence. Auto-pause on `visibilitychange` hidden and `window` blur during intro/race. Enlarge the touch menu button to 52px and move it away from the minimap. Add `Resume` focus trap and `aria-modal`.
- Effort: M. Risk: do not change `Race.step`/accumulator maths; pausing only withholds calls. Classic fidelity unaffected (original had no pause). Sim determinism: `sim()` uses its own demo stepping, so untouched.
- Verify: Playwright: start race, press Esc, assert `__rug.race.player.x/z` unchanged for 2 s, Resume continues, Quit reaches title; hidden-tab test via `page.evaluate` dispatching `visibilitychange`; run `sim()` for all 6 maps and compare to the numbers above.

**RUG-02 | Accessibility / UI | S2 | Touch targets below 44px**
- Evidence (400x860 touch, measured): settings options 27x34 (digits 0-5, laps) up to 103x34; `--` `src/settings.css:56` `min-height: max(calc(var(--u)*62), 34px)`; garage colour swatches 39x39; sound button 39x39; menu button 39x39; results Save 69x34, Skip 64x34, name input 235x34; maps chips 36px high. Touch BOOST 89, JUMP 81, reset 52, stick 174 are fine. Screenshots `rug-ph-02-settings.png`, `rug-ph-04-garage.png`.
- Change: set `.set-opts button`, `.gar-row` buttons, `.maps-list` chips, `.res-send/.res-skip/.res-name`, `.sound-btn`, `.t-menu` to `min-height: 44px; min-width: 44px` (settings: `min-width: 44px` so digits stay 44 wide; `gap: 8px`). Because the settings panel is already scrollable only at its current size, make `.set-panel` `overflow-y:auto; max-height: calc(100dvh - 140px)` so the larger targets still fit (currently panel is 154..754 of 860, so about 100px headroom is not enough for +10px on 12 rows).
- Effort: S-M. Risk: layout reflow of `.gar-panel`; none for sim.
- Verify: re-run `rug-phone.mjs` and assert every interactive rect >= 44x44; check no horizontal scroll (`scrollWidth === 400`, currently passes).

**RUG-03 | UI | S2 | HUD text is ~8px on phones**
- Evidence: every HUD size is `calc(var(--u) * N)` with `--u = width/1080` in vertical layout (`src/main/layout.js:56`); at 400px, `--u = 0.37`. Desktop computed values (u=0.7407): stat label 16.3px (22u), gap name 19.3px (26u), hint 17.8px (24u), nitro key 19.3px (26u). Phone derived: stat label ~8.1px, gap name ~9.6px, key chip ~9.6px. Screenshot `rug-ph-06-race2.png` (VS BEST / BEST LAP / DRIFT rows barely legible); `rug-ph-07-finish.png`. Only the settings panel has a floor (`max(...,12px)`).
- Change: introduce `--hud-min: 11px` and wrap HUD font sizes in `max(calc(var(--u)*N), var(--hud-min))` for `.stat .k`, `.gaps .gap span`, `.gaps .gap i`, `.bl-key`, `.split-pop`, `.dp-event`. Move the stats block into a two-line compact layout in `.vertical`. Consider rendering the lap-stat block only on demand on phones (it is 85px high at the top-left over the road).
- Effort: S. Risk: HUD collisions in portrait (check `.gaps` top 156-195 vs `.stats` top 219 vs minimap 110-191 on 400x860). Sim: none.
- Verify: computed font-size >= 11px for all `.hud *` text nodes at 400x860 and 360x640; screenshot compare; confirm no overlaps via bounding boxes.

**RUG-04 | Accessibility | S2 | No reduced-motion support**
- Evidence: `grep` finds zero `@media` rules in `src/*.css` and no `matchMedia("(prefers-reduced-motion")`. Infinite animations: `style.css:211` (stripes 0.35s), `:408` float, `:449` pulse, `:1224` logo hop, `:1251` button sway, `hud-extra.css:63` boostReady. With `reducedMotion:'reduce'` emulated, measured `getComputedStyle(.key-btn).animationName = "sway"` and `.logo b = "hop"` (also made Playwright report title buttons as "not stable"). Camera shake `CameraRig.js:257-260` (`shake` set by hits/turbo/bootstrap `0.55`). Also nothing is skippable (banner 2.4s, intro dive 2.8s forced on first run).
- Change: add `@media (prefers-reduced-motion: reduce)` setting `animation: none` for the loops above and a "Reduce motion" setting (`SETTING_OPTIONS.reduceMotion: [false,true]`, default from matchMedia) that sets a body class and zeroes `cameraRig.shake`, disables boost FOV jitter and screen-edge motion; make the intro dive skippable with any key. Keep the logo/button hop for the default.
- Effort: M. Risk: `cameraRig.shake` is visual only (not read by physics; verify). Sim: none.
- Verify: Playwright `emulateMedia({reducedMotion:'reduce'})` then assert no running infinite animations (`document.getAnimations().filter(a=>a.effect.getTiming().iterations===Infinity)` is empty) and shake stays 0 after a collision.

### S3

**RUG-05 | UI / Bug | S3 | Gap rows keep a stale name and "-0.0s" when the neighbour disappears**
- Evidence: `src/ui/raceHud.js:75-82`: `fill()` returns early on `!car` without clearing text, so the faded (`.gap.off {opacity:.25}`, `hud-extra.css:125`) row still shows the previous car. Measured at 4th place: `gapAhead = "+4.3s Black Pickup"`, `gapBehind = "-0.0s Black Pickup"` (same name in both rows). Screenshots `rug-desk-08-drift.png`, `rug-desk-09-boost.png`, `rug-ph-06-race2.png` (ghost row "-0.0s Silver Van"), `rug-ph-07-finish.png`. This is the "duplicate opponent name" seen in the known issues; names themselves are unique (`garage.js` colour+model, cars 1-3 get distinct colours).
- Change: in `fill()` when `!car`, set `b` to `""` (or `--`) and `span` to `""` and hide the row (`visibility:hidden` instead of 25% opacity); keep layout height by `visibility`.
- Effort: S. Risk: none. Add a unit test for `updateGaps` with the leader/last cases (pure DOM mock). Sim: none.
- Verify: unit test plus Playwright at 1st place and last place asserts the empty row has no text.

**RUG-06 | UI | S3 | Controls hint overlaps the minimap and sits mid-screen**
- Evidence: measured `.hint` rect 312-968 x 577-615 vs `.minimap` 959-1253 x 564-774 at 1280x800 (9px horizontal overlap, full vertical overlap); hint lies over the player car (`rug-desk-08-drift.png`). `src/hud-extra.css:80` overrides the base `bottom:46u` with `bottom:250u`.
- Change: `.hint { left: 40u; transform:none; max-width: calc(100% - minimap width - 120u); white-space: normal; bottom: 250u }` or move it above the nitro bar (left-aligned over `.boost`). Fade it after the first 12 s of the first lap and on the first pad pickup. Keep hidden on touch (`style.css:721`).
- Effort: S. Verify: bounding-box test `hint.right <= minimap.left - 16` at 1280x800, 1024x600, 1920x1080.

**RUG-07 | UX / Onboarding | S3 | First 30 seconds: no goal text, hint omits steering and throttle**
- Evidence: title has only a tagline "A toy car race on the play rug" (`template.js` ~62); the in-race `.hint` lists Shift, Space, S+turn, C, R but not W/A/S/D or arrows (`template.js` last line). There is no explanation of boost pads, drift mini-turbo tiers or "first to finish 3 laps". The `H` key to hide UI and `V` to flip orientation are undocumented. `rug-desk-07-race.png`.
- Change: first-run only (localStorage flag `rug-racers-seen`), show a 3-step card before the countdown: "WASD / arrows drive", "Hold Shift for nitro, grab batteries to refill", "Hold S while turning to drift; longer drift = bigger boost"; add "Press ? / tap" to replay. Put WASD/Arrows first in `.hint`. Add an `H`/`V` line to settings footer.
- Effort: M. Risk: must not delay the race clock for returning players; sim: none. Strings in a `strings.js` (see RUG-17/18).
- Verify: clear storage, load, confirm card, dismiss with any key, reload and confirm it does not reappear; measure time-to-first-input.

**RUG-08 | Gameplay / UI | S3 | Touch players have no camera button and no nitro readout; nitro bar crowds the stick**
- Evidence: touch buttons are only BOOST, JUMP, reset, menu (`touchControls.js:19-23`); `camBtn` run lists `["BOOST","JUMP","↻","☰"]`. The nitro label (name, %, key chip) is hidden on touch (measured `.boost-pct` / `.bl-key` rects 0x0), the bar sits at y 820-849 versus the stick bottom at 827 and the BOOST button shows no charge. `rug-ph-06-race2.png`. Camera can only be changed in Settings. Drift on touch requires pulling the stick down while steering, which is undiscoverable.
- Change: add `.t-cam` (`data-code="KeyC"`, 52px, to the left of reset) calling the existing `cycleCameraView`; show the nitro % over the BOOST button as a ring (CSS conic-gradient) and dim BOOST when empty; move the bar to the top centre or raise it 24px above the stick bottom; add a small DRIFT button (`KeyS`+steer assist) or a coach mark.
- Effort: M. Risk: touch layout in portrait and landscape; sim: none (key codes already handled). Known issue "no touch camera button" confirmed.
- Verify: touch test taps `.t-cam` and reads `app.cameraView`; assert bar and stick rects do not intersect.

**RUG-09 | Graphics | S3 | Round and Runner rugs look sparse**
- Evidence: preview of Round Rug `rug-desk-03-maps-6.png` shows large empty green fields inside the oval and few buildings next to the Wild City previews (`rug-desk-03-maps-5.png`). The Runner preview was not captured (see "could not check"); `CHANGES.md` section D says both maps use the seeded sol-family generator on a clipped shape.
- Change: raise prop density for shape maps: add a `density` target in `shapeRoutes`/`solArrange` for these map ids (e.g. >= 70% of Wild City props per m^2 of rug area), fill leftover fields with trees, fences, crops, ponds from the existing painters (`printFields`, `paintPond`), and add one landmark (windmill, pitch) per empty zone > N m^2. Measure by counting placed props per rug area for every map.
- Effort: M-L. Risk: new colliders change those two maps' lap times; allowed (not in the 6), but use the new maps' own RNG streams only, never the `mulberry32(4242)` order of Playmat or any generator shared with the 6 originals. Then re-record Round (23.37916666666566) and Runner (27.09166666666545) and confirm the six originals are bit-identical.
- Verify: `sim()` on all 8 maps; prop-per-area table before/after; screenshots of both.

**RUG-10 | UI | S3 | Maps panel hides most of the preview; "MAPS" title overlaps the rug**
- Evidence: 1280x800: the panel covers y 305-775 of the 800px stage, the rug preview shows only the top ~35% and "MAPS" sits on top of it (`rug-desk-03-maps-5.png`, `-6.png`). On the phone the title also sits on the preview (`rug-ph-03-maps.png`); help text is hidden. Map chips wrap to three rows.
- Change: collapse theme/pattern/floor into a single row of three dropdown-style rows or a second tab so the panel is <= 45% of height, shift the preview up and the title above it; keep `Left/Right browse`.
- Effort: M. Risk: the `maps` camera mode and `previewMap` placement; sim: none.
- Verify: screenshot at 1280x800 and 400x860, assert >= 50% of the preview visible (bounding box test).

**RUG-11 | UI | S3 | Settings open over the live title (logo and buttons ghost through the panel)**
- Evidence: `rug-desk-02-settings.png`, `rug-ph-02-settings.png`: "LIVING ROOM GP" letters and the Race/Time-trial buttons are visible behind the panel and clash with row labels.
- Change: when `openSettings` runs, hide `.title-screen` (`ui.showTitle(false)`) and show again on close, or raise `.gar-panel` background opacity to 0.94 and add a backdrop scrim.
- Effort: S. Verify: screenshot; focus returns to the Settings button on close.

**RUG-12 | Accessibility | S3 | Contrast without backing plates; measured ratios**
- Evidence (computed from `hud-extra.css`/`style.css` colours): nitro percent `#ffd650` has no background; against a light rug/wall sample (#cfcfcf / #d9c3a0) it is 1.11:1 / 1.22:1 (fine only over the dark car in the shot). Gap-ahead text `#ff9d8a` on the 75%-opaque dark pill: 8.03:1 on dark, 3.5:1 if the backdrop is white. White on green button `#1fa45a`: 3.22:1 (large text passes AA-large, small "Done" fails). White on red `#e5322b` 4.35:1; yellow button text `#23262b` on `#f2bd1d` 8.73:1; hint white on 65% dark over white 4.82:1.
- Change: give `.boost-lbl` a 55%-black pill (`background:#1e2126bf; padding: 4u 14u; border-radius: 20u`), raise the gap pill to `#1e2126e6`, darken `.gar-done` green to `#17804a` (white 4.9:1), and make `.key-btn` red `#c8271f`.
- Effort: S. Verify: contrast script against sampled screenshot pixels, target >= 4.5:1 text and 3:1 UI.

**RUG-13 | Accessibility | S3 | No colour-blind option, HUD scale or input alternatives**
- Evidence: red/green split in gap rows (`#ff9d8a` vs `#9be8b0`), delta good/bad and drift tier colours (`logic/drift.js` TIERS) carry meaning; arrows and signs back up gaps and deltas, but tiers and minimap dots are colour-only. No HUD size setting. Controls are fixed (`input.js`), drifting needs S + steer simultaneously and boost needs Shift held; no toggle mode.
- Change: add settings `hudScale` (100/125/150%, multiplies `--u` for HUD only), `colourBlind` (palette swap for gaps/tiers via CSS vars), `boostMode` hold/toggle, and key remapping for the 6 in-race actions. Label drift tiers with text ("MINI", "SUPER", "ULTRA") in the pop, not only colour.
- Effort: L. Risk: settings schema `logic/settings.js` needs defaults and validation tests; sim: none. 
- Verify: settings unit tests extended; screenshot with simulated deuteranopia filter.

**RUG-14 | Audio | S3 | Many events have no sound; one master slider only**
- Evidence: `src/audio/sfx.js` API: jump, land, hit, bricks, boost, beep, go, grab, pickup, click, finish, meow, popWave, engine. Missing: lap complete, sector split good/bad, drift start / bank / lost / tier-up, wrong-way, nitro ready / empty, position gained/lost, new best, menu confirm/back on title, results screen. Only `settingsPanel.js:26` provides a volume slider (no SFX/engine split). No music, no ambience.
- Change: add `lap()`, `split(good)`, `driftTier(tier)`, `driftBank()`, `driftLost()`, `wrongWay()`, `nitroReady()`, `overtake()`, `newBest()`; route through an event table (`audioEvents.js`: event name -> sfx) so UI/HUD emit events instead of calling sfx; add Master / SFX / Engine sliders (engine mix at `sfx.js` gains 0.05-0.14 hardcoded). Keep existing gain values for the existing sounds.
- Effort: M. Risk: drift/tracker events (`tracker.events`, `drift.events`) are drained in the HUD, not in the sim; hooking sound there is sim-neutral. Verify: stub `playTone` and assert each event triggers exactly one cue; listening pass for loudness (target peak <= -6 dBFS, engine under SFX).

**RUG-15 | Audio | S4 | Pad pickup stacks two cues; mix constants hardcoded**
- Evidence: `src/main/frame.js:116-118` plays `sfx.pickup()` and `sfx.boost()` together on every pad; `frame.js:108-111` reuses `sfx.boost()` for boost start and drift turbo (no tier distinction). Engine/rival/skid gains inline in `sfx.engine` (`0.05 + throttle*0.05`, `0.11`, `0.1`, `0.05`).
- Change: dedicated pad cue; pitch the turbo cue by tier; move gains to `config/audio.js`.
- Effort: S. Verify: unit snapshot of calls per event.

**RUG-16 | Robustness / IP | S3 | Debug and cheat hooks ship in the production build**
- Evidence: `src/main/debug.js` exposes `window.__rug` with `autopilot()`, `timeScale`, `pause`, `startDemo`, `sim()` and mutable `race`/`app` in the built site. Used in this review to autopilot to the finish at timeScale 12 (finish and results screen reached). Results screen offers a name form for a board (race, 3 laps, >=1 AI); the board server was not reachable in the sandbox so server-side validation could not be checked (`src/api/leaderboard.js`).
- Change: install hooks only when `import.meta.env.DEV` or `?debug`; keep a minimal `__rug.sim` behind `?debug` and update the test/CI scripts to open with `?debug`. Ensure the leaderboard server rejects impossible times (e.g. below `sim()` * 0.9).
- Effort: S (client) + unknown (server). Risk: external tooling and the bit-identical gate rely on `__rug.sim()`: keep the hook with `?debug`, do not alter simulateDemoFinish. Verify: production build without `?debug` has `window.__rug === undefined`; gate script passes with it.

**RUG-17 | Code quality | S3 | Hardcoded tuning outside config modules**
- Evidence: AI profiles and rubber-band numbers live in `src/race/aiDriver.js` (`AI_PROFILES`, `driveAi` 109 lines) and `logic/difficulty.js`; HUD thresholds (e.g. drift bank 1.5 s, `gaps.js` speed floor 12, `Car.nextBreak` 1.5, camera shake factors `0.03/0.6/0.12`) are inline in logic/main files. `config/physics.js` is a good model (top 37, boostTop 54, accel 34, brake 60 ...) but covers only Car physics.
- Change: add `config/ai.js`, `config/drift.js`, `config/camera.js`, `config/hud.js`; import from them; keep values identical so Normal stays x1.
- Effort: M. Risk: the 6 sim numbers are sensitive to any float change (e.g. reordering multiplications); move constants only, never refactor the arithmetic. Verify: vitest (82 tests) plus the six `sim()` numbers.

**RUG-18 | Code quality | S3 | File and function size hotspots**
- Evidence (script count): files over 300 lines: `src/style.css` 1331, `src/hud-extra.css` 398, `src/fx/Particles.js` 334 (`src/boot/loader-worker.js` 3485 is a beautified copy of a vendor loader, exclude). About 39 functions over 50 lines, worst: `layoutGenerator.generateRandomLayout` 216, `sceneryBuilder.buildScenery` 216, `obstacles.buildObstacles` 235, `rugMaterial.createRugMaterial` 213, `classicCars.buildClassicCar` 186, `legoCar.buildLegoCar` 168, `routeOverlay.paintRouteLayer` 160, `scene.createWorld` 135, `Car.step` 124, `aiDriver.driveAi` 109, `CameraRig.update` 96, `template.buildUiHtml` 97, `Particles` constructor 105, `touchControls.createTouchControls` 82. `ui/template.js` keeps all user strings inline (no strings module).
- Change: split CSS into `hud.css`, `menus.css`, `touch.css`; split HUD template into per-panel builders; leave `Car.step`, `driveAi`, `generateRandomLayout` and the sol-family scatter untouched until RUG-17 is done with the gate in CI.
- Effort: L. Risk: any edit to code reached by the 6 original maps' sim; restrict refactors to UI/CSS/build code first. Verify: 82 vitest tests and the six sim numbers after every refactor.

**RUG-19 | Performance | S3 | Single 806 kB chunk and per-frame allocations (GPU fps not measured)**
- Evidence: `npm run build` output: `index-*.js` 806.10 kB (233.71 kB gzip), `index-*.css` 32.83 kB, one chunk (Vite warns >500 kB). `src/main/frame.js` `syncCar` builds a new `WHEEL_OFFSETS.map(...)` array of arrays per car every frame (4 cars -> 20 arrays/frame at 60 fps ~1,200 small arrays/s); `Math.random()` calls in the per-frame particle branches (`frame.js:61,77,79`). Adaptive resolution (`main/loop.js`) steps 0.85x down to 0.62 with an 8 s cooldown, which is reasonable. SwiftShader fps: title 1 frame/s class, race 1.7 fps (not representative).
- Change: reuse preallocated Float32Arrays for wheel positions; `manualChunks` to split `three` from game code and lazy-load maps/garage UI; measure real fps on a mid phone (Chrome remote profile) and add an fps/long-task budget (p95 frame < 20 ms at `quality: medium`).
- Effort: M. Risk: trail positions feed `trailField` (visual only); do not touch `Car.step`. Verify: Chrome performance trace before/after; heap allocation sampling shows fewer minor GCs.

**RUG-20 | UX | S3 | Results overlay leaves the full HUD behind it**
- Evidence: `rug-ph-08-results.png`: lap badge, timer, gap rows, stats and nitro bar are all still visible behind the results card on 400x860; results card covers only the middle 283px. On desktop the HUD competes with the table.
- Change: call `ui.showHUD(false)` on entering `results`, or dim `.hud` to 0.2; stop sending `updateRaceHud` once finished.
- Effort: S. Verify: screenshot, `.hud` hidden on results.

### S4

**RUG-21 | Gameplay / Replay hooks | S4 | No target times, medals or progression**
- Evidence: only local best per map/laps (`records.js`, `rug-racers-best:*`) and ghost for time trial; `CHANGES.md` section 2. Results show "First local best set" but no goal to chase.
- Change: derive bronze/silver/gold per map from `sim()` autopilot times (e.g. 1.25x/1.12x/1.04x), show medals on map tiles and on results; optional daily seeded layout on `random`.
- Effort: M. Risk: reading sim numbers only; do not store them in code that feeds the sim. Verify: unit tests for medal thresholds; map tile screenshot.

**RUG-22 | Polish | S4 | Malformed favicon markup in `index.html`**
- Evidence: `index.html:7` has the data-URL `<link>` closed after the second `<circle>` (no `</svg>`), followed by stray `<rect ...>` tags and a dangling `</svg>" />` that the parser swallows silently (head text node check found none). The favicon likely does not render.
- Change: replace line 7 with one valid `<link rel="icon" href="data:image/svg+xml,...">` containing the full SVG. Effort: S. Verify: tab shows icon; HTML validator clean.

**RUG-23 | Graphics | S4 | Display font not shipped**
- Evidence: `src/style.css:9` font stack starts with "Nunito" and falls back to Arial Rounded / Varela Round / Segoe UI Black; there is no `@font-face` or font link anywhere in `src` or `index.html`, so Windows/Android users get a different look than the macOS captures.
- Change: self-host a subsetted Nunito Black WOFF2 (Latin only, ~15 kB) with `font-display: swap` and preload. Effort: S. Verify: `document.fonts.check` against a real face, screenshot diff on Linux/Windows Chromium.

**RUG-24 | UI | S4 | Nitro label/key chip layout has no minimum spacing**
- Evidence: known "Shift overlaps nitro %" NOT reproduced at 1280x800: `.boost-pct` 331-429 and `.bl-key` 442-502 (13px gap, "NITRO READY" label ends near 265). The label row is a single 640u flex line (`hud-extra.css:8-30`), so a longer localized name or a larger HUD scale (RUG-13) would collide.
- Change: `.boost-lbl { flex-wrap: wrap; row-gap: 4u }` and `.boost-pct { min-width: 4ch }`, `.bl-key { flex: none }`. Effort: S. Verify: bounding box test at HUD scale 150%.

**RUG-25 | Gameplay | S4 | Difficulty curve not verified; no difficulty-specific feedback**
- Evidence: the autopilot (`__rug.autopilot`, top 37, aLat 92) finished 4th on a 3-lap race at Normal, 1:13.03 vs the AI 1:02.98 / 1:07.61 / 1:08.78 (AI spread 5.8 s); this is a bot, not a human, so it only shows the AI is not trivially beatable by the default profile. Easy/Hard/Insane and rubber-band feel were not measured.
- Change: run a headless sweep of AI finish times per difficulty on the 8 maps (using `__rug.Session`), record in a `docs/balance.md`; then tune only the `difficulty.js` table (Normal stays x1). Show the chosen difficulty on the results screen.
- Effort: M. Risk: any change to `AI_PROFILES` base values changes the 6 original maps' demo-based sim; tune only the scale table for non-Normal. Verify: sim numbers unchanged and a balance table committed.

## Bugs found (with repro)

1. Stale gap row text (RUG-05): start a 3-lap race, finish the first corner in 4th (or lead at 1st); look at the top-left gap pills. The unused row shows "-0.0s <previous rival name>" faded (also the source of the "duplicate opponent name").
2. Hint overlaps minimap (RUG-06): start any race at 1280x800 within the first seconds; the hint box (x 312-968) overlaps the minimap (x 959-1253) by 9px and covers the car.
3. Esc or the phone menu button forfeits the race immediately (RUG-01): start a race, press Esc.
4. Reduced motion ignored (RUG-04): `emulateMedia({reducedMotion:'reduce'})`, load title; logo and buttons continue to hop/sway.
5. Settings over title shows the title through the panel (RUG-11).
6. Results card leaves the HUD visible behind it (RUG-20).
7. Favicon markup malformed (RUG-22).

Not reproduced: "Shift label overlaps nitro %" (desktop) and "possible duplicate opponent name" as a naming collision (names are unique; the duplicate is the stale row).

## What already works well

- Strong, cohesive visual identity: LEGO-style cars, rug diorama, readable title, good HUD hierarchy on desktop; themes/patterns/floors give variety.
- Settings are validated and persisted; corrupted `rug-racers-settings`, `rug-racers-skin-choice` and bests reload to the title with zero errors.
- Keyboard works across all menus (Tab order, visible focus ring, Enter on a focused button correctly opens Maps rather than starting a race); roles/aria on settings and meters.
- Robust state machine under key mashing and resize (no page errors, final mode `title`).
- Deterministic sim hooks and 82 unit tests; physics constants already in `config/physics.js`.
- Procedural audio with a compressor and lazy AudioContext resume on first input, plus a mute persisted.
- Touch layout exists (stick, boost, jump, reset) with 81-89px primary buttons and `touch-action: none`.

## What I could not check

- Real GPU frame rate, long tasks, memory growth over a long session (only SwiftShader; 1.7 fps in race).
- Human difficulty curve and session pacing (autopilot only); Easy/Hard/Insane AI.
- Runner Rug preview/screenshot (only Round Rug and the six originals were reviewed visually); Winter/Neon/Pastel themes, Persian/Blueprint patterns, other floors.
- Landscape phone, rotate-in-race, tab-hidden behaviour (code reading only: `visibilitychange` handled for audio and adaptive quality), true iOS/Android Safari touch, real audio output and mix loudness.
- Leaderboard server (`src/api/leaderboard.js`) validation and the online path; time trial ghost recording over multiple runs.
- Time-trial results and drift scoring beyond a single "DRIFT LOST" popup; actual colour-blind simulation (contrast measured from source colours, not sampled pixels, except as noted).
- Dark mode: the game has no `prefers-color-scheme` rules; panels are already dark so no defect recorded.
