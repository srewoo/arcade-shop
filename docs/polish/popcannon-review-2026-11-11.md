# Pop Cannon: polish assessment (Phase 1), 2026-11-11

Reviewer: automated studio review. Source and config were read-only. Build tested via `vite preview` on port 4864 in an isolated Playwright 1.48.2 Chromium (desktop 1280x800, phone 400x860 touch, phone landscape 860x400, dark and reduced-motion emulation). The `?debug=1` hook (`window.__pc`) was used for bot runs. Screenshots are in `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/` and are referred to below as `shots/popcannon-*.png`. Server stopped and `dist/` deleted afterwards.

## Scorecard

| Area | Score | Reason |
| --- | --- | --- |
| UI | 3/5 | Clean, consistent chrome and good hierarchy, but the desktop canvas is only 417x617 in a 1280x800 window and phone landscape collapses to 146x217. |
| UX | 3/5 | Fast to start (Arcade is focused on load, Enter starts), but there is no onboarding for bombs, rainbows and stones, no Esc/back, and focus leaks out of modals. |
| Gameplay | 3/5 | Core shot feel and rules are sound. Puzzle pars are meaningless on several levels, and Arcade level 1 is rarely cleared because of the refill cadence. |
| Graphics | 3/5 | Cohesive glossy bubbles and good colour-blind symbols, but no pop animation, recoil, trail or level banners, so the juice is thin. |
| Audio | 2/5 | One synth voice per event only: no master bus or limiter, no combo escalation, no UI, timer or danger sounds, no volume control. |
| Accessibility | 3/5 | Strong base (symbols, motion setting, keyboard play, aria labels, zod-validated settings). Gaps: no focus trap, 38px header buttons, symbols off by default, fixed canvas text. |
| Performance | 4/5 | Measured 60.1-60.4 fps in every mode on desktop and phone, max frame 16.8 ms, no frames over 34 ms. Per-frame gradient allocations and unbounded `grid.rows` are latent costs. |
| Robustness | 3/5 | Corrupt storage falls back cleanly, tab-hide pauses, rapid input is safe, and there were no console errors. Weak spots: `land()` early-return, unbounded rows, debug hook shipped in the production build. |

## Top 3 ("if you only do three")

1. POPCANNON-01 / 02: Fix the progression and difficulty maths. Make Arcade clearable (the refill cadence outpaces clearing) and recalibrate puzzle pars from a solver (level 10 par 22 is solved in 4 shots).
2. POPCANNON-07: Add render interpolation (or cap and decouple the visual step) and a pop/recoil/ball-trail juice pass so the 60 Hz sim stops stuttering on 120/144 Hz screens and feedback feels earned.
3. POPCANNON-03 / 04: Fix layout use of space. Make the desktop canvas fill the viewport height, and add a landscape layout for phones (side controls) so the game is playable when rotated.

## Full prioritised list

Effort: S under half a day, M 1-2 days, L more. Severity: S1 broken, S2 major, S3 moderate, S4 nice-to-have.

### POPCANNON-01 | Gameplay | S2 | Arcade level clear almost unreachable
- Evidence: `afterShot` in `src/shoot.ts` calls `dropCeiling` every `dropEvery` shots (`src/rules.ts:arcadeDifficulty`, 8 at level 1). A new full row of 10-11 bubbles arrives every 8 shots. A greedy "best pop" bot (`__pc.shootBest`) over 5 seeds and 400 shots each reached only level 2 on 2 of 5 seeds. The other 3 stayed on level 1 (223 shots with 8 bubbles still on the board in the first run). A random-aim bot lost in 28-48 shots (mean about 39), so the fail side is fine.
- Change: Make the clear reachable. Options (pick with the designer): (a) first drop after N=10 shots on level 1 and ramp from 10 down to 4 over 10 levels (currently 8 down to 3 over about 8 levels); (b) a finite starting field plus drops that add rows only when no pop happened that shot (the classic "miss" rule); (c) clear at 100% of non-stone bubbles in the top 6 rows. Recommend (b), which is the genre norm, and keep `dropEvery` as the miss budget.
- Effort: M. Risk: changes scoring curve and any saved Arcade best (reset or version `pc-scores`). Keep the seeded RNG deterministic (tests in `tests/sim.test.ts`).
- Verify: re-run the bot over 20 seeds; target 70% or more of seeds clearing level 1 within 40 shots, level 5 reachable by a skilled bot but not by a random one. Add a vitest for the new drop rule.

