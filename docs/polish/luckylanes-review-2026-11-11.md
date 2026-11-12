# Lucky Lanes - Polish Assessment (Phase 1), 2026-11-11

Build reviewed: `npm run build` output served by `vite preview` on :4863, headless Chromium (Playwright 1.48.2). Shots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/luckylanes-*.png` (abbreviated `S:` below). Raw data: `.../scratchpad/ll-out.json`, scripts `ll-review.mjs`, `ll-fine.mjs`.
Read-only on game source. Tests/lint not re-run. FPS numbers come from software-rendered headless Chromium, so treat them as a floor.

## Scorecard (1-5)

| Area | Score | Reason |
| --- | --- | --- |
| UI | 3 | Clean, consistent neon/pink identity, but the pin deck reads as 7 pins, the 10-frame scoreboard is clipped at desktop width, and the Lock button sits on the fold edge. |
| UX | 3 | The 4-step meter flow is clear and the status text is good. There is no onboarding or pocket cue, a Start press mid-game silently wipes the game, and Esc does not close the menu. |
| Gameplay | 2 | Strike window is about 65 ms; blind meter play gives 1.3% strikes and a mean of about 43 pins per game. The ball-position choice that matters most is never explained. |
| Graphics | 3 | Cohesive procedural look with a nice lane and pins. Crash VFX are small, the camera lags, and there is no ball trail, no end-of-game celebration and no pin-fall readability. |
| Audio | 3 | Rumble, clatter and jingles are all synthesised, but there are no UI sounds, no meter-lock ticks, and the roll rumble does not stop when the game is paused. |
| Accessibility | 3 | Good focus ring, text contrast and reduced-motion handling. Meters are colour-only, small buttons are under 44px, and the banner is hidden from screen readers. |
| Performance | 4 | 60 fps in every state measured, a 10 MB heap, and no long tasks in play. The 6-second sustained run had one 53 ms long task. |
| Robustness | 4 | Corrupt storage, input spam and resize mid-roll are all handled with zero console errors. Pause audio and silent restart are the gaps. |

## Top 3 ("if you only do three")

1. LUCKYLANES-01: Widen and teach the strike window. Add ball-position and pocket guidance, ease the aim-meter speed, and add an assist.
2. LUCKYLANES-02: Make the pin deck and impact readable and juicy: a higher camera, a hit-stop, a bigger burst and a camera shake pulse.
3. LUCKYLANES-03: Fix landscape and desktop layout so the Lock button is always on screen and the scoreboard shows all 10 frames.

## Prioritised list

### LUCKYLANES-01 | Gameplay | S2
- **Evidence:** The in-page sweep (power .85, x=0, `ll-fine.mjs`) shows a spin-0 strike aim band of -0.005..+0.005 rad, out of a +/-0.075 meter range. That is 6.7% of the range, and about 65 ms of the aim meter's travel around centre (`inputFsm.ts:24`, `AIM_HZ=0.5`, so aim speed at centre is 0.15 rad/s). Over 400 random meter outcomes, 60.8% of balls knock 0 pins, strikes are 1.3% and the mean is 1.99 pins. Twelve blind games scored 18-67. Twelve games with the centred-aim "skilled" bot scored 84-126. The pro bot scored 170-224. The position sweep at aim 0 shows x=0 gives 9 pins while x=+/-9 gives 10 (`xsweep` in `ll-out.json`).
- **Change:**
  1. Raise the aim meter's pocket tolerance: use a nonlinear meter mapping so the centre 20% of the bar maps to +/-0.0125 rad, or slow `AIM_HZ` to 0.35 around centre.
  2. Show a pocket marker (a small tick on the foul line at x=+/-9) while in the position phase, and a "Pocket" hint in the status text.
  3. Offer an "Assist: wide pocket" setting that widens the window by about 2x.
  4. Target a casual strike rate of 10-15%, measured with the same sweep script.
- **Effort:** M
- **Risk/constraints:** Changing the physics constants affects `tests/physics.test.ts` and `cpu.test.ts` determinism. Change only meter mapping and `MAX_AIM` usage, not collisions. Keep the meter and constants in config.
- **Verify:** Re-run `ll-fine.mjs`. Strike share in the aim/spin grid should rise from 3.54% to 8% or more, and the random-meter mean should be 3 pins or more.

### LUCKYLANES-02 | Graphics/Juice | S2
- **Evidence:**
  - S: `desk-solo-power.png` and `desk-rolling.png` show the rack as 7 pins in a line, because the camera is low and depth is compressed by `K=0.38` (`project.ts:5`). Spare leaves are hard to read in `desk-spare-play.png`.
  - Crash burst is 2-14 particles (`particles.ts:34`) and shake is `strength/4000` at a 2.4/s decay (`game.ts:198`, `game.ts:141`).
  - The camera approaches at rate 6/s while rolling (`game.ts:236`).
- **Change:**
  1. Raise camera height by about 25% and the row depth factor `K` from 0.38 to 0.5 for the rack only, so the three front rows separate.
  2. Add a 60-80 ms hit-stop on the first ball-pin event (skip the sim step, keep the render).
  3. Scale burst particles up to 30 for strikes, with a ring flash.
  4. Add a one-shot shake pulse (amplitude 0.6) on strikes. Skip it when reduced motion is on.
  5. Raise the camera follow rate from 6 to 10, or snap the camera at 70% of HEAD_Y.
- **Effort:** M
- **Risk/constraints:** The camera must not affect sim determinism (render-only). Keep reduced-motion gates.
- **Verify:** Screenshots show ten distinguishable pins. A strike frame sequence shows more than 25 live particles at impact. Reduced motion shows zero shake and 30% particles.

### LUCKYLANES-03 | UI/Responsive | S2
- **Evidence:**
  - Desktop 1280x800: Lock is at y=755-799 and Back is at 798+ (S: `desk-solo-power.png`), so the controls are cut at the viewport edge.
  - Phone landscape 860x400: the stage is 828x320 but the lane draws only about 300px wide (S: `phone-landscape.png`), and Lock is at y=515, below the 400px viewport, so it needs a scroll.
  - Desktop sidebar: the scoreboard is `min-width:560px` (`style.css`, `.sb`) inside a roughly 453px column. Frames 8-10 and the total are clipped (S: `desk-gameover.png`, showing "143" cut).
  - Phone with 4 players: scoreboard scrollWidth 645 vs clientWidth 366.
- **Change:**
  1. Cap `.stage` at `max-height: calc(100dvh - 230px)` with `min-height: 240px`, so the controls always fit.
  2. Add `@media (orientation: landscape) and (max-height: 520px)` with a two-column layout: stage left, meters and controls right.
  3. Lower the `.sb` min-width to 420px and use a 2-line cell layout, or move the scoreboard under the stage at less than 1200px.
  4. Pin the current player's row to the frame with `scrollIntoView({inline:'center'})` on each turn.
- **Effort:** M
- **Risk/constraints:** None for sim. Check light and dark.
- **Verify:** Playwright at 1280x720, 1366x650 and 860x400: Lock `getBoundingClientRect().bottom <= innerHeight`. The scoreboard `scrollWidth <= clientWidth` at 1280.

### LUCKYLANES-04 | Bug/Audio | S2
- **Evidence:** Opening Menu while the ball is rolling pauses the sim (`main.ts:131`, `if (!menu.isOpen || !started) game.update(dt)`). `game.audio.rollSrc` stays non-null and the rumble keeps playing (measured `rollSrcActive: true`, `stageT` frozen at 0.533 for 800 ms). `AudioEngine.updateRoll` is only called inside `update`.
- **Change:** Add `game.pause()` / `resume()` that call `audio.stopRoll()` (or ramp the roll gain to 0) on pause and restore it on resume. Also suspend the AudioContext on `document.visibilitychange` hidden.
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** In the page, `game.audio.rollGain.gain.value` approaches 0 after the menu opens.

### LUCKYLANES-05 | UX | S2
- **Evidence:** With 8 frames played, `#menu-btn` followed by `#start` reset to 0 rolls with no confirmation (`startMidGame: before 8, after 0`). The menu also offers Resume, so the two sit side by side.
- **Change:** If a game is in progress, relabel Start to "Restart game" and add an inline confirm ("Discard the current game?", Yes/No, focus on No). Make Resume the focused default (already done).
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** Mid-game Start shows the confirm; choosing No keeps the frames.

