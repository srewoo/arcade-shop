# Lucky Lanes - verification round 1 (2026-11-11)

Verdict: **PASS**. Adversarial pass found no S1/S2 regressions and no console errors. Three low-severity (S4) observations, listed at the end.

## Gates
| Check | Result |
| --- | --- |
| `npm run build` (tsc --noEmit + vite build) | OK. 155 modules, JS 136.68 kB (45.33 kB gzip). The log says 136.5 kB; negligible rounding. Rollup prints zod comment-annotation warnings (benign, from node_modules). |
| `npx vitest run` | 17 files, 154 tests, all pass (matches the log). |
| `npm audit` | 0 vulnerabilities. |
| Hard constraints | No luckylanes-specific entry in CONVENTIONS section 7. Applicable rules checked: `package.json`, `package-lock.json`, `.npmrc` are byte-identical to the backup (`cmp`), so pins and deps are unchanged. Physics/collision/pin/scoring/constants/rng files (`physics.ts`, `collide.ts`, `pins.ts`, `scoring.ts`, `constants.ts`, `rng.ts`) do not appear in the diff, so sim determinism is untouched. The determinism tests still pass. `window.__ll` is `undefined` without `?debug=1` (executed). |
| Size rules | Largest file `game.ts` 236 lines, `Game` class lines 44-236 = 193 (under 200). All files <= 300. |
| Diff vs backup | Changes match the log: new modules (`tuning`, `meterMap`, `turnFlow`, `rolling`, `presentation`, `juice`, `cameraRig`, `pauseView`, `dialog`, `coach`, `stats`, `strings`, `sfx`, `shotInfo`, ...), `overlays.ts` removed and replaced, 9 new test files. No unlogged source changes found. |

## Browser checks (isolated headless Chromium, Playwright 1.48.2, port 4883)
Desktop 1280x800 (also 1280x720, 1366x650, 1920x1080), phone 400x860 portrait and 860x400 landscape with touch and CDP touch events, 360x740, reduced motion + dark, CPU 4x throttle.
Console/page errors: **0** across every session.
Screenshots: `scratchpad/polish-shots/verify1-luckylanes-*.png`.

