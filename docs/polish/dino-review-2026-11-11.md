# Fossil Frenzy: polish assessment (Phase 1), 2026-11-11

Build reviewed: `/Users/sharajrewoo/DemoReposQA/arcadeShop/dino/src` (vite 7 build, preview on :4868, now stopped, `dist/` deleted). Read-only on source.
Shots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/dino-*.png` (abbreviated `shots/` below).
Scripts: `.../scratchpad/dino-play.mjs`, `dino-play2.mjs`, `dino-play3.mjs`. Raw output: `dino-out.json`, `dino-out2.json`.

Method note: headless Chromium with SwiftShader (software GL), keyboard/mouse/touch via Playwright and CDP. Gameplay judgements come from code and autopilot runs, not from human playtesting. FPS numbers are software-rendered and only usable as relative signals.

## Scorecard (1 to 5)

| Area | Score | Reason |
|---|---|---|
| UI | 3 | Strong cohesive look (Impact italic, cream and ink), but the title screen stacks the HUD score, the title, chips and the dino on top of each other. |
| UX | 3 | Four modes, Esc layering and the settings dialog are sound. There is no pause, no duck or double-jump teaching, and the touch start target collides with Settings. |
| Gameplay | 4 | Faithful Classic, fair telegraphed new obstacles (meteor marker), well-designed Zen and Shield. Leaderboard integrity and Zen unlocks are open issues. |
| Graphics | 4 | Low-poly biomes, weather, a nice ragdoll and hit-stop. The shield is a debug-looking wireframe and there are few juice moments beyond the crash. |
| Audio | 3 | Fully procedural and tidy, but there are no UI sounds, no music or ambience, no limiter, and mute is not persisted. |
| Accessibility | 2 | Reduced motion and the focus trap are good. Pinch-zoom is blocked, text is 10 to 13px, and contrast is 1.4 to 3.5:1 on key text. |
| Performance | 3 | One 4.98 MB chunk (1.82 MB gzip) with inlined WASM. Software-GL FPS is 15 to 33 and cannot be judged. Hot loops look allocation-free. |
| Robustness | 4 | Corrupt or blocked storage, 60 rapid keys, resize and rotate all survive with zero console errors. No auto-pause. |

## If you only do three

1. DINO-01 + DINO-02 + DINO-03: rebuild the title composition. Hide the score on the title, move Settings to a corner gear, give blurb/CTA/hints a cream backing, and add a real START button.
2. DINO-06: add pause, with auto-pause on blur or visibility change.
3. DINO-07: add contextual onboarding for duck, double jump and pickups, then retire the permanent hint line.

## Prioritised list

Severity: S1 broken, S2 major, S3 moderate, S4 nice-to-have. No S1 found. All items are untouched in source (assessment only).

### DINO-01 | UI | S2 | Title HUD score overlaps the FOSSIL logo
- Evidence: `shots/dino-desk-title.png` (1280x800), `dino-desk-1200x700-title.png`. At 1200x700, `#title h1` top is 17.9px but `#score` spans y 12 to 58, so "00000 / BEST 00000" is printed through the F-O-S letters. The same happens at 1280x800 (h1 top 53.9). `style.css:50-67` (`#score` always visible), `.panel{top:36%}` at `style.css:132`.
- Change: toggle a `body.is-title` class in `hud.showTitle()` (`ui.js:96`) and add `.is-title #score{display:none}`. The per-mode bests are already on the chips (`ui-modes.js:35`). Optionally anchor `.panel` with `top:max(24%, 96px)` so the logo never rises above the HUD zone.
- Effort: S
- Risk: none for sim. Keep `#score` visible when `H` hides the UI during a run.
- Verify: Playwright 1200x700 and 1280x800, assert `getBoundingClientRect` of `#score` and `#title h1` do not intersect on the title.