### LUCKYLANES-06 | UX/Accessibility | S3
- **Evidence:** Esc with the menu open leaves it open (`menuClosedByEsc:false`, `escWhilePaused:false`). `keyboard.ts:20` returns early when blocked, and `Menu` only traps Tab.
- **Change:** In `Menu.root` keydown, close on Escape when `resumable()` is true and restore focus to `#menu-btn`. Add a `pause` shortcut: `P` toggles the menu.
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** Esc or P while rolling opens and closes the menu, and the game continues from the same `stageT`.

### LUCKYLANES-07 | UX/Onboarding | S3
- **Evidence:** First launch goes straight to the mode menu (S: `desk-title.png`) with no controls summary. "How to play" is collapsed, and the first status text is the only guidance. The meter order (position, aim, power, hook) is learned by trial.
- **Change:** On the first start (flag in settings, e.g. `seenIntro`), show a 3-step coach overlay: "Slide, lock, aim, power, hook". Highlight the active meter with a pulsing label. Expand "How to play" by default for the first session.
- **Effort:** M
- **Risk/constraints:** Add the flag to the zod schema with a default so old saves still validate.
- **Verify:** A clean profile shows the coach; a repeat visit does not.

### LUCKYLANES-08 | Gameplay | S3
- **Evidence:**
  - Easy CPU scores 104-143 against the pro bot's 170-224. Pro CPU scores 175-184, roughly equal to the pro-bot human (`ll-out.json`: `cpu_easy` and `cpu_pro` lines). A real human will not average that high, so both CPU levels are far above realistic human skill.
  - Pro CPU Easy uses 4 candidates, `xNoise 6` (`cpu.ts:20`).
