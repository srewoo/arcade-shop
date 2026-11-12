# Corner Pocket - Polish Assessment (Phase 1), 2026-11-11

Build reviewed: dist from `npm run build` (js 107 kB / 35 kB gz, css 5 kB), served by `vite preview` on :4865. Driven with Playwright 1.48.2 (chromium headless), real mouse, keyboard, CDP touch. Shots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/cornerpocket-*.png` (shortened below as `shots/cornerpocket-*.png`). Script: `.../scratchpad/cp-review.mjs`, raw metrics `.../scratchpad/cp-out.json`.

## Scorecard (1-5)

| Area | Score | Reason |
| --- | --- | --- |
| UI | 3 | Clean, consistent card/HUD system with good light/dark tokens, but phone table uses only 63% of width, native green `<meter>` is off-theme, landscape phone clips the table. |
| UX | 3 | Slingshot + tap-aim + keyboard all work; but Esc silently abandons a run, no pause, no onboarding beyond a text line, timer starts before first input. |
| Gameplay | 4 | Deterministic physics, CPU that simulates shots, 15 par-solved puzzles, good combo/time economy; thin replay hooks and no difficulty ramp feedback. |
| Graphics | 3 | Competent procedural table and balls, cue/guide render over rails and clip at canvas edge, ball numbers illegible on phone, little juice (no shake, no pocket drop animation). |
| Audio | 2 | Synth is tidy, but only 6 sounds: nothing for win, lose, rack clear, sweep, time warning, turn change, UI clicks; noise buffer rebuilt per clack. |
| Accessibility | 3 | 44px targets everywhere, visible focus ring, reduced-motion honoured, contrast mostly >=4.9; but HUD `aria-live` floods (10 mutations/s), colour-only spin cue, gold stars 3.14:1, 2x text overflows. |
| Performance | 4 | 59.9 fps desktop and 60.4 fps phone profile during rolling, max frame 33 ms; 107 kB bundle; per-frame innerHTML-free HUD diffing. Small hot-loop allocations only. |
| Robustness | 4 | Corrupt localStorage falls back cleanly (zod), rapid Space/R spam (60 keys) produced 0 console errors, resize/orientation re-layouts; gaps: landscape clip, no `visibilitychange` pause, blur mid-charge. |

Console errors/warnings across all sessions: 0.

## If you only do three

1. CORNERPOCKET-01/02: Fix phone layout - portrait table is 235 px wide in a 376 px canvas (ball numbers unreadable), landscape clips the table (page 548 px tall in 400 px viewport).
2. CORNERPOCKET-04/05: Add a real pause (overlay with Resume/Restart/Menu, auto-pause on tab hide/blur) and stop starting the Rack Attack clock before the first shot; Esc must not discard a run.
3. CORNERPOCKET-10/11: Audio and juice pass for outcomes - rack clear, clean sweep, time-low tick, win/lose stingers, turn change, pocket drop animation and a small shake on scratch.

## Prioritised list

Severity: S1 broken, S2 significant, S3 noticeable, S4 nice-to-have. Effort S/M/L.

### CORNERPOCKET-01 | UI/Mobile | S2
- Evidence: phone 400x860 `shots/cornerpocket-phone-rack.png`. Canvas 376x435 CSS px (measured), but table is rotated and height-limited by `main.ts:62` budget `innerHeight - top - 235`; table width = 435 * 472/872 = about 235 px, leaving about 70 px dead dark bars each side. Ball radius on screen = 10 * 0.499 = 5 px, numbers are about 3.5 px tall.
- Change: in `layout()` (`src/main.ts:57-71`) cut the portrait reserve from 235 to the measured controls height (read `$('play .controls').offsetHeight + hud height` instead of a constant), and move Restart + help text out of the fold: put Restart in the top bar and hide `.help` under 600 px. Target canvas height >= 560 px at 860 px viewport so scale >= 0.64. Also draw ball numbers only when `scale >= 0.55`, else draw a larger 1-character number with `font = max(r*0.7, 7px/scale)`.
- Effort: M. Risk: layoutView aspect and `input.view` consumers; the 1/240 sim is unaffected.
- Verify: Playwright at 400x860: assert table drawn width / canvas width >= 0.8 and no vertical page scroll with controls visible; screenshot compare.

### CORNERPOCKET-02 | UI/Mobile landscape | S2
- Evidence: `shots/cornerpocket-phone-landscape.png`, viewport 860x400: `scrollHeight` 548 > 400, canvas 836x260 (forced by `Math.max(260, ...)` at `main.ts:61`), bottom pockets and the whole control row are below the fold; header and HUD eat 154 px.
- Change: when `innerHeight < 500` and landscape, hide `h1` and `.help`, collapse HUD into one line, and place controls in a right-hand column (`.play { display:grid; grid-template-columns: 1fr 12rem }`); drop the `260` floor to 200 and let scale shrink. Alternatively lock to a fullscreen play mode with `100dvh` stage.
- Effort: M. Risk: touch-action and safe-area insets.
- Verify: 860x400 and 667x375: `scrollHeight <= innerHeight`, all 6 pockets visible.

### CORNERPOCKET-03 | Accessibility | S2
- Evidence: `index.html` `#hud role="status" aria-live="polite"`; measured 30 DOM mutations in 3 s (time text changes every 0.1 s, `ui.ts:20-22`). A screen reader would announce the countdown ten times a second and drown the status line.
- Change: remove `role=status` from `#hud`; make the timer `aria-hidden` plus a separate visually-hidden `role="timer"` updated every 10 s (and at 10, 5, 3, 2, 1), and a `role="status"` span containing only `h.status` and float text events (`fx.say`) so results are announced once.
- Effort: S. Risk: none to sim.
- Verify: MutationObserver count inside the live region <= 1 per shot; VoiceOver pass.

