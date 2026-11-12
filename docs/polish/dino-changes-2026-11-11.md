# Fossil Frenzy: polish pass changes (Phase 2 to 4), 2026-11-11

Game folder: `/Users/sharajrewoo/DemoReposQA/arcadeShop/dino/src`. Work list: `dino-review-2026-11-11.md`. Cross-game rules: `CONVENTIONS.md`.
`dino/original` and `dino/beautified` were not touched. No `.npmrc` exists in this folder (nothing to keep or change). No new runtime dependencies.

## Result

| | |
|---|---|
| Report items | 25 total: **23 done, 2 partial, 0 declined** |
| Tests | 18 files, 160 tests pass (was 6 files, 64 tests) |
| Build | `vite build` OK; first-load JS 669.5 kB (179.8 kB gzip) instead of one 4,976 kB chunk |
| `npm audit` | found 0 vulnerabilities |
| Hard constraint | Classic, Normal, power-ups off: **bit-identical** to the pre-change build (see "Classic fidelity check") |
| Console errors | 0 in every Playwright run (desktop, phone, landscape, dark, reduced motion, offline leaderboard) |

## Report items

Verification columns refer to the scripts in `.../scratchpad/polish-work/dino/` (`parity.mjs`, `v-layout.mjs`, `v-pause.mjs`, `v-misc.mjs`, `v-vis.mjs`, `v-audio.mjs`, `v-gates.mjs`, `v-load.mjs`) and vitest.