- **Change:** Add a "Casual" CPU level (1 candidate, `aimNoise` 0.01, `powerNoise` 0.25) and make it the default. Move `PROFILES` into the config module.
- **Effort:** S
- **Risk/constraints:** Extending `CpuLevel` changes the settings schema, high-score keys and `cpu.test.ts`.
- **Verify:** The new level averages 60-90 over 10 simulated games.

### LUCKYLANES-09 | Gameplay/Pacing | S3
- **Evidence:** The turn cycle has fixed waits: settle 0.9s, sweep 0.8s, banner 1.7s or 0.3s (`game.ts:24-25`, `game.ts:216`), plus CPU think 0.9s and aim 0.8s (`game.ts:26-27`). A strike frame waits about 3.4s plus roll time. There is no skip.
- **Change:** Let Space, Enter or a tap skip the banner, settle and CPU-think waits (fast-forward 4x). Add a "Fast CPU turns" option.
- **Effort:** S
- **Risk/constraints:** Skipping must not drop sim steps. Fast-forward only the non-physics waits.
- **Verify:** A full 10-frame game with skipping takes under 3 minutes, versus roughly 5 minutes unskipped.

### LUCKYLANES-10 | Accessibility | S3
- **Evidence:**
  - The three meters are `role="meter"` but have no text readout. Active state is colour only (pink border, green "done" thumb).
  - Meter track border contrast is 1.50:1 (light) and 1.45:1 (dark), below the 3:1 non-text guideline (`--border` against `--card`).
  - Inactive thumb contrast is 7.06:1, fine.
  - The banner has `aria-hidden="true"` (`index.html`), so strike or spare is never announced.
- **Change:**
  1. Add a numeric or word readout to each meter (e.g. "Aim: left 3", "Power 85%"), and a "locked" check mark.
  2. Darken `--border` to about #8a82a8 for meters only (3:1).
  3. Put the banner text into the existing `#status` live region.
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** The contrast check is at least 3:1. A screen reader announces "Strike!".