### CORNERPOCKET-04 | UX/Robustness | S2
- Evidence: `onKey` `main.ts:90` `Escape -> toMenu()`; Playwright: pressing Esc mid-rack returned to menu with no confirm (`escToMenuNoConfirm: true`), score lost, nothing saved (`recordResult` only on over). `Esc` is also shown as a hint on the Menu button, and Menu button taps one-tap discards. No pause exists; the clock only stops when `document.hidden` (`main.ts:174`), not on blur or when a dialog is open.
- Change: add `Game.paused` + pause overlay (Resume, Restart, Menu, Sound toggle) opened by Esc, P, a visible Pause button, `visibilitychange`, and window `blur`. `Menu`/Restart during an unfinished Rack/8-ball game ask "Abandon game?" inline. Pause also gates `update()` and `fx.update()`.
- Effort: M. Risk: sim determinism unaffected (pause = skip `update`); tests in `tests/game.test.ts` extendable.
- Verify: start rack, Esc, wait 5 s, time unchanged; hide tab, return, time unchanged; Esc twice resumes.

### CORNERPOCKET-05 | UX/Gameplay | S3
- Evidence: Rack Attack idle 5 s with no input dropped time 35.0 to 30.0 (`timeAfter5sIdle: 30.0`). Clock starts the instant the screen shows, before the player has read the HUD or seen the table.
- Change: show a 3-2-1 or "Aim and shoot to start" state; start `tickRack` on first shot (`rack.ts` `tickRack` gated on `state.started`), config `RACK_START_ON_FIRST_SHOT = true`. Keep clock running during rolling.
- Effort: S. Risk: score comparability with existing `rackHigh` (note in release).
- Verify: unit test `tickRack` does not decrement before first shot; Playwright idle 5 s keeps 35.0.

