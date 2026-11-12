# Sudoku Dash: polish assessment (Phase 1), 2026-11-11

Build reviewed: `/Users/sharajrewoo/DemoReposQA/arcadeShop/sudokudash` (Vite 7.3.7 production build, served by `vite preview` on :4866, driven by Playwright 1.48.2 / Chromium, desktop 1280x800 and phone 400x860 touch, plus 375x667, 320x568 and 860x400).
Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/sudokudash-NN-*.png` (abbreviated `shots/NN` below). Probe scripts are `sd-*.mjs` in the scratchpad. Source was not modified; `dist/` deleted and server stopped.

## Scorecard (1-5)

| Area | Score | Reason |
| --- | --- | --- |
| UI | 3 | Clean, consistent tokens, good board hierarchy; popups collide with digits/HUD, hint panel shifts the layout, cramped mobile tool rows. |
| UX | 2 | Dash rules never explained, Menu does not pause (clock keeps draining), Solve all is one unconfirmed tap, undo farms time. |
| Gameplay | 3 | Good logical-solver hints and combo idea; Easy Dash is practically unlosable and the undo exploit breaks scoring. |
| Graphics | 3 | Cohesive flat look, light/dark both fine; juice is minimal (no board shake, no completion flashes, no low-time pulse). |
| Audio | 2 | Eight beeps only: no sound for erase/undo/pause/pad/low-time, `tap` defined but never used, no volume control or master bus. |
| Accessibility | 3 | Real buttons, labelled cells, reduced-motion honoured, strong ink contrast; touch targets under 44px, 8-9px notes, dark hint-focus 2.36:1, no focus trap in end dialog. |
| Performance | 5 | 60.5-60.6 fps in play on desktop and phone profile, max frame 16.8 ms, 130 KB JS (39.5 KB gz) + 78 KB worker, main thread lag 2-3 ms during Hard generation. |
| Robustness | 3 | Corrupt storage handled and zero console errors; but timer runs on the title screen, stale "Continue" button, resume starts clock instantly. |

## If you only do three

1. **SUDOKUDASH-01 / 02**: Pause the session whenever the Menu/title screen is shown (clock currently runs there and can end the game under the title) and stop the stale Continue button.
2. **SUDOKUDASH-03**: Close the Dash undo/redo farm (undoing a correct digit and re-placing it pays +4s and full combo points again).
3. **SUDOKUDASH-05 / 06**: Make touch targets >= 44px and confirm "Solve all" (it sits 6px from Pause and ends the run).

## Full prioritised list

Severity: S1 broken, S2 major, S3 minor, S4 nice-to-have. Effort: S/M/L.

### S1 / S2

**SUDOKUDASH-01 | UX/Robustness | S1 | Menu does not pause the session**
- Evidence: probe `sd-3.mjs`: Dash Easy, click Menu, advance clock 60 s, Continue: time 4:00 -> 3:01. Advance 200 s on the title: "Time's up" overlay renders over the title (`shots/30`). Cause: `src/main.ts:259-266` `loop()` ticks the session whatever screen is up; `showTitle()` (`main.ts:125`) never calls `session.pause()`.
- Change: in `showTitle()` call `this.session?.pause()` before `save()`; in `resumeSaved()` and Play-again, start in `paused` with the Resume cover (see 12). Also make `loop()` skip `tick` unless `$('screen-game').hidden === false`.
- Effort S. Risk: none to sim; saved games already store elapsed/dash state. Verify: repeat probe, expect 4:00 after 60 s on the menu; add a `session.test.ts` case that paused sessions do not consume `timeLeftMs`.

**SUDOKUDASH-02 | UX | S2 | Stale "Continue saved game" and game-over modal on the title**
- Evidence: after the loss above, `btn-continue` is still visible (`hidden === false`) while the end dialog is up; clicking it silently returns to the title (`resumeSaved`, `main.ts:182`). `finishGame` clears the save (`main.ts:238`) but never re-renders the title.
- Change: after `clearSavedGame()` call `renderTitle(...)`; and when `end` shows while the title is visible, switch to the game screen first (or fixed by 01). In `resumeSaved()` with no save, show a status line "Saved game expired".
- Effort S. Verify: probe repeat; Continue hidden after any loss.

**SUDOKUDASH-03 | Gameplay | S2 | Undo/redo farms time and score in Dash**
- Evidence: probe `sd-4b.mjs`: place a correct digit (+4s, 50 pts), Ctrl+Z, re-place: score 50 -> 150 -> 1050 after 5 cycles, clock 4:04 -> 4:24 with no real progress. `Session.input` (`session.ts:98-117`) awards on every correct entry and `undo` (`session.ts:140`) restores the grid only, not `dash`.
- Change: snapshot `dash` (time, combo, score, lastCorrectAt) together with `game` in `History`, or track `awardedCells: Set<number>` so each cell pays once per game; undo of a correct digit restores the pre-award dash state (do not refund time already elapsed).
- Effort M. Risk: sim determinism: history type changes, saved-game schema (`savedGame.ts`) needs a version bump with migration/fallback. Verify: new unit test "undo+replace pays once"; probe shows score/time unchanged.

**SUDOKUDASH-04 | Gameplay/Balance | S2 | Easy (and Medium) Dash cannot be lost by a competent player**
- Evidence: clues sampled 5x per level: Easy 36 (45 blanks), Medium 28 (53), Hard 24-27, Expert 23-28. `src/core/scoring.ts:5-16`: 240 s start, +4 s per digit, cap 360 s. Break-even pace is `start/blanks + 4`: Easy 9.3 s/cell, Medium 8.0, Hard ~7.2, Expert ~6.6. Scripted run hit the 6:00 cap after 8 s (`shots/09`). Loss only comes from mistakes (-10 s) or the player stalling. The README claims "Beat the clock" but Easy has no tension.
- Change: move tuning to `src/config/dash.json`/`balance.ts` and trial: Easy start 150 s, gain 2.5 s (Medium 150/2.5, Hard 150/3, Expert 150/3.5 as a starting point, then telemetry); add a decay lever (gain shrinks 10% per 10 cells) or reduce `capFactor` to 1.25. Show par time on the title.
- Effort M. Risk: invalidates personal bests semantics (bests store score, so keep but note). Verify: bot-play at 3, 5, 8 s/cell via the probe's `sd-1` loop; target Easy loss rate for a 7 s/cell player at 15-25%.

**SUDOKUDASH-05 | Accessibility/UI | S2 | Touch targets below 44px on phone**
- Evidence (400x860, `sd-2.mjs`): board cell 40.2x39.9 px; pad button 36.6x52 px (width fails); `.tool` height 39.7 px; top `.chip` 32 px high; checkboxes 18 px; at 375 px a cell is 37.4 px. Rules: `style.css` `.pad` 9 columns with `gap:0.3rem`, `.tool` padding 0.5rem 0.6rem, `.chip` padding 0.35rem 0.85rem.
- Change: `.tool{min-height:48px}`, `.chip{min-height:44px;padding-inline:1rem}`, `.check{min-height:44px}` with `input{width:1.5rem;height:1.5rem}`. Pad: switch to two rows on <=480px (`grid-template-columns:repeat(5,1fr)`, 5+4, buttons 64x52), or keep 9 columns but let the board be 100vw minus 0.5rem gutters (cells ~42 px) and accept cell target via padding on `.board-wrap`. Cells cannot reach 44 px on a 400 px screen (9x44=396 plus gutters), so add tap-slop: extend `.cell` hit area with `::after{inset:-2px}` and show selection highlight so mis-taps are visible.
- Effort M. Risk: vertical budget, see 14. Verify: `getBoundingClientRect` probe, all interactive >= 44x44 except cells (>= 40 with slop).

**SUDOKUDASH-06 | UX | S2 | "Solve all" is one unconfirmed tap next to Pause/Hint**
- Evidence: `shots/11`, `shots/13`: `#tool-all` 88x39.7 px, 6 px from Pause; `main.ts:93` calls `solveAll()` immediately; ends the run, loses combo, flags `assisted`. Also in Dash it pays the time bonus (end screen shows SCORE 3680 for 0 digits placed, `sd-4b`).
- Change: move Solve step/Solve all into a "Solver" disclosure (or `tool-menu` overflow); require two-step confirm ("Solve all? Tap again") with 3 s auto-revert; in Dash set `dashFinishBonus` to 0 when `assisted`.
- Effort S. Risk: none. Verify: tap once -> button label changes, no finish; solve-all in Dash shows score 0 bonus.