### DINO-02 | UI/UX | S2 | Title panel is stacked on the dino, and on phone the "tap to run" area is the Settings button
- Evidence: `shots/dino-phone-title.png` and `dino-desk-title.png`. 400x860: chips y 227 to 339, blurb 349, weather 374 to 414, CTA 440, Settings 470 to 514 (x 143 to 258). The dino projects to about (160, 438) and its body fills y 400 to 580, so chips, CTA and Settings sit over its head and torso. The CTA "TAP TO RUN" is hidden behind the dino (`dino-phone-title.png`). My `touchscreen.tap(200,500)` to start a run opened Settings instead, and the run only started with a tap at (200,700). This confirms the known "Settings over the dino" issue. At 1200 and 1280 wide the CTA and Settings button overlay the dino's chest, and the blurb sits across its head.
- Change: (a) a title camera offset (in `updateCamera` for `state==='title'`, shift lookAt so the dino sits at about 68% of viewport height, or to the right third on landscape); (b) Settings becomes a 44x44 gear button in the top-right corner (same row as the badge) with `aria-label="Settings"`; (c) add a 56px primary `START` button under the chips (also fixes DINO-17). Keep "tap anywhere else" as a bonus.
- Effort: M
- Risk: `camera.js` title branch only. Classic run camera untouched.
- Verify: phone 400x860 and 360x640: no element rects intersect the dino's projected bbox (project `dino.rig` bounds with `camera`), and a tap at the dino centre starts a run.

### DINO-03 | UI/Accessibility | S2 | Key title and HUD text fails contrast (measured)
- Evidence (sampled pixels from `shots/dino-desk-title.png`, ink `#3a332b`):
  - `#mode-blurb` 13px at 72% ink over sand: 3.1 to 3.5:1.
  - `#hints` 13px: 3.1:1 on the title and 2.1:1 over the Dusk Canyon red (`dino-desk-skip1200-biome.png`, bg about rgb 195,81,44).
  - `.cta` blink trough at opacity 0.25: 1.4:1. The CTA is effectively invisible half of the time (`style.css:171` `steps(2)` blink).
  - Rain env: tagline and CTA are unreadable (`shots/dino-desk-title-rain.png`).
- Change: give `#mode-blurb`, `.cta` and `#hints` a pill backing, `background:#fff6e6e6; padding:4px 12px; border-radius:999px; color:var(--ink)` (ink on cream is 11.6:1). Blink between opacity 1 and 0.65, not 0.25. Remove `--ink-soft` (alpha 0.72) for text. Reuse the `.badge` pill style.
- Effort: S
- Risk: none.
- Verify: automated contrast check on screenshot crops under all 5 environments, minimum 4.5:1.

### DINO-04 | UX/UI | S2 | Game-over card sits on the ragdoll and the score is unreadable
- Evidence: `shots/dino-desk-gameover.png`: "SCORE 36" is printed across the dino torso, and the quip and the buttons straddle the body. `dino-desk-zen-endrun.png` shows the same. Phone version is better (`dino-phone-gameover.png`) but RUN IT BACK still overlaps the tail. The panel is at `top:36%` while the death camera (`camera.js:35-38`) centres the ragdoll.
- Change: in `updateCamera`'s `dead` branch, lift `wantLook` so the ragdoll lands in the lower 40% of the viewport (`wantLook.y += 1.6`, tune per aspect), and give `#final` a cream pill. Same camera offset helper as DINO-02.
- Effort: S/M
- Risk: camera-only, no sim. Autoplay recording unaffected.
- Verify: screenshot at desktop and phone, assert `#final` rect does not intersect the projected torso.

### DINO-05 | Accessibility | S2 | Pinch-zoom blocked and text is tiny, with no text-size setting
- Evidence: `index.html:6` `maximum-scale=1, user-scalable=no`. Computed sizes: `#hints` 13px, `.chip-best` 11px, `.pu-name` 10px (at <=480px, `style.css` media block), `.skin small` 10px, `#mode-blurb` and `#toast` 13px, `.badge` 12px. The settings panel has no scale option.
- Change: drop `user-scalable=no, maximum-scale=1` (the canvas keeps `touch-action:none`, so play is unaffected). Raise the floor to 12px, and 14px for gameplay-critical text (blurb, toast). Add a "Text size" segment (100, 125, 150%) writing `--ui-scale` onto `:root`, with font sizes in `calc(Npx * var(--ui-scale))`. Add `textScale` to `settings.js` (validated 1, 1.25, 1.5).
- Effort: M
- Risk: layout reflow of the title at 150% (re-run DINO-02 checks).
- Verify: at 150% on 400x860, no clipping or overlap, and Settings still scrolls.

