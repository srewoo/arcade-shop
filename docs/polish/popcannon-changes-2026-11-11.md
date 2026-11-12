# Pop Cannon: polish changes, 2026-11-11

Work list: `popcannon-review-2026-11-11.md` (26 items) plus `CONVENTIONS.md`. Implemented in `/Users/sharajrewoo/DemoReposQA/arcadeShop/popcannon` only.

Totals: 26 items, 25 done, 1 partial (POPCANNON-14), 0 declined.

Final gates: `tsc --noEmit` clean, `vitest run` 13 files / 225 tests passed (was 6 / 120), `npm run build` ok, `npm audit` found 0 vulnerabilities, `grep __pc dist/assets/*.js` = 0 matches in the normal production build. No file over 300 lines (largest `src/main.ts` 254), no function over 50 lines.

How verification was done: Playwright 1.48.2 headless Chromium scripts (desktop 1280x800 and 1920x1080, phone 400x860 and 360x740 touch, phone landscape 860x400 and 667x375 touch, `reducedMotion: reduce`, `colorScheme: dark/light`) against `vite preview` on port 4874, built with `VITE_E2E=1` so the `?debug=1` hook exists; the production build was checked separately. Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/after-popcannon-*.png` (all looked at). Zero console or page errors in every run. Server stopped and `dist/` deleted.

## Report items

| ID | Status | What changed (files) | Verified by |
| --- | --- | --- | --- |
| 01 Arcade clear unreachable | done | Option (b): ceiling drops only after `dropEvery` consecutive shots that pop nothing (miss budget); any pop resets it. `src/resolve.ts` (`maybeDrop`), `src/shoot.ts`, `src/state.ts` (`hits`), HUD label now "Misses left". Same rule in Time Rush. Greedy bot moved to pure `src/bot.ts`. Seeded RNG order unchanged. | Bot over 20 seeds (node and in the browser): skilled bot clears level 1 within 40 shots on 20/20 seeds (before: 3 of 5 seeds never left level 1 in 400 shots), skilled reaches level 9 to 13 in 400 shots, random-aim bot clears level 1 on 0/20 and always loses (mean 94 shots, before 39). Vitest: drop-after-N-misses, pop resets budget, 70% clear test, level 5 reachable by skilled not random. |
| 02 Puzzle pars | done | `scripts/solve-puzzles.ts` beam search (1 degree steps, swap allowed, beam 2500) found a solution for all 12. Pars set to best+1 (best 8 or less) or best+2; queue shortened to about par x 1.6 (never below best+2, never longer than before); 2-star band = par + 25% of slack (`twoStarShots`, `TUNING.puzzle.twoStarSlack`). Level 11 "Checker" (a true checkerboard) was not solvable by the beam even at beam 3000, so it was redrawn as 2-wide brick rows and renamed "Brickwork" (solvable in 11). `src/levels.ts`, `tests/puzzle-solutions.json`. Scores bumped to version 2: point bests kept, puzzle stars restart (meaning changed). | `tests/puzzles.test.ts` replays every stored solution through the real sim: each level wins within its limit, par is best+1..2, 3 stars at par. See table below for before/after. |
| 03 Desktop canvas | done | Side layout (HUD left, board centre, controls right) for landscape widths 600px and up; `.app` max-width 80rem; canvas fits stage height. `src/style.css`, `src/canvasFit.ts`. | 1280x800 canvas 417x617 -> 528x780 (97.5% of window height; target 85%). 1920x1080: 717x1060. |
| 04 Phone landscape | done | Same side layout; at height 520px and under: h1 text hidden, 2-column button grids, 4-column puzzle tiles without names, compact help, panel `max-height:100%`. | 860x400 canvas 146x217 -> 261x387; 667x375 canvas 245x362 (target 300 tall). Title, settings, puzzle select, help and pause panels all fit with no scrolling at both sizes; every pause button on screen. |
| 05 Focus trap | done | `src/overlay.ts`: `.top`, `.hud`, `.controls` get `inert` while a panel is open, explicit Tab wrap, `aria-labelledby`. | Playwright: 9 Tab presses and Shift+Tab never leave the panel; background inert. |
| 06 Unbounded rows | done | `trimRows` in `src/match.ts`, called from `removeCells` and `dropCeiling`. | Vitest: rows <= lowestRow+2 on every shot of a 400-shot run, max 16 (test) and 11 (browser); before 32 at 220 shots. |
| 07 Render interpolation | done | Previous positions kept on ball, particles, fallers, drop slide; `alpha` from `src/clock.ts` passed in `RenderOpts`; sim results unchanged. Ball now flies in fixed 4 px slices with a separate smooth render position. | Vitest simulates 30 to 240 Hz frames: 600 steps per 10 s everywhere, and at 144 Hz the interpolated ball moves 4.44 px per frame within 1 px (control without interpolation judders by more than 5 px). Not measured on a real 144 Hz display. |
| 08 Touch targets | done | `.icon-btn`, `.btn`, `.btn.small` min 2.75rem (44px), tiles 3.5rem. | Playwright asserts every visible button and slider >=44x44 on title, puzzle select, settings, pause (phone) and pause (landscape). Pause 58x38 -> 60x44, Sound 79x38 -> 83x44, small buttons 32 -> 44 px tall. |
| 09 Fire button | done | Never disabled; `busy` class adds an inner ring during flight; `requestFire` buffers a press for 150 ms and fires on landing. `src/shoot.ts`, `src/hud.ts`, `src/style.css`. | Browser: in flight `disabled=false`, opacity 1; buffered tap fires a second shot. Vitest: buffer fires, expires, ignored when run over. Contrast white on accent 7.04:1 (before 2.36:1 disabled). |
| 10 Onboarding | done | (a) 3-step coach card with canvas highlights, once (`seenTutorial`), pauses the sim. (b) One-line hint the first time bomb, rainbow, stone or the ceiling warning appears (`seenHints`, `src/hints.ts`). (c) Canvas label 10 -> 12 px, "How to play" screen from title and pause. `src/coach.ts`, `src/hints.ts`, `src/screens.ts`, `src/strings.ts`. | Browser: coach on a fresh profile, Rush timer frozen at 90 during it, not shown after reload; stone and bomb hints shown once and not repeated after reload. |
| 11 Audio | done | Master gain 0.7 into a compressor (`src/audio.ts`), pure per-event plan (`src/audioPlan.ts`), shared noise buffer, volume 0 to 100 setting, pop pitch +2 semitones per combo step, new events ui, start, pause, resume, warn, danger, tick, best, star(n), locked. Every button click plays `ui` through `playEvent`. | Offline render of bomb+fall+pop+ceiling burst in Chromium: peak 0.334 at volume 100, 0.167 at 50 (limit 0.9). Vitest on the event map, combo pitch, stacked-voice headroom. Not listened to on real speakers. |
| 12 Juice | done | (a) pop scale-up and fade (0.1 s) plus ring burst of 10 with two sizes (total capped at 150 particles); (b) recoil 4 px over 0.12 s and 40 ms muzzle flash; (c) 6-point ball trail; (d) "LEVEL n CLEAR" banner for 1.8 s; (e) damped 30 Hz sine shake instead of `Math.random()`. All gated by reduced motion (pops, trail, recoil, flash, shake off; 4 particles per cell). `src/effects.ts`, `src/renderFx.ts`, `src/renderParts.ts`, `src/render.ts`. | Screenshots mid-pop (`desk-pop`), banner (`desk-level-clear`), reduced-motion pop (`desk-reduced-pop-symbols-dark`). Vitest for pop lifetime, ring sizes, trail length, shake maths. |
| 13 Visual identity | done | Page background is the canvas gradient in both themes, header text light, light mode kept as card style; bubble-cluster wordmark SVG in the header. Art-director sign-off is not something I can give. `index.html`, `src/style.css`. | Screenshots light and dark; contrast list below. |
| 14 Colour discrimination | partial | Palette respaced (below); symbols default on when `prefers-contrast: more` or `forced-colors` on first run; one-click "Colour-blind assist" toggle on the title and in Settings. Not done: the extra toggle in the HUD row (no room in the phone header). `src/palette.ts`, `src/settings.ts`, `src/screens.ts`. | Luminance ratios computed (table below); Vitest for first-run default. |
| 15 Tuning config | done | `src/config.ts`: frozen, zod-validated `TUNING` (ball speed, turn rate, scoring, special odds, arcade curve, Rush, puzzle bands, timers, fx). `shoot.ts`, `update.ts`, `rules.ts`, `resolve.ts`, `hex.ts`, `aim.ts`, `match.ts` read from it. Values unchanged. | `tests/config.test.ts` (defaults parse, frozen, rejects junk, original curve values). Existing sim tests pass unchanged except the ceiling test (rule changed on purpose). |
| 16 Esc / back | done | Each screen registers `onBack` (`src/overlay.ts`): Settings, Help, Puzzle select go back, Result goes to menu, Pause resumes, confirm cancels; focus returns to the opener control. | Playwright keyboard walkthrough title -> settings -> Esc -> puzzle -> Esc -> help -> Esc -> pause -> Esc; focus is back on "Settings" after leaving it. |
| 17 Render allocations | done | Bubble and background sprite cache per canvas scale (`src/sprites.ts`), preview cached by aim, board version and loaded bubble (`src/renderGuide.ts`), HUD writes only on change, in-place `compact` for effect arrays, event list cleared in place. | Chromium CDP, 4x CPU throttle, 1280x800, 3 runs each: script time idle 0.081 -> 0.045 s per s (-45%), task time 0.137 -> 0.088 (-36%); with 8 bot shots 0.092 -> 0.052 (-43%). fps 59 to 60 in both. |
| 18 Stars requirements | done | Puzzle tiles show "Par n / limit m" (portrait), HUD shows `used/limit` with "Shots · par n", result says "3 stars at n shots or fewer" or "Perfect: 3 stars!". | Screenshots `phone-puzzle-select`, `desk-pop`; Vitest on result lines and HUD meter. Tile text 11.5 px (min 11). |
| 19 Ceiling telegraph | done | One miss before a drop: amber ceiling bar, dots pulse at 1.5 Hz (static colour under reduced motion), `warn` sound on the shot before and a one-time hint. | Screenshot `desk-ceiling-warning`; Vitest for the warn event and `ceilingWarning`. |
| 20 Time Rush urgency | done | Last 10 s: HUD value turns red (6.54:1 light, 6.93:1 dark), `tick` sound each second (higher in the last 3), +3 s on a board clear, "TIME'S UP" banner before the sheet. | Browser: HUD `urgent` class and red colour at 8 s; Vitest: ticks exactly 4,3,2,1 and status `finished`, clear adds seconds. |
| 21 `land()` swallow | done | `landingCell` widens to radius 3 then scans every row down to the danger row; if somehow none, `lose()`. The shot always sticks and counts. `src/hex.ts`, `src/shoot.ts`. | Vitest with a fully packed board: bubble placed, loss recorded; widen-search test. |
| 22 Debug hook | done | `installDebug` imported dynamically only when `import.meta.env.DEV` or `VITE_E2E === '1'`; still needs `?debug=1`. `src/main.ts`, `src/debug.ts`. | Production `dist` has no `__pc` string and no debug chunk; in a browser `typeof window.__pc` is `undefined` with `?debug=1`. |
| 23 Text size | done | Settings "Text size" 100/125/150% scales the page (`--ui-scale` on the root font size) and canvas text (NEXT label, popups, banners); "High contrast guide" thickens guide dots, landing ring and danger line. | Playwright at 360x740 with 150%: no horizontal scroll, no clipped HUD, header or controls (HUD switches to 2 columns). Originally verified at 360x740 only; small landscape phones were broken and are fixed in the follow-up below. |
| 24 Result screen | done | Row that crossed the line is tinted and the danger line flashes during the 0.9 s delay; HUD meter shows "-"; result sheet counts the score up, reveals stars one by one with a rising `star` sound, adds shots, accuracy and "A bubble crossed the red line." Reduced motion shows the final state at once. `src/renderFx.ts`, `src/screens.ts`, `src/result.ts`. | Screenshots `desk-lose-highlight`, `desk-gameover`, `desk-puzzle-result`; Vitest on result content. |
| 25 Replay hook | done | "Daily Arcade" mode: seed = local `yyyymmdd`, best for today stored separately (`daily`, `dailyDay`, `dailyToday`), shown on the title. `src/state.ts` (`Mode`), `src/settings.ts`. | Vitest: same seed gives identical board and identical first 20 shooter bubbles, next day differs, per-day best logic. Cross-browser run not done (pure seeded JS). |
| 26 Aim guide | done | Bomb: faint blast radius circle at the landing ring; normal bubbles: ghost outlines on the group that would pop; preview computed from a cache, no per-frame grid clone. `src/preview.ts`, `src/renderGuide.ts`. | Screenshots `desk-bomb-guide`, `desk-ceiling-warning`; Vitest that the preview restores the grid. |

### Puzzle pars before and after (item 02)

| Level | Old par / queue | Solver best | New par / limit | 2-star up to |
| --- | --- | --- | --- | --- |
| 1 First Steps | 6 / 13 | 3 | 4 / 7 | 5 |
| 2 Pairs | 9 / 18 | 8 | 9 / 15 | 11 |
| 3 Stone Age | 9 / 20 | 4 | 5 / 8 | 6 |
| 4 Ladder | 11 / 22 | 13 | 15 / 22 | 17 |
| 5 Five Colours | 13 / 28 | 6 | 7 / 12 | 9 |
| 6 Pillars | 13 / 26 | 13 | 15 / 24 | 18 |
| 7 Funnel | 14 / 28 | 13 | 15 / 24 | 18 |
| 8 Stone Wall | 12 / 29 | 5 | 6 / 10 | 7 |
| 9 Rainbow Road | 17 / 38 | 16 | 18 / 29 | 21 |
| 10 Bomb Squad | 12 / 33 | 4 | 5 / 8 | 6 |
| 11 Brickwork (was Checker) | 22 / 40, unsolvable layout | 11 | 13 / 21 | 15 |
| 12 Finale | 26 / 48 | 27 | 29 / 47 | 34 |

Old pars on levels 4 and 12 were below the best solution found (level 4: par 11, best 13; level 12: par 26, best 27), so three stars were unreachable there; level 6's old par 13 equalled the best with no slack.

### Palette (item 14), luminance contrast between neighbouring hues

| Pair | Before | After |
| --- | --- | --- |
| red / green | 1.44 | 2.14 |
| red / orange | 1.49 | 2.15 |
| orange / yellow | 1.60 | 1.83 |
| yellow / green | 1.65 | 1.83 |
| green / blue | 1.37 | 2.05 |
| blue / purple | 1.08 | 1.85 |

All six colours stay above 3:1 against the canvas `#0d1024` (lowest: red 3.66, was 4.84; blue 3.81). Colours are now `#cf2e2e #3dbd75 #2e6bdc #ffe04a #bd84fb #fb8a2b`. Symbols are still the guarantee for hue-only confusions.