### CORNERPOCKET-06 | Graphics/Bug | S3
- Evidence: cue stick in `drawStick` (`renderBalls.ts:67-79`) is `gap + 260` long (up to 335 table px). `shots/cornerpocket-desktop-rack-pull.png`: stick is cut at the canvas left edge (x=156) because the cue ball starts at x=200 and the canvas margin is only the 36 px rail; `cornerpocket-phone-rack-pull.png` stick leaves canvas top; `cornerpocket-desktop-cpu-late.png` stick runs through top-right pocket and off table. Guide object-line (yellow) also runs through rails and out of canvas (`cornerpocket-desktop-dark-rack.png`).
- Change: clamp the stick's far end to the canvas by shortening to `min(260, distance_to_canvas_edge)` and fade the last 60 px with a gradient alpha to 0; clip guide rays to the cushion rectangle (ray vs `[0,TABLE_W]x[0,TABLE_H]`). Optional: draw stick at 60% opacity over rails.
- Effort: S. Risk: pure render change.
- Verify: screenshot cue at x=60 and x=740 in both orientations; stick never touches canvas edge abruptly.

### CORNERPOCKET-07 | UX/Onboarding | S3
- Evidence: `shots/cornerpocket-desktop-title.png`: first screen has one line of help text at 12.8 px under the fold of the cards, bottom 55% of the 1280x800 viewport empty; HUD hint is only "Clear the table before time runs out". No first-shot coaching; slingshot (pull opposite to shot) is counter-intuitive for pool players.
- Change: first-run (flag `cornerpocket-seen` in settings schema, zod) shows a 3-step coachmark on the first rack: "Drag back from the white ball", "Release to shoot", "Tap table to aim". Animate a ghost pull on the cue ball for 2 s (static under reduced motion). Add an "Aim style: pull-back / drag-to-aim" setting only if testing shows confusion.
- Effort: M. Risk: settings schema is `.strict()`; add field with default.
- Verify: clear storage, start Rack, coachmark appears once and is dismissable with Esc/Enter.

### CORNERPOCKET-08 | Graphics/Juice | S3
- Evidence: `src/fx.ts` only has 22-particle sparkle, ring flash, floating text; `shots/cornerpocket-desktop-rack-rolling.png`. Potted balls vanish instantly (`ball.pocketed`) with no drop/shrink; scratch has no shake; nothing on cushion hits; no ball trails at high speed.
- Change: add 0.18 s pocket animation (scale 1 to 0 and move toward pocket centre) driven by an Fx list, scratch screen shake (2 px, 0.15 s, off under reduced motion, via `ctx` translate), cue-ball flash on strike scaled by power, and score pop at the pocket instead of top-of-table text. Values go into `src/fxConfig.ts`.
- Effort: M. Risk: keep rendering purely visual; sim untouched.
- Verify: reduced-motion run shows zero shake and static text (`reducedParticles: 0` already holds); 60 fps unchanged.

### CORNERPOCKET-09 | Graphics/Readability | S3
- Evidence: floating text is drawn at `cssH * 0.14` (`render.ts:75`), landing on the top pocket/rail: "CPU: No pot: turn passes" overlaps pocket (`shots/cornerpocket-desktop-cpu-late.png`), "Miss" sits on the top-middle pocket in `cornerpocket-phone-landscape.png`. Text colours: `#ff8a73` on felt 6.57:1 OK, but text stroke is the only separation from rails.
- Change: anchor float text to the table's vertical centre-upper third of the felt (y = TABLE_H*0.32 in table coords, transformed) and reserve it away from pocket mouths; combine "CPU: No pot: turn passes" to "CPU missed". Move result copy to `strings.ts`.
- Effort: S. Risk: none.
- Verify: screenshots at all three viewports show text clear of pockets.

### CORNERPOCKET-10 | Audio | S3
- Evidence: `src/audio.ts` exports only `clack, cushion, pot, shot, chime, scratch`. No cue for rack clear, Clean Sweep, Hole in one, game over, win/loss, trick stars, ball-in-hand, turn change, low time, UI button press, or sound-on feedback. `shot()` reuses `clack`. `main.ts:onEvent` has no `over` sound. `pot()` is 0.5 gain vs clack 0.22 and cushion 0.28, with pot at 170 Hz being the loudest sound on the table (mix imbalance).
- Change: add `sfx.rackClear()`, `sweep()`, `win()`, `lose()`, `star(n)`, `tick()` (1 Hz under 10 s, 2 Hz under 5 s), `turn()`, `ui()`; trigger via a new `GameEvent` `{t:'sfx', name}` so UI never calls synth directly (ui-code rule). Normalise levels in one `MIX` table in `src/audioConfig.ts` (pot 0.35, clack 0.25, cushion 0.2, stingers 0.25) and route all through a master `GainNode` with `DynamicsCompressor`.
- Effort: M. Risk: autoplay policy: keep lazy context creation on gesture.
- Verify: unit test that each `OverInfo` and each text event maps to an sfx name; manual loudness A/B; OfflineAudioContext peak <= -3 dBFS.

