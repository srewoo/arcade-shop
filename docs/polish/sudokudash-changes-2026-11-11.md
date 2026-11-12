# Sudoku Dash: polish changes, 2026-11-11

Source: `sudokudash-review-2026-11-11.md` + `CONVENTIONS.md`. Screenshots: `scratchpad/polish-shots/after-sudokudash-*.png`. Verified in headless Chromium (Playwright 1.48.2) at 1280x800, 400x860 and 860x400 (touch/isMobile), 375x667, 320x568, 360x740, reduced motion + dark scheme, deuteranopia/protanopia emulation. Zero console errors/warnings in every run.

Final state: `tsc --noEmit` clean, `vite build` OK, `vitest run` 14 files / 116 tests passed (was 9 / 66), `npm audit` 0 vulnerabilities.
Hard constraint: solver untouched (`src/core/*` solver/techniques/counter/generator not edited; only `scoring.ts`, `game`-adjacent helpers added); no GPL workbook code introduced.

## Report items (27)

| ID | Status | What changed (files) | Verified |
| --- | --- | --- | --- |
| 01 Menu does not pause | done | `app/app.ts` showTitle pauses (`pause('menu')`); `app/lifecycle.ts` only ticks when game screen visible; `session.ts` pause reasons | fake-clock probe: Dash, Menu, +250 s, Continue: 3:38 -> 3:39 (before: 4:00 -> 3:01, "Time's up" on title). Unit tests: paused sessions do not consume time/elapsed, cannot time out or take input |
| 02 Stale Continue / modal on title | done | `app/app.ts` finishGame re-renders title; `continueGame` shows "Saved game expired" when nothing to load; live session re-attached | probe: Continue hidden after a loss; no end overlay on title |
| 03 Undo/redo farm | done | new `dashRules.ts` (`awarded` set, each cell pays once; hint/solver-filled cells marked free); `savedGame.ts` v2 (+`awarded`, `bestCombo`, `mistakeCells`, v1 migration) | probe: 1 digit + 5 undo/re-enter cycles: 3:43 / 50 pts / x1 unchanged (before: 50 -> 1050, +20 s). 6 session tests + v1 migration test |
| 04 Easy/Medium unlosable | done | `config/dash.ts` per-level start/gain (220/3, 265/3.5, 280/4, 285/4.5 s), cap 1.25x; `core/balance.ts` Monte-Carlo model; par pace shown on title | `tests/balance.test.ts`: reference player (7 / 7.5 / 8 / 8.5 s per cell) loses 19% / 14% / 11% / 13% (before, Easy 7 s/cell: 0%, Medium 7.5: ~5%). Break-even Easy 9.3 -> 7.9 s/cell. Note: Hard/Expert were previously much harsher (7 s/cell lost 56% / 92%); they are now eased on purpose, needs playtest telemetry |
| 05 Touch targets <44px | done | `style.css`, `game.css`: chips/buttons/tools/checks min 44 (tools 48), pad 5+4 two-row at narrow width (container query) 73x52.8, gutters 8px and 2px board border | 400x860: every non-cell control >=44x44 (was pad 36.6, tool 39.7, chip 32, check 18). Cells 40.2 -> 42.2 px (375 px: 39.4, 320 px: 33). Tap-slop `::after` skipped (neighbouring cells overlap, no gain) |
| 06 Solve all unconfirmed | done | Solver popover (`app/solverMenu.ts`), two-step "Solve all? Tap again" reverting after 3 s; Dash bonus 0 when assisted | probe: 1st tap keeps playing, label reverts after 3.3 s, 2nd tap ends; end card SCORE 0 / bonus 0 (before 3680) |
| 07 Dash rules invisible | done | `index.html` "How Dash works" details (text generated from config by `strings.ts`), new mode subtitles, first-run coach (`ui/coach.ts`) | strings test checks numbers match config; coach shows once |
| 08 Popup collisions | done | `ui/popups.ts`: 0.85rem + outline, one per cell, max 4, clamped; clock delta in reserved slot; "Oops" replaced by board/cell shake + "-10s" | 10 rapid placements: max 4 live popups, 0 overlapping boxes; clock delta no longer over digits |
| 09 Tiny notes/badges | done | notes `clamp(11px,3vw,15px)` bold, badge 0.72rem, HUD `.k` 0.75rem, tabular nums | 400 px: notes 12 px (was 9.2), badge 11.5 px (9.6), HUD label 12 px (10.6). Text size setting 100/125/150 |
| 10 Contrast | done | `--grid` = ink 50% mix, `.h-focus` text `--on-gold`, `.same` 15%, notes ink inside hint region | grid line 1.39 -> 3.28 light, 1.46 -> 4.69 dark; hint-focus dark 2.36 -> 6.28; same-digit accent 3.87/3.56 -> 4.96/4.75; muted on region dark 3.73 -> ink |
| 11 Colour-blind | done | wrong = tint + stripes + corner x; conflict/target = dashed rings (always on); Settings "Colour-blind assist" orange #a34200/#ffa95c, blue #00649c/#6cc0f2 | CDP deuteranopia/protanopia screenshots show states still distinct; palette contrast 4.3-8.9 on tints |
| 12 Resume starts instantly | done | Continue/Play again/Restart start paused with "Ready? Start" cover; `status` not persisted because resume always starts paused | probe: after Continue time frozen 30 s until Start |
| 13 End dialog not trapped | done | `ui/modal.ts` (inert `#app`, Tab wrap, focus restore); end Esc = Menu | Tab cycles only the two end buttons; app inert |
| 14 Hint panel / landscape | done | hint panel (originally an overlay on `.side`; changed to in-flow by the 2026-11-11 follow-up, see below); landscape-short grid layout (board = full height); desktop board `min(44rem, 100dvh-13rem)` | 400x860 doc height 860 -> 860 on hint (original overlay; the in-flow panel now adds scroll, see follow-up); 860x400: no scroll, board 387 px, cells 42.3, all controls >=44. 375x667 still scrolls (see remaining) |
| 15 Audio | done | `config/audio.ts` cue table (+erase, undo, redo, pause, resume, tick, record, start, solve; `tap` now used), master gain + limiter, volume slider | `tests/audio.test.ts` (every cue <= -6 dBFS peak at full volume, volume scaling); tick-per-second session test. Not listened to (headless) |
| 16 Juice | done | board shake, house-complete wash (WAAPI), low-time pulse, combo pop + 6 s window bar, loss vignette; all off with Reduce motion | house-flash event unit test; 59.8 fps, max frame 33 ms during 12 rapid placements |
| 17 Records mix modes | done | new `bests.ts` per-mode rows with legacy migration; title table split | storage tests incl. migration and "Classic win does not alter Dash row" |
| 18 Retention | done | `daily.ts` log, streak, "done today", "Copy result" with 9x9 grid (clipboard with textarea fallback) | daily win -> end share text, button "(done today)", streak 1, survives reload; 10 unit tests |
| 19 Lost run score / breakdown | done | Classic loss score 0 and hidden; Dash end card lists Score, Digits, Time bonus, Best combo. Dash loss still shows points earned (sensible default) | classic loss card shows no score; session tests |
| 20 Hard generation wait | partial | pool target 4 (max 6), fill on idle, Daily Hard pre-built for today + tomorrow (`generation.ts`), indeterminate progress bar | pool full in 5.6 s; Hard presses 60/35/33/38 ms, Daily Hard 37 ms from cache. Back-to-back presses beyond 4 still wait; skeleton board replaced by a bar |
| 21 Config / splitting | partial | `config/{dash,timing,juice,audio}.ts`, `strings.ts`; `App` split into `app/{app,bindings,events,gameScreen,lifecycle,preferences,results,solverMenu,startFlow}.ts`; `Session` split into `session.ts`+`sessionBase.ts`+`dashRules.ts`+`solverActions.ts` | all files <=300 lines except none; `App` class is 246 lines, `Session` 205 (target 200) |
| 22 Tick/rAF | done | 100 ms logic tick, HUD painted in rAF with sub-tick glide, bars un-transitioned | 20 s sampled: 17 transitions, 0 skipped/repeated seconds |
| 23 Mode cards / keys | done | `.seg` stretch, keys legend hidden on `(hover:none)` | cards equal height |
| 24 Identity | done | inline-SVG bolt in logo and combo, animated hero mini grid on title (400 ms fade) | screenshots |
| 25 Screen reader | done | `ui/announcer.ts` live region: wrong, combo, low time, paused/resumed | not run with VoiceOver |
| 26 Check mode | declined | Needs rework of lock-on-correct and Dash scoring; report flags classic-fidelity risk; needs a design decision | n/a |
| 27 Tab-hide prompt | done | pause caption "tab hidden / window lost focus", Resume focused on return | probe: hidden and blur auto-pause, focus on Resume |