## Conventions

| Convention | Status | Notes |
| --- | --- | --- |
| 1 Pause: P and Esc open overlay (Resume default focus, Restart, Settings, Quit; plus How to play) | done | Restart and Quit ask an in-page confirmation (default focus on "Keep playing"), never `window.confirm`. Esc on the overlay resumes. Verified. |
| 1 Auto-pause on tab hidden and window blur, held input cleared, manual resume | done | Verified with a dispatched `blur` and a patched `document.hidden`: angle frozen while paused, no drift after resume. |
| 1 Settings pauses; touch pause button >=44 px; countdowns stop | done | Settings opens only from title or pause (sim not running); Pause button 60x44; Rush timer verified frozen during the coach card and pause. The Rush clock still starts at the first frame of play (report item 20 did not ask for a delayed start). |
| 2 Settings: volume, reduce motion System/On/Off, colour-blind assist, text size, theme | done | Stored values for motion stay `system/reduce/full` (labels System/On/Off) so old saves load. Every field validated per field with fallback; storage in try/catch; verified persistence across reload and corrupt JSON fallback. |
| 3 Accessibility floor | done | 44 px targets (measured), contrast list below, HUD labels 12 px (tiles 11.5 px), focus ring on every control (amber on the dark chrome, accent inside panels), dialogs trap focus and Esc closes, `role="dialog"` with `aria-labelledby`, `aria-live` status line `#sr-status` (pause, resume, game result), canvas `aria-label`. |
| 4 Interpolation, feedback, destructive confirms, onboarding | done | See items 07, 10, 11, 12. |
| 5 Layout and DPR | done | 1280x800, 1920x1080, 400x860, 860x400, 667x375, 360 wide with 150% text; safe-area insets kept; devicePixelRatio capped at 2 (was 3; verified backing 752 px for a 376 px canvas at DPR 3). |
| 6 Code: tuning module, strings module, size limits, debug gating, no new deps | done | `src/config.ts`, `src/strings.ts`; no runtime dependency added (zod 4.6.7 only); versions untouched; `npm audit` 0. |