| ID | Status | What changed (files) | How verified |
|---|---|---|---|
| DINO-01 | done | `body.is-title` set by `ui.js showTitle`; `css/title.css` hides `#score` (and clock, power-ups) on the title and `#score` on the game-over card; the title panel is top-anchored (`.panel`) | `v-layout`: `#score` not rendered on the title at 1280x800, 1200x700, 400x860, 360x640, 860x400. Screenshots `after-dino-*-title.png` |
| DINO-02 | done | Settings is a 48 px gear in the top-right corner (`index.html`, `css/base.css .icon-btn`, `aria-label` from `strings.js`); 56 px `START` button under the chips (`ui-chrome.js`); `camera.js` title branch (`layoutShift`, `CAMERA.title` in `tuning.js`) parks the dino low on portrait and on the right third on wide screens; panel is a left column on wide screens, tighter on short phones | `v-layout`: no UI rect intersects the projected dino box on 400x860, 360x640, 860x400 (desktop only the bottom hint line intersects the conservative box, the screenshot shows clear space). A touch tap at the dino centre starts a run (state `running`, Settings closed) on all three phone views |
| DINO-03 | done | Pill backing (`.pill`) on tag, blurb, CTA, hints, quip, score, stats; ink on cream; CTA blink now 1.0 to 0.65 (was 0.25); `--ink-soft` removed | Worst case over a black or white scene behind the translucent pill: **10.16:1 light, 11.96:1 dark** for blurb, CTA, tag and hints in all 5 environments (before 3.1 to 3.5, 2.1 on Dusk Canyon, 1.4 at the blink trough). `tests/contrast.test.js` |
| DINO-04 | done | `camera.js` dead branch uses `layoutShift(CAMERA.dead)`; `#final`, `#quip`, `#run-stats` on pills; the HUD score hides on the card so it no longer collides with the title | `v-vis`: ragdoll torso box does not intersect any game-over card element at 1280x800, 400x860, 360x640, 860x400. Screenshots `after-dino-*-gameover*.png` |
| DINO-05 | done (corrected: incomplete until the 2026-11-11 follow-up) | Viewport meta no longer blocks zoom; new Text size 100/125/150% (`settings.textScale`, `--ui-scale`, `calc(Npx * var(--ui-scale))` in all CSS); floor 12 px, 14 px for blurb and toast | `v-misc`: persists across reload; at 150% on 400x860 no horizontal scroll (scrollWidth 400), START bottom at 532 of 860, Settings scrolls (scrollHeight 1549). Font audit at 400 px: nothing under 12 px on title, settings, run (this was wrong for the settings legend `small` text, which rendered at 10 px at 100%; fixed in the follow-up, see below). Settings and title screenshots at 150% |
| DINO-06 | done | `pause.js`, `ui-pause.js`, `stateMachine.js` (`paused` state), `pauseMath.js`: P or Esc, 48 px pause button, auto-pause on `window.blur`, `visibilitychange` hidden and `pagehide`; overlay Resume (default focus), Restart, Settings, Quit; Zen gets END RUN (confirmed) and Esc no longer ends a Zen run; inputs released; `elapsed`, powers and the Time Attack clock freeze; audio ambience stops and a hidden pause suspends the context; resume has a 3-2-1 (0.9 s) grace | `v-pause`: after `blur`, score, `timeLeft`, `elapsed` and `z` unchanged over 2 s, overlay shown, reason `blur`; frozen during the 3-2-1, then running; hidden tab pauses; Esc and P pause, Esc on overlay resumes; held Down cleared; settings from pause freezes and returns to pause. `tests/stateMachine.test.js` (transition table, auto-pause rules, Esc layering, countdown) |
| DINO-07 | done | `coach.js`, `runAlerts.js coach()`, `feedback.js`: one-time duck prompt within 25 m of the first mid ptero or log; first pickup toast states its effect; first-run "jump" prompt; `#hints` hides after 8 s of run time, `?` button shows it again; `seenHints` in settings; text only, Classic table untouched | `v-misc`: first mid ptero shows "DUCK: hold the Down key", `seenHints` = jump, duck; second run shows nothing; hint line display none after 8 s, `?` brings it back. `tests/copy.test.js` |
| DINO-08 | partial | `audioCore.js` + `audio.js`: UI sounds (`ui('tick'/'confirm'/'back'/'toggle')` via click delegation and `data-snd`), `newBest`, `warn` (power-up last 3 s), `tick` (Time Attack 10, 5, 3, 2, 1), `timeUp`, `slowmo(on/off)`, `powerEnd`, `recover` (Zen), `biome`, looping rain and wind ambience bed, polyphony cap 8, all through the master gain, volume and mute. **Music declined**: needs a human audio-direction decision (and a score) | `v-audio` (real AudioContext): context running after the first gesture, ambience `rain` active, silenced on pause. `tests/audio.test.js` (voice cap, priority voices, mute, queue, pause, every new sound runs) |
| DINO-09 | done | `DynamicsCompressor` (threshold -12 dB, ratio 8) before the destination; `muted` persisted (M key, settings checkbox, badge on load); sounds requested before the context wakes are queued (max age 400 ms) and flushed after `resume()`; hidden pause suspends | `v-audio`: limiter threshold -12, ratio 8. `v-misc`: mute persists across reload with MUTED badge, M toggles and stores. `tests/settings.test.js`, `tests/audio.test.js` |
| DINO-10 | done (corrected: incomplete until the 2026-11-11 follow-up; ranking was judged from live settings at game over, so a change in pause could game the board) | `ranking.js` (`isRanked`, `unrankedReasons`): Easy/Hard, Classic Plus (Classic only) and Snow are unranked; UNRANKED tag with reasons on the card; unranked runs show the board read-only and never POST; Snow labelled "floatier landings" (chip title, aria-label, settings). `dino`, best keys and board ids unchanged. Decision: the local per-mode best still updates for unranked runs (it is a personal record, and Easy players still earn skins) | `v-misc` with a mocked `/api/scores`: Hard finishes with `UNRANKED`, no form, board shown, 0 POSTs; Normal shows the form and 1 POST. `tests/ranking.test.js`. Follow-up: ranking is now frozen at run start and mid-run changes can only make the run unranked (see below) |
| DINO-11 | done | `skins.js`: `bestOverall` ignores Zen; `isNewBest` needs previous best > 0 and score >= 50; `settings.unlockedSkins` grandfathers old unlocks (one-time migration in `storage.loadSettings`); `records.js` | `v-misc`: Zen 5000 gives no NEW BEST, no unlock; classic 0 to 600 gives no badge but unlocks Ember; 600 to 700 gives the badge. `tests/skins.extra.test.js`, `tests/settings.test.js` |
| DINO-12 | done | `tuning.js GATES`: boulder 15 s, log 25 s, meteor 40 s, ramp 20 s, converted per mode and difficulty to distances (`obstacles/difficulty.js distanceAtTime, obstacleGates`); a 1.5x breather gap every 25 s (`breatherDue`, `ObstacleField._breather`); `spawnTable(distance, rules)` signature kept. Classic with Classic Plus off uses `gates: null` and no breather, so the original table and spacing are untouched. Telemetry `__dino.telemetry()` (deaths by kind, median time to death). "Scale by startSpeed/13" not applied: time-based gates already equalise modes | `tests/difficulty.test.js`. `v-gates` (autopilot, blunders off): Classic Plus first sees boulder 9.1 s, log 25 s, meteor 43 s (spawn lead included); Hardcore 16, 22, 49 s; Time Attack reaches full table weights at 60 s (meteor gate 40 s plus 20 s ramp; before: half weight). Gate distances Classic Plus 250/340/480 m become 217/388/680 m, Hardcore 291/525/936 m (was 250/340/480 m at 12/15/20 s) |
| DINO-13 | done | `run.js skipCrash`, `FLOW` in `tuning.js`: jump or tap during the ragdoll goes to the card once `crashT >= 0.8`; a restart press within 0.3 s of the card is ignored; focus moves to RUN IT BACK after 0.35 s; `TUNING.crashToGameOver` untouched | `v-misc`: press at crashT < 0.8 ignored; press at 0.9 shows the card in 7 ms; the next press within 0.3 s ignored; the one after restarts |
| DINO-14 | done | `fx/bubble.js` fresnel shield (rim shader, additive); 12-particle ring burst on pickup (`puffs.ring`); confetti (`fx/confetti.js`) plus a 2 s FOV punch on NEW BEST; white flash with bright edge on shield break; all cut under reduced motion (`juice.js`, counts also lower on quality low and mobile). Near-miss feedback is in the evidence only, not in the Change list, and was not added | `v-vis`: confetti pixels 2737 with motion, **0** with `reducedMotion: reduce`; screenshots `after-dino-phone360-ta-powerups.png` (shield), `after-dino-desk-newbest-confetti.png`. `tests/misc.test.js`, `tests/puffs.test.js` |
| DINO-15 | done | `css/settings.css`, `css/title.css`: `.wchip` 40 to 44 px, `.check` rows 36 to 48 px (whole row taps), `#set-volume` 32 to 44 px, `.seg-btn` `flex: 1 1 30%` so rows fill evenly; labels "Power-ups" and "Classic Plus" with a sub line | `v-misc`: every button, range and row at 400x860, 360x640 and 860x400 in title, settings, run and pause is at least 44 px; the only items below 44 are the 24 px checkbox glyphs, which sit inside 48 px tappable rows |
| DINO-16 | done | `css/powerups.css`: at <= 480 px wide or <= 460 px tall power-ups are a row of 40 px ring timers under the score; toast moved to 132 px; `aria-label` kept | `v-vis` with all 4 granted: `#powerups` vs `#toast` overlap **false** at 360x640, 400x860, 860x400 (before: 9 px overlap, column 206 px tall, now one 40 px row) |
| DINO-17 | done | START button (Tab, Enter, Space); CTA reads "PRESS ENTER ON START" while a chip owns focus (`strings.ctaText`); `#gameover` is `aria-labelledby`, final score `aria-live`, focus moves to `#btn-restart`; off-screen `#sr-status` announces score milestones, pause and game over; canvas has an `aria-label` | `v-misc`: Tab, Tab, ... reaches START, Enter starts; CTA text switches; after death `document.activeElement.id === 'btn-restart'`; announcement "GAME OVER. Score 36." |
| DINO-18 | done | `--accent` `#e0442e` to `#b8301c` (dark theme `#ff8f78`); locked skins are hatched with full-contrast text and a lock glyph (no 55% dimming); `#clock.low` pulses, gets a "!" prefix and a tick | Cream on accent **3.89 to 5.63:1** (dark theme 6.91); locked skin text 2.85 to 11.6:1; accent on pill 5.63. `tests/contrast.test.js` |
| DINO-19 | done | `vite.config.js` manual chunks `three` and `rapier`; `physics/ragdoll.js` loads Rapier with `import()` after first paint; START shows LOADING until `game.physicsReady`; ragdoll warm-up in idle time; `renderer.compile` at boot | Build: first-load JS **4,976 kB (1,825 kB gz) to 669.5 kB (179.8 kB gz)**, Rapier 4,337 kB (1,655 kB gz) loads lazily. Playwright at 4 Mbps, 150 ms RTT, 4x CPU throttle, median of 3: title visible **4.44 s to 2.51 s**, bytes at title 1,790 kB to 185 kB, START enabled 4.45 s to 4.66 s. Lighthouse was not run (no allowed tool) |
| DINO-20 | partial | `qualityGovernor.js` (pure) + `quality.js`: down below 50 fps for one 2.5 s window, back up after 10 s at 58+ fps, restart after a hidden tab; `?fps` overlay (avg, p95, draw calls, triangles, governor step); `renderer.compile` at boot; per-frame allocations removed (hitbox arrays, HUD chip state, power-up expiry list). No real-GPU trace was possible (headless SwiftShader), so p95 and long-task targets are unmeasured | `tests/governor.test.js` (recovery, hysteresis, dip resets the hold timer, ignores long frames). `v-audio`: `?fps` overlay renders under the prod build |
| DINO-21 | done | `ui-over.js`: top-score lookup first; offline shows "Leaderboard offline. Your score is saved on this device." and no name form; failed save shows a RETRY button | `v-misc` / `shots2`: with the preview server answering `/api/scores` with HTML the note appears, no console errors |
| DINO-22 | done | `tuning.js`: `CLASSIC` derived from `TUNING`, `HITSTOP`, `INPUT`, `CAMERA` (framing, title, dead), `QUALITY`, `GATES`, `FLOW`, `COACH`, `SKIN_UNLOCKS`, `WEATHER_COUNTS`, `AUDIO`, `JUICE`; `modes.js`, `input.js`, `run.js`, `camera.js`, `quality.js`, `skins.js`, `weatherModes.js` read from it. Power-up durations stay in `powerups.js` (already one table, re-exported). `window.__dino` and storage keys unchanged | `tests/tuning.test.js` fidelity guard (`MODES.classic.*` equals `TUNING.*`); seeded autopilot parity (below) |
| DINO-23 | done | `events.js` emitter + `feedback.js` (score, milestone, pickup, shield, hit, game over, pause) so `run.js` and `crash.js` no longer touch the HUD or most audio; `STATE_TRANSITIONS` + `transitionState` guard (`stateMachine.js`, `flow.js`); `style.css` (801 lines) split into 6 files under 300 lines; `DinoRig.update` split into `animateTorsoAndLegs`, `animateHeadAndTail`, `animateArms`, `plantFeet` (+ `dino/face.js`); `ObstacleField.physicsProps` moved out; `initSettings` and `_spawnAhead` split. Step, jump, land and duck sounds still call audio directly | Tests for the transition table and for input swipes with synthetic pointer events (`tests/input.test.js`); every JS file <= 300 lines and every function <= 50 lines (script audit) |
| DINO-24 | done | Dark palette via tokens (`css/base.css`, system and explicit); `theme-color` media variants; head script applies saved theme and text size before first paint, and a saved Night environment boots on the dark loading screen | `v-vis` with `colorScheme: dark`: body and `#loading` background `rgb(29,26,22)`; screenshots `after-dino-{desk,phone}-dark-rm-title.png` |
| DINO-25 | done | `quips.js` (`QUIPS_ZEN`, `QUIPS_TIMEUP`, `quipPool`), `strings.summaryLine` run summary ("412 m, 3 pickups, 7 cleared, best 00500"), `game.stats.pickups`, `ObstacleField.cleared` | `v-pause`: Zen end shows "RUN OVER", a Zen quip and the summary. `tests/copy.test.js` |