### DINO-06 | UX/Robustness | S2 | No pause, and losing window focus does not stop the run
- Evidence: `grep` for pause finds only `debug.paused` (`state.js:63`). `Input._release` on `blur` clears the keys but `tick()` keeps running. I dispatched `blur` mid Time Attack and the state stayed `running` with the clock still counting. `Esc` during a non-Zen run does nothing (`controls.js:20-23`). A tab hide freezes via the rAF clamp (`main.js:21`) but an alt-tab to a visible window or a phone notification shade does not.
- Change: add a `paused` state. Triggers are `P` or `Esc` while running (Zen keeps Esc as end-run but gains `P`), a 44x44 pause button top-right on touch, and automatic pause on `window.blur` and `visibilitychange`. Show a "PAUSED, Space to resume" card with RESUME, RESTART and MENU. Freeze `elapsed`, powers and audio (`ctx.suspend()`).
- Effort: M
- Risk: Time Attack clock and score submission must not accept a paused-state exploit (`finishRun` is only reachable from `running`). Resume with a 3-2-1 or 0.5 s grace so the first obstacle does not hit instantly.
- Verify: unit test the transition table. Playwright: blur mid-run and assert `score` is stable over 2 s.

### DINO-07 | UX | S3 | Onboarding: duck, double jump and pickups are never taught, and the hint line is permanent
- Evidence: `index.html:106-109` is one 13px line with 13 key bindings, visible on title, running and game over. On phone it wraps to 2 lines and says "pick a mode on the title screen" during a run (`shots/dino-phone-run.png`). New obstacles (hanging log needs a duck, meteor needs a jump after landing) have no first-encounter cue. Pickups only get a toast with the name (`run.js:collectPickups`).
- Change: (a) a one-time contextual prompt (stored as `seenHints` in settings) at first `pteroMid` or `log` within 25 m: "DUCK: swipe down / hold the down key". (b) The first pickup toast also states its effect ("DOUBLE JUMP: tap again in the air"). (c) Hide `#hints` when `state==='running'` after the first 8 s, and keep a "?" button to recall the controls. Classic keeps the original spawn table, so only the text changes.
- Effort: S/M
- Risk: Classic fidelity is safe (display only). Respect `H`.
- Verify: fresh profile: the first mid-ptero triggers the prompt once. Second run does not repeat.

### DINO-08 | Audio | S3 | Audio coverage gaps (from `audio.js` and callers)
- Evidence: effects exist for step, jump, land, duck, milestone, crash, thud, gameOver, pickup, shieldBreak, airJump, meteor and thunder. Missing:
  - UI sounds for chips, buttons, toggles and the dialog open/close (only the volume slider plays `pickup()`, `ui-settings.js`).
  - A new-best sting (`new-best` badge is silent).
  - A power-up expiry warning, plus Slow-Mo having no audible time-dilation cue.
  - A Time Attack last-10-seconds tick and a distinct time-up sting (reuses `gameOver`).
  - A Zen stumble-recover cue and a biome-change cue (toast only).
  - Ambience: no wind or rain bed (rain only has thunder) and no music.
- Change: add `AudioFx.ui(kind)` ('tick', 'confirm', 'back') via `onClick` delegation in `controls.js`. Add `newBest()` (rising 3-note arpeggio), `warn()` for the last 3 s of a power-up and for TA at 10, 5, 3, 2, 1, `biome()` (soft pad swell), and a looping filtered-noise rain/wind bed gated by weather and volume. Put the new sounds on an event list so gameplay code emits events (see DINO-23).
- Effort: M
- Risk: keep Classic's existing mix unchanged. Stagger and cap simultaneous voices (cap about 8).
- Verify: an offline AudioContext render in vitest, or a node-count assertion per action. Manual listen at 25, 50, 100% master.

### DINO-09 | Audio/Robustness | S3 | No master limiter, mute is not persisted, and sounds are dropped silently before the first gesture
- Evidence: `audio.js:23-27` has master gain 0.5 straight to the destination. The `crash()` layers peak at about 0.6+0.6+0.12+0.11 before master. `settings.js` has no `muted` field, so `M` resets on every reload. `ready` is false until `unlock()` and `_tone/_noise` return silently, so the first interaction's sound is lost. `unlock` also never suspends on tab hide.
- Change: insert a `DynamicsCompressor` (threshold -12 dB, ratio 8) before the destination. Persist `muted` in `parseSettings`. Call `ctx.suspend()` on pause or hidden. Queue the first sound until `resume()` resolves.
- Effort: S
- Risk: none for the sim.
- Verify: unit test `parseSettings({muted:true})`. Manual: mute, reload, still muted with the MUTED badge shown.