### POPCANNON-02 | Gameplay | S2 | Puzzle pars are not calibrated (known issue, now measured)
- Evidence (greedy max-pop bot, seeded; "rand" is 30 runs of random-angle play):
  - L1 par 6, bot clears in 3 shots (3 stars). Random aim wins 4/30 with 3 stars.
  - L3 par 9, bot 4 shots (3 stars). L10 par 22 (queue 38), bot 4 shots (3 stars), random 5/30 wins and 3/30 three-star.
  - L8 par 12, bot 8 shots (3 stars). L2 par 9, bot 10 (2 stars). L7 par 14, bot 17 (2 stars).
  - L4, 5, 6, 9, 11, 12: the greedy bot fails (out of shots), so those pars are untested by it. A solver is needed to know if they are fair.
- Change: Add a dev script (`scripts/solve-puzzles.ts`, using the pure `match.ts`/`aim.ts` modules) that does beam search over angles (1 degree steps, queue order fixed, swap allowed) and records the best-found shots per level. Set 3-star par = best-found + 1 or 2, 2-star = par + 25% of slack, and shorten the queue to par x 1.6 so the shot limit bites. For L1-3 and L10 specifically: L10 par 22 to about 6, L1 par 6 to 4.
- Effort: M. Risk: stars saved in `pc-scores` change meaning, so bump the key or recompute. Verify: unit test that every level is solvable within `limit` (solver result) and that par is at most solver-best + 2.

### POPCANNON-03 | UI | S3 | Desktop canvas uses a third of the window
- Evidence: `shots/popcannon-desk-title.png`, `desk-puzzle1.png`. At 1280x800 the canvas is 417x617 CSS px (`src/style.css:27` `.app{max-width:36rem}`; `resize()` in `src/main.ts` fits W=352 x H=520 into the stage). Bubble radius on screen is about 18 px.
- Change: Raise `.app` max-width to `min(100vw, 56rem)` and let the stage fill the remaining height. The canvas already scales with `min(w/W, h/H)`, so height drives size. Move the 4 control buttons beside the canvas at widths over 900px (grid 1fr auto), freeing about 60 px of height. Target canvas height of at least 700 px at 800 px viewport height.
- Effort: S. Risk: none to the sim. Verify: screenshot at 1280x800 and 1920x1080; canvas height at least 85% of the window minus header.

### POPCANNON-04 | UI/Robustness | S2 | Phone landscape is unplayable
- Evidence: 860x400 viewport: canvas measured 146x217, the pause panel is 201 px tall and covers it (`shots/popcannon-phone-landscape.png`). The header, HUD and controls take about 180 px of a 400 px height.
- Change: Add `@media (orientation: landscape) and (max-height: 520px)`: switch `.app` to a 3-column grid (HUD stack left, canvas centre, controls right), hide the `<h1>` and the 0.68rem labels, and shrink the panel to a 2-column button grid with `max-height: 100%`. Alternatively show a "rotate your device" notice, but the layout is the better fix.
- Effort: M. Risk: touch targets must stay 44 px or more. Verify: Playwright at 860x400 and 667x375; canvas at least 300 px tall; all panel buttons reachable without scrolling.

