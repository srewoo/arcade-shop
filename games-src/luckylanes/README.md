# Lucky Lanes

An original arcade ten-pin bowling game in the arcadeShop collection. TypeScript (strict), Vite, Canvas 2D pseudo-perspective, no external assets and no network calls: every picture is drawn in code and every sound is synthesised with WebAudio. It replaces an old Excel-embedded Flash bowling game and only borrows the genre.

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (scoring, physics, CPU, input, balance, audio, pause, settings)
    npm run build      # typecheck + production build into dist/

Add `?debug=1` to the URL to expose `window.__ll` (state, `advance(seconds)`, `throwShot(shot)`, `playBalls(n)`, `autoPlay()`, `audio()`, `settings()`), used for scripted browser checks. Without the flag nothing is exposed.

## Modes

- **Solo:** ten frames against the lane.
- **Hot seat:** 2-4 players on one device, one frame each in turn.
- **CPU rival:** you against a computer bowler. Casual (default, averages about 60-90) plays one loose shot; Easy has shaky aim, power and hook; Pro is steady and searches shots with the real physics.
- **Spare challenge:** ten preset pin leaves (7-10, 4-6-7-10, ...), one ball each. Points = pins knocked, +5 for clearing the leave.

## Controls

A shot is four steps: **position** along the foul line (two white **pocket ticks** at 9 cm either side of centre mark the pocket lines), then an oscillating **aim** arrow, a **power** meter, and a **hook** (spin) meter. The last lock throws. A dashed guide shows the predicted path, including the hook; its dash pattern differs per meter (long dashes aim, dots power, solid hook). The centre of the aim bar is a wide, slow sweet spot (the bar maps through a power curve, tinted on the bar), each meter starts at a random point in its cycle, and a "Pocket!" or "Nice!" call follows a good first ball. **Assist: wide pocket** in Settings roughly doubles the sweet-spot window.

| Input | Action |
| --- | --- |
| `Left` / `Right` or `A` / `D` | Slide along the foul line (hold to keep moving) |
| `Space` / `Enter` | Lock the current step; the fourth lock throws. During settle, banner and CPU waits it skips ahead (4x) |
| `Backspace` | Step back one meter |
| `Esc` / `P` | Pause (Resume, Restart, Settings, Quit to title; Restart and Quit ask first). `Esc` or `P` again resumes |
| `M` | Mute / unmute |
| On-screen buttons | Left, Right, Lock (label follows the step, "Skip wait" during waits), Back, Pause/Menu, Sound, Settings |
| Mouse / touch | Drag the ball sideways near the foul line to position it. Drag up from anywhere to throw: length = power (a ring shows it), direction = aim, a curved path = hook. A short tap (14 px) locks the current meter or skips a wait |

The game pauses by itself when the tab is hidden or the window loses focus; resume is manual. Opening Settings pauses too.

**Settings** (header or pause menu): volume, reduce motion (System / On / Off), colour-blind assist (high-contrast guide), text size (100 / 125 / 150%), theme, wide-pocket assist, fast CPU turns. Together with mode, players, CPU level and the first-run flags they are saved in localStorage (`luckylanes-settings`), validated field by field with zod when read back, so old saves keep working. Top-5 high scores per mode (Solo, Hot seat, CPU Casual, CPU Easy, CPU Pro, Spare challenge) live in `luckylanes-highscores`, lifetime stats (games, best, strikes, spares, gutters) in `luckylanes-stats`. Invalid data falls back to defaults; every storage call is in try/catch. Reduce motion turns off screen shake, flashes, ring bursts, confetti and the banner pop, trims particles to 30% and slows the meters; "System" follows `prefers-reduced-motion`. The spare challenge earns 1-3 stars at 15 / 25 / 35 points.

## Physics and scoring

- Fixed 120 Hz step, separate from rendering (`Game.update(dt)` accumulates time; `draw.ts` only reads state). Units are centimetres on a 106 cm lane, 18 m to the head pin.
- 2D top-down circles: ball-pin and pin-pin impulses with restitution and Coulomb friction, sliding deceleration, position correction so live pins never overlap, hook as lateral acceleration that builds toward the pins, gutters that capture the ball, wobble from accumulated hits, and toppled pins that sweep a wider circle.
- Scoring handles strikes, spares, 10th-frame bonus balls and running totals (null until a bonus is known).

## Code

All gameplay tuning (timings, meter curves, CPU profiles, juice, camera) lives in `src/tuning.ts`; `src/constants.ts` keeps only physical lane and ball constants. New UI text is in `src/strings.ts`.

| File | Role |
| --- | --- |
| `src/constants.ts`, `src/tuning.ts` | Lane geometry and physics constants; gameplay tuning |
| `src/scoring.ts` | Pure ten-pin scoring, frame/ball state, strike/spare detection |
| `src/pins.ts` | Pin deck layout, masks, spare-challenge leaves |
| `src/physics.ts`, `src/collide.ts`, `src/worldTypes.ts` | Fixed-step world, collision resolution, shared types |
| `src/inputFsm.ts`, `src/meterMap.ts`, `src/drag.ts`, `src/readouts.ts` | Shot state machine with per-turn offsets, meter power curves and pocket maths, drag-to-throw mapping, meter text |
| `src/cpu.ts`, `src/rng.ts`, `src/shotInfo.ts` | CPU shot search with level noise; seedable PRNG; look-ahead (clears the rack? pocket call) |
| `src/match.ts`, `src/announce.ts`, `src/turnEnd.ts`, `src/turnFlow.ts` | Players, turn order, banner choice, roll resolution, skippable waits |
| `src/game.ts`, `src/rolling.ts`, `src/presentation.ts`, `src/juice.ts`, `src/cameraRig.ts`, `src/interp.ts` | Controller, fixed-step rolling with render interpolation, render-side state, hit-stop and strike effects, camera follow |
| `src/settings.ts`, `src/stats.ts`, `src/storage.ts` | zod schemas, defaults, high scores, lifetime stats, guarded localStorage |
| `src/project.ts`, `src/scene.ts`, `src/renderPins.ts`, `src/draw.ts`, `src/drawOverlay.ts`, `src/laneCache.ts`, `src/gradients.ts`, `src/preview.ts`, `src/particles.ts` | Camera, procedural lane, pins and ball, frame composition, guide/ticks/drag trail, cached lane layer and gradients, pooled particles |
| `src/audio.ts`, `src/sfx.ts` | Audio engine (volume, mute, pause, limiter), synthesised voices |
| `src/hud.ts`, `src/scoreboardView.ts`, `src/menu.ts`, `src/pauseView.ts`, `src/settingsView.ts`, `src/results.ts`, `src/resultsText.ts`, `src/coach.ts`, `src/dialog.ts`, `src/bannerView.ts`, `src/applySettings.ts`, `src/dom.ts` | DOM: status, meters, scoreboard, menu, pause, settings, results, first-run coach, modal helper, banners and live region |
| `src/keyboard.ts`, `src/pointerInput.ts`, `src/main.ts`, `src/debug.ts` | Input wiring, app bootstrap, `?debug=1` hook |
| `src/style.css`, `src/lane.css`, `src/panels.css` | Tokens and layout, stage and meters, overlays and scoreboard |

Tests live in `tests/`: exhaustive scoring, physics invariants and determinism, CPU validity and level strength (incl. Casual), input state machine, meter curves and the balance maths (strike rate versus the old linear meters), settings and stats validation, pause and skip behaviour, hit-stop/interpolation/effects not changing results, audio engine (pause, mute, volume, limiter headroom) against a fake AudioContext, particles, camera and match flow, plus a headless full-game run through `Game`.
