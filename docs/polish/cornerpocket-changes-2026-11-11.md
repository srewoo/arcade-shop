# Corner Pocket polish pass: changes log, 2026-11-11

Work list: `cornerpocket-review-2026-11-11.md` (25 items). Rules: `CONVENTIONS.md`.
Result: **16 done, 9 partial, 0 declined** (25 total). Sim modules (`physics, sim, constants, aim, rules8, layouts, rng, tricks`) are byte-identical to the pre-polish backup.

Final gates: `npm run build` OK (js 131.80 kB / 43.40 kB gz, css 9.62 kB; was 107 / 35 / 5), `npx vitest run` 13 files, 122 tests passed (was 7 files, 68 tests), `npm audit` found 0 vulnerabilities, console errors 0 in every headless session (desktop, phone portrait, phone landscape, reduced motion, dark, 2x text).

Verification scripts (kept outside the repo): `.../scratchpad/polish-work/cornerpocket/{smoke,verifyA,verifyB,verifyC,verifyD}.mjs`, shots `.../scratchpad/polish-shots/after-cornerpocket-*.png`.

## Report items

| ID | Status | What changed (files) | How verified |
| --- | --- | --- | --- |
| 01 phone portrait pillarbox | done | Stage is now a flex child filling the viewport (`style.css`, `index.html`); canvas sized by a `ResizeObserver` (`canvasView.ts`); header, help text and Restart removed from the phone play view; ball numbers scale to >= 8 screen px (`renderBalls.numberMetrics`). | 400x860: canvas 376x435 -> 376x600, table/canvas width 0.63 -> 0.86, scale 0.499 -> 0.688, ball radius 5.0 -> 6.9 px, number height 3.5 -> 8 px. No vertical scroll. Unit test on number metrics. |
| 02 landscape clip | done | `(max-height:500px) and (orientation:landscape)`: header hidden, grid layout with controls in a 13rem right column, HUD one line with ellipsis, 260 px floor removed. | 860x400: scrollHeight 548 -> 400, canvas 836x260 -> 634x320 (table 0.93 of width, 6 pockets visible). 667x375: scrollHeight 375, canvas 441x270. |
| 03 aria-live flood | done | `#hud` no longer a live region; Time stat `aria-hidden`; `#sr-timer role=timer` fed by `srTimer.timerSpeech` (every 10 s and at 5, 3, 2, 1); `#sr-status role=status` announces float text, pause, resume and game over once (`ui.announce`, single DOM write). | Playwright MutationObserver on `[aria-live]` across a 3 s shot: 30 -> 1 mutation. Unit tests for the timer speech. |
| 04 Esc / no pause | done | `Game.paused`; pause dialog (Resume, Restart, Settings, Sound, Quit) on Esc, P and a visible Pause button; auto-pause on `visibilitychange` and window `blur`; Restart/Quit/R go through an in-page "Abandon this game?" confirm (`pauseUi.ts`, `modal.ts`, `main.ts`, `game.ts`). Menu button removed from the header. | Playwright: Esc pauses, time 33.50 -> 33.50 after 5 s; Esc again resumes; blur and hidden-tab pause; P toggles; confirm default focus is Keep playing; Esc on game over does not discard. Unit tests: paused Game freezes clock, sim and CPU, refuses to shoot. |
| 05 clock before first shot | done | `RackState.started`, `tickRack` gated, `RackMode.onShot` starts the clock, HUD says "Aim and shoot to start the clock". | Idle 5 s: 30.0 -> 35.0 (unit + browser). |
| 06 stick/guide clipping | done | `geom.ts` (`rayExit`, `visibleBounds`, `stickLength`); stick shortened to the visible area with a 60 px alpha fade; guide rays stop at the cushions (`renderGuide.ts`). | Screenshots with the cue at x=60 and x=740 on desktop, phone, landscape; unit tests for ray/stick maths in both orientations. |
| 07 onboarding | done | `seen` flag in settings; slim coach strip ("Drag back from the white ball, release to shoot, tap the table to aim") plus an animated ghost pull on the cue (static under reduce motion); dismiss by button, Enter, Esc or first shot (`coach.ts`). The optional "aim style" setting was not added (no evidence of confusion). | Fresh profile: strip shown, Esc dismisses without pausing, not shown after reload. |
| 08 juice | partial | Pocket drop animation 0.18 s, scratch shake 2 px / 0.15 s, strike ring scaled by power, all in `config/fx.ts` and off under reduce motion (`fx.ts`, `renderFx.ts`, `render.ts`). Not done: score pop at the pocket (score is only known at shot end), cushion-hit and speed-trail effects. | Browser: drops/flash/particles counted during a pot; reduced run shows 0 particles, 0 drops, 0 flashes, 0 shake; unit tests. fps 60.2, max frame 16.8 ms. |
| 09 float text | done | Text anchored on the felt (first line at 20% of the long axis, later lines stack down), shrinks to fit 92% of the canvas, scales with text size; "CPU: No pot: turn passes" is now "CPU missed". | Screenshots at all three viewports, text clear of pockets; unit test for the message. |
| 10 audio | done | New sounds: rackClear, sweep, win, lose, newBest, star(n), tick (1 Hz under 10 s, 2 Hz under 5 s), turn, ui. Game emits `{t:'sfx'}` events; UI calls `sfx.play(name)`. `config/audio.ts` MIX table (pot 0.35, clack 0.25, cushion 0.2, stinger 0.25), master gain + `DynamicsCompressor`, volume and mute respected. Individual frequencies stay inline in `audio.ts`. | `sfxMap` test: every game-over outcome maps to a known sound; every name dispatches to a method. OfflineAudioContext peaks: rackClear 0.276, sweep 0.283, win 0.286, lose 0.279, star 0.206, tick 0.046, turn 0.134, ui 0.028, newBest 0.277 (all below -10 dBFS, limit was -3). Not listened to (headless). |
| 11 noise buffer / voices | done | One shared 0.12 s noise buffer, per-hit decay by gain envelope, 8-voice cap (`audio.ts`). | Code and unit review; no GC trace taken. |
| 12 spin cue / guide shapes | done | 4 px mark with dark outline plus up/down chevron (outline vs cue ball 15.3:1, was 2.69 and 3.34); "Spin: Top/Back/Centre" label in controls; object line solid yellow, cue line dashed cyan; assist adds end markers (diamond/circle). | Screenshots of top/back spin, assist on. CVD emulation not run. |
| 13 contrast | done | `--gold #8a6510` (3.14 -> 5.32 on panel, 4.71 on bg), new `--edge #8f8873` for interactive borders (card/button borders 1.49 -> 3.54 on panel, 3.14 on bg; dark `#66796f` 3.40/3.89), kbd text `--ink` at 0.8em, "2/3" text beside stars. The report's suggested `#b9b19c` only reaches 2.14:1, so a darker value was used. | Contrast computed from the CSS hex values. |
| 14 text scale | done | `.seg button` wraps, `min-width:0` on grid children, grids use `min(x,100%)`; canvas text scaled by the root font size; text size setting 100/125/150. | 400 px with `html{font-size:32px}`: scrollWidth 472 -> 400 on title, play and settings. 150% at 360 px: no horizontal scroll. |
| 15 keyboard | partial | `N` cycles aim through legal balls, `1 2 3` power presets, `Enter` shoots, canvas focused on start, place-phase status text (`input.ts`, `game.aimAtNext`). `Tab` is not hijacked (would break focus order); `N` only. | Playwright N, 2, Enter fires a shot; unit tests for the cycle. A full puzzle solved by keyboard alone was not played. |
| 16 replay hooks | partial | `OverInfo.newBest/best/par/shots`; gold "New best!" badge and "Best N" on Rack Attack over; trick over says "(par P, limit L)". Declined sub-items: Hint button (the puzzle hint is already always visible in the HUD) and daily seed (needs a separate leaderboard, a product decision). | Browser: stored best 400, run 900 shows the badge and saves 900; unit tests for `withBest`. |
| 17 balance | partial | `config/rack.ts` holds every constant; economy changes: pot time bonus cap 5 -> 3 s, rack time shrinks 5 s per rack from rack 4 (floor 15 s), clock starts on first shot. Scoring formulas unchanged. Progress key not versioned: old `rackHigh` values stay valid but were earned on easier clocks. | Bot sims (CPU planner at Pro accuracy plus aim noise, 3 s/shot, 14 games, cap 25 racks). Before: sd 0.008 rad median 25 / p90 25, sd 0.010 p90 25 (no natural end). After: sd 0.008 median 9 / p90 14 / max 15, sd 0.010 median 3 / p90 8, sd 0.012 median 3 / p90 7. Greedy bots do not play position, so mid skill medians sit below the 6-8 target; p90 < 15 holds. Unit tests pin the ramp and cap. |
| 18 8-ball clarity | partial | Dashed rings under legal balls (groups assigned, human turn), "CPU is thinking..." status, group chip glyphs (disc for solids, striped square for stripes), thicker stripe band (1.5r), number badge, light rim on the 8 ball. Not done: fade-in of the CPU aim line. | Screenshot after group assignment shows rings only on stripes; unit test for `highlight()`. |
| 19 controls | done | Power meter is a themed `role=meter` div, `kbd` hidden on `pointer: coarse`, spin legend replaced by a label row. | Screenshots; all visible buttons >= 44 px on every screen (measured). |
| 20 title screen | done | Per-mode best on each card (Best / x of 45 stars / W-L), hero "Play <last mode>" button, trick grid `grid-auto-rows:1fr` (card heights 107 and 130 -> all 130), duplicate Menu/Back removed. | Screenshots. |
| 21 blur / per-frame layout | done | Blur and visibility pause the game; `layout()` per frame removed, replaced by `ResizeObserver` plus `resize`/`orientationchange`. | Blur 4 s: time unchanged; no per-frame `getBoundingClientRect` in the loop. |
| 22 performance | partial | `fx` arrays compacted in place. CPU planning is a generator (`chooseShotSteps`, `chooseCuePlacementSteps`) advanced 2 candidates per frame (`config/cpu.workPerFrame`), same result and RNG use as before. No Web Worker. | Node bench before: `chooseShot` 172 ms median (max 190), placement 356 ms in one task. After: browser CPU turn shows 0 long tasks. Tests prove identical output and bounded steps. |
| 23 config / strings | partial | `src/config/{input,rack,cpu,fx,audio,layout}.ts` (frozen objects), `src/strings.ts`, `main.ts` split into `modal, pauseUi, settingsPanel, coach, prefs, canvasView, canvasSetup, debugHooks`. Left inline: audio frequencies, table art numbers; no zod check of configs in dev. All files <= 250 lines, no function over 50 lines. | Build and tests green; values copied exactly (existing physics, cpu, rules tests unchanged). |
| 24 tests | partial | +54 tests (pause, first-shot clock, tick, economy, pull maths, geometry, keyboard targeting, settings fields, new best, sfx map, timer speech, interpolation, fx, number metrics, CPU slicing). Not added: jsdom tests for `ui.ts` and `Input` DOM wiring (a new devDependency on a package set hit by the npm 10 workaround; covered by the Playwright scripts instead, which are not wired into CI). | `npx vitest run` 122 passed. |
| 25 touch pull | partial | `pull.ts`: full power at `max(150, 110/scale)` table px, grab radius `max(90, 56/scale)`, cancel ring while dragging, grab-area ring after a missed tap. Not done: moving the power readout away from the finger. | Drags of 40/80/120 CSS px give power 0.31/0.68/1.0 at 400x860, 860x400 (and 0.33/0.69/1.0 at 667x375); a drag starting 50 px from the ball now grabs (power 0.77). Unit tests for scales 0.4 to 0.73. |