### POPCANNON-05 | Accessibility | S3 | Modal overlay does not trap focus
- Evidence: With the title shown, Tab order was Puzzle, Time Rush, Settings, then the background controls `◀`, `Swap`, `▶` (then body, Pause). The panel has `aria-modal="true"` but `#overlay` siblings are not inert. (Fire is skipped only because it is disabled.)
- Change: In `show()` (`src/screens.ts`), set `inert` on `.top`, `.hud` and `.controls` while the overlay is open and remove it in `hideOverlay()`. Return focus to the previously focused control (canvas) on close.
- Effort: S. Verify: Tab cycles only within the panel; axe or manual check; Esc behaviour per item 18.

### POPCANNON-06 | Robustness | S3 | `grid.rows` grows without bound in Arcade
- Evidence: `dropCeiling` (`src/match.ts:118`) `unshift`s a row and never trims empty trailing rows. After 223 shots the bot's board held 8 bubbles but `rows` was 32 (`__pc.state().rows`). `lowestRow`, `forEachBubble`, `findFloating` and `structuredClone` loops scale with it.
- Change: After `removeCells` and after the drop, pop trailing rows that are all null while `rows.length > 0`. Add a test that rows length is at most lowestRow + 1.
- Effort: S. Risk: `DANGER_ROW` logic uses `lowestRow` (unchanged). Verify: 400-shot bot run ends with rows at most 16.

### POPCANNON-07 | Graphics/Performance | S2 | No render interpolation (known)
- Evidence: `frame()` in `src/main.ts` runs fixed 1/60 steps and renders the latest state with no alpha blend. The ball moves 10.7 px per step (`BALL_SPEED` 640 / 60). On a 120/144 Hz display frames alternate between 0 and 1 sim steps, so the ball and falling bubbles judder. Not measurable in headless 60 Hz Chromium (I measured 60.1 fps, max 16.8 ms).
- Change: Keep `prevBall`, `prevFaller` positions in `Game` (or a render-only snapshot) and draw at `lerp(prev, cur, acc / STEP)`. Particles and fallers can be interpolated the same way. Pass `alpha` through `RenderOpts` in `src/render.ts`.
- Effort: M. Risk: do not feed interpolated values back into the sim; determinism tests unchanged. Verify: run with Chromium `--run-all-compositor-stages-before-draw` at 144 Hz (or throttle) and compare ball x/y deltas per frame; they should be uniform within 1 px.

### POPCANNON-08 | Accessibility | S3 | Touch targets under 44 px
- Evidence (phone 400x860, measured `getBoundingClientRect`): Pause 58x38, Sound 79x38 (`.icon-btn` min-height 2.4rem = 38 px). `.btn.small` in Settings is 2rem = 32 px. `◀ ▶ Swap Fire` are 74/104 x 46 and pass. The NEXT bubble swap hit area is a 34 logical-px radius, about 36 px on screen, which is fine.
- Change: `.icon-btn { min-height: 2.75rem; min-width: 2.75rem }`, `.btn.small { min-height: 2.75rem }`. Add `.level { min-height: 3.25rem }`.
- Effort: S. Verify: Playwright asserts every visible button is at least 44x44.

### POPCANNON-09 | UX | S3 | Fire button disabled flicker and low contrast
- Evidence: `src/main.ts:117` sets `disabled` whenever `g.ball` exists, so the button flashes to opacity 0.5 on every shot (white on 50% accent about 2.4:1). `shots/popcannon-phone-pause.png`.
- Change: Never disable it. Ignore the press silently and show a 100 ms "cooldown" ring instead, or keep it enabled and queue one buffered shot (input buffering of about 150 ms improves feel).
- Effort: S. Verify: Fire stays at full contrast during flight; a press during flight fires on landing if buffered.

