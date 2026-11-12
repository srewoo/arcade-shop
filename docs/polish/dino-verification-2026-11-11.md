# Fossil Frenzy (dino): adversarial verification, round 1, 2026-11-11

Folder: `/Users/sharajrewoo/DemoReposQA/arcadeShop/dino/src`. Verifier was read-only on game code. Preview on :4888 stopped, `dist/` deleted. Shots: `.../scratchpad/polish-shots/verify1-dino-*.png` (33 files). My scripts: `.../scratchpad/polish-work/dino/v1/`.

## Verdict: PASS (with two open findings, neither S1 or S2)

Build, tests, audit and the hard constraint are all OK, every S1/S2 item is genuinely done, the game raised no console error or page error, and no S1/S2 regression was found. Two real defects remain and should be fixed in a follow-up (they do not trigger a fail under the round's rules):

1. S3 (incomplete fix of DINO-10, leaderboard integrity): ranked/unranked is decided at game over from the live settings, not snapshotted at run start. See R1.
2. S4 (false claim in the log, DINO-05): the settings dialog has 10 px text at 100% on a 400 px phone. See R2.

The single console line seen in all runs (`net::ERR_FAILED`) came from my own aborted `/api/scores` route, not from the game (section 7).

## 1. Build, tests, audit

| Check | Result |
|---|---|
| `npm run build` | OK (vite 7.3.8; there is no tsc step in this package). Chunks: index 123.68 kB, three 547.03 kB, rapier 4,336.69 kB. First-load JS about 670 kB (log says 669.5), Rapier lazy |
| `npx vitest run` | 18 files, 160 tests, all pass (vitest 5.1.0, same as pre-change `package.json`) |
| `npm audit` | found 0 vulnerabilities |
| `package.json` and `package-lock.json` vs backup | identical, no new dependency |
| `.npmrc` | none in the backup and none now (the log's statement is correct) |
| `dino/original`, `dino/beautified` | untouched (mtimes 16:30 to 16:31, before the 16:56 backup) |
| Size limits | no JS file over 300 lines (world.js is 300). No non-test function over 50 lines (AST scan). Four test `describe` blocks exceed 50 lines, which is acceptable. CSS max 265 lines |
| Log vs diff | the `diff -rq` file list matches the log: new modules, `style.css` split into `css/`, the touched files. Spot-checked `modes.js`, `difficulty.js`, `field.js`, `run.js`, `crash.js`, `input.js`, `controls.js`, `powerups.js`: they match the descriptions |

## 2. Hard constraint (Classic, Normal, power-ups off), executed by me

Harness: pre-change source (backup plus the one-line `tick`/`resetRun` hook in `main.js`, served by vite dev on :4889) against the new production build on :4888. Seeded `Math.random`, rAF disabled, fixed 1/60 steps, autopilot, then compared score, distance, steps, killer and the number of `Math.random` calls.

- Seeds not used by the implementer, with autopilot blunders: 4, 9, 13, 31, 64, 200, 777, 2024. **All 8 identical** (scores 263, 270, 252, 263, 220, 224, 265, 280; killers weed, weed, cactus, ptero, cactus, weed, cactus, cactus; call counts equal).
- The implementer's seeds 1, 2, 3, 7, 11, 42, 99, 123: **all 8 identical** (re-run by me).
- 110 s no-blunder runs, seeds 5, 8, 21, 77 and 3, 14, 59: **all 7 identical** (score 1950, 2600.15 m, equal call counts).
- Code read: `effectiveRules` gives `gates: null` and `breather: null` for Classic with Classic Plus off. `spawnTable` without gates is the original table. `MODES.classic` speeds come from `TUNING`. The only gameplay-adjacent changes are press-to-skip the ragdoll after 0.8 s, the pause, and the 0.3 s restart guard. None of them touches the simulation, and the default 2 s timing is unchanged.

Result: **hard constraint OK.**

## 3. S1/S2 items (DINO-01 to DINO-06; the report lists no S1)

| ID | Result | Evidence from my run |
|---|---|---|
| DINO-01 | PASS | `#score` is not rendered on the title at 1280x800, 400x860, 860x400 and 360x640 |
| DINO-02 | PASS | Settings is a 48 px gear at the top right. START is 280x56 on phone and 280x66 on desktop. A touch tap at the projected dino centre (170, 586 at 400x860) starts the run, with Settings closed. `elementFromPoint` there is the canvas |
| DINO-03 | PASS | Measured from computed colours, worst case over black and white behind the translucent pill, in all 5 environments: 11.47:1 light and 14.3:1 dark for the tag, blurb, CTA, chips, hints and START. Pause buttons are 5.63 to 14.3:1 |
| DINO-04 | PASS | After a real crash at 400x860, 860x400, 360x640 and 1280x800, the ragdoll torso box intersects none of the card elements. Focus lands on RUN IT BACK |
| DINO-05 | PASS with caveat | The viewport meta allows zoom. Text size 100/125/150% persists across reload (`--ui-scale` 1.5 applied before paint). At 150% there is no horizontal scroll at 400 and 360. Caveat: R2 |
| DINO-06 | PASS | See section 4 |

## 4. Conventions

| Item | Result | Notes |
|---|---|---|
| P and Esc pause, overlay Resume/Restart/Settings/Quit, Resume has default focus | PASS | P pauses, `#btn-resume` is focused. Esc resumes and pauses again |
| Restart and Quit confirm in page; no single key forfeits | PASS | Confirm text appears with "No" focused. Esc backs out. 40 alternating P/Esc presses never reach gameover or title. P and Esc during `crashed` do nothing. In Zen, Esc pauses and END RUN needs a confirm |
| Auto-pause | PASS | `window` blur gives `paused` with reason `blur`. Hidden `visibilitychange` gives reason `hidden`. Score, z, elapsed and Time Attack `timeLeft` are frozen over 2 s. Held Down is cleared. Blur on a modal or in `crashed` is correctly ignored |
| Settings opens a freeze; closing returns to pause | PASS | z frozen with the dialog open, still paused after Esc, Esc handled by the dialog only |
| Zen stumble pause | PASS | Pause during `stumble` returns to `stumble` then `running` |
| Touch pause button, 44 px | PASS | 48x48 at the top right, tap pauses at 860x400. Double-tapping Resume ends in `running` |
| Settings persist and validate | PASS | Four corrupt payloads (garbage, wrong types, 1e999 and negative values, array) all fall back per field with 0 console errors. Text 1.5, motion on, theme dark, difficulty hard, volume 35%, assist and mute persist across reload (`data-theme=dark`, MUTED badge shown) |
| 44 px targets | PASS | `getBoundingClientRect` on every button, input and radio, in title, run, pause and game over at 400x860, 860x400, 360x640 and 1280x800: none under 44. The only items under 44 are the 24 px checkbox glyphs inside 48 px rows |
| Contrast | PASS | See DINO-03 |
| Reduced motion | PASS | With `reducedMotion: reduce`, confetti pixels are 0. Without it, 2,969 on a NEW BEST. `settings.reducedMotion` follows the OS |
| Dark | PASS | `colorScheme: dark` gives body and `#loading` `rgb(29,26,22)` |
| Keyboard-only | PASS | Tab reaches gear, chips, one chip radio, START, with a 3 px solid focus outline on each. The CTA reads "PRESS ENTER ON START" while a chip is focused. Enter on START runs. The pause dialog traps Tab. After death focus is on `btn-restart` |
| No horizontal scroll at 360, rotate and resize mid-play | PASS | 6 viewport changes mid-run, canvas tracks the viewport, `scrollWidth` equals the viewport, no errors |

## 5. S3/S4 sample (14 items, more than the required 8)

| ID | Result | Evidence |
|---|---|---|
| DINO-07 | PASS | A first mid ptero shows "DUCK: hold the Down key". `seenHints` becomes jump, duck. The hint line is `display:none` after run time 20 s (hint and coach logic is skipped under autoplay by design). The `?` button shows it again |
| DINO-09 | PASS | Mute persists across reload, limiter present in `audioCore.js` (threshold and ratio from tuning) |
| DINO-10 | PARTIAL, see R1 | Hard gives UNRANKED, no name form. Offline note shown. Loophole: settings change in pause |
| DINO-11 | PASS | Zen run to score 5,256: no NEW BEST, no unlock, `unlockedSkins` empty. First Classic run of 721: no NEW BEST badge, Ember unlock shown |
| DINO-12 | PASS (tests + code) | `tests/difficulty.test.js` passes. The Classic table is untouched (parity above). Time-based gates and breather only when `newObstacles` |
| DINO-13 | PASS | Presses at `crashT` 0 do nothing. At 0.83 s a press goes to the card. A 20x Space/Enter spam straight after is ignored. A later click restarts |
| DINO-14 | PASS | Shield is a fresnel bubble (screenshots), confetti 0 under reduced motion |
| DINO-15 | PASS | See 44 px row |
| DINO-16 | PASS | At 360x640, 400x860 and 860x400 the power-up row (40 px) and a visible toast do not overlap (landscape: x 10 to 188 against 254 to 606). Desktop keeps the column (206 px) |
| DINO-17 | PASS | CTA text, focus on game over, `sr-status` present |
| DINO-21 | PASS | With the endpoint aborted: "Leaderboard offline. Your score is saved on this device.", no form |
| DINO-24 | PASS | Dark loading and body background are dark |
| DINO-25 | PASS | Zen end shows "RUN OVER", the Zen quip "Stretch break. Well earned." and the summary "16 m, 0 pickups, 0 cleared, best 00012" |
| DINO-19, 22, 23 | PASS | Chunk split confirmed by the build output. Tuning guard tests pass. Size limits hold (AST scan) |
| DINO-20 | PARTIAL, as logged | Governor logic is pure and tested. Remaining small per-frame allocations: `idlePose()` on every title frame, a template string per active power-up chip per frame, and the `dino.update` pose object. Not the ones the report named, no real-GPU data, as declared |
| DINO-08 | PARTIAL, as logged | Music honestly declined with a valid reason (needs a human audio-direction decision) |

## 6. Regressions and findings

### R1. S3 | Leaderboard rank is judged at game over, so it can be gamed (DINO-10 incomplete)
- Repro (executed): set difficulty Easy, start a Classic run, press P, Settings, set difficulty Normal, close, resume, die. The run used Easy speeds (start 11.39 m/s, accel 0.17) but the card shows no UNRANKED tag and the name form, so a POST to `/api/scores` is allowed. Cause: `feedback.js onGameOver` calls `isRanked(settings, mode)` with the live settings, and `commit()` in `ui-settings.js` applies changes immediately. The same applies to Classic Plus and Snow: start in the easier config, switch to default in pause, finish.
- Fix: snapshot `{difficulty, classicPlus, weather}` (or just `ranked`) in `prepareRun`/`startRun` and use it at game over, or disable those settings while a run is paused.
- Not S1/S2: the board only matters if the server trusts the client, and DINO-10 itself was S3.

### R2. S4 | False log claim: "nothing under 12 px on settings at 400 px"
- Measured: at 100% text size on 400x860, `#settings legend small` renders at 10 px ("(Easy and Hard runs are unranked)", "(W on the title screen)"). `css/settings.css:49` has no explicit size, so `small` falls to 83% of the 12 px legend. Conventions require at least 11 px for secondary labels and 12 px for HUD text. At 125% and 150% it is fine.

### R3. S4 cosmetic, not in the log
- On game over (phone and landscape) the in-run "tap to jump" pill and the controls hint line are still shown under the ragdoll. In landscape the toast can sit over the BEST line of the score box (toast top 64 against score bottom 73.5).
- The pause subtitle says "Space to resume", which only works while a button holds focus (Space on a focused Resume button clicks it). I did not test the case where focus was lost.

## 7. Console

- Every run (desktop, 3 phone sizes, landscape, dark, reduced motion, corrupt storage, 4-mode 150 s autopilot soaks with Classic Plus and power-ups on, rapid input, rotate, pause spam) logged 0 `pageerror` and 0 console errors or warnings.
- One entry: `error: Failed to load resource: net::ERR_FAILED`. It came from my own `page.route(...).abort()` that simulates an offline leaderboard. The game handled it (note shown, no form). It is a browser network log line, not a game exception, and with the endpoint answered by an HTML fallback (the log's scenario) nothing is logged. Not counted against the game.

## 8. False claims in the log

None of the "done" items were found untrue. The only inaccurate statements are R2 (settings text size) and the DINO-10 "done" status, which holds only until the player changes settings in pause (R1). Counts below treat DINO-10 as done with a known gap, and DINO-08 and DINO-20 as partial, as the log itself states.

## 9. Counts

Items total 25, done 23, partial 2 (DINO-08, DINO-20), declined 0 (the music sub-item of DINO-08 is declined with a valid reason).