Counts: 24 done, 2 partial (20, 21), 1 declined (26) of 27.

## Conventions

| Item | Status | Notes |
| --- | --- | --- |
| Pause overlay (P/Esc, Resume default focus, Restart, Settings, Quit with in-page confirm) | done | `ui/pauseOverlay.ts`; Esc during play now pauses (hint is dismissed with its button) |
| Auto-pause visibility + blur; Settings pauses; countdown stopped in menus | done | `app/lifecycle.ts`; resume is manual |
| Visible touch pause button >=44 px | done | header "Pause (P)" chip + tool row |
| Settings: volume, mute, reduce motion (System/On/Off), colour-blind, text size, theme; per-field validation; old keys kept | done | `storage.ts`, `ui/settingsDialog.ts`, `ui/appearance.ts`; persisted across reload and corrupt values fall back per field |
| Accessibility floor (44 px, contrast, 12 px HUD, focus traps, roles) | done | see items 05, 09, 10, 13 |
| Interpolation | n/a | not a fixed-timestep game; HUD glide covered by item 22 |
| Onboarding once | done | coach flag `sudokudash-seen` |
| Layout 1280x800 / 400x860 / 860x400, safe areas, no h-scroll | done | scrollWidth == innerWidth at 320/360/375/400 |
| Tuning config, strings module | done | `src/config`, `src/strings.ts` |
| Debug hooks gated | done | `window.__sudokudash` only with `?debug=1` (none existed before) |