### POPCANNON-10 | UX | S3 | Onboarding does not explain special bubbles or goals
- Evidence: Title only has the line "Drag to aim, release to fire. Keys: ...". Bomb, rainbow and stone appear from level 3 (`SPECIALS_FROM_LEVEL`) with no tooltip. The "NEXT / SWAP" label is 10 logical px (about 10.7 px on phone, `render.ts:104`). No explanation of the red line, the ceiling-drop counter dots, or puzzle stars.
- Change: (a) First-run coach card (stored in `pc-settings` as `seenTutorial`): 3 steps with highlights (aim, swap, danger line). (b) First time each special spawns, show a one-line popup ("Bomb: pops everything within 2 cells") pausing 0 ms. (c) Raise the canvas label to 12 logical px and add a "?" button listing controls.
- Effort: M. Verify: new profile shows the card once; reduced-motion respected; each special announces once per profile.

### POPCANNON-11 | Audio | S3 | Thin audio: no bus, limiter, escalation or UI sounds
- Evidence: `src/audio.ts` has 11 events, each `osc/gain` direct to `ctx.destination` (no master gain or compressor). A big bomb plus fall plus pop at the same time stacks (vol 0.5 noise + 0.2 saw + 0.16 x 4). `pop` depends on group size only, not on `g.combo`. No sound for: button clicks, game start, pause/resume, aim ticks, danger-line approach, Time Rush last 10 s, new best, star award, or locked puzzle. No music. No volume slider (only on/off).
- Change: Add a master `GainNode` (0.7) into a `DynamicsCompressorNode`; add a volume setting (0-100, step 10) to `Settings`; scale pop pitch by combo (`note(440, SCALE[...] + 2*combo)`); add events `ui`, `danger`, `tick`, `best`, `star(n)`; reuse a single pre-generated noise buffer instead of allocating per call. Route UI clicks through `playEvent` (matches the ui-code rule "UI sounds via the audio event system").
- Effort: M. Verify: offline-context render shows peak at most 0.9 on a bomb+fall+pop burst; unit test for the event map; manual listen.

### POPCANNON-12 | Graphics | S3 | Pop, drop and level-clear feedback is thin
- Evidence: Popped bubbles vanish instantly and emit 6 particles of 2.4 px (2 under reduced motion; `shoot.ts:resolve`). No cannon recoil or muzzle flash, no ball trail, no hit-stop. Arcade `status 'cleared'` waits 1.8 s with only a popup and a jingle, no banner. Screen shake is `Math.random()` per frame at amplitude up to 7 (`render.ts:148`), so it is jittery rather than damped.
- Change: (a) 80-120 ms scale-up then fade on popped bubbles, particles ring burst of 10 with 2 sizes; (b) cannon recoil: offset -4 px decaying over 120 ms and a 40 ms muzzle flash; (c) 6-point fading ball trail; (d) centred "LEVEL n CLEAR" banner during the 1.8 s; (e) replace random shake with a decaying sine at 30 Hz; all gated by `g.reduced`.
- Effort: M. Risk: effects stay out of the sim (use `fx`). Verify: screenshots mid-pop; reduced motion shows no recoil or shake; FPS stays at 60 with 150 particles.

### POPCANNON-13 | Graphics/UI | S4 | Visual identity is generic and the light chrome fights the dark canvas
- Evidence: `shots/popcannon-desk-title.png`: a light page frame with a permanently dark canvas, overlaid by a blurred wash; logo is plain text "Pop Cannon". Dark theme looks cohesive (`desk-dark-symbols`-style shots).
- Change: Make the page background follow the canvas gradient in both themes (or use a dark-only chrome with accent colour), add a simple bubble-cluster wordmark (SVG data URI reused from the favicon), and keep light mode only as a card style.
- Effort: S-M. Verify: art-director sign-off; contrast checks below stay at least 4.5:1.