### S3

**SUDOKUDASH-07 | UX/Onboarding | S3 | Dash rules and scoring are invisible**
- Evidence: title copy (`index.html:24`) says only "buys time / costs it"; the numbers (+4 s, -10 s, -8 s hint, 6 s combo window, x8 cap, finish bonus, 1.5x clock cap) exist only in the README. "Classic: Relaxed, timed" is ambiguous. 3-mistake limit is on by default and labelled "(Classic)". No "how to play". First game gives no coaching on notes/hint.
- Change: add a "How Dash works" `<details>` under the mode picker with the numbers read from the config module; rename subtitles to "Race the clock, build combos" / "No countdown, optional 3-strike limit"; first-run only toast "Tap a cell, then a number. Wrong numbers show red."
- Effort S. Verify: first-30-seconds read-through; a tester can state the penalty values.

**SUDOKUDASH-08 | UI | S3 | Score and clock popups collide with digits and each other**
- Evidence: `shots/07`, `shots/22`: "+400 x8" strings overlap neighbouring cells and each other; at combo speed 26 `.pop` nodes were live at once (`sd-3`); "Oops" on row 1 renders above the board and is clipped by the HUD (`shots/05`). Mobile: "-8s" overlays the clock digits (`shots/13`). `.pop` font 1.2rem, 0.9 s, `popups.ts:13` 1100 ms timer.
- Change: make popups 0.85rem with a 2 px `paint-order:stroke` outline, cap one popup per cell and a global max of 4 (drop oldest), clamp `top` to board bounds, and move the clock delta to a fixed slot right of the time (reserve width with `min-width:3ch`). Replace "Oops" by a cell shake plus "-10s".
- Effort S. Verify: screenshot of 10 rapid placements shows no overlapping text.