### CORNERPOCKET-11 | Audio/Performance | S4
- Evidence: `audio.ts:44-55` `noise()` builds a new `AudioBuffer` and fills it with `Math.random()` on every clack (throttled to 25 ms, so up to 40 per second); `tone()` creates oscillator+gain per call.
- Change: pre-generate one 0.12 s noise buffer on first `ensure()` and reuse it; cap polyphony at 8 voices.
- Effort: S. Risk: none.
- Verify: Chrome performance trace during break shot shows no GC spikes from audio.

### CORNERPOCKET-12 | Accessibility | S3
- Evidence: `render.ts:43-47` spin mark is a 2.2 px dot, blue `#2f9de6` (top) vs orange `#e6552f` (back), 2.69:1 and 3.34:1 against the cue ball `#f7f4ea` and distinguished by hue only. Spin buttons show state only with `aria-pressed` fill colour.
- Change: draw a 4 px mark with dark outline plus a glyph (up/down chevron) and show a spin-preview badge in the HUD ("Top spin"/"Back spin"/"Centre"). Add shape-based redundancy for guide lines: object line solid yellow, cue-deflection line dashed cyan (currently differ only by hue `rgba(255,214,102)` vs `rgba(160,230,255)`).
- Effort: S. Risk: none.
- Verify: Chrome DevTools colour-vision emulation (protanopia/deuteranopia) screenshots still distinguish top vs back.

### CORNERPOCKET-13 | Accessibility/Contrast | S3
- Evidence: measured: gold stars `#b88a1b` on white panel 3.14:1 (fails 3:1 only barely for UI, but stars are the only progress indicator), `--line #d9d3c4` borders on panel 1.49:1 and on bg 1.32:1 (card edges nearly invisible), `kbd` text is `--muted` at 0.7em (~11 px). Muted text 4.95:1 on bg and 5.58 on panel pass AA; dark theme all >=7.0:1.
- Change: `--gold: #8a6510` (about 5.2:1 on white) in light theme; `--line: #b9b19c` for interactive card borders (>=3:1 per WCAG 1.4.11); `kbd` font-size 0.8em and `color: var(--ink)`. Add text label "2/3" next to star glyphs (already aria-label on cards, not for visual users with low vision).
- Effort: S. Risk: visual only.
- Verify: re-run contrast script; all interactive borders >= 3:1.

### CORNERPOCKET-14 | Accessibility/Text scale | S3
- Evidence: injecting `html{font-size:32px}` (2x) at 400 px: `scrollWidth` 472 > 400 (`shots/cornerpocket-phone-textscale2x.png`), horizontal scroll; `.seg button` long labels "Easy (long guides, loose CPU)" do not wrap well. HUD font is `rem` but canvas text uses `cssW/18` px and ignores user text scale.
- Change: `.seg button { white-space: normal; flex: 1 1 10rem }`, `.top-actions` wrap already; `min-width:0` on grid children; scale canvas float text by `parseFloat(getComputedStyle(documentElement).fontSize)/16`.
- Effort: S. Risk: none.
- Verify: 200% font on 400 px width, `scrollWidth <= innerWidth`.

### CORNERPOCKET-15 | Accessibility/Keyboard | S3
- Evidence: menu tab order is logical (Sound, Theme, 4 modes, Easy, Pro), focus ring is a 3 px gold outline (`style.css:49`). Gaps: in play, canvas `tabindex=0` has no focus-start, ball-in-hand placement uses arrows but the HUD does not say so; no way to fire at a specific ball by keyboard (only rotate at 0.9 rad/s, 0.18 fine). No "aim at next target" shortcut.
- Change: add Tab/`N` to cycle aim to the next legal ball (`legalTargets`), Enter to shoot at the current power preset (Low/Med/High keys 1-3), and focus the canvas on game start. Status text in place phase: "Ball in hand: move with arrows or drag, Enter to place".
- Effort: M. Risk: input.ts is 132 lines; keep under 300.
- Verify: complete a trick puzzle with keyboard only, no mouse.