### POPCANNON-14 | Accessibility | S3 | Colour discrimination relies on hue; symbols off by default
- Evidence (WCAG relative-luminance ratios, computed): red/green 1.44, orange/red 1.49, orange/yellow 1.6, so hue is the only separator for many players. Bubbles vs canvas bg `#0d1024`: red 4.84, purple 4.75, blue 5.11 (all above 3:1 for graphics). Symbols (circle, triangle, square, diamond, star, cross) work (`shots/popcannon-desk-symbols.png`) but default `symbols: false` and the setting lives only in Settings.
- Change: Offer a "Colour-blind symbols" quick toggle on the title screen and in the HUD row; default to on when `prefers-contrast: more` or `forced-colors` is active; darken purple (`#a855f7` to `#9333ea`) and spread luminance (green to `#2f9e5c`, orange to `#fb923c`) so adjacent hues differ at least 1.8:1. Also give special bubbles non-colour cues (already distinct shapes: keep).
- Effort: S. Verify: run a protanopia/deuteranopia simulation on a screenshot; all 6 colours distinguishable with symbols off, or the toggle is within 1 click of the title.

### POPCANNON-15 | Code quality | S3 | Gameplay tuning is hardcoded across files
- Evidence: `BALL_SPEED = 640` (`shoot.ts:11`), `TURN_RATE = 1.7` (`update.ts:8`), score formula (`shoot.ts:75`, `:98`), special spawn odds 0.06/0.12 (`rules.ts:54`) and 0.07 (`:64`), `clearTimer = 1.8` (`shoot.ts:148`), result delay 900 ms (`main.ts`), `RUSH_SECONDS`, `DANGER_ROW`, shake and dropAnim constants (`update.ts:17-18`), `R`, `H`. This conflicts with the gameplay-code rule that gameplay values come from config.
- Change: Create `src/config.ts` exporting a frozen, zod-validated `TUNING` object (ball speed, turn rate, scoring, special odds, timers, par bands, shake). Import it everywhere above; add one test asserting defaults parse. No file exceeds 300 lines and no function exceeds 50 lines today, so no splitting is needed.
- Effort: S-M. Risk: must keep seeded determinism identical (values unchanged). Verify: existing `tests/sim.test.ts` snapshots unchanged.

### POPCANNON-16 | UX | S3 | Esc / back handling and focus restore
- Evidence: Esc only toggles pause during play (`bindKeys` calls `pause` for 'p' or 'escape'; `setPaused(phase==='play')` is a no-op in menus). Settings, puzzle select and result screens cannot be closed with Esc. After Resume the canvas is refocused, but returning from Settings does not restore the previously focused button.
- Change: A single `onBack()` in `screens.ts` per screen; Esc invokes it (Settings to previous screen, Puzzle select to title, Result to menu). Restore focus to the opener.
- Effort: S. Verify: keyboard-only walkthrough title, settings, back, puzzle, back, with Esc.

### POPCANNON-17 | Performance | S4 | Per-frame allocations in the render hot path
- Evidence: `drawBubble.ts:12` creates a `createRadialGradient` per bubble per frame (about 40-110 per frame, more with fallers), plus background and cannon gradients; `main.ts` writes 6 `textContent`s per frame in `updateHud`; `game.events.splice(0)` allocates per step; `updateEffects` reallocates arrays via `filter` per step. Measured fps is still a stable 60 in headless Chromium, so this is headroom for low-end phones, not a current defect.
- Change: Pre-render each bubble kind and colour (and symbol variant) once to an `OffscreenCanvas` sprite sheet at the current DPR, `drawImage` per bubble; cache the background gradient; write HUD text only when the value changes; in-place compaction for effects arrays.
- Effort: M. Verify: Chrome performance trace shows scripting time per frame down by at least 40% on 4x CPU throttle; no visual diff.

### POPCANNON-18 | UX | S3 | Puzzle select and HUD hide what stars require
- Evidence: Select screen shows name and stars only; the HUD shows "Shots N" but not par or the 2/3-star thresholds; result screen says "Cleared! ★★" without telling the player how far from 3 stars they were (`starsFor` in `levels.ts`).
- Change: Show "Par n / limit m" under each level tile and in the HUD meter (`Shots 12 (par 9)`); result lines add "3 stars at n shots or fewer".
- Effort: S. Verify: text visible in `phone-puzzle-select.png` equivalent without clipping at 400 px (tile text at least 11 px).