## Conventions items

| Item | Status | Notes |
|---|---|---|
| Pause (P/Esc, overlay with Resume/Restart/Settings/Quit, confirm for Restart and Quit, auto-pause, inputs cleared, touch pause button >= 44 px, countdowns stop while paused or in menus) | done | See DINO-06. Opening Settings from any state freezes the simulation (`run.js tick`) |
| Settings fields | done | Volume, Mute, Reduce motion (System/On/Off, legacy boolean migrated), Colour-blind assist, Text size 100/125/150%, Theme System/Light/Dark, all validated per field on load and persisted under the existing `dino-run-locked-in:settings` key. No music, so no SFX/Music sliders |
| Reduce motion "On" | done | No shake, flashes, confetti, FOV punch or kick; slam, blink and pulses off (`body.reduced-motion`); weather and dust at <= 40% (`puffs.scale`); cloud drift frozen. Reacts to the OS preference live |
| Colour-blind assist | done | Power-up chips get distinct silhouettes (shield square, double jump triangle, slow-mo hexagon, x2 diamond); chips and pickups already carry text and shape; low clock has "!"; locked skins have a lock glyph; the meteor marker pulses and is a shape on the ground |
| Text size, 44 px targets, contrast | done | See DINO-03, 05, 15, 18 |
| Interpolation | not applicable | The game steps once per rendered frame with a clamped `dt`, not a fixed timestep, so it is already smooth at 120 and 144 Hz and there is no accumulator to interpolate |
| Onboarding | done | See DINO-07 |
| Layout 1280x800, 1920x1080, 400x860, 860x400 | done | Screenshots for each; safe-area insets used; no horizontal scroll at 360 px (`scrollWidth` equals viewport) |
| Tuning config and strings module | done | `tuning.js`, `strings.js` |
| Debug-hook gating | done | `window.__dino` only with `?debug=1` or the dev server (verified absent in the prod build); `?fps` shows the overlay |
| Keyboard and semantics | done | Visible focus ring, dialogs trap focus and return it, `aria-live` regions, labelled corner buttons, sr-only status line |