### DINO-10 | Gameplay/Integrity | S3 | One leaderboard board per mode regardless of difficulty, Classic Plus or snow
- Evidence: `modes.js` boards `dino`, `dino:hardcore`, `dino:timeattack`; `settings.difficulty` multiplies start, max and accel (x0.85 to x1.15, `settings.js:9-12`, `session.js`) but all submit to the same board. Classic Plus adds power-ups and obstacles to Classic and still posts to `dino`. Snow lowers fall gravity to x0.92 (`weatherModes.js:SNOW_FALL_GRAVITY`), a gameplay effect hidden under the cosmetic "Environment" chips, and it applies in Classic too. The per-mode best key (`dino-run-locked-in:best`) is likewise shared across difficulties.
- Change: define `rankedConfig = {difficulty:'normal', classicPlus:false, weather!=='snow'}`. Off-config runs get an "UNRANKED" tag on the game-over card and skip `submitScore`, or post to `dino:<mode>:<variant>` boards. Label Snow in the UI "floatier landings". The Classic board id `dino` stays reserved for the default config only.
- Effort: M
- Risk: Classic fidelity and existing saved bests. Do not rename `dino` or the best key. Server contract is unknown (`leaderboard.js`).
- Verify: unit test `isRanked(settings, mode)`. Playwright: switch Hard, finish a run, no POST to `/api/scores`.

### DINO-11 | Gameplay | S3 | Zen mode unlocks every skin
- Evidence: `ui.js:submit()` runs in `finishRun` for Zen and `bestOverall` (`skins.js:23`) spans all four modes including Zen. A Zen hit never ends the run, so a player who only survives reaches 4000 points at about 26 m/s in roughly 3.8 min (max speed 26, accel 0.15, reached at about 87 s, then about 140 s more) and unlocks Royal Gold with no skill. The Zen run also shows NEW BEST at score 2 (`shots/dino-desk-zen-endrun.png`).
- Change: exclude `zen` from `bestOverall` (pass the ranked modes only), or require thresholds from a skill mode. Show NEW BEST only when the previous best is above 0 and the score is at least 50. Add a test to `tests/skins.test.js`.
- Effort: S
- Risk: players who already unlocked via Zen keep their skin (the setting stores the choice, but `resolveSkin` falls back when locked). Grandfather the unlocks with a persisted `unlockedSkins` set.
- Verify: vitest `bestOverall` ignoring zen.

### DINO-12 | Gameplay/Balance | S3 | Obstacle ramp is distance-gated, so fast modes get a difficulty cliff (computed, not human-tested)
- Evidence: `obstacles/difficulty.js:5-8` introduces boulder at 250 m, log at 340 m, meteor at 480 m, full weight at +250 m. Time to reach those distances: Classic Plus (13 m/s, 0.2 accel) about 17 s, 22 s, 30 s. Hardcore (17 m/s, 0.32) about 12 s, 15 s, 20 s. The speed ramp in Classic is linear 13 to 31 m/s over 90 s (max score about 1400 at that point), with no rest beats or sawtooth. Time Attack's 60 s run reaches only about 1400 m, so the meteor only reaches half weight and TA never sees the full table. `shots/dino-desk-hardcore-skip500.png` shows boulder gates stacking with the autopilot's mid-speed.
- Change: move the gates into `config` as time-based: boulder 15 s, log 25 s, meteor 40 s of run time, ramped over 20 s, scaled by the mode's `startSpeed/13`. Add a "breather" (a guaranteed empty gap of 1.5x the usual spacing) every 25 s. Provide a debug telemetry hook (`window.__dino.stats`: deaths by obstacle kind, time to death) to tune from real play.
- Effort: M
- Risk: Classic with Classic Plus off must keep the original table (guard `newObstacles` as today). Sim determinism: changes only the spawn weights, so seed-based tests keep passing if `spawnTable(distance, ...)` keeps its signature.
- Verify: extend `tests/world.test.js` with a spawn-table time-gate test. 20 autopilot runs per mode with blunders off, logging the death histogram.