### CORNERPOCKET-16 | Gameplay/Replay hooks | S3
- Evidence: Rack game over (`shots/cornerpocket-desktop-rack-over.png`) shows only "Score 1300 · reached rack 1 · best combo x0"; no "New best!", no previous best, no share/seed. `progress.rackHigh` exists but is only shown on the title page. Trick fail screen shows 0 stars with no hint of par/how close.
- Change: in `onOver` compare to `progress` before recording; include `newBest` in `OverInfo` and render a gold "New best" badge plus "Best 4200". Trick over: "Par 7, you used 9" and a Hint button after 2 failed attempts. Add daily seed for Rack Attack (`seed = yyyymmdd`) as a replay hook, with a label.
- Effort: M. Risk: `OverInfo` type extension; tests in `tests/game.test.ts`.
- Verify: set progress high, beat it, badge shows once; daily seed gives identical rack 1 across reloads.

### CORNERPOCKET-17 | Gameplay/Balance | S3
- Evidence: `rack.ts`: `rackTime = 15 + 5*count` (35 s for 4 balls, 60 s for 9) and each pot adds `min(combo,5)` s, clean sweep +10 s, rack clear carries leftover time. Pot economics: 4-ball rack needs 4 pots, a clean 4-pot chain earns 1+2+3+4 = 10 s plus 10 s sweep, so a good player gains net time every rack and the game has no natural end until the player misses (no difficulty ramp: rack count capped at 9 balls from rack 6, `layouts.ts:8`). Scratch only costs 5 s; Hole in one is first shot only (+250).
- Change: no-code assessment first - run `/balance-check` style simulation using `simulateShot` with the CPU as a bot to measure median rack reached at Easy/Pro. Candidate tuning: after rack 6 reduce `rackTime` by 2 s per rack, tighten pocket radius `POCKETS.r` or bonus cap to 3, add shot-clock. Move all constants (`SCRATCH_PENALTY`, `CLEAN_SWEEP_SECONDS`, `100*combo`, `250`, `500`, `200*rack`, `15 + 5*`) into `src/config/rack.ts`.
- Effort: M. Risk: changes scores vs saved `rackHigh`; version the progress key.
- Verify: bot run of 200 seeded games: target median 6-8 racks, 90th percentile < 15.

### CORNERPOCKET-18 | UX/8-ball clarity | S3
- Evidence: `shots/cornerpocket-desktop-cpu-late.png`: HUD says "YOU stripes (6 left)", but the table gives no on-ball indication of which balls are yours/legal; solids vs stripes depend on a thin 22%-height band at 10 px radius; "8" nearly indistinguishable from `#17161a` on dark felt. Foul results ("No pot: turn passes") are the only feedback; the CPU shot preview aims 0.8 s with no label.
- Change: draw a small ring (dashed, 2 px) under legal target balls for the human, a "CPU thinking" HUD status and fade-in of the aim line; add group chip in HUD with a ball-pattern icon; thicker stripe band (r*0.8) and numbers in a white circle at 0.55 r.
- Effort: M. Risk: none to rules8.
- Verify: screenshot after group assignment shows rings only on legal balls.

### CORNERPOCKET-19 | UI/Controls | S4
- Evidence: native `<meter id="power">` renders default green (`shots/cornerpocket-desktop-rack-pull.png`) out of palette; "Power" label and meter use 16 px height; keyboard kbd hints (`Esc`, `Space`, `R`, `Up Down`) appear on touch devices (`shots/cornerpocket-phone-rack.png`) where they are noise; spin legend overlaps fieldset border.
- Change: replace `meter` with a styled div using `--accent` (keep `role="meter"` and `aria-valuenow`), hide `kbd` under `@media (pointer: coarse)`, give `.seg legend` `background: var(--panel)`.
- Effort: S. Risk: none.
- Verify: screenshots; `aria-valuenow` updates.