### POPCANNON-19 | Gameplay/UX | S3 | Ceiling drop is not telegraphed
- Evidence: Ceiling drop happens after the shot that hits `sinceDrop >= dropEvery` with a 3 px shake and a 130 ms slide (`dropAnim` decays at 260 px/s). The only warning is 8 tiny 3.2 px dots on the ceiling and the HUD "Drop in" counter.
- Change: When `dropEvery - sinceDrop === 1`, tint the ceiling bar amber and pulse the dots (not under reduced motion; instead use a static colour change). Add a distinct `ceiling` tick sound on the shot before.
- Effort: S. Verify: visible and audible one shot ahead; no flashing over 3 Hz.

### POPCANNON-20 | Gameplay | S3 | Time Rush has no urgency cues
- Evidence: 90 s mode, greedy bot gets 36-41 shots and 3.3k-5.2k points (3 seeds); HUD only shows "Time 90 s". No audio or colour change in the final 10 s, no "time bonus" for clears beyond +300.
- Change: Below 10 s turn the HUD meter red and tick each second (respect Sound); add +3 s on a board clear; show a final "Time's up" banner before the result sheet.
- Effort: S. Verify: manual run; reduced-motion shows colour only.

### POPCANNON-21 | Robustness | S3 | `land()` can swallow a shot
- Evidence: `src/shoot.ts:58` `if (!pos) return;` after clearing `g.ball`/`g.flying` and without calling `afterShot`, so a ball that finds no free cell (full boundary row) is silently consumed, with no stick, no drop counter and no loss check. Not reproduced in play (needs a pathological board), found by reading code.
- Change: Fall back to the nearest in-bounds free cell scan with a larger radius; if none exists, call `lose(g)`. Add a unit test with a packed top row.
- Effort: S. Verify: new test in `tests/sim.test.ts`.

### POPCANNON-22 | Robustness | S4 | Debug hook is shipped in the production build
- Evidence: `src/main.ts:181` calls `installDebug`; `?debug=1` exposes `window.__pc` (start, shoot, settle) in `vite build` output (confirmed against the preview server).
- Change: Guard with `import.meta.env.DEV || import.meta.env.VITE_E2E === '1'` so it tree-shakes out of production.
- Effort: S. Verify: `grep __pc dist/assets/*.js` returns nothing; E2E scripts use a dev or `VITE_E2E` build.

### POPCANNON-23 | Accessibility | S4 | No text scaling for canvas text
- Evidence: Canvas labels use fixed logical sizes (10 px label, 14/18 px popups, `render.ts`) scaled only with canvas size. The DOM uses rem, so browser zoom works there.
- Change: Add a Settings "Text size" (100/125/150%) applying to the popups, NEXT label and HUD (`--ui-scale` CSS variable plus a canvas font multiplier). Also add a pause-free "high contrast" option that thickens the guide dots and the danger line.
- Effort: M. Verify: at 150% no HUD clipping at 400 px.

### POPCANNON-24 | UX | S4 | Result screen is flat
- Evidence: `shots/popcannon-phone-gameover.png`: "Game over / Score 110 (new best!) / Best combo x1 / Reached level 1". No indication of why you lost (which bubble crossed the line), no star count animation, no stats such as shots or accuracy. The HUD still shows "Drop in 8" behind the blur.
- Change: Highlight the lowest offending row and flash the danger line for 600 ms before the sheet (existing 900 ms delay); count up the score and reveal stars one by one; add shots and accuracy lines; freeze the HUD meter to "-".
- Effort: S-M. Verify: visual check; reduced motion shows the final state immediately.

### POPCANNON-25 | Gameplay | S4 | Replay hooks
- Evidence: Only high scores per mode and puzzle stars persist. No daily seed (the RNG is seeded, `mulberry32`), no streak, no achievements, no unlock for the 6th colour.
- Change: Add a "Daily Arcade" mode with `seed = yyyymmdd` and a separate stored best; show it on the title.
- Effort: M. Risk: needs a date-based seed; keep determinism tests. Verify: same seed gives the identical first 20 bubbles across two browsers.