### DINO-13 | UX | S3 | Death-to-retry latency is a fixed 2 s plus the slam animation
- Evidence: `TUNING.crashToGameOver = 2` (`config.js:21`), then `h2` animates 0.42 s (`style.css:slam`). Jump input during `crashed` is ignored (`controls.js` `onJump` handles `title/running/gameover` only). A naive session dies at about 6 s (my keyboard run: 6.3 s), so a 2.4 s dead time is about 28% of the loop.
- Change: allow jump or tap during `crashed` once `crashT >= 0.8` to jump straight to the game-over card and then restart on the next press, or add a "skip" via any key at 0.8 s. Leave `TUNING.crashToGameOver` itself untouched (original value).
- Effort: S
- Risk: Classic fidelity is preserved because the default timing stays. Make sure a held jump key does not instantly restart (require a fresh press).
- Verify: Playwright: press Space 1 s after a crash, the game-over card shows in under 100 ms and a second press restarts.

### DINO-14 | Graphics/Juice | S3 | The shield is a wireframe sphere, and there are few juice moments outside the crash
- Evidence: `shots/dino-phone-ta-powerups.png`: the bubble is a visible white wireframe icosphere, which looks like a debug mesh against the flat-shaded style. There is no burst on pickup collect, no new-best celebration (only a text badge), and no near-miss feedback. The score pop fires only every 100 (`run.js:updateScore`).
- Change: replace the wireframe with a fresnel-shaded translucent sphere (`MeshPhysicalMaterial transmission 0` plus an additive rim shader) in `fx/bubble.js`. Add a 12-particle ring burst via `puffs` on `collectPickups`, confetti plus a 2 s camera FOV punch on new best (skipped under `settings.reducedMotion`), and a brief white flash and screen-edge pulse on a Shield break.
- Effort: M
- Risk: particle budget (`particleBudget`, x0.6 mobile). Reduced motion must cut all of it.
- Verify: screenshots at the pickup moment, a particle-count assertion under quality low, and no motion with reduced-motion on.

### DINO-15 | UI | S3 | Settings dialog and touch target sizes
- Evidence (phone 400x860, `dino-out.json`, `shots/dino-phone-settings.png`): `.wchip` 40px high (below 44), `.check` rows 36px, `#set-volume` 32px, checkboxes 22px. "Hard x1.15" and "Rain" drop to orphan full-width rows. The skins row is cut at the fold and the panel scrolls (scrollHeight 937 vs 751). Long option text such as "Power-ups (Hardcore, Zen, Time Attack)" wraps to 2 lines.
- Change: `.wchip{min-height:44px}`, `.check{min-height:48px}` with the whole row as the tap target, `#set-volume{min-height:44px}`, `.seg-btn{flex:1 1 30%}` so 3 and 5 option groups fill rows evenly (or use `grid-template-columns:repeat(auto-fit,minmax(88px,1fr))`). Shorten the labels ("Power-ups", "Classic Plus" plus a `<small>` subline).
- Effort: S
- Risk: none.
- Verify: Playwright asserts every interactive element at least 44px in both dimensions at 400 and 360 widths.

### DINO-16 | UI | S3 | Phone HUD: power-up column is bulky and the toast collides with it
- Evidence: `shots/dino-phone-ta-powerups.png`, `dino-out2.json`: `#powerups` rect (10,52)-(166,258), `#toast` rect (157,90)-(243,117), a 9px overlap. Four active chips consume about 206px of the left column (about 24% of screen height) beside the dino's path.
- Change: at <=480px, render chips as icon plus a conic ring timer (36px) in a horizontal row under the score, with the name as a toast only. Place `#toast` at `top: calc(120px + safe-top)` centred.
- Effort: S
- Risk: keep `aria-label` text on each chip (screen readers).
- Verify: no rect intersection between `#powerups` and `#toast` with all 4 powers granted at 360x640.

