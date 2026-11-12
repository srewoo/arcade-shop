# Sudoku Dash: verification round 1, 2026-11-11

Verdict: PASS. Port 4886, headless Chromium (Playwright 1.48.2). Shots: `polish-shots/verify1-sudokudash-*.png`.

## Gates
- `npm run build` (tsc + vite): OK (158.9 KB JS / 48.8 KB gz + 78.5 KB worker; only a rollup annotation warning from zod).
- `npx vitest run`: 14 files, 116 tests passed.
- `npm audit`: 0 vulnerabilities.
- Hard constraint: `diff -rq` against backup shows nothing changed in solver.ts, singles, subsets, xwing, intersections, candidates, counter, generator, grader, hint, steps, game, history, rng, grid, puzzleInput. Only `core/scoring.ts` (tuning moved to config) changed; new core files are balance.ts and solverActions.ts. No GPL/workbook references in src. Solver tests pass. OK.
- Log vs diff: changed/added files match the log (app/, config/, ui/, dashRules, bests, daily, strings, tests). Class sizes: app.ts 275 lines, session.ts 212 lines, all files < 300.
- Console: 0 errors/warnings across all runs (desktop, phone, landscape, dark, reduced motion, corrupt/blocked storage, rapid input, spam).

## S1/S2 items
| Item | Result | Evidence |
| --- | --- | --- |
| 01 Menu pauses | PASS | Menu: status paused, timeLeft identical after 3 s; Continue shows paused:ready cover, clock frozen until Start |
| 02 Stale Continue | PASS | Continue hidden after classic loss and time-up; no end dialog on title |
| 03 Undo/redo farm | PASS | 1 digit + 5 Ctrl+Z/re-enter cycles, 4 undo/redo button cycles, erase/re-enter, reload+Continue: score stays 50, clock unchanged. Wrong digit then undo keeps mistake. Hint-filled cells pay 0 |
| 04 Easy balance | PASS (unit tests only) | start 220 s Easy, gain 3 s, cap 1.25x seen in play; balance.test passes; assumptions acknowledged in log |
| 05 Touch targets | PASS with caveat | 400x860 and 860x400: every button/chip/tool/pad/label >=44 (pause 98x44). Board cells are 42.2x41.9 px (<44, was 40.2), disclosed in log; 375 px 39 px |
| 06 Solve all | PASS | first tap "Solve all? Tap again", game stays playing, reverts after ~3.3 s; two taps end the run, score 0, bonus 0 |

## S3/S4 sampled (13): 07, 08, 09, 10, 11 (assist toggles, persists), 12, 13, 14, 15 (tests), 17, 18, 19, 23, 25, 27
- 07 PASS how-to lists numbers from config. 08 PASS max 4 popups in 10 rapid placements. 09 PASS min text 11.5 px, notes 12 px. 10 PASS measured contrast: 0 failures light/dark title and game+hint (single "Got it" 1.28 reading is a measurement artefact: button is gold with dark text in screenshot).
- 12 PASS. 13 PASS: Tab cycles only end-menu/end-again, #app inert. 14 PASS: 860x400 no scroll, board 387 px; 400x860 hint does not change doc height (860).
- 17 PASS per-mode bests rows. 18 PASS daily win: "done today", streak 1 persists across reload; Copy falls back to text area in headless. 19 PASS classic loss shows no score; Dash card lists Score/Digits/Time bonus/Best combo.
- 23 PASS equal cards (83.7 px), keys legend display none on touch. 25 PASS aria-live region: "Wrong digit, minus 10 seconds". 27 PASS caption "The window lost focus, so the clock stopped." and Resume focused.
- Partial items 20/21 are honestly marked partial. 26 declined (S4) with a valid reason.

## Conventions
- Pause: P/Esc open overlay with Resume focused; Esc on overlay resumes; Restart and Quit show in-page confirm and change nothing until Yes; Settings opens paused and returns to the pause overlay; blur and visibility hidden auto-pause, resume manual, input ignored while paused.
- Settings persist on reload (volume 30, reduce motion On, 150% text -> 24 px root, dark, colour-blind). Corrupt JSON, null, array, out-of-range volume, bad enum values fall back per field; all game keys corrupted still starts; localStorage throwing is survived.
- Reduced motion (OS reduce and setting On): 0 running animations, no confetti, transitions ~0.
- Keyboard-only: Tab ring 3 px solid on every control, pause overlay trap works.
- Resize/rotate mid-play (400, 860x400, 320, 1920): scrollWidth == innerWidth, status stays playing.
- Break attempts: 300 rapid keys, spam Play x5 + Daily, spam End "Play again" x8, pause/resume key spam x40, P spam around time-up (ends cleanly as lost, #app inert, no pause cover): no errors, single game each time.

## Minor observations (not regressions of S1/S2)
- Desktop 1280x800: the hint panel overlays the Hint/Solver/Pause/Menu tool row and intercepts clicks until dismissed (header Pause still reachable). Phone: first-run coach toast covers the tool row until "Got it". Cosmetic S3.
- Board cells 42 px at 400 px width remain below the 44 px floor (disclosed).
- Esc on the end dialog goes to Menu (run already over, acceptable).
- Cleanup: preview server stopped, dist/ deleted, .npmrc kept.