### LUCKYLANES-11 | Accessibility/Touch | S3
- **Evidence:** Measured on the phone: Menu 62x40, Sound 109x40, Theme 127x40 (`.icon-btn { min-height: 40px }`), Back 368x38 (`.controls .ghost`, `min-height: 38px`), the "How to play" summary 342x32, and the scoreboard has `tabindex=0`. Targets under 44px: five.
- **Change:** Set `.icon-btn` and `.controls .ghost` to `min-height: 44px`, and `.help summary` to `min-height: 44px`.
- **Effort:** S
- **Risk/constraints:** The header grows by 4px.
- **Verify:** The measure script reports every interactive element at 44px or more in height.

### LUCKYLANES-12 | Accessibility | S3
- **Evidence:** Small text: `.m-label` 12.8px, scoreboard names and headers 12px, `.leave` 11.5px (`style.css`, `.sb thead th`, `.sb .leave`), `.turn` 13.1px. The font sizes are fixed rem fractions, so browser text zoom works, but the in-canvas "LUCKY LANES" sign and the pin deck do not scale.
- **Change:** Raise the scoreboard base to 14px and the meter labels to 14px. Add a "Large text" toggle (class on `<html>` scaling the root font by 1.25) in settings.
- **Effort:** S
- **Risk/constraints:** The scoreboard width grows, so land this after item 03.
- **Verify:** The 200% browser zoom shows no overlap and no horizontal page scroll.