### DINO-17 | Accessibility | S3 | Keyboard flow: CTA text is wrong when a chip has focus, and game-over has no focus or announcement
- Evidence: `dino-out2.json`: Tab order is Classic chip, Auto chip, Settings, then BODY (the roving tabindex works well). With a chip focused, pressing Space activates the chip and the state stays `title` while the CTA reads "PRESS SPACE TO RUN" (`input.js:~58`, Space on a `HTMLButtonElement` returns early). After game over `document.activeElement` is `BODY`, so `Tab` restarts at the top. `#gameover` has no `role` or `aria-live`, so "GAME OVER, score N" is not announced. (Positive: the settings dialog focus trap, Esc, and opener-focus restore all work.)
- Change: add the START button from DINO-02 (reachable by Tab, Enter and Space). On `showGameOver` set `#gameover` to `role="dialog" aria-modal="false" aria-labelledby="over-title"`, move focus to `#btn-restart`, and put the final score in an `aria-live="polite"` node. Make the CTA switch to "PRESS ENTER ON START" while a chip owns focus.
- Effort: S
- Risk: moving focus to a button means Space activates RESTART (the same result). Keep `e.currentTarget.blur()` behaviour for pointer clicks.
- Verify: keyboard-only Playwright script: Tab, Enter starts a run. After death, the focused element is `#btn-restart`.

### DINO-18 | Accessibility | S3 | Accent colour and low-state cues are weak on contrast and rely on colour
- Evidence (computed): cream text on `#e0442e` (NEW BEST, UNLOCK banner, AUTOPLAY badge, 12 to 13px) is 3.89:1. `#save-msg` accent on cream is 3.89:1. `.skin.locked` (ink at 55% on cream) is 3.14:1. `#clock.low` accent on the sky is about 2.5:1 and signals "low time" by colour only. FRENZY subtitle accent on sand is 2.65:1 (display text at 40% of the h1 size, large text, so it passes 3:1 only borderline).
- Change: darken `--accent` to `#b8301c` (5.63:1 with cream, 5.1 to 6.1:1 range). Raise locked-skin opacity to 0.75 plus a lock glyph. Make `#clock.low` pulse (skipped under reduced motion), add "!" prefix text, and play the DINO-08 tick.
- Effort: S
- Risk: brand colour shift (small). Check the Classic palette `PALETTE` is not affected (CSS only).
- Verify: contrast script over `#new-best`, `#unlock`, `#save-msg`, `.skin.locked` at least 4.5:1.

### DINO-19 | Performance | S3 | Single 4.98 MB chunk with inlined Rapier WASM
- Evidence: `npm run build`: `dist/assets/index-*.js 4,976 kB (gzip 1,825 kB)`, a single chunk, with Vite warning about >500 kB. `rapier3d-compat` embeds its WASM as base64. The `#loading` screen waits for `initPhysics()` + `warmUpRagdoll()` before the title appears (`main.js:boot`).
- Change: `build.rollupOptions.output.manualChunks` splitting `three` and `rapier`, load Rapier via `import()` after the first paint and run `warmUpRagdoll` in `requestIdleCallback` (the title screen does not need physics). Measure TTI on a throttled 4G profile.
- Effort: M
- Risk: the first crash must not hitch if the physics is not ready (guard with `await physicsReady` before a run starts, which a title-screen dwell normally covers).
- Verify: Lighthouse (mobile) before and after: LCP under 2.5 s, TBT, and JS transfer size.

### DINO-20 | Performance | S3 | No real-GPU baseline, plus the adaptive-quality governor never recovers
- Evidence (SwiftShader, so not representative): avg FPS desktop title 17.9, run 15.0, hardcore 19.2, zen 27.5, TA 30.7, rain title 19.0, phone title 33.5 and run 31. Longtasks 194, 268 and 139 ms at the run start and the rain title. Max frame 633 ms right after the run start (probably first-use shader compile or a puff-pool warm, unconfirmed). `quality.js:11-15` degrades up to 3 steps and never restores after a transient dip (tab switch, notification), so one bad 2.5 s window permanently lowers the pixel ratio for the session.
- Change: add `?fps` overlay (frame time p95, draw calls via `renderer.info`, triangles) in `main.js`. Make the governor symmetric: after 10 s above 58 fps, step back up. Pre-warm the first-run shaders with `renderer.compile(scene, camera)` during boot.
- Effort: M
- Risk: oscillation, so use hysteresis (down at under 50 fps for 2.5 s, up at over 58 fps for 10 s).
- Verify: Chrome DevTools performance trace on a real mid-range Android. Targets p95 under 20 ms, no long task over 50 ms during the first 10 s.