## Extra bugs found and fixed

1. Pause overlay could not take focus because it was shown after the focus call (`display: none`): fixed in `ui-pause.js` (found by `v-pause`, default focus was empty).
2. A pause request during the 3-2-1 grace was refused: pausing and auto-pausing are now allowed there.
3. `PowerupState.update` allocated an array every frame, `PowerHud.update` an object per chip per frame, `DinoRig.hitboxes` 10 arrays per call (twice a frame): all reuse scratch data now.
4. Zen's Esc ended a run with one key press: Esc now pauses; ending a run is confirmed.
5. The first sound after a gesture could be lost (context still suspended): queued and flushed.
6. Classic Plus and Hardcore got new obstacles after distances that arrived in 12 to 20 s: time-based gates (DINO-12).

## Classic fidelity check (hard constraint)

Harness: both the pre-change build (backup, plus a one-line hook exposing `tick`) and the new build, seeded `Math.random`, `requestAnimationFrame` disabled, fixed 1/60 steps, autopilot, Classic, Normal, power-ups off, RNG re-seeded then `resetRun()` so both start from the same state.

| Run | Seeds | Compared per seed | Result |
|---|---|---|---|
| Autopilot with its blunders | 1, 2, 3, 7, 11, 42, 99, 123 | score, distance, steps, killer, number of `Math.random` calls | **identical in all 8** (scores 227, 229, 221, 274, 218, 248, 199, 213) |
| Autopilot, no blunders, 110 s | 5, 8, 21, 77 | same | **identical in all 4** (score 1950, 2600.15 m, 39,238 to 39,506 random calls) |