## Conventions items

| Item | Status | Notes |
| --- | --- | --- |
| Pause (P/Esc, overlay, confirm, auto-pause, touch button, timers stop) | done | See 04, 05. Pause button 97x82 px. Esc on the dialog resumes; Settings from header or pause pauses and returns to the pause dialog. Focus returns to the opener (after the 2026-11-11 follow-up; before it, Resume from the Pause button sent focus to the canvas). |
| Settings panel | done | Volume 0-100, Sound, Reduce motion (System/On/Off), Colour-blind assist, Text size 100/125/150, Theme, Difficulty. Fields added to the strict zod schema with per-field fallback; pre-polish saves load unchanged; keys `cornerpocket-settings` and `cornerpocket-progress` kept. Persistence verified across reload, corrupt JSON falls back to defaults. |
| Reduce motion | done | Setting resolves against the OS preference (`effectiveReduced`); "Off" overrides a system "reduce"; "On" removes shake, flashes, drops, particles. |
| Colour-blind assist | done | Rims on every ball, bigger numbers, guide end markers. Spin and group cues are non-colour by default. |
| Text/HUD size | done | Root font-size scaling; HUD labels 0.75rem (11.2 -> 12 px). |
| 44 px targets | done | All visible buttons and the range input >= 44x44 on menu, tricks, play, pause, settings. |
| Contrast | done | See 13. Ball 8 vs felt is 2.27:1 (art), improved with a light rim. |
| Interpolation | done | `Game.alpha/drawPos` render between the last two 1/240 s steps; tests show identical tables with and without sampling. |
| Onboarding | done | See 07. |
| Layout (1280x800, 1920x1080-class, 400x860, 860x400, safe areas, DPR cap 2) | done | Play width scales with viewport height on large screens; 1280x800 canvas 1036x523 (table 0.93 of width). 1920x1080 not screenshotted. |
| Tuning config, strings module | done | See 23. |
| Debug-hook gating | done | `window.__cp` only with `?debug=1`, loaded by dynamic import. |
| Hard constraints | n/a | None of the rug/dino/crumbrun/stackfall/sudokudash constraints apply to this game. Determinism check: physics, sim, constants, aim, rules8, layouts, rng and tricks are unchanged. |