### DINO-21 | Robustness | S4 | Leaderboard offline path is silent
- Evidence: `ui.js:offerSave`. With the endpoint unreachable (my preview server answered `/api/scores` with HTML, so `res.json()` threw and the client mapped it to `{error:'offline'}`), SKIP produced no board and no message (`dino-out2.json` `boardState: board hidden, txt ''`). The name form is shown even when offline, and a failed SAVE says only "Couldn't save, try again". Positive: `textContent` is used for names (no XSS), the nickname is length-limited, and timeouts are 7 s.
- Change: render "Leaderboard offline, your score is saved on this device" when `fetchTopScores` returns `error`. Hide the name form after 1 failed fetch. Retry button after a failed save.
- Effort: S
- Risk: none.
- Verify: Playwright with the route aborted: the message appears, no console errors.

### DINO-22 | Code/Config | S3 | Tuning is scattered, and Classic's numbers are duplicated
- Evidence: `modes.js:18-20` hard-codes Classic `startSpeed:13, maxSpeed:31, accel:0.2` which duplicate `config.js` `TUNING` (so editing one silently breaks Classic fidelity). Other magic numbers outside config: `run.js:22-24` (hit-stop 0.22/0.1/0.45), `input.js:14-18` (swipe thresholds), `quality.js:11-15`, `camera.js:6-7,31-33` (framing lerps), `powerups.js` durations and weights, `skins.js` unlock thresholds, `world/weatherModes.js` particle counts. This conflicts with the "all gameplay values from config" rule.
- Change: create `tuning.js` (or `config/` folder) exporting `CLASSIC`, `MODES`, `POWERUPS`, `HITSTOP`, `INPUT`, `CAMERA`, `QUALITY`; build `MODES.classic` from `TUNING`, never literals. Add a vitest assertion `MODES.classic.startSpeed === TUNING.startSpeed` (and max and accel) as a fidelity guard.
- Effort: M
- Risk: pure refactor. Keep the `window.__dino` hook and storage keys unchanged.
- Verify: the existing 64 tests plus the new guard pass, and a before/after autopilot run with a fixed seed gives identical scores.

### DINO-23 | Code | S4 | Gameplay coupled to UI, implicit state machine, and size limits
- Evidence: `run.js` (247 lines) calls `hud.setScore/pop/toast`, `audio.*` and DOM-facing code directly (`run.js:updateScore`, `collectPickups`), and `game.state` is a bare string with no transition table (`run.js` header comment only). Limits: `style.css` 801 lines, `dino/rig.js:113` `update()` is 83 lines, `world/world.js` 300 lines, `obstacles/field.js` 286. Tests cover 6 pure modules (64 tests) but nothing for `run.js`, `crash.js`, `input.js` or the UI.
- Change: add a tiny `events.js` emitter (`game.events.emit('score', n)`, 'pickup', 'hit', 'milestone') and let `hud`/`audio` subscribe (this also unlocks DINO-08 cleanly). Add `STATE_TRANSITIONS` table plus a `transition(to)` guard. Split `style.css` into `title.css`, `hud.css`, `settings.css`. Break `rig.update` into `animateRun/animateJump/animateDuck`. Add tests for the transition table and input swipe logic (feed synthetic pointer events).
- Effort: L
- Risk: Classic fidelity (cover with a deterministic autopilot-score regression before and after).
- Verify: vitest transition-table test, unchanged autopilot score for fixed seeds.

### DINO-24 | Graphics/UI | S4 | Light-only chrome and loading flash in dark mode
- Evidence: no `prefers-color-scheme` rules anywhere in `style.css`. With `colorScheme:'dark'` the body background stays `rgb(247,223,194)` and `#loading` is cream (`shots/dino-desk-dark-rm-title.png`, `dino-phone-dark-rm-title.png`). The scene is a lit 3D daytime/night world so the chrome rarely clashes, but the loading screen flashes cream before a dark Night env.
- Change: `@media (prefers-color-scheme: dark){ #loading{background:#1d1a16;color:#fff6e6} }` plus `theme-color` media variants, and skip the cream flash when `settings.weather==='night'`.
- Effort: S
- Risk: none.
- Verify: Playwright dark emulation, loading bg is dark.