Contrast ratios (text 4.5:1, graphics 3:1): light muted on panel 5.85, ink 15.99, primary button 7.04, danger 6.54, muted on tile 5.33, stars on tile 2.97 -> 4.86 (new `--star`); dark muted 6.92, ink 13.97, primary 7.28, danger 6.93, muted on tile 8.09, stars 10.19; header muted on page 8.36 to 10.02; header ink 13.86; NEXT label on canvas 11.59; focus ring on dark chrome 13.09, in light panels 7.04, in dark panels 6.23. Old disabled Fire button 2.36.

## Extra bugs found and fixed

1. The aim guide and the real shot used different substep phases (4 px slices vs 4, 4, 2.67 px per frame), so the ball could land in a different cell than the guide showed. Both now use identical fixed 4 px slices (test: landing cell matches the trace across angles).
2. Two puzzle levels (4 and 12) had a 3-star par below the best achievable solution, and level 11 was not solvable at all (item 02).
3. Settings re-rendered the whole panel after each toggle and dropped keyboard focus; rows now update in place.
4. Esc only paused; now it is back on every screen. P could resume the game from inside the Settings or Help screen opened from pause; it now resumes only from the pause screen.
5. HUD label "Drop in" no longer matched the rule (it counts misses), now "Misses left".
6. Light-theme star glyph contrast on level tiles was 2.97:1, now 4.86:1.
7. Debug start did not follow the reduced-motion setting, so effects looked different from a real run.