## Extra findings

- Rack Attack had no natural end for an accurate player (bot sd 0.010 rad reached the 25-rack cap in over 10% of games): fixed by the time ramp and bonus cap in item 17.
- Esc and R discarded a run instantly, and the menu button forfeited too: now confirm-gated.
- `Input` dropped held keys on blur only; pause now also resets drags and power.
- Header Settings and the game-over overlay interact safely: opening Settings after game over does not pause; Esc on the overlay is a no-op.
- `window.__cp` is now installed asynchronously (dynamic import), so test scripts must wait for it.

## Known remaining issues

- Audio was never heard (headless); levels are checked by peak only.
- No colour-vision-emulation, VoiceOver or real-device touch check; 1920x1080 not screenshotted.
- At 200% text the HUD stacks tall and the page scrolls vertically (no horizontal overflow).
- 360x740 phones get a 336x433 canvas (table 0.70 of width) because HUD and controls take 300 px.
- Balance medians for mid-skill bots (3 racks) are below the 6-8 target; real players will differ, retune `config/rack.ts` from telemetry.
- Items marked partial above: score pop at pocket, cushion/trail effects, CPU aim fade-in, keyboard-only full puzzle, jsdom tests, readout offset, Web Worker for the CPU, progress key versioning.

## Follow-up fixes 2026-11-11