### LUCKYLANES-13 | Accessibility/Colour | S3
- **Evidence:** The guide path colours are yellow (aim), orange (power) and cyan (hook) (`draw.ts:33`). Yellow and orange are hard to tell apart for protanopia and deuteranopia. The meter fills use green "done" against pink "active" (`style.css`, `.meter.done i`, `.meter.active i`), and green against pink is a classic colour-blind clash. The lane wall trim is pink on one side and cyan on the other, with no side labels.
- **Change:** Change the done thumb to a check shape or a blue (#2f6df0), and make the guide dash patterns differ per phase (long dash for aim, dotted for power, solid for hook). Add a settings switch "High-contrast guide".
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** Simulated deuteranopia screenshots still distinguish meter states.

### LUCKYLANES-14 | Audio | S3
- **Evidence:**
  - No sound for meter lock, position slide, throw release, button taps, menu open/close or banner pop. `AudioEngine` has only `startRoll`, `clatter`, `jingle` (`audio.ts`).
  - There is no ball-drop thud at release.
  - The master gain is a hardcoded 0.8 and there is no volume control. The roll rumble is 0.42 and jingles are 0.16 square waves (`audio.ts:78`, `audio.ts:132`), so the square jingles stand out against the soft brown-noise bed.
- **Change:**
  1. Add `tick(phase)` (short 880 Hz blip, pitch rising per meter lock), `release()` (low thud plus a click) and `ui()`.
  2. Add a volume slider (0-100) in the menu next to Sound.
  3. Lower the jingle gain to 0.1 and use a triangle wave for the spare jingle.
  4. Add a strike crowd noise burst (filtered noise, 0.6s).
- **Effort:** M
- **Risk/constraints:** Respect muted state. Rate-limit like `clatter`.
- **Verify:** Every action in the input table has an audible event (checklist). The master level stays under -6 dBFS.

### LUCKYLANES-15 | Gameplay/Feedback | S3
- **Evidence:** The ball-aim meter always starts at centre (triangle starts at 0, `inputFsm.ts:24`). Locking immediately gives a straight ball. A player who taps Space four times gets a straight x=0, power 0.5 ball, which reaches pocket 9 pins about 20% of the time at power .5 and some aim values (see `ll-out.json`, `p0.5_s0`: 7-10 pins in the central 9 steps). Rhythm skill is therefore not rewarded much over mashing.
- **Change:** Start each meter's phase at a random offset (use the seedable RNG, not in the sim), and add a visible "perfect zone" tint (the centre 10% of the aim bar) so near-misses are legible. Add "Nice!" / "Pocket!" feedback text when the final shot lands within 0.005 rad of a strike line.
- **Effort:** M
- **Risk/constraints:** Randomising the start offset breaks any test that assumes t=0 (`input.test.ts`). Use a seeded value per turn.
- **Verify:** Mashing Space four times no longer yields a centred shot; the zone tint is visible in screenshots.

### LUCKYLANES-16 | UX/Touch | S3
- **Evidence:** Touch drag works (CDP: slide moved startX 0 to 21.5, a curved drag launched a throw). But drag-to-throw has no on-screen affordance: no ghost arrow while dragging, and the `shotFromDrag` power reference is `game.size.h * 0.55` (`pointerInput.ts:68`). The user cannot see the power or hook they are drawing until the guide appears after release. A short tap locks the meter, but on a 368px lane a 10px tap radius (`TAP_PX`) is easy to overshoot.
- **Change:** Draw a live drag trail and a power ring while dragging. Raise `TAP_PX` to 14. Show "Drag up to throw" on the lane for the first 3 throws.
- **Effort:** M
- **Risk/constraints:** Render-only. Check that the pointer capture still works.
- **Verify:** Touch session screenshot shows the drag trail. A scripted 12px tap locks the meter.

### LUCKYLANES-17 | Performance/Code | S4
- **Evidence:** `updateParticles` runs `Array.shift`/`splice` in the hot loop (`particles.ts:25`, `particles.ts:56`) and `drawBackdrop` and `drawBody` recreate gradients per frame (`scene.ts`, `renderPins.ts:30`). Measured: 60 fps, p95 16.8 ms, one 53 ms long task during a 6-second sustained strike series, and 10 MB heap. It is fine today but will cost on low-end phones once the VFX grow (item 02).
- **Change:** Use a ring buffer for particles. Cache the backdrop gradient and pin body gradients per size. Pre-render the lane to an offscreen canvas and redraw it only on resize and camera change.
- **Effort:** M
- **Risk/constraints:** Do this after item 02 so the cost is measured with the real VFX.
- **Verify:** The `__fps` sample on a 4x CPU throttle holds at least 50 fps; `longtask` count of 0 during a strike series.

### LUCKYLANES-18 | Robustness | S3
- **Evidence:**
  - Tab hide: there is no `visibilitychange` handler (`grep` finds none in `src`). `dt` is clamped at 0.05 so a hidden tab does not fast-forward, but a hidden tab with a rolling ball keeps the AudioContext rumble going.
  - Resizing mid-roll is fine (stage `ready` after, `afterResize` OK), spam keys in every phase are handled (`afterSpam` OK), and corrupt storage falls back to defaults with the menu open (`corruptStorage`).
  - The game auto-resets the camera on resize with `createCamera` (`game.ts:63`), but a resize mid-roll snaps the camera `y` (only `y` is preserved, not `x`).
- **Change:** Add a `visibilitychange` listener that pauses the game and the roll audio. Preserve `cam.x` in `resize()`.
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** Dispatch `visibilitychange` with `document.hidden=true`. The audio gain goes to 0 and `stageT` stops.

### LUCKYLANES-19 | Code/Config | S3
- **Evidence:** Gameplay tuning is hardcoded outside `constants.ts`: `SETTLE_S`, `SWEEP_S`, `CPU_THINK_S`, `CPU_AIM_S`, `MOVE_CM_PER_S` (`game.ts:24-28`), banner time 1.7/0.3 (`game.ts:216`), `AIM_HZ`/`POWER_HZ`/`SPIN_HZ` (`inputFsm.ts:19-21`), CPU `PROFILES` (`cpu.ts:20`), the keyboard nudge of 3 cm (`keyboard.ts:22`), the shake factor and decay, the particle constants, the camera `K`, `D0` and follow rates (`project.ts:5`, `game.ts:236`). The library rule `gameplay-code.md` asks for config-driven values.
- **Change:** Create `src/tuning.ts` exporting a typed readonly `TUNING` object (timings, meters, CPU, juice, camera) with defaults, and import it in those files. Keep `constants.ts` for physical constants only.
- **Effort:** M
- **Risk/constraints:** Behaviour-preserving. Run the full vitest suite (physics determinism).
- **Verify:** `npm test` passes unchanged. Screenshot/sweep output is identical.

### LUCKYLANES-20 | Code/Structure | S4
- **Evidence:** All files are under 300 lines (largest `game.ts` at 239). `Game` is 190 lines of class, near the 200 limit. `Menu.render` and `Menu` constructor are fine. `Game.updateCamera`, `resolve` are about 20 lines each. No function exceeds 50 lines except `drawLaneSurface`/`drawBackdrop` neighbours, which stay under the limit.
- **Change:** Before adding items 02, 09 and 14 to `Game`, extract `TurnFlow` (stage timers) from `game.ts` to keep it under 200 lines.
- **Effort:** M
- **Risk/constraints:** The headless full-game test in `tests/game.test.ts` should keep passing.
- **Verify:** `wc -l` is under 200 for the `Game` class.

### LUCKYLANES-21 | UX/Feedback | S3
- **Evidence:** There is no score-so-far in the HUD overlay (only "You F1.1"). The running total is only in the scoreboard, which is clipped (item 03) or below the controls on phones (S: `phone-play-viewport.png`, scoreboard at y=857). Game over shows only the final score. The high-score note appears only on a rank.
- **Change:** Add the current total to the `.turn` chip ("You F4.1 | 84"). On the results panel, add the per-frame strike/spare count and the player's best for the mode.
- **Effort:** S
- **Risk/constraints:** None.
- **Verify:** The chip updates after each frame. The results panel shows "Best: N".

### LUCKYLANES-22 | UX/Replay | S4
- **Evidence:** Replay hooks are limited to the top-5 board per mode. There are no daily goal, streak or stat tracking (strikes, spares, gutters). The spare challenge is the only goal-based mode and has no star rating.
- **Change:** Track lifetime stats (games, best, strikes, spares) in a zod-validated `luckylanes-stats` key and show them in the menu. Give the spare challenge 1-3 stars (e.g. 15/25/35 points).
- **Effort:** M
- **Risk/constraints:** Validate with zod and keep try/catch, like the existing storage code.
- **Verify:** Stats survive a reload, and corrupt data falls back to zeros.

## Bugs found

1. **Pause leaves the roll rumble running** (item 04). Repro: Start, throw, click Menu while the ball rolls. The sim freezes but the rumble loops until Resume.
2. **Start discards a game silently** (item 05). Repro: play 8 balls, open Menu, press Start game. The scoreboard resets with no prompt.
3. **Esc does not close the menu** (item 06). Repro: Menu button, press Escape. It stays open; the keyboard handler ignores keys while it is open.
4. **Controls and clipped scoreboard on common sizes** (item 03). Repro: 1280x800, or phone landscape 860x400.
5. No console errors or page errors in any session (desktop, phone, dark, reduced motion, robustness).

## What already works well

- A fixed-step 120 Hz sim separate from rendering, with strong unit tests and a `?debug=1` hook that made this review's sweeps possible.
- Keyboard-only play works end to end: focus lands on Start, the Tab trap holds, and the results panel focuses Play again.
- Reduced motion works: shake 0, particles at 30%, no confetti, and a plain fade banner.
- Colour contrast: body text 15.5:1 (light) and 16.2:1 (dark), muted text 6.3:1 and 8.6:1, primary button 5.5:1 and 6.7:1.
- Corrupt `localStorage` falls back to defaults, with no crash and no console errors.
- The 60 fps hold, the 10 MB heap and the 112 kB (37 kB gzip) bundle.
- The mouse and touch drag-to-throw works, including the curved hook path.

## What could not be checked

- Real audio output (headless has no sound device). Mix balance comes from reading the synth code only.
- Real-device touch feel, iOS Safari quirks, notch and safe-area handling, and haptics.
- Real-GPU frame times. Headless software rendering reports 60 fps, so low-end phone performance is unmeasured.
- Colour-blind simulation (no simulator run). The findings are from colour values and design only.
- Screen reader behaviour (VoiceOver/NVDA not run).
- Long sessions (more than 30 minutes) for memory growth. Only about 6 seconds of sustained load and several full games were sampled.
- Human difficulty perception. The balance figures come from scripted bots and uniform random meters, not real players.