### POPCANNON-26 | UX | S4 | Aim guide limited to one bounce and ignores special bubbles
- Evidence: `traceShot(g.grid, g.angle, 1)` in `render.ts` stops the guide after one wall bounce, and the landing ring is hidden after a bounce (`if (tr.bounces > 1) return`). Aiming with a bomb or rainbow gives no preview of the blast radius.
- Change: Keep the single-bounce guide but draw a faint blast radius (2 cells) around the landing ring when `g.cur.kind === 'bomb'`, and highlight the group that would pop (ghost outline) for normal bubbles.
- Effort: M. Verify: screenshot with a bomb loaded; no per-frame allocation regression (reuse the trace).

## Bugs found (with repro)

1. Unbounded `grid.rows` (POPCANNON-06). Repro: `/?debug=1`, in console run `__pc.start('arcade',0,3)`, then loop `__pc.shootBest(); __pc.settle(150)` for about 220 shots. `__pc.state().rows` reaches 32 while `bubbles` is 8.
2. Modal focus leak (POPCANNON-05). Repro: load the page, press Tab four times. Focus moves from Settings to the background `◀` button.
3. Phone landscape (POPCANNON-04). Repro: phone emulation 860x400, open Pause; the panel (201 px) covers a 146x217 canvas.
4. Fire button flicker (POPCANNON-09). Repro: fire any shot and watch the button drop to 50% for the flight duration.
5. Esc does nothing in menus (POPCANNON-16). Repro: open Settings from the title and press Esc.
6. `land()` early return (POPCANNON-21): code-reading only, not reproduced.
7. Debug hook present in production (POPCANNON-22). Repro: `npm run build && npx vite preview`, open `/?debug=1`, check `window.__pc`.

No console errors or page errors in any run (title, 3 modes, settings, pause, result screens, dark, reduced motion, phone touch, storage corruption).

## What already works well

- Stable 60.1-60.4 fps in title, puzzle, rush and phone runs; no long frames.
- Pure, well-tested sim modules (`hex`, `match`, `aim`, `levels`, `rules`) and a fixed-timestep loop independent of refresh rate.
- Keyboard-complete play (arrows or A/D, Space, X, P, M); Arcade is focused on load, so Enter starts immediately.
- Pause on tab hide (`visibilitychange`, verified) and on Esc/P; held keys are cleared on blur.
- Touch: drag-to-aim with release-below-cannon cancel (verified fire on touchEnd), hold-to-aim arrow pads.
- Settings validated with zod and tolerant of corrupt storage (verified: bad JSON gives defaults, no crash).
- Colour-blind symbols implemented as distinct shapes; motion setting plus `prefers-reduced-motion` honoured; theme tokens with dark mode.
- UI text contrast measured: muted text 5.3:1 on bg (light), 6.9:1 (dark); primary button 7.0:1 and 7.3:1.

## What could not be checked

- Real high-refresh (120/144 Hz) judder (item 07 is inferred from the loop, not measured).
- Real audio output: mix balance, clipping and loudness were reviewed from the synth code only (headless has no audible device).
- Real devices: iOS Safari (AudioContext unlock, safe-area insets, 100dvh), Android Chrome and gesture conflicts such as pull-to-refresh (the CSS sets `overscroll-behavior: none` and canvas `touch-action: none`).
- Puzzle fairness for L4, 5, 6, 9, 11 and 12 beyond the greedy bot (needs the solver in item 02).
- Screen-reader behaviour (VoiceOver or NVDA); only aria attributes were read.
- Long-session memory (about 30 minutes) and battery use.
- Light-mode reduced-motion visual comparison beyond code reading (`reduced` gates shake, drop slide, popups and pulse).