Fixes for the verification findings (R1/S3, N1-N3/S4). Status corrections: item 15 status text is now correct after placement (was a regression), and the pause "focus returns to the opener" claim is only true after this follow-up.

| Finding | Status | Change | Verification |
| --- | --- | --- | --- |
| R1 (S3) stale "Ball in hand" after placing in 8-ball | fixed | `EightMode.hud()` keys the hint off `phase === 'place'` instead of `state.ballInHand` (rules state untouched). | Unit test (hint present while placing, gone after `confirmPlace`); Playwright vs CPU: hint -> "Break!" after Enter. |
| N1 (S4) Enter/Space spam dismisses Rack Attack results | fixed | New `grace.ts` + `INPUT.graceMs` (600 ms): result overlay buttons ignore activation for 600 ms after appearing. | Unit tests for the grace window; Playwright: 30 Enter/Space presses right after game over leave the overlay up, a later Enter dismisses it. |
| N2 (S4) double-click on Trick Shots starts a puzzle | fixed | Trick cards ignore clicks with `detail > 1` and clicks within the grace window after the grid renders. | Playwright: double-click opens the grid only; a later click starts puzzle 1. |
| N3 (S4) focus after Pause button goes to canvas | fixed | `resume()` no longer forces focus to the canvas; `hideModal` restores the opener (canvas fallback). | Playwright: Pause button then Resume -> focus on `#pause-btn`; P/Esc path also returns to the opener. |

Gates: `tsc --noEmit` clean, vitest 14 files / 125 tests, build OK, `npm audit` 0 vulnerabilities, 0 console errors in the browser runs. N4 (coach strip height jump) not addressed (out of scope for this follow-up).