### S1/S2 items
| Item | Result | Evidence |
| --- | --- | --- |
| 01 Strike window (partial) | PASS (partial honest and justified) | Strike window recomputed from code: zone u = sqrt(0.005/0.075) = 0.258, window = 2u/(4*0.42) = 0.307 s, matches the logged 307 ms (was 66.7 ms). Pocket ticks and "Pocket marks" label visible (`desk-play.png`). Assist setting persists. Unmet literal 8% grid target is disclosed with measured alternatives (casual-player model 10.8%, in the report's 10-15% range). Accepted as a valid partial. |
| 02 Pin deck and juice | PASS | Rack reads as four rows (`desk-play.png`). Strike peak 134 live particles, ring 1, shake nonzero. Reduced motion: 39 particles (<=40%), rings 0, shake 0. |
| 03 Layout | PASS | Lock bottom: 1280x800 763.5/800, 1280x720 683.5/720, 1366x650 613.5/650, 1920x1080 1043.5/1080, 860x400 259.25/400, 400x860 788/860 (Back 844). Scoreboard scrollWidth = clientWidth (558) at 1280/1366/1920. No horizontal page scroll at 400, 360, 860x400 and 360 at 150% text. Rotation mid-play keeps state and canvas resizes. |
| 04 Roll rumble on pause | PASS | Throw, press Esc: `rollGain` 0, `stageT` frozen for 700 ms, resumes after. Hidden tab: AudioContext `suspended`. |
| 05 Silent restart | PASS | Header button reads "Pause" mid-game. Pause > Restart shows in-page confirm, focus on "No, keep playing", 44 px buttons, 10 px gap. Esc backs out. Quit confirm likewise. Stats and scores are not written on quit. |

### Sampled S3/S4 items (all marked done)
| Item | Result | Evidence |
| --- | --- | --- |
| 06 Esc/P pause | PASS | P and Esc open and close it, Esc keeps meter phase, Backspace is the only step-back, focus returns to `#menu-btn`, held arrow key cleared by pause (hold 0, no drift). |
| 07 Onboarding | PASS | Coach card and open help on a clean profile, dismissed by "Got it". |
| 09 Pacing | PASS | After a strike, Space spam reaches the next turn in 0.37 s; unskipped gutter turn took 6.0 s. Spamming Space/taps does not throw extra balls or skip physics. |
| 10 Readouts / contrast / banner | PASS | Readouts "right 9 / 78% / left 1" with check marks; `#sr-live` announced "STRIKE!" and "GUTTER BALL". Meter border contrast 4.02 (light, vs page bg) and 5.61 (dark), above 3:1. |
| 11 Touch targets | PASS | `getBoundingClientRect` sweep of every visible interactive element: none under 44 px on title, play, pause, settings, results at 400 portrait and 860x400 landscape, and at desktop. |
| 12 Text sizes | PASS | m-label 14, sb 14, other HUD 13; no page h-scroll at 360 px with 150% text. |
| 13 Colour-blind assist | PASS (visual) | `dataset.cb=on`, screenshot `desk-cb-assist.png` shows distinct guides. Not a validated simulator. |
| 15 Pocket callout | PASS | "Pocket!" callout on an x=9 straight shot. |
| 16 Drag affordance | PASS | CDP touch drag shows the trail; pausing mid-drag and releasing does not throw; the next drag throws. |
| 17 Render perf | PASS | 4x CPU throttle through four strikes: avg 16.67 ms, p95 16.7 ms, max 16.8 ms, 0 long tasks. |
| 18 Tab hide / blur | PASS | Blur and visibilitychange hidden open pause; visible again leaves it paused; double blur harmless; blur on results and title does nothing. |
| 21 Score chip / results | PASS | Chip "You F1.1 \| 0"; results "3 strikes, 5 spares . Best: 173". |
| 22 Stats / stars | PASS | Stats persist after a game ("games 1, best 173, ..."), spare challenge shows "Stars: ★☆☆ . Best: 17" and is not added to lifetime stats. Corrupt stats fall back. |
| 08 Casual default | PASS | Default `cpuLevel` is `casual`; CPU game completes with a result; tests assert 60-90 average. |
| 19, 20 | PASS | `tuning.ts` exists and is used; `Game` class 193 lines. |
| 14 Audio | NOT VERIFIABLE | No sound device. Tests and code only, as the log itself says. |

### Conventions
| Item | Result |
| --- | --- |
| Pause, auto-pause, no single-key forfeit | PASS. Esc/P only pause. Restart and Quit need a second explicit confirm. Enter/Space on the results screen only activate the focused "Play again". |
| Settings persist and validate | PASS. Corrupt JSON, `[]`, `null` and mixed-invalid objects fall back per field (valid `theme: dark` kept, invalid volume/textSize/mode/players defaulted). Valid out-of-range volume 150 falls back to 80. All seven controls persist across reload and re-render correctly. Settings opened mid-game pauses; Esc closes only Settings and focus lands on Resume. |
| 44 px targets, 8 px gaps | PASS (measured). |
| Contrast | PASS. Body 15.49 (light) / 16.18 (dark), muted 6.33 / 8.55, primary button 5.48 / 6.7, headers 14.29 / 12.07. |
| Reduced motion | PASS. No banner animation, no shake or rings, particles at 39 vs 134. |
| Keyboard-only with visible focus ring | PASS. 3 px solid ring on all controls; Enter on Start starts, Space x4 locks position, aim, power and hook and throws; dialogs trap Tab; Esc and focus return work. Title and results ignore Esc by design. |
| Layout, safe-area, no h-scroll at 360 | PASS. |

### Break attempts (all survived)
Double-click Start; Start called twice via debug mid-play (single clean game); 10x rapid P with a resize mid-roll; pause during settle, sweep and banner (timers frozen); 30-40x Space spam through roll, settle and banner (no extra balls, no stuck state); 15x lock/lane tap spam on phone; 6x Play again spam on results (one game, stats written once); input during the CPU turn ignored; rotate portrait to landscape to 360 mid-play; mute key and M at 0 volume; 4-player hotseat scoreboard scrolls inside its own container.

## Observations (none block the pass)
1. **S4, keyboard focus after Start.** After starting with the keyboard the title dialog closes and focus falls to `BODY`. The first Tab then leaves the page, fires window `blur`, and the auto-pause opens (observed). Playable with Space/Enter, but a keyboard player's first Tab pauses the game. Suggest focusing `#lock` (or the stage) after start.
2. **S4, phone portrait HUD.** The "Drag up to throw" pill touches the in-canvas "LUCKY LANES" sign at 400 px (`phone-play.png`). Cosmetic.
3. **S4, wording.** The log says item 10's meter border is 4.48:1 (against `--card`); measured against the page background it is 4.02:1. Both exceed 3:1. Log bundle size says 136.5 kB, actual 136.68 kB.

No false claims found. Unaddressed S1/S2: none.

Cleanup: preview server stopped, `dist/` deleted, no game source edited.