**SUDOKUDASH-09 | Accessibility | S3 | Notes and pad badges too small**
- Evidence: note glyph computed `9.2px` at 400 px (`board.css .cell .notes i{font-size:clamp(0.5rem,2.3vw,0.8rem)}`), pad badge `.6rem` = 9.6 px, HUD labels `.66rem` = 10.6 px (`shots/12`).
- Change: notes `clamp(0.6rem, 2.7vw, 0.85rem)` (>= 9.6 px), bold weight 800; pad badge `0.7rem`; HUD `.k` `0.72rem`. Use `font-variant-numeric: tabular-nums`. Offer a "Large numbers" setting that sets `--scale`.
- Effort S. Verify: 400 px screenshot, glyph >= 11 px.

**SUDOKUDASH-10 | Accessibility | S3 | Dark-mode hint focus contrast 2.36:1; grid lines 1.4:1**
- Evidence (computed from tokens): `.cell.h-focus` text `--ink` (#eef0ff) on gold@70% over `#1a1b34` = 2.36:1 (shows the offending digit for a "Mistake found" hint); `.cell` grid line `#ddd8ea` on white 1.39:1, dark 1.46:1; same-digit highlight with accent digit 3.87:1 light / 3.56:1 dark (passes only as large text). Muted on `.h-region` dark 3.73:1.
- Change: `.cell.h-focus{color:#1d1b2e}` in both themes; line colour `color-mix(in srgb,var(--ink) 35%,var(--panel))` (>=3:1); `.cell.same` mix 22% instead of 30%.
- Effort S. Verify: recompute ratios >= 4.5 text, >= 3 for lines (`check_contrast`).

**SUDOKUDASH-11 | Accessibility | S3 | Colour-blind safety: wrong/conflict/hint states rely on hue**
- Evidence: wrong digit `--bad` #c4143c vs user digit `--accent` #5a3df0 are near-equal luminance (6.0 vs 6.25 on white) so red/purple collapses under deuteranopia; hint `h-region` (gold) vs `h-target` (green) differ by hue only (`board.css:48-51`); `wrong` has only a tint (no glyph).
- Change: add a non-colour cue: wrong cells get a diagonal-stripe background (`repeating-linear-gradient`) and a small corner "x" via `::after`; target cells get dashed inset ring, region stays flat tint; add a "Colour-blind palette" setting swapping `--bad` to orange #c75b00 and `--good` to blue #0072b2.
- Effort M. Verify: Chromium DevTools vision-deficiency emulation screenshots at deuteranopia/protanopia.

**SUDOKUDASH-12 | UX | S3 | Resume/Continue starts the clock instantly**
- Evidence: `sd-3`: after reload then Continue, `pause-cover` hidden and the Dash clock runs immediately; `Session` restores always `playing` (`session.ts:41-61`) even if saved while paused or tab hidden.
- Change: `resumeSaved()` creates the session then calls `pause()` so the cover shows "Ready? Resume"; persist `status` in `toRestored`.
- Effort S. Verify: Continue shows cover, time unchanged until Resume.

**SUDOKUDASH-13 | Accessibility | S3 | End dialog is `aria-modal` but not trapped**
- Evidence: `sd-4b`: from the end dialog, Tab goes End-again -> End-menu -> body -> `btn-sound`, `btn-theme`, a board cell, `tool-menu`. Background stays interactive.
- Change: set `inert` on `.app` while `#end` is visible (and remove on hide); restore focus to `tool-menu`/Play on close. Same for pause cover: `inert` the board and tools.
- Effort S. Verify: Tab cycles only the two end buttons.

**SUDOKUDASH-14 | UI/Mobile | S3 | Hint panel pushes the pad off-screen; landscape unusable**
- Evidence: 400x860: opening a hint raises document height 860 -> 971 and moves the pad/tools below the fold (`shots/13`); 375x667: tools bottom at 761 > 667 (scroll to reach Pause/Menu, `shots/41`); 860x400 landscape: board 576 px tall in a 400 px viewport, page height 926 (`shots/15`); the 2-col layout starts only at 880 px (`style.css` `@media (min-width:880px)`).
- Change: render the hint as an overlay sheet anchored above the pad (`position:sticky;bottom:` or absolute within `.board-wrap`) so layout never shifts; add `@media (orientation:landscape) and (max-height:520px)` using the two-column grid with the board sized `min(100vh - 5rem, 60vw)`; use `min(36rem, calc(100dvh - 22rem))` for portrait on short phones.
- Effort M. Verify: no document height change on hint at 400x860; landscape fits without scroll.

**SUDOKUDASH-15 | Audio | S3 | Large audio coverage gaps and no mix control**
- Evidence: `src/audio.ts` has 8 cues; `'tap'` is defined but never emitted (`grep` shows no `sfx('tap')`); no sound for cell select, pad tap, erase, undo/redo, pause/resume, Solve step/all (reuses `correct`), low-time warning, game start, new record, hint dismiss. Every oscillator connects straight to `ac.destination` at 0.1-0.16 gain with no master gain/limiter (a combo + correct overlap at up to 0.32); no volume slider, only on/off; none respect `prefers-reduced-motion` (not required) but also nothing for screen reader users.
- Change: add `master = ctx.createGain()` (0.6) -> `DynamicsCompressor` -> destination; add cues `erase`, `undo`, `pause`, `resume`, `tick` (last 10 s once per second), `record`, `start`; emit `tap` on pad/cell press; add a Volume `<input type=range>` persisted in settings; keep synth (no assets).
- Effort M. Verify: listening pass, peak under -6 dBFS (OfflineAudioContext render in a test).

**SUDOKUDASH-16 | Graphics/Juice | S3 | Little feedback beyond text**
- Evidence: no board shake on mistake, no row/column/box completion flash, no low-time pulse (only digits turn red under 30 s, `hud.ts:17`), combo shown as plain "x8", lose state has no animation, confetti only for unassisted wins (`endScreen.ts:62`).
- Change: CSS-only: `.board.shake` 160 ms translateX on mistake; `.cell.done` sweep flash 300 ms when a house completes; `.stat.time.low` 1 Hz pulse; combo chip scale-pop on increment with width bar for the 6 s window; subtle red vignette on loss. Gate all behind `prefers-reduced-motion: no-preference` (existing pattern in `style.css`).
- Effort M. Risk: keep within 16 ms frame budget. Verify: Performance trace fps >= 58 with all effects.

**SUDOKUDASH-17 | Gameplay | S3 | Records mix Dash and Classic times**
- Evidence: `recordResult(this.bests, s.difficulty, s.elapsedMs, ...)` (`main.ts:240`) stores best time from either mode; Dash with auto-gain finishes faster than a considered Classic run, and the title column "Best time" has no mode. Score-less Classic wins pass `0`.
- Change: bests keyed `difficulty -> {classicTimeMs, dashTimeMs, dashScore}`; zod schema with `.strict()` and migration from old shape in `parseBests`.
- Effort M. Risk: storage migration; add test. Verify: Classic win does not alter Dash row.

**SUDOKUDASH-18 | Replay hooks | S3 | No retention loop**
- Evidence: only personal bests and a Daily seed; no streak, no "daily done today" state, no stats history, no share string; Daily Hard has no pool and waits 0.8-2.1 s.
- Change: store `dailyResults[dateKey]` (score, time, mistakes), show streak and a check on the Daily button; end screen "Copy result" (`navigator.clipboard.writeText`, Wordle-style grid of mistakes) for Daily.
- Effort M. Verify: win daily, reload, button shows done and streak 1.

**SUDOKUDASH-19 | Gameplay | S3 | Lost run shows a score; Dash result shows elapsed rather than remaining**
- Evidence: Classic loss "TIME 0:00 SCORE 1700 MISTAKES 3" (`shots/24`) because `finish()` computes `classicScore` on loss (`session.ts:253-257`); elapsed 0:00 because the three mistakes were instant; Dash win stat "TIME 0:08" omits time left and bonus breakdown.
- Change: lost Classic score = 0 and hidden; end card for Dash lists Base, Combo best, Time bonus; include "Best combo". Keep `finalScore` for wins only.
- Effort S. Verify: unit test `finish(false)` gives 0; end card screenshot.

**SUDOKUDASH-20 | Performance/UX | S3 | Hard generation 0.8-2.1 s when the pool is empty**
- Evidence: cold Hard presses 2138, 842, 818, 823 ms (`sd-3` `hardCold`); with the pool 29-48 ms but 2 of 4 consecutive presses missed (1132, 1893 ms). Main-thread lag only 2-3 ms (worker works). Pool target is 2 (`generation.ts POOL_TARGET`) and refill starts 1.5 s after load (`main.ts:47`).
- Change: raise `POOL_TARGET` to 3-4 (PoolSchema `.max(4)` -> 6), start `fillPool` on `requestIdleCallback` at load, keep a second worker; show a determinate-looking skeleton board in the building state; same pool for Expert (57-118 ms, not needed) and for Daily Hard (pre-build tomorrow's).
- Effort M. Verify: 10 consecutive Hard presses in `sd-3`, p95 < 300 ms.

**SUDOKUDASH-21 | Code quality | S3 | Hardcoded tuning outside a config module, oversized classes**
- Evidence: `DASH`/`DIFFICULTY_MULTIPLIER`/`CLASSIC_MISTAKE_LIMIT` live inside `core/scoring.ts:4-18,60-76`; magic numbers scattered: loop interval 250 (`main.ts:41`), autosave 5000 (`main.ts:261`), pool delay 1500 (`main.ts:47`), popup life 1100 (`popups.ts:13`), confetti count 70 and colours (`endScreen.ts:26,22`), audio frequencies/gains (`audio.ts:6-14,40`). `class App` spans `main.ts:25-290` (265 lines) and `class Session` `session.ts:18-285` (267 lines), both over the 200-line limit; `session.ts` 290 and `main.ts` 292 lines are 8-10 lines from the 300 cap. No function over 50 lines found.
- Change: create `src/config/{dash.ts,timing.ts,juice.ts,audio.ts}` (typed, `as const`, zod-checked at test time); split `App` into `screens.ts`, `gameBindings.ts`, `lifecycle.ts`; split `Session` into `Session` + `dashRules.ts` (onCorrect/onMistake/hint penalties) + `solverActions.ts`.
- Effort L. Verify: `npm test` green, no file > 300 lines, `grep` finds no tuning literals in UI.

**SUDOKUDASH-22 | UX | S3 | Tick granularity and countdown readability**
- Evidence: `setInterval(...,250)` (`main.ts:41`) drives all timing; displayed clock uses `ceil` so it can show 0:01 while 0 ms remain, and timebar CSS transition is `.25s linear` (visible stepping at low time). Timer is updated outside `requestAnimationFrame` so renders are not vsync-aligned.
- Change: drive HUD via `requestAnimationFrame` while playing (keep logic ticks at 100 ms), use `performance.now()` deltas, sync the bar with a CSS animation set once per segment.
- Effort M. Risk: sim determinism: keep `tick(dt)` pure, rAF only renders. Verify: sampled `hud-time` text sequence has no repeated or skipped seconds over 20 s.

### S4

**SUDOKUDASH-23 | UI | S4 | Mode cards unequal height on mobile; keys legend long**
- Evidence: `shots/10`: "Dash" card 82 px vs "Classic" shorter (`.seg span height:100%` not stretching in grid); keys legend a long sentence on phones where it is irrelevant.
- Change: `.seg label{display:grid}` + `.seg span{height:auto;align-self:stretch}`; hide `.keys` under `(hover:none)` and show Notes/Hint help in a first-run toast.
- Effort S. Verify: card heights equal at 400 px.

**SUDOKUDASH-24 | Graphics | S4 | Visual identity is generic**
- Evidence: logo is text only, the favicon is the only lightning motif; theme toggle shows "Theme: system" text; no title-screen illustration or board-fill animation.
- Change: add an inline-SVG bolt in the logo, animate the title board on load (cells fade in, 400 ms), and use the gold lightning as the combo icon.
- Effort M. Verify: art-direction sign-off.

**SUDOKUDASH-25 | Accessibility | S4 | Screen reader announcements for play events**
- Evidence: popups are `aria-hidden` (`index.html:75`), HUD has `role="timer"` but no announcements for correct/incorrect, time low, combo; cell labels say "incorrect" only when re-read.
- Change: add a visually hidden `aria-live="polite"` region updated for: "Wrong, minus 10 seconds", "Combo x3", "30 seconds left", "Paused".
- Effort S. Verify: VoiceOver pass.

**SUDOKUDASH-26 | Gameplay | S4 | Wrong digits reveal the answer (free brute force)**
- Evidence: a wrong entry is flagged immediately and counted (`wrong` class, 11 mistakes from 300 mashed keys in `sd-3`). In Classic with limit off there is no cost.
- Change: add "Check mode" option: errors shown only on request or at 3-strikes; default stays instant.
- Effort M. Risk: Classic fidelity (instant check is an accepted convenience). Verify: setting persists and hides red.

**SUDOKUDASH-27 | Robustness | S4 | Tab-hide pause has no resume focus/prompt**
- Evidence: hidden -> pause cover appears; on return focus stays on the selected cell, user must press P/Resume; no notice why paused (`sd-3` `afterVisible`).
- Change: show "Paused (tab hidden)" and focus the Resume button.
- Effort S.

## Bugs found (repro)

1. **Menu leaves the clock running (S1, item 01).** Dash Easy -> Play -> Menu -> wait 60 s -> Continue: 60 s of the countdown is gone. Wait 4 min: "Time's up" modal appears on the title.
2. **Stale Continue button (S2, item 02).** Continue the above after the loss: button remains visible, click does nothing visible.
3. **Undo/redo farm (S2, item 03).** Dash: place correct digit, Ctrl+Z, place again, repeat 5x: time +20 s, score 1050 with one cell filled.
4. **Solve all pays a Dash bonus (S3, item 06).** Dash Easy -> immediately Solve all -> end card SCORE 3680 "Solved by the solver".
5. **Lost Classic run displays a score (S3, item 19).** Classic Easy, limit on, three wrong digits -> "Too many mistakes", SCORE 1700.
6. **End dialog focus leak (S3, item 13).** Solve all -> Tab x4: focus reaches Sound, Theme, a board cell, Menu behind the modal.

No console errors or warnings in any run (title, Dash, Classic, daily, custom, mobile, dark, reduced motion, rapid input, corrupted storage).

## What already works well

- Hints name the technique and the cells, with source/target/region highlights; Place-it applies it (`shots/05`).
- Performance: 60.5 fps, 16.8 ms worst frame in play, no main-thread stall during Hard generation (worker + pool); small bundle.
- Robust storage: corrupt `sudokudash-game/settings/bests/pool` values fell back cleanly to defaults with no errors.
- Custom-puzzle validation messages are specific (length, clue count, row clash) and the dialog returns focus correctly and closes on Escape.
- Reduced-motion and dark/system themes are implemented from tokens; text at 200% root size kept `scrollWidth == innerWidth`; 320 px width has no horizontal overflow.
- Full keyboard play (digits, arrows, N/H/P/M, Ctrl+Z, Shift+Z) and roving tabindex on cells; Daily seed deterministic (same grid twice).
- Pad shows remaining count per digit and disables exhausted digits.

## What I could not check

- Actual audio output (headless; only the synth code was read).
- Real device touch latency, haptics, iOS Safari quirks (`env(safe-area-inset-*)`), Dynamic Type; emulated `isMobile` only.
- Screen reader behaviour (VoiceOver/NVDA) and forced-colors/high-contrast mode.
- Colour-blind appearance was judged from token luminance, not rendered with a CVD simulator.
- A human-paced difficulty curve: pacing numbers are from arithmetic on clue counts and a scripted solver, not playtesters; Hard/Expert technique density was not sampled beyond clue counts.
- Long-session memory growth (only a few minutes of play and a 300-keypress burst; DOM stayed ~1.17k nodes).
- Daily puzzle across midnight/time zones.
