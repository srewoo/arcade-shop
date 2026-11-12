# Corner Pocket verification, round 1 (2026-11-11)

Verdict: **PASS** (no S1/S2 regressions, no false claims found; one S3 regression and several S4 notes below).

## Gates
| Gate | Result |
| --- | --- |
| `npm run build` | OK (tsc + vite; js 131.80 kB / 43.40 kB gz, css 9.62 kB). Rollup prints zod "annotation" comment warnings, not errors. |
| `npx vitest run` | 13 files, 122 tests passed |
| `npm audit` | 0 vulnerabilities |
| Hard constraint (none apply to this game; determinism check instead) | `cmp` of physics, sim, constants, aim, rules8, layouts, rng, tricks vs backup: all byte-identical. OK |
| Console errors/warnings | 0 across desktop, phone portrait/landscape/360/667, reduced motion, dark, 150%/200% text |
| File size rule | largest src file main.ts 250 lines (limit 300) |
| diff vs backup | Matches the log: new modules (modal, pauseUi, coach, canvasView, canvasSetup, geom, pull, srTimer, sfx*, renderFx, renderGuide, strings, config/*, debugHooks), new tests; sim files unchanged. |

## Items checked (executed in headless Chromium)
| Item | Result | Evidence |
| --- | --- | --- |
| 01 phone portrait (S2) | PASS with note | 400x860 no vertical or horizontal scroll, all buttons >=44. Canvas is 376x600 (scale 0.688) once the coach strip is dismissed, matching the log. While the first-run coach strip is visible it is 376x516 (scale 0.59, table about 0.74 of width), so the log figure is the post-coach state. |
| 02 landscape (S2) | PASS | 860x400 and 667x375: scrollHeight == innerHeight, controls in right column, all 6 pockets visible. Canvas 618x259 with coach shown (320 high after dismiss per log). |
| 03 aria-live (S2) | PASS | MutationObserver on the live region across three touch shots: 1 mutation (#sr-status). |
| 04 pause (S2) | PASS | Esc/P/Pause button open dialog (focus on Resume); time frozen 3 s; Esc on dialog resumes; Restart and Quit both go to in-page "Abandon this game?" (default focus Keep playing; Esc returns to pause); R key also confirm-gated; blur and visibilitychange hidden auto-pause and stay paused on return; pause freezes ball positions mid-roll; Space-hold then P then release fires no shot. First Esc with coach visible only dismisses the coach (second Esc pauses). |
| 05 clock on first shot | PASS | Idle 5 s at rack start: 35.0 -> 35.0. After first shot clock runs while aiming (32.9 -> 29.9 in 3 s). |
| 06 stick/guide clip | PASS (visual) | Screenshots portrait/landscape/desktop: stick fades before canvas edge, guide stops at cushion. |
| 07 onboarding | PASS | Coach shown fresh, dismissed by shot, not shown after (seen flag). |
| 08 juice | PASS | Pot: 22 particles, 1 drop, 2 flashes; scratch shake 0.133 s. System-reduce and "On": all zero. "Off" overrides system reduce (effects present). |
| 09 float text | PASS | "Miss" and "CPU: Scratch..." sit on felt clear of pockets. |
| 12/13 contrast | PASS | Computed from DOM: light min 4.95 (muted on bg), dark min 7.02. Focus ring 3 px solid rgb(138,101,16) on every Tab stop. |
| 14 text scale | PASS | 360 px at 150% and html 32px: scrollWidth 360. |
| 15 keyboard | PASS (partial as logged) | Canvas focused on start; N, 3, Enter shoot. |
| 16 replay hooks | PASS | Trick over: "Out of shots with 2 balls left (par 2, limit 4)", Retry/Menu. Rack over shows "Best 0". |
| 17 balance | not re-simulated | Config and unit tests read; plausible. |
| 18 8-ball clarity | PASS | Dashed rings only on legal stripes after group assignment, "CPU is thinking" status seen. See regression R1. |
| 19 controls | PASS | Themed meter, kbd hidden on touch. |
| 20 title/tricks | PASS | All 15 trick cards 134 px high; per-mode best and hero button present. |
| 22 CPU planning | PASS | PerformanceObserver longtask during CPU turns: none. |
| 25 touch pull | PASS | 40 px drag gives power 0.32 at 400x860 (log 0.31). |
| Conventions: settings | PASS | Corrupt values (bad level, volume 500, seen:"no", unknown key) fall back per field while valid fields (theme, reduceMotion, textSize, colorAssist) are kept; `{bad` falls to defaults; changing text size, theme, volume, difficulty persists across reload. |
| Conventions: 44 px | PASS | No visible button/input under 44x44 on title, play, pause, settings, 4 viewports (pause button 73x82/60). |
| Conventions: keyboard-only | PASS | Tab order logical, visible 3 px ring, Settings Esc returns focus to opener. |
| Breaking attempts | PASS | 40-key spam in play, rapid rotate/resize x6 mid-shot, double-click on Pause, Restart then instant Abandon, 30-key spam on game over: no errors, no stuck state. |

## Regressions / findings
- **R1 (S3)**: 8-ball vs CPU or 2P after a scratch: the new status "Ball in hand: move with arrows or drag, Enter to place" stays on screen for the whole aim phase after the ball is placed, because `state.ballInHand` (rules8) is never cleared when placement is confirmed (`eightMode.hud()` keys off it). Repro: vs CPU, let CPU scratch, press Enter to place, HUD still says ball in hand while Shoot is enabled (screenshot `verify1-cornerpocket-desk-8ball-rings.png`). Introduced by item 15 status text.
- N1 (S4): Enter/Space pressed repeatedly right as a Rack Attack ends activates the default-focused "Play again" button and dismisses the results; no input guard on the overlay.
- N2 (S4): double-click on the Trick Shots card opens the grid and the second click starts the puzzle under the cursor.
- N3 (S4): after pause via the visible Pause button, focus returns to the canvas, not the opener (convention says opener).
- N4 (S4): first-run coach strip makes the canvas about 84 px shorter and it jumps taller when dismissed.

## Counts (after correcting for false claims: none found)
25 items, 16 done, 9 partial, 0 declined.

Not verified: audio by ear, colour-vision emulation, 1920x1080, real-device touch.