## Known remaining issues

- Real 120/144 Hz display smoothness and real audio output (mix, loudness, compressor feel) are not checked; interpolation and peak level were checked in unit tests and an offline render only.
- iOS Safari (AudioContext unlock, safe-area, dynamic viewport) and Android Chrome gestures are untested; screen readers (VoiceOver, NVDA) not tested.
- Puzzle solutions are beam-search results, so "best" is an upper bound on the true optimum; a human may find a shorter line and par could be 1 shot loose on a level. `tests/puzzle-solutions.json` must be regenerated with `scripts/solve-puzzles.ts` if a level layout or queue changes.
- Existing players keep their Arcade, Rush and Puzzle point bests, but saved puzzle stars restart (pars changed).
- No colour-blind toggle in the HUD row (item 14); the narrow HUD cell wraps "Shots · par n" onto two or three lines in the side layout.
- Arcade is now noticeably easier for weak players (a random-aim bot lasts 94 shots instead of 39); the starting miss budget (`TUNING.arcade.dropStart`) may want to drop from 8 to 6 after human playtests.
- The canvas shows the amber focus ring after being focused programmatically in some browsers; it is intentional (visible focus) but may look heavy to mouse users.
- The Rush 90 s clock still starts immediately at game start rather than on the first shot.
- Long-session memory and battery use not measured.