## Extra fixes
- Wrong-digit stripe tint lowered so digit contrast on stripes stays >=4.2.
- HUD "Mistakes" label was truncating on phones; column widths and label spacing adjusted; Daily label shortened.
- Hard puzzle pool storage schema widened (max 6) and Daily cache validated on read.

## Known remaining issues
- 375x667 and shorter portrait phones scroll to reach the last tool row; cells there are 39 px (33 px at 320).
- `App` class 246 lines and `Session` 205, over the 200-line class guideline.
- Hard/Expert Dash now easier than before; balance numbers need playtest data. Reference paces are assumptions.
- Pool/daily skeleton board not built (progress bar only); more than 4 back-to-back Hard starts still wait 1-2 s.
- Audio, VoiceOver/NVDA, real-device touch and clipboard success (headless denies it, fallback verified) not tested.
- Esc no longer dismisses a hint (it pauses, per conventions).

## Follow-up fixes 2026-11-11
- S3 hint panel / coach toast overlap: fixed. `.hint-panel` is now `position: static` in the `.side` column (it sits above the number pad and pushes the pad and tool rows down instead of covering them). While the first-run coach toast is visible, `.app` reserves 6rem of bottom padding (`overlays.css`, `body:has(.coach:not([hidden]))`) so the toast never sits on the tool row once scrolled to the end. Item 14 status above corrected: the hint is no longer an overlay.
- Verified in headless Chromium: at 1280x800, 400x860 and 860x400, with and without the coach, hint open shows no rectangle overlap between hint and tool rows, nor between coach and tool rows at scroll end; no horizontal overflow; no console errors. Trade-off: on a 400x860 phone an open hint makes the page scroll (doc height 1016 vs 860 closed); 1280x800 does not scroll.
- Tests: `tests/layoutCss.test.ts` (new), plus `vitest.config.ts` so CSS text is readable in tests.