### DINO-25 | UX | S4 | Result copy is not mode-aware
- Evidence: Zen "RUN OVER" still uses the crash quip "Aerodynamic. Not steerable." (`shots/dino-desk-zen-endrun.png`). Time Attack "TIME UP" shows no comparison to the best or the 60 s pace. There is no run summary (distance, pickups, obstacles cleared), a missing replay hook.
- Change: add `QUIPS_ZEN`, `QUIPS_TIMEUP` arrays in `ui.js` and a `run stats` line ("412 m, 3 pickups, best 00500"). Track `game.stats` in `run.js`.
- Effort: S
- Risk: none.
- Verify: unit test quip selection by `endTitle`.

## Bugs found

1. Phone: tapping the lower-middle of the title screen (400x860, point 200,500) opens Settings instead of starting a run (the Settings button spans y 470 to 514 and sits on the dino). Repro: touch-emulated 400x860, load the page, tap (200,500). Expected: run starts. Actual: Settings dialog opens. Tap at (200,700) starts a run. (DINO-02)
2. Desktop 1200x700 and 1280x800 title: the score HUD is rendered through the title logo. Repro: load the page. (DINO-01)
3. Blur does not pause: start any run, dispatch `window` `blur` (or alt-tab to a visible window), the run keeps simulating with all inputs released. (DINO-06)
4. Keyboard: with a mode chip focused, Space activates the chip and not the run, although the CTA says "PRESS SPACE TO RUN". Repro: load, press Tab, press Space, state stays `title`. (DINO-17)
5. Zen game over shows NEW BEST at score 2 and unlocks skins from Zen-only play. Repro: Zen, run a few seconds, Esc. (DINO-11)
6. Mute (`M`) is lost on reload (not in settings). Repro: press M, reload, sound is on. (DINO-09)
7. Offline leaderboard: SKIP shows nothing, with no explanation. Repro: block `/api/scores`, die, press SKIP. (DINO-21)

No console errors or page errors in any of the 3 scripts (about 14 contexts, includes 60 rapid keys, resize 1280 to 700, portrait to landscape mid-run). Boot succeeded with corrupt settings JSON, a negative best, a `<img onerror>` nickname, blocked localStorage and an invalid `mode:'__proto__'` (all fall back to defaults).

## What already works well

- Classic is faithful. The tuning table and the original spawn table are intact and new content is gated behind modes or "Classic Plus".
- Storage and settings parsing are defensive (`parseSettings`, `safeGet`), proven by the corruption tests above.
- Settings dialog: modal semantics, focus trap, Esc, opener-focus restore, roving-tabindex mode chips and radio roles.
- Reduced motion is honoured twice (OS default into settings, plus the CSS class), and blink and the slam animation are removed.
- Ragdoll with hit-stop slow motion, a tamed Zen stumble, the telegraphed meteor marker, and the biome and weather variety are strong game-feel.
- Touch input design (tap, swipe-down duck with a 420 ms minimum, second finger jumps) responded correctly in CDP tests (`game.duck` true after the swipe).
- Procedural audio keeps the bundle small and every gameplay verb except UI has a sound.
- Hot loops use module-level scratch vectors (`world.js`, `ragdoll.js`), so allocations per frame look controlled.

## What I could not check

- Real-GPU FPS, GC pauses, thermal throttling and mobile Safari behaviour (headless SwiftShader only). The FPS figures above are indicative only.
- Audio output itself (headless, no listening). Audio findings come from reading `audio.js` and its call sites.
- True difficulty feel: no human playtest. The curve numbers are computed from tuning constants and the autopilot, which blunders on purpose.
- Pickup spawn frequency in natural play (not sampled across many runs) and whether a Slow-Mo with Shield stack feels unfair.
- The real leaderboard server contract (only the client is in the repo, and the preview server has no `/api/scores`).
- Colour-blind simulation of the 3D scene. I reviewed only the HUD (power-ups are text-labelled) and used no CVD filters.
- `npm audit` and dependency freshness (not run, out of scope for read-only assessment).
- Time Attack timed to natural completion without the clock shortcut. I set `game.elapsed` to skip ahead for the end state.