## Follow-up fixes 2026-11-11

1. S3, text size 125%/150% on small landscape phones (667x375, 740x360): fixed (item 23 is now done at those sizes too). New block at the end of `src/style.css` for `orientation: landscape` and `max-height: 520px` with data-text 125/150: side columns narrowed with `--side: clamp(6.25rem, 24vw, 9rem)` (canvas was 120 px wide, now usable); HUD becomes one column of label/value rows; touch targets use a fixed 44 px minimum (48 px pads, 56 px Fire) instead of scaling with the rem; non-coach modals (title, pause, settings, puzzle select, help, result) use the whole viewport (`position: fixed`) so they are no longer squeezed by the canvas stage; level grid six columns; help text two columns; tighter panel padding.
   - Browser check (headless Playwright, production build, port 4903): at 667x375 and 740x360 with 125% and 150%, title, puzzle select, settings, pause and play screens have no clipped buttons, no horizontal scroll, no HUD/controls overlap, canvas wider than 150 px, panels do not scroll, pause buttons 46 px (125%) and 55 px (150%) tall. Zero console or page errors. 860x400 at 125%/150% also checked.
   - Test: `tests/layout.test.ts` (reads `src/style.css` and asserts the rules). Visual layout itself is verified in the browser only.
   - Remaining: in portrait phones (360x740, 400x860) at 125%/150% menu panels still scroll vertically inside the modal (by design, `max-height: 100%; overflow: auto`) and the Settings panel at 100% on 667x375 shows a few px of horizontal overflow (pre-existing, not text-size related). Not part of this finding.