### CORNERPOCKET-20 | UI/Hierarchy | S4
- Evidence: title screen (`shots/cornerpocket-desktop-title.png`) is a flat grid of identical cards; progress line "Rack Attack best 0 (rack 0) · Trick stars 0/45 · vs CPU 0W 0L" is 14 px muted prose; inconsistent trick card heights in last row (`shots/cornerpocket-desktop-tricks-grid.png`: cards 13 and 15 taller because of title wrapping alignment); Back and Menu both present on tricks screen.
- Change: put per-mode best on each card ("Best 1300", "12/45 stars", "3W 1L"), add a hero Play button for the last-played mode, align trick card content with `grid-template-rows: auto auto auto`, remove duplicate Back or Menu.
- Effort: S. Risk: none.
- Verify: screenshots; focus order still logical.

### CORNERPOCKET-21 | Robustness | S3
- Evidence: `input.ts:30` listens `window blur` to clear keys but `Game.update` keeps running on blur (only `document.hidden` stops it, `main.ts:174`); a Space-hold charge released while the window is unfocused is dropped (`charging=false`) without firing, which is fine, but the rack clock continues while a different window has focus. Also `layout()` runs every frame (`main.ts:176`) and calls `getBoundingClientRect` forcing layout each frame.
- Change: tie into CORNERPOCKET-04 pause on blur; call `layout()` from `ResizeObserver` on `#stage` and `orientationchange` only.
- Effort: S. Risk: none.
- Verify: blur window 10 s in rack mode, time unchanged; trace shows no forced reflow per frame.

### CORNERPOCKET-22 | Performance | S4
- Evidence: FPS 59.9 desktop (max frame 33.4 ms), 60.4 phone (max 16.8 ms) while balls rolled. Long-task observer logged 9 tasks of 53 to 153 ms but these coincide with my synchronous `runToRest()` scan loops in the test harness (60 sim seconds in one call), not real play; CPU shot planning (`rank(balls,targets,40)` runs real sims on the main thread, `cpu.ts`) is the genuine candidate: could not isolate it in-session.
- Change: measure `chooseShot` with `performance.now()` in a debug build; if > 16 ms, move to a Web Worker or spread candidates across frames (`requestIdleCallback`). `drawFx` allocates `fx.particles.filter` arrays per frame (`fx.ts:36`); switch to in-place compaction.
- Effort: S measure, M if worker. Risk: determinism is preserved because sim is pure.
- Verify: performance trace of CPU turn with 15 balls; longest task < 50 ms.

### CORNERPOCKET-23 | Code quality | S4
- Evidence: all files < 300 lines (largest `main.ts` 195), but `main.ts` mixes settings, screens, events, sound mapping, layout and loop in one module; functions `bindUi` (about 40 lines) and `drawFrame` fine. Tuning is scattered and hard-coded: `input.ts` `PULL_MAX 150, GRAB 90, CHARGE_RATE 0.85, 0.9/0.18 rad/s, 150 px/s`; `rack.ts` scoring; `eightMode.ts` `THINK 0.7, SHOW 0.8`; `cpu.ts` `NOISE`, 0.4 runner-up chance, 40 candidates; `fx.ts` 22 particles, 0.96 damping; `audio.ts` every frequency/gain; `render.ts` text rise 24. Gameplay-code rule requires external config.
- Change: create `src/config/{input,rack,cpu,fx,audio,layout}.ts` exporting frozen typed objects (zod-validated in dev), import everywhere; UI strings to `src/strings.ts`. No behaviour change.
- Effort: M. Risk: none if values copied exactly; existing 485 lines of tests guard physics/rules.
- Verify: `npm test` and `npm run build` pass; grep for numeric literals in the listed files drops.

