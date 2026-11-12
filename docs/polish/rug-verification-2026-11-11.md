# Living Room GP (rug): verification round 1, 2026-11-11

Verdict: PASS (with notes). Server on 4889 stopped, `rug/dist` deleted. Screenshots: `scratchpad/polish-shots/verify1-rug-*.png` (desk, ph, land, ph360, rm-dark, cb-hud150, pause, tips, results, maps, focus).

## Gates
| Gate | Result |
|---|---|
| `npm run build` (script is `vite build`, there is no tsc step in this project) | pass, main 272.46 kB + three 554.78 kB, matches log |
| `npx vitest run` | 17 files, 134 tests pass |
| `npm audit` | 0 vulnerabilities |
| `__rug.sim()` six originals (port 4889, `?debug=1&map=`) | all bit-identical: 31.954166666665174, 36.39583333333533, 34.0958333333335, 29.11249999999867, 31.591666666665194, 32.46249999999887 |
| diff vs backup | `config/physics.js`, `race/Car*` untouched; `aiDriver.js`/`difficulty.js` only move constants to `config/ai.js`; `layoutGenerator.js` changes are gated on `ctx.inside` (shaped rugs only). Matches the log. |
| Console | 0 page errors in all desk / phone / landscape / reduced-motion / dark runs. One `404 /api/scores` console error appears when a results screen reaches the leaderboard fetch under `vite preview` (no backend). `api/leaderboard.js` is unchanged from the backup, so it is environmental and not a regression. |

## S1/S2 items
| Item | Result |
|---|---|
| RUG-01 pause | PASS. Esc / P pause, player x/z and race.time identical after 2 s, Esc resumes, Restart confirm and Esc back-out work, Esc spam never forfeits, blur and hidden-tab auto-pause, Settings from pause freezes the sim and returns focus to Settings, Quit confirm reaches `grab`, intro pause freezes session time, touch pause button 52x52 works (phone, landscape, rotate while paused, 6 rapid taps), title blur does not open pause. |
| RUG-02 targets | PASS. Zero visible interactive elements under 43.5 px on title, settings, maps, garage, race, pause, results at 400x860 and 860x400. scrollWidth equals viewport at 400, 860 and 360. |
| RUG-03 HUD text | PASS. No visible HUD text node under 12 px at 400x860 and 860x400. |
| RUG-04 reduced motion | PASS. Infinite running animations 0 under `reduce` (title and race); addShake leaves shake 0; setting Off overrides the OS (shake 0.75); intro skip by a key sets `app.t` to 3.0. |

## S3/S4 sample (11 checked)
| Item | Result |
|---|---|
| RUG-05 gap row | PASS (empty row `visibility:hidden`, text "--") |
| RUG-06 hint | PASS (hint right 924 <= minimap left 959, bottom 628 < nitro 649) |
| RUG-07 onboarding | PASS (tips dialog aria-modal, race time stays 0 while open, flag `rug-racers-seen` stored). Tab on the tips card stays on its button |
| RUG-08 touch cam / boost | PASS with real touch tap: camView chase to far; BOOST aria-label "Boost, 100 percent" |
| RUG-10 maps panel | PASS (screenshot) |
| RUG-11 settings over title | PASS (focus returns to Settings button, Tab never leaves, 60 Tabs, 0 escapes) |
| RUG-12 contrast | PASS measured: green 4.97, red 5.58, Skip 6.26 |
| RUG-16 hooks | PASS (`window.__rug` undefined without `?debug`) |
| RUG-21 medals | PASS (results show "Bronze at 0:49.50", "Bronze medal NEW! Next: Silver") |
| RUG-22 favicon | PASS (one valid svg data link) |
| RUG-23 font | PASS (`document.fonts.check('900 20px Nunito')` true, Nunito loaded) |
| RUG-13 settings fields | PASS: reduceMotion / colourBlind / hudScale / boostMode / sfx / engine persist; corrupt JSON, `null`, `[1,2]`, bad enums, out-of-range numbers fall back per field; blocked localStorage still plays; legacy save loads with defaults |

## Conventions
* Pause / auto-pause / no single-key forfeit: PASS.
* Touch targets: PASS. Contrast: PASS on measured buttons (all >= 4.97).
* Reduced motion: PASS.
* Keyboard-only with visible focus ring: PARTIAL, see findings 1 and 2.
* Rapid input: 150 random keys in race, triple Enter plus T, Enter spam on results, resize 1280/860x400/400/360 mid-play and mid-pause: no errors, mode stays valid. (Enter on a results screen on a random map reloads the page, pre-existing.)

## Findings (none S1/S2)
1. S3, convention gap. The hidden results buttons (`.res-key`, opacity 0, not inert) are Tab stops on the title screen. The 8th Tab on the title lands on an invisible "ENTER race again". Pre-existing, but it breaks "visible focus ring".
2. S3, claim partly false. The log says dialogs return focus to the opener. Settings does. Maps and Garage never move focus in and leave focus on `body` after Esc. The How-to card (help button) also leaves focus on `body` after close.
3. S4. `rug/src/input/touchControls.js.bak` was left in the source tree (not imported, not built).
4. S4. At HUD 150 % the `.stats` and `.drift-pop` boxes overlap in the bounding-box check (the pop is transient).
5. S4. Title buttons still sway under default motion, so Playwright reports them "not stable"; the log lists this as fixed. It is only fixed under Reduce motion.

## Counts after correcting false claims
Items 25: done 18, partial 7, declined 0 (sub-parts declined inside partials are valid: key remapping, separate DRIFT button, server-side leaderboard). Claims corrected: accessibility-floor "dialogs return focus" is partial (finding 2). No S1/S2 item is falsely marked.