Plus `tests/tuning.test.js`: `MODES.classic.startSpeed/maxSpeed/accel` equal `TUNING`, Classic rules have `gates: null` and `breather: null`, and `spawnTable` without gates is the original table (`tests/world.test.js`, `tests/difficulty.test.js`).

## Before and after numbers

| Measure | Before | After |
|---|---|---|
| Title HUD score vs logo | printed through the F-O-S letters | not rendered on the title |
| Phone tap at (200,500) | opened Settings | starts the run (Settings is a corner gear; tap at the dino centre starts) |
| Muted text contrast (blurb, hints, CTA) | 3.1, 2.1, 1.4:1 | 10.16:1 light, 11.96:1 dark |
| Accent text (cream on accent) | 3.89:1 | 5.63:1 |
| Locked skin text | 2.85:1 | 11.6:1 |
| `.wchip` height, `.check` row, volume slider | 40, 36, 32 px | 44, 48, 44 px |
| Toast vs power-ups overlap (360x640) | 9 px | none |
| Power-up HUD, 4 chips | 206 px column | one 40 px row |
| Game-over latency | fixed 2.0 s plus slam | card 7 ms after a press once 0.8 s have passed (default unchanged) |
| Leaderboard offline | silent | note, no form |
| First-load JS | 4,976 kB (1,825 kB gz) | 669.5 kB (179.8 kB gz), 4,337 kB lazy |
| Title visible, throttled 4G and 4x CPU | 4.44 s | 2.51 s |
| Quality governor | never recovers | recovers after 10 s above 58 fps |
| Tests | 64 in 6 files | 160 in 18 files |

## Known remaining issues

- No real-GPU measurements: FPS, p95 frame time, GC and Lighthouse numbers still need a mid-range Android run (the `?fps` overlay is there for it). SwiftShader only.
- No music (DINO-08): needs a human audio decision. Ambience is rain and wind only; Night and desert have no bed.
- Near-miss feedback (DINO-14 evidence) was not added.
- The unranked rule keeps the local best and skin unlocks for Easy, Hard, Snow and Classic Plus runs; a per-config local best would be a product decision. The server contract for `/api/scores` is still unknown, so unranked runs simply do not post.
- The desktop layout check flags the bottom hint line against a conservative dino box; screenshots show clear space, but there is no pixel-exact mesh projection.
- Existing classes still exceed the 200-line guideline (`ObstacleField` about 230 lines, `RagdollSim`, `DinoRig`); only functions and files were brought under the limits.
- `hud` and `audio` are still called directly for footsteps, jump, land and duck in `run.js`; events cover everything else.
- Checkbox glyphs are 24 px (inside 48 px tappable rows).
- Physics now loads after first paint: on a very slow network START shows LOADING until Rapier is ready; a load failure shows a toast and leaves START disabled.
- The harness scripts live in the scratch folder, not in the repo, so the parity check is not part of `npm test`.