### CORNERPOCKET-24 | Testing | S4
- Evidence: `tests/` covers cpu, game, physics, rules8, settings, tricks, view (485 lines) but nothing for UI/`ui.ts`, input handling, overlay focus, `onOver` wiring, or audio mapping.
- Change: add jsdom tests for `renderHud` (live-region content), `showOverlay` (focus + next button), `Input` (pull math at scale 0.5 and 1.0, keyboard charging), plus a Playwright smoke in CI at 1280x800 and 400x860 using `?debug=1`.
- Effort: M. Risk: devDependency additions must be pinned and audited.
- Verify: CI green; coverage report includes `src/ui.ts` and `src/input.ts`.

### CORNERPOCKET-25 | UX/Touch | S3
- Evidence: phone touch drag `pull()` (`input.ts`): full power needs 150 table px = about 75 CSS px at scale 0.499 and is reached at about 80 px (phonePull power 1.0 after 80 px drag), the finger covers the cue ball and stick; GRAB radius 90 table px = 45 CSS px, so a drag starting 50 px away from the ball becomes a tap-aim instead of a shot, with no feedback. No pull-cancel zone is visible (cancel only by tiny pull).
- Change: scale PULL_MAX in screen space (`max(150, 110/scale)` table px) so power resolution is constant across devices; offset the power/angle readout above the finger; draw a cancel ring (radius `PULL_MIN`) around the ball while dragging; show GRAB hit area briefly on first touch.
- Effort: S. Risk: input tuning; keep a Pro/Easy-independent value.
- Verify: touch drag of 40, 80, 120 CSS px gives power about 0.35, 0.7, 1.0 at both scales.

## Bugs found (with repro)

1. Phone portrait table pillarboxed (CORNERPOCKET-01): open at 400x860, Rack Attack, measure canvas 376x435; table about 235 px wide.
2. Phone landscape clipped (CORNERPOCKET-02): 860x400, start any mode, bottom pockets cut, page scrolls 548 px.
3. HUD live region spam (CORNERPOCKET-03): start Rack, observe 30 mutations in 3 s in `#hud`.
4. Esc discards run (CORNERPOCKET-04): start Rack, shoot, press `Esc` - menu appears, score gone, no prompt.
5. Cue stick and guide clipped at canvas edge / drawn over rails (CORNERPOCKET-06) - the known "cue extends past canvas" issue; reproduce at any start with cue at x=200 pulling left.
6. Timer runs before first input (CORNERPOCKET-05): start Rack, wait 5 s, time 30.0 s.
7. 2x text scale causes horizontal scroll (CORNERPOCKET-14): `html{font-size:32px}` at 400 px, scrollWidth 472.

No crashes, no console errors, no NaN HUD values, storage corruption handled (`{bad` settings and `{"rackHigh":-5,"stars":[9]}` progress both fell back to defaults).

## What already works well

- Deterministic fixed-step physics and a CPU that uses the real sim; trick par values verified by solver.
- Three input paths (slingshot, tap-aim, keyboard hold-Space) all functional; rapid key spam safe.
- Reduced motion drops particles and rise/pop animation (verified `particles.length === 0`), prefers-color-scheme and manual theme with complete dark palette (dark text contrast >= 7:1).
- All buttons >= 44 px high (measured on desktop and phone), visible 3 px focus ring, overlay moves focus to the primary button, aria-labels on canvas, trick cards and stars.
- Zod-validated storage with try/catch; 107 kB bundle; no external assets or network calls.

## What I could not check

- Real audio output (headless has no audio device): mix balance is from reading the synth code only, not by ear.
- Real-device touch feel, iOS Safari quirks (`ui-rounded`, 100dvh, safe areas), and thermal behaviour on low-end phones.
- Screen-reader announcements (VoiceOver/NVDA) - reasoning from DOM mutation counts only.
- Long-task cost of CPU planning in isolation (see CORNERPOCKET-22); my harness' synchronous scans polluted the long-task numbers.
- Colour-blind rendering via actual CVD simulation; contrast values are computed from CSS/canvas hex values.
- A 2P pass-and-play session with actual device hand-over, and a full natural 8-ball win (the 8-ball win/loss overlay was verified via the break-pot-8 loss and a CPU game ended mid-run).