## Follow-up fixes 2026-11-11

Source: `dino-verification-2026-11-11.md` (R1, R2, R3 and the DINO-20 note). Files touched: only `dino/src` and this log.

| Item | Status | What changed | How verified |
|---|---|---|---|
| R1 / DINO-10 (S3) ranking gamed via pause > Settings | done | `ranking.js`: `snapshotRun`, `taintRun`, `isRunRanked`, `runInProgress`. `run.js startRun` stores `game.runRank = {mode, reasons}` when the run starts; `apply-settings.js` merges any off-config reason into it when settings change while a run is under way (running, paused, stumble, crashed); `feedback.js onGameOver` judges the run from `game.runRank`, not live settings. A run started off-config stays unranked when switched back to Normal, and a Normal run switched to Easy/Hard/Classic Plus/Snow in pause is unranked even if switched back before dying. Changes at the title or on the game-over card behave as before | `tests/ranking.test.js` (7 new tests: freeze, taint, switch-back, no duplicates, no-board mode, no mutation, run states). Playwright on the production build: Easy start then Normal in pause gives UNRANKED, no name form, 0 POSTs; Normal then Easy then Normal gives UNRANKED; Normal then Hard gives UNRANKED; Classic Plus start then off in pause gives UNRANKED (reason classicPlus); an untouched Normal run still shows the form |
| R2 (S4) settings legend small text 10 px | done | `css/settings.css`: `#settings legend small, #skin-note` get `font-size: calc(12px * var(--ui-scale))` | Playwright at 400x860, 100%: all settings `small` elements 12 px or 12.04 px, minimum font in the dialog 12 px |
| R3 (S4) game-over screen still shows the "tap to jump" pill and hint line | done | `css/hud.css`: `body.is-over #coach, body.is-over #hints { display: none }` | Playwright: during the run `#coach` ("tap to jump", "Space or Up to jump") and `#hints` are displayed; on the game-over card both are `display: none` at 400x860, 860x400 and 1280x800 |
| R3 landscape toast over the BEST line | done | `css/hud.css`: in `max-height: 460px` the toast sits at 84 px (was 64 px) | Playwright at 860x400 with a held toast: toast top 76 to 84 px against score bottom 73.6 px, no overlap with the score box or the power-up row (the score box is hidden on the card itself) |
| DINO-20 remaining per-frame allocations | done (the three named ones) | `run.js`: `idlePose()` returns one frozen shared object, the run and end-of-run poses reuse one scratch object (`setPose`); `ui-power.js`: the `"Ns"` label string is rebuilt only when the displayed second changes. Other DINO-20 caveats (no real-GPU measurements) are unchanged, so DINO-20 stays partial | Seeded parity (below); `?fps` not re-measured on a real GPU |
| R3 pause subtitle "Space to resume" with lost focus | not changed | Not in the follow-up list; untested edge case | |

Verification gates: `npx vitest run` 18 files, 167 tests pass (was 160); `npm run build` OK; `npm audit` found 0 vulnerabilities; there is no tsconfig in this package, so no `tsc` step. `package.json`, `package-lock.json` unchanged. Files stay at or under 300 lines (`run.js` 295).

Classic fidelity re-run (same harness as above, seeded `Math.random`, fixed 1/60 steps, autopilot, Classic, Normal, power-ups off) on the new production build against the stored pre-change results: seeds 1, 2, 3, 7, 11, 42, 99, 123 identical in score, distance, steps, killer and `Math.random` call count (scores 227, 229, 221, 274, 218, 248, 199, 213); 110 s no-blunder runs on seeds 5, 8, 21, 77 identical (1950, 2600.15 m, 39,238 / 39,390 / 39,338 / 39,506 calls); the verifier's seeds 4, 9, 13, 31, 64, 200, 777, 2024 give its scores 263, 270, 252, 263, 220, 224, 265, 280 with the same killers. Console: 0 errors and 0 warnings across all follow-up Playwright runs.
