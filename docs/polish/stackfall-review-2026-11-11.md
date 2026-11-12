# Stackfall polish review (Phase 1: Assessment) - 2026-11-11

Scope: `/Users/sharajrewoo/DemoReposQA/arcadeShop/stackfall` (TypeScript strict, Vite, Canvas 2D, WebAudio). Read-only review; no game files were changed. `dist/` was deleted and the preview server on :4867 was stopped.

Method: read README and all 2,334 lines of `src/`; played the production build in isolated headless Chromium (Playwright 1.48.2) with real keyboard, mouse and CDP touch input at 1280x800, 1920x1080, 400x860 (isMobile, hasTouch, DPR 2), 360x640, 320x568, 240x240 and 860x400. Covered title, all five modes, settings, partial and full sessions, game over, win (Sprint), pause, light/dark `colorScheme`, `reducedMotion`, storage corruption and blocked storage, rapid input, resize and tab hide. Scripts: `scratchpad/sf-review1.mjs`, `sf-review2.mjs`, `sf-review3.mjs`. Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/stackfall-*.png` (abbreviated `SHOTS/` below).

Console: 0 errors and 0 warnings across every run.

## Scorecard (1-5)

| Area | Score | Reason |
| --- | --- | --- |
| UI | 3 | Clean glass-terrarium look and readable HUD, but the well is only 23% of a 1280px viewport and small phones/landscape break down. |
| UX | 2 | No controls or goal teaching on phones, Settings does not pause, Space-hammering skips the result card, stash top-out can freeze the game. |
| Gameplay | 3 | Solid sim (7-bag, lock delay, kicks, five modes, deterministic), gentle curve; Zen/Ultra/records have loose semantics. |
| Graphics | 4 | Cohesive original stone sprites with per-shape facets, level-tinted sky, good shatter particles; missing level-up/danger/lock feedback. |
| Audio | 3 | Pleasant procedural ambient and 11 SFX, but many actions are silent, no volume controls, music keeps playing while paused. |
| Accessibility | 2 | Remapping, reduced motion and focus rings exist; no colour-blind mode or text scale, 36px targets, 9-11px canvas text, no announcements. |
| Performance | 4 | Steady 60 fps (p95 16.8 ms) incl. 400-particle quad clear; one 174 ms long task on first Play; per-frame gradient allocs. |
| Robustness | 3 | Storage corruption, blocked storage, 400-key spam and 6 rapid resizes all survived; one hard freeze and two flow bugs. |

## If you only do three

1. **STACKFALL-01** (S1): stash that spawns into a blocked top sets `status='over'` with no `end` event, so the game freezes with no result card.
2. **STACKFALL-04** (S2): reclaim the wide empty margins (known issue): drop the `64rem` cap, move the HUD into the canvas side columns and size the well from the full stage height (measured well 296px wide of 1280px; 300px to 1000px stage).
3. **STACKFALL-03** (S2, with 02): auto-pause while Settings is open and guard the result card from stray key presses; today the sim runs under the modal and Space-spamming restarts the run 172 ms after the card appears.

Counts: **S1 = 1, S2 = 5** (01; 02, 03, 04, 05, 07). S3 = 14, S4 = 7 (27 items total).

## Full prioritised list

Effort: S under half a day, M 1-2 days, L more. Constraints that apply to everything: keep `src/core` DOM-free and deterministic (`tests/replay.test.ts`), keep the Classic rule set, never introduce the word "Tetris" or guideline colours/music.

### S1

**STACKFALL-01 | Robustness/Gameplay | S1 | Stash top-out freezes the game**
- Evidence: `src/core/actions.ts:98` sets `s.status = 'over'` without pushing an `end` event (compare `lock.ts:finish`). `app.ts:258` only shows the result card from an `end` event. Repro run: SHOTS/stackfall-bug-stash-freeze.png (board frozen, no overlay, `status:'over'`, ticks stuck at 26 for 1 s+, `#overlay` hidden, `#btn-again` not visible). `step.ts:15` has the same pattern on creation (cannot trigger in play).
- Change: in `doStash`, replace the bare assignment with `finish(s, 'over')` when `s.rules.gameOver`, and for Zen call the same wipe path as `onTopOut` (clear board, push `wipe`, respawn). Export `finish`/`onTopOut` from a shared module (they live in `lock.ts`) to avoid a circular import, e.g. move to `core/end.ts`. Also make `tick()` push an `end` event if `status !== 'playing'` and none was emitted, as a safety net.
- Effort: S. Risk: sim determinism unchanged for normal play; add replay test with a seeded top-out via stash. Zen must not end.
- Verify: new vitest case (fill rows 0-1 at spawn columns, set stash to a blocked piece, call `tick` with `stash`) expects an `end` event (or `wipe` in Zen); Playwright repro above shows `#btn-again`.

### S2

**STACKFALL-02 | UX | S2 | Result card is activated by a stray Space (hard-drop key)**
- Evidence: `app.ts:192-205` shows the card 900 ms after the end and `setOverlay(..., '#btn-again')` focuses "Play again". Space is not intercepted when not playing (`controls.ts` `if (!playing) return`), so the browser clicks the focused button. Measured: hammering Space at 80 ms intervals after game over restarted the run 172 ms after the card appeared (`sf-review2` section B).
- Change: when the card appears, set `disabled`/`aria-disabled` on both buttons for 700 ms (or ignore `click` events whose `event.detail===0 && performance.now() - shownAt < 700`) and do not move focus to Play again if a key is currently held (`Controls` already tracks `codes`). Keep Enter working after the grace period.
- Effort: S. Risk: none for sim. Verify: Playwright spam of Space for 2.5 s keeps the card up; after 700 ms a Space/Enter press restarts.

**STACKFALL-03 | UX/Robustness | S2 | Settings does not pause; Esc handling resumes the game behind the dialog**
- Evidence: `app.ts:207-219` `openSettingsDialog` never calls `pause()`. Measured: opening Settings from the top chip during play, ticks went 17 to 169 in 2.5 s with the dialog open (`C_settingsMidGame`). In the Pause card, Settings then Esc: Esc is `preventDefault`ed by `controls.ts` (pause key), the dialog stays open and `togglePause` resumes: ticks 37 to 126 in 1.5 s with `#overlay` hidden (`D_pauseSettingsEsc`). The player can top out inside a modal.
- Change: in `openSettingsDialog`, if `phase==='playing'` call `pause()` first and remember `resumeAfter=false` (return to the Pause card on close). In `Controls.onKeyDown`, ignore pause/mute keys while `document.querySelector('dialog[open]')` is set (or add `isModalOpen()` to `ControlHooks`) so Esc closes the dialog natively.
- Effort: S. Risk: none. Verify: with Settings open ticks do not advance; Esc closes the dialog and the Pause card is shown, a second Esc resumes.

**STACKFALL-04 | UI/Graphics | S2 | Wide empty margins on landscape desktop (known issue), measured**
- Evidence: SHOTS/stackfall-desk-quad.png, stackfall-desk-1920.png. `.app{max-width:64rem}` (`style.css:23`) caps the stage at 1000 px; `layout.ts:16` limits cell to `H*0.9/rows`; header + HUD + hint consume about 140 px of 800. At 1280x800: stage 1000x658, cell 29.6 px, well 296 px wide = 23% of the viewport; at 1920x1080 stage is still 1000 wide (460 px dead each side), well 430 px = 22%.
- Change: (a) remove the `max-width` for landscape (`@media (min-aspect-ratio: 1/1)`: `.app{max-width:none}`); (b) in landscape move Score/Lines/Level/Time/Best into canvas side columns (left under Stash, right under Next) or a vertical HUD in the DOM, and shrink the top bar to the title and chips only; (c) change `cell = min((H - 2*gap)/ (rows + 0.5), (W - sideWidth*2)/cols)` with `gap = 12` so the well uses about 96% of height, giving roughly cell 36 px at 1280x800 and 46 px at 1080p; (d) hide `.hint` after the first game (see 07).
- Effort: M. Risk: Canvas layout only; touch gesture step uses `cellSize` so thresholds scale. Check phone portrait does not regress.
- Verify: Playwright at 1280x800, 1920x1080, 2560x1080: well height >= 92% of stage height and well width >= 30% of the viewport; screenshot diff.

**STACKFALL-05 | UI | S2 | Phone landscape is unplayable**
- Evidence: SHOTS/stackfall-phone-landscape.png. At 860x400 the stage is 184 px tall (HUD 49, pad 48, hint wraps to two lines), so cell is about 8 px (`layout.ts:16` `Math.max(8,...)`) and Stash/Next labels overlap the well ("STASH" over the stash box edge).
- Change: for `(max-height: 500px) and (orientation: landscape)` hide `.hint` and the top bar title, put the HUD in canvas side columns (see 04) and overlay the touch pad as two vertical columns left and right of the stage (move/drop left, rotate/stash right, each button 56x56 px) so the stage keeps about 90% of the height. Consider showing a "Rotate your phone" nudge instead if the layout is not done.
- Effort: M. Risk: layout only. Verify: at 860x400 cell >= 14 px and pad buttons >= 44 px; at 667x375 also.

**STACKFALL-07 | UX | S2 | No onboarding; phones never learn the controls**
- Evidence: the only control text is `#hint` (12.5 px, `style.css:105`), which is `display:none` at <=520 px (`style.css:125`). On a 400x860 phone the pad shows icons only (SHOTS/stackfall-phone-play2.png) and swipe/tap/swipe-up gestures are undiscoverable; the title copy is one sentence and the desktop title card has no controls, goal or Stash explanation.
- Change: add a one-time "How to play" strip on the title card (3 lines: goal, controls by input type chosen from `(pointer: coarse)`, Stash) with a "Got it" that stores `stackfall-seen-help=1`; on touch show an animated 2-second gesture coach on first run ("swipe left/right to move, tap to rotate, swipe up to drop", respecting reduced motion); add text labels or `title` tooltips to pad icons (`Rotate left`, `Rotate right`, `Soft drop`). Keep `?seed` untouched.
- Effort: M. Risk: new localStorage key must be zod-validated like the others (`settings.ts`). Verify: fresh profile shows the help; after dismissal it does not return; phone screenshot shows gesture text.

### S3

**STACKFALL-06 | UI | S3 | Small phones: title card overflows, HUD time wraps, autofocus hides the heading**
- Evidence: 320x568: overlay 341 px tall, card scrollHeight 770 (`sf-review3` `title320`), HUD time renders as "0:00." / "4" because `.hud b{overflow-wrap:anywhere}` (`style.css:66`; SHOTS/stackfall-phone-play-320.png). At 360x640 the card is 702 px in a 434 px overlay and `focus()` on `#btn-play` scrolls the card to the bottom so the title and Marathon/Sprint cards start out of view (SHOTS/stackfall-phone-title-360.png). At 240x240 the stage collapses to 2 px.
- Change: replace `overflow-wrap:anywhere` with `white-space:nowrap; font-size:clamp(0.78rem,3.6vw,1.05rem)`; make the mode grid two compact rows (hide `.mode small` below 400 px and show the blurb only for the selected mode); focus with `focus({preventScroll:true})` in `setOverlay`; set `.app{min-height:100dvh}` and allow page scroll below 300 px height instead of collapsing the stage.
- Effort: S. Risk: low. Verify: 320x568 title visible without nested scroll; HUD time one line.

**STACKFALL-08 | Accessibility | S3 | Touch targets under 44 px**
- Evidence (measured via `getBoundingClientRect`): Pause/Sound/Settings chips 70-115 x 36 px (`style.css:43-49`, `min-height:2.25rem`); settings key buttons 128 x 36 px, selects 119 x 36 and 83 x 36 (`style.css:117`); checkbox 21 x 21 px; range tracks 16 px high so the thumb is about 16 px (SHOTS/stackfall-phone-settings.png). Pad buttons (50 x 48) and `.btn` (44 px) pass.
- Change: `.chip{min-height:2.75rem;padding-inline:1rem}` (44 px), `.field select,.field button,.keybtn{min-height:2.75rem}`, `input[type=checkbox]{width:1.75rem;height:1.75rem}` plus make the whole `.field` row the hit area (wrap input in the `<label>`), `input[type=range]{height:2.75rem}` with a 24 px thumb via `::-webkit-slider-thumb`/`::-moz-range-thumb`.
- Effort: S. Risk: top bar wraps earlier on narrow phones (check 320 px). Verify: script asserts every `button, select, input, label[for]` rect >= 44 px on 400x860.

**STACKFALL-09 | Audio | S3 | Music keeps playing while paused or the tab is hidden**
- Evidence: `app.ts:148-158` `pause()` does not touch `ambient`; measured oscillators created 10 to 20 in 8 s while paused (`E_oscDuringPause`) with the AudioContext still `running`. The `visibilitychange` handler (`app.ts:48`) pauses the game but not audio. `ambient.stop()` only runs on the title.
- Change: add `AudioEngine.suspend()/resume()` using `ctx.suspend()`/`ctx.resume()`; call from `pause()`/`resume()` and the visibility handler (ambient timer is `setInterval` and is throttled in hidden tabs anyway). Optionally duck master gain to 0.3 on pause instead of full suspend.
- Effort: S. Risk: `ensure()` already resumes on user gesture; make sure Resume does not re-trigger autoplay policy errors. Verify: after pause, `ctx.state==='suspended'`; oscillator counter flat.

**STACKFALL-10 | Graphics/UX | S3 | Missing feedback for level-up, garbage, stash, lock, danger and the Ultra clock**
- Evidence: `renderer.handleEvents` (`renderer.ts:50-62`) only handles `clear`, `hardDrop`, `lock`, `wipe`. `levelUp`, `garbage`, `stash` events produce no visual (level change is only a sound plus slow hue drift in `background.ts`); no stack-height warning; Ultra has no last-10-seconds cue; cleared rows collapse in the same tick (no clear animation hold) and `flashRow` y values are computed from pre-collapse rows but drawn over the post-collapse board (`renderer.ts:64-68`); the 900 ms `finish()` delay shows a frozen board with no "Game over" animation.
- Change: add banners `Level N` (reuse `fx.banner`, include the level in the `levelUp` event), a 0.25 s rise pulse on the well edge for `garbage`, a stash swap tween (mini piece slides 120 ms), a lock flash (white overlay 80 ms on the four cells), a red-tinted vignette when any cell above row 6 is filled (pulse disabled under reduced motion), a pulsing HUD clock plus a tick sound for the last 10 s of Ultra, and a 150 ms row-dissolve before collapsing (render-only: keep the sim clearing instantly and draw ghosts of cleared rows from `event.colors`). Add a dim/"X" over the stack on game over.
- Effort: M. Risk: render-only, keep sim deterministic; effects must stay under `MAX_SHARDS`. Verify: Playwright screenshots at each trigger; FPS stays >= 58.

**STACKFALL-11 | Audio | S3 | Large SFX coverage gaps and no volume control**
- Evidence: `app.ts:221-234` plays sounds for move, rotate, stash, hardDrop, lock (not on hard drop), clear (3 variants), levelUp, end. Silent: UI clicks, game start/countdown, pause/resume, blocked move/rotate/stash-denied, soft drop, garbage rise, Zen wipe, combo and back-to-back (no pitch ramp: `play('twist')` is the only special case), all clear, new best, low stack, Ultra clock. `Sfx` type has no entries for these (`engine.ts:2`). `AudioEngine.muted` and master gain 0.8 are fixed; mute is not persisted (reload resets "Sound on"); `Sound effects`, `Ambient music` and `M` overlap with no master/music/SFX sliders.
- Change: add `uiClick`, `pause`, `resume`, `start`, `deny`, `garbage`, `wipe`, `combo` (pitch = 392 * 2^(combo/12)), `b2b`, `allClear`, `newBest`, `warn`, `tick` entries; route `uiClick` from the shared button helper in `dom.ts`; add Master/SFX/Music sliders (0-100) to `SettingsSchema` and persist `muted`; throttle `move` to at most one per 40 ms so ARR 33 ms does not buzz.
- Effort: M. Risk: keep synth-only, no samples; sounds must stay original (no known theme). Verify: unit test that every `GameEvent` type maps to a `Sfx` or an explicit "silent" entry; manual listen.

**STACKFALL-12 | Audio | S3 | Ambient pad is much louder than gameplay SFX (calculated)**
- Evidence: `ambient.ts:68-84` runs eight triangle oscillators (4 intervals x 2 detunes) through one gain envelope of 0.05 peak, so the pad can peak near 8 x 0.05 = 0.40 before the 700 Hz low-pass, plus droplets at 0.05 with 0.38 feedback echo; `engine.ts:59-60` `move` is 0.05 and `rotate` 0.07, `hardDrop` 0.2, clears 0.12-0.14 with up to five overlapping notes (0.14 x 5 summed, no compressor or limiter on `master`). Not measured with a meter (headless, no output device); numbers come from the code.
- Change: normalise: per-oscillator gain 1/8 of target (`vol/8`), put music on a `musicGain` (default 0.35) and SFX on `sfxGain` (default 0.8) feeding a `DynamicsCompressorNode` (threshold -18 dB, ratio 4) before destination; target SFX peaks: move -24 dBFS, rotate -22, lock -14, clear -12.
- Effort: S. Risk: balance is subjective; expose sliders (see 11). Verify: render each SFX and the pad via `OfflineAudioContext`, assert pad RMS at least 6 dB below clear1.

**STACKFALL-13 | Accessibility/Graphics | S3 | No colour-blind support beyond small facets**
- Evidence: Machado CVD simulation of `palette.ts` base colours, delta-E (CIE76) of the closest pairs: normal Sapphire/Amethyst 23.4; protan Sapphire/Amethyst 6.7; deutan Rose/Jade 8.5 and Copper/Sandstone 13.9; tritan Copper/Rose 13.6 (values under about 20 are hard to separate). Cue is the facet shapes in `stones.ts:22-37` (pentagon 5 vs hexagon 6 vs octagon 8 sides) at `mini` size 15-18 px in Next/Stash, which is hard to read. Garnet vs well background is only 3.33:1, Pebble 4.19:1 (computed from `#c9484f`/`#8c8478` vs the well fill). `ui-code` checklist requires a colour-blind mode.
- Change: add Settings option `Piece colours: Default / Colour-blind safe` with an alternate 7-colour palette chosen for deutan/protan/tritan separation (e.g. Okabe-Ito derived hues, still original stone names), a `High-contrast outlines` toggle (1.5 px dark+light outline on every cell), and make facets more distinct (circle, square, triangle, diamond, plus, bar, ring) with `size*0.26` radius. Raise Garnet lightness so it is >= 4.5:1 against the well.
- Effort: M. Risk: IP: keep colours away from the guideline set (cyan I, yellow O, purple T, green S, red Z, blue J, orange L); the current mapping already avoids it. Verify: rerun the delta-E script, min pair >= 20 in every simulation.

**STACKFALL-14 | Accessibility | S3 | No text scaling, tiny canvas text, no live announcements**
- Evidence: canvas panel labels `renderer.ts:112` use `max(9, mini*0.62)` px (about 9-11 px; contrast 4.98:1 on the panel is fine, size is not); HUD key labels 10.9 px (`style.css:63`), `.hint` 12.5 px, `kbd` about 9 px, mode blurbs 12.5 px. HUD is not `aria-live` and line-clear banners exist only on canvas, so screen-reader users get no score/level/clear feedback; `#overlay` is `role=dialog aria-modal=false` with no `aria-labelledby`.
- Change: add `Text size: 100/125/150%` setting applied as `html{font-size}` and passed to the renderer for label sizes (min 12 px); raise `.hud .k` to 0.8rem and `.hint` to 0.9rem; add a visually hidden `aria-live="polite"` region updated with "Double, 300 points", "Level 4", "Game over, score N"; give `#overlay` `aria-labelledby` pointing at the card `h2`; move `#overlay` focus trapping to `inert` on `.bar, .hud, .pad` while a card is open.
- Effort: M. Risk: layout growth at 150% (check HUD at 400 px). Verify: axe-core run; Playwright asserts live region text after a forced clear.

**STACKFALL-15 | UI/UX | S3 | Settings dialog: too tall, Done off-screen, default-blue sliders**
- Evidence: dialog scrollHeight 1050 px vs 772 visible at 1280x800 and 1050 vs 772 on 400x860 (`phoneSettingsScroll`); the "Done" button sits below the fold at y=1025 (SHOTS/stackfall-desk-settings.png). Range inputs render with the browser's blue accent (SHOTS/stackfall-phone-settings.png) while checkboxes use the mint accent (`style.css:122`).
- Change: group into `<details>` sections (Handling, Options, Keys; Keys collapsed), add a sticky footer with Done (`position:sticky;bottom:0`), show DAS/ARR also in frames, add `accent-color:var(--accent)` to `input[type=range]`, and a "Reset" per fieldset. Close on backdrop click.
- Effort: S. Risk: none. Verify: Done visible without scrolling at 1280x800 and 400x860.

**STACKFALL-16 | Bug | S3 | Remapping a default key can leave an action unbound**
- Evidence: `settings.ts:76-81` `rebind` removes the code from every action, then refills empty actions from `DEFAULT_KEYS` minus the same code. Binding `Space` to Rotate leaves Hard drop with `[]` (default is only `['Space']`); the same for Mute (`KeyM`) and Rotate CCW (`KeyZ`). No warning is shown; `rebind` replaces all alternates (Left loses `A`). Static analysis of the code path (not executed in browser).
- Change: when the steal would empty an action, swap instead (give the displaced action the old key of the action being rebound) or reject with a visible message "Space is used by Hard drop - pick again or swap". Keep alternates and allow Add/Replace. Blocklist `Tab`, `Enter`, `Meta*` so UI navigation cannot be bound. Add tests in `tests/settings.test.ts`.
- Effort: S. Risk: stored settings with empty arrays already fail `KeyList.min(1)` and fall back to defaults, so no migration. Verify: unit test that every action has at least one key after any rebind.

**STACKFALL-17 | Accessibility/UX | S3 | Keyboard flow on the title is awkward**
- Evidence: initial focus is `#btn-play`; Tab order was Settings, document, Pause chip, Sound chip, Settings chip, then the mode buttons (`I_tab`). Activating a mode re-renders the card and refocuses Play (`app.ts:126` `showTitle()` then `focus('#btn-play')`), so arrow-style mode picking needs Shift+Tab loops. The overlay is not a focus trap (Tab reaches the top chips behind it).
- Change: make the mode group a roving-tabindex radio group (Left/Right/Up/Down move and select, Enter/Space plays), keep focus on the chosen mode instead of re-rendering (update `aria-pressed` and the Play label in place), put the modes before Play in DOM order, `inert` the rest of the page while a card is shown (see 14).
- Effort: S. Risk: none. Verify: Playwright: ArrowRight x2 then Enter starts Ultra; Tab never leaves the card.

**STACKFALL-18 | Accessibility | S3 | Reduced motion keeps full-strength flashes; no separate shake/flash controls**
- Evidence: `effects.ts:64` row flash `rgba(255,255,240,0.7)` for 0.35 s is not gated by `reduced` (only shake, particle count and banner pop are); Quad flashes four rows plus 12 px shake plus additive particles at once (SHOTS/stackfall-desk-quad.png). Light/dark and reduced-motion emulation produced identical frames except fewer particles (`mode-reduced.png`).
- Change: scale flash alpha to 0.25 and duration to 0.2 s when `reduced`, add independent toggles `Screen shake`, `Flashes`, `Particles` (Off/Low/Full) in Settings, cap luminance change to under 3 flashes per second, keep the CSS media rule.
- Effort: S. Risk: none. Verify: forced `reducedMotion:'reduce'` run: sampled frame max brightness delta <= 15% over the well.

**STACKFALL-19 | Gameplay | S3 | Difficulty curve and pacing feel flat at the extremes**
- Evidence: `modes.ts:37` gravity `48*0.82^(level-1)` frames/row: L1 1.25 rows/s (a piece needs about 16 s to reach the floor), L5 2.8, L10 7.5, L15 20.1 rows/s (computed table); marathon reaches L15 at 140 lines so the last 10 lines have no change; Sprint fixed L3 (1.9 rows/s) and Dig fixed L2 make those modes soft-drop races; soft drop is `1/3` row/frame (`step.ts:10`) which equals gravity at L15 so soft drop adds nothing there; lock delay 30 frames with 15 resets (`state.ts:28-29`) allows long stalling. Estimated Marathon length for a competent player: about 150 x 10 / 4 = 375 pieces, roughly 8-12 minutes. This is estimated from rules, not from human playtest data (see "could not check").
- Change: move tuning into `core/tuning.ts` (see 24) and trial: L1 at 36 frames/row, curve factor 0.80, cap level 20 with a 1/60-row (instant) tier from L16 for experts but keep L15 the "win" band; make soft drop `max(base*6, 1/3)`; add per-mode gravity multipliers so Sprint starts L1 and ramps (+1 level per 8 lines). Keep the Classic table available as a "Classic" preset.
- Effort: M. Risk: Classic fidelity and `tests/game.test.ts`/`replay.test.ts` fixtures depend on the current numbers; gate behind a `tuning` preset id. Verify: deterministic bot run per level and a telemetry-free playtest (3-5 humans, `playtest-report` template).

**STACKFALL-20 | Performance | S3 | One 174 ms long task on first Play**
- Evidence: PerformanceObserver `longtask` 174 ms at t=1074 ms (when Play was pressed; none during load, `dcl` 43 ms, transfer 42 KB). Likely `AudioContext` construction in `audio.ensure()` plus ambient start and first stone-sprite builds (`stones.ts` builds one canvas per colour per size on demand, cache capped at 96). Also 63 ms and 182 ms seen across a 20 s play session in one run and 378 ms total in another.
- Change: create the `AudioContext` on first pointer/key event on the title (gesture already exists) rather than on `start()`, pre-warm `stoneSprite` for `cell` and `mini` sizes during `resize()` with `requestIdleCallback`, and keep `ambient.start()` scheduling out of the click task (`setTimeout 0`).
- Effort: S. Risk: autoplay policy: only create after a gesture. Verify: no longtask > 50 ms during Play press (Playwright `PerformanceObserver`).

### S4

**STACKFALL-21 | Gameplay/UX | S4 | Zen, Ultra and record semantics**
- Evidence: Zen records an unbounded score (`modes.ts:25` best 'score', no cap), so idling at Level 1 farms a "best"; `recordRun('quit')` (`app.ts:174`) lets a quit run set the Marathon best; the Ultra mode silently honours the "Marathon start level" setting (`modes.ts:30-33` progression modes use `startLevel`); Zen level is fixed at 1 so there is no progression; "Best" in the HUD only updates after the run and there is no "new best" cue during play.
- Change: Zen: no records (hide Best) or record "lines cleared in 5 minutes"; Marathon quit records only if status is `won`/`over`; rename setting to "Start level (Marathon, Ultra)" or hide it for Ultra; live-update `hud-best` and flash it when passed; Zen levels rise slowly with lines (cosmetic hue only).
- Effort: S. Risk: existing stored Zen records become unused (schema keeps key). Verify: unit tests on `beatsRecord`.

**STACKFALL-22 | UX | S4 | Result and title polish**
- Evidence: SHOTS/stackfall-desk-gameover.png and stackfall-desk-win.png: cards show a duplicated "Stackfall" `h1`/`h2`, Pause "Take a breath." is filler, result card has no delta vs previous best, no pieces/min or lines/min, no share/copy-seed, the same card for win and loss apart from the title.
- Change: show "+1,240 vs best" or "0:03.2 slower", add PPS and lines per minute, a "Copy seed" button (the sim is seeded), distinct win header art (mint glow) and keep the title card h2 as "Choose a mode".
- Effort: S. Risk: none. Verify: screenshot diff.

**STACKFALL-23 | Performance | S4 | Per-frame allocations and recomputation in the render loop**
- Evidence: `background.ts:29,39,59` create one linear, nine radial and one more linear gradient every frame; `drawBed` re-seeds a PRNG and draws about 40 ellipses per frame (`background.ts:73-84`); `effects.ts:43-52` reallocates arrays via `filter` every frame; `renderer.ts` calls `window.devicePixelRatio` repeatedly. Measured FPS is still 60 (p95 16.8 ms, max 16.8 ms) in headless Chromium for idle, a quad clear with about 400 shards, and a 15 s random-input session (`fpsIdle/fpsClear/fpsPlay`). Heap growth could not be read (`performance.memory` unavailable).
- Change: render the static layers (sky gradient per hue bucket, glass, pebble bed) to an offscreen canvas and redraw only when the hue changes by more than 1 degree or on resize; use in-place compaction for shards/banners/flashes (swap-remove); cache `dpr` on resize.
- Effort: M. Risk: low-end phones benefit, desktop does not need it. Verify: Chrome Performance trace on 4x CPU throttle: scripting time per frame drops; FPS holds 60.

**STACKFALL-24 | Code quality | S4 | Hardcoded tuning and size limits block polish**
- Evidence: `gameplay-code.md` (data-driven values): gravity constants `modes.ts:37`, `SOFT_DROP_RATE`/`ZEN_GARBAGE_INTERVAL` (`step.ts:10-11`), `lockDelay:30`/`moveResetLimit:15` (`state.ts:28-29`), score tables (`scoring.ts:4-7`), audio frequencies/volumes (`engine.ts:59-69`), shake/particle values (`renderer.ts:54-76`, `effects.ts:11`), layout constants (`layout.ts:16-24`), touch thresholds 12/50/350/600/14 (`touch.ts`). Size limits from CLAUDE.md: `App` class is about 260 lines (limit 200; file 282 of 300), `openSettings` is a 62-line function (limit 50); every other file <= 181 lines.
- Change: add `src/config/tuning.ts` (gravity, lock, scoring, zen, touch), `src/config/feel.ts` (shake, particles, banner timings) and `src/config/audio.ts` (note tables and gains), imported by core/ui; split `App` into `App` (wiring), `Session` (phase machine) and `Hud`; split `openSettings` into section builders in separate files. Barrel-export per module.
- Effort: M. Risk: keep `src/core` free of DOM; replay test must still pass byte-for-byte with default tuning. Verify: `npm test`, plus a lint rule (max-lines) in CI.

**STACKFALL-25 | Audio | S4 | Ambient nodes are never disposed**
- Evidence: `ambient.ts:25-33` creates a new `DelayNode`, two `GainNode`s with a feedback loop on every `start()` and `stop()` only clears the timer (`ambient.ts:36-39`); pad oscillators scheduled up to 10 s ahead keep sounding after Quit (`E_oscOnTitle`: no new oscillators, but already-scheduled pads still ring on the title).
- Change: create the delay chain once in the constructor, keep a list of live oscillator/gain nodes and call `stop()` with a 0.4 s fade on `Ambient.stop()`, disconnect on `onended`.
- Effort: S. Risk: none. Verify: after Quit, master RMS reaches silence within 0.6 s; node count constant across 20 restarts.

**STACKFALL-26 | IP | S4 | Scoring numbers mirror the guideline tables**
- Evidence: `scoring.ts:4-7`: line points 100/300/500/800, twist 400/800/1200/1600, mini 100/200/400, all-clear 800/1200/1800/2000, back-to-back x1.5, soft/hard drop 1/2 per row. Names (`Twist`, shapes `bar/cube/spur/...`), palette (copper/rose/jade/sapphire/sandstone/amethyst/garnet), kicks (own table) and audio (random pentatonic, no melody) are original; `grep -ri tetris` over `src`, `index.html`, `README.md` returns nothing; shape-to-colour mapping differs from the guideline on all seven shapes.
- Change: optional hardening: offset the tables (e.g. 100/250/450/750, twist 350/700/1100/1500) via the tuning module so the score ladder is Stackfall's own; keep a "Classic" preset if fidelity is required. No change needed for colours, music or naming.
- Effort: S. Risk: breaks `tests/scoring.test.ts` expectations and any shared leaderboards; "Classic fidelity" trade-off decision for the owner. Verify: tests updated; grep for banned words stays empty in CI.

**STACKFALL-27 | UI/Accessibility | S4 | Always dark, ignores colour-scheme and forced-colors; touch niceties missing**
- Evidence: `style.css:1-12` defines only a dark palette with `color-scheme: dark`; `colorScheme:'light'` and `'dark'` emulation produce identical computed backgrounds `rgb(11, 28, 27)` (SHOTS/stackfall-mode-light.png, mode-dark.png). No `@media (forced-colors: active)` rules, the unselected `.mode` border is 2.0:1 against the card (`rgba(255,255,255,.22)`, computed) and 1.6:1 on panels. No `navigator.vibrate` haptics on lock/clear; swipe-down soft drop requires holding below the start point (`touch.ts:44-46`); a short drag under 12 px but over 350 ms does nothing (`touch.ts:18`).
- Change: keep dark as the identity but add `@media (forced-colors: active)` with `CanvasText`/`Highlight` borders, raise `--line` to 0.4 alpha for interactive borders (3:1), add optional haptics (Settings toggle, 10 ms on lock, 25 ms on clear, off under reduced motion), and expose swipe sensitivity (`step` 14-30 px) in Settings.
- Effort: S. Risk: none. Verify: Windows High Contrast screenshot; contrast script >= 3:1 for borders.

## Bugs found (with repro)

| ID | Sev | Repro |
| --- | --- | --- |
| STACKFALL-01 | S1 | Open `/?debug&seed=7`, press Play, in the console fill rows 0-1 around the spawn columns (`window.__stackfall.state().board[0][4]=3` and `[1][4]=3`), set `state().stash='cube'`, press C. Game state flips to `over`, no overlay, input dead. Natural trigger: stack near the top with a stashed piece whose spawn collides. |
| STACKFALL-02 | S2 | Play Marathon, hold or tap Space until you top out, keep tapping Space. About 170 ms after the card appears a new game starts. |
| STACKFALL-03a | S2 | Press Play, click the top-right Settings chip: ticks keep advancing under the dialog. |
| STACKFALL-03b | S2 | Play, press P, click Settings, press Esc: dialog stays open, game resumes behind it. |
| STACKFALL-06 | S3 | Load at 320x568: HUD time wraps ("0:00." over "4"); load at 360x640: title card opens scrolled to the bottom. |
| STACKFALL-09 | S3 | Play, press P: ambient oscillators still scheduled (10 to 20 in 8 s). Hide the tab: game pauses, audio does not. |
| STACKFALL-16 | S3 | Settings, click Rotate clockwise, press Space: Hard drop is now unbound with no warning (by code inspection). |
| STACKFALL-10 | S3 | Reach 10 lines in Marathon (level 2): only a sound plays, no visual cue; Zen rising garbage has no cue either. |

## What already works well

- Stable 60 fps (p95 16.8 ms) including the heaviest effect moment; 42 KB transferred, DCL 43 ms.
- Deterministic, DOM-free sim with a replay test; fixed 60 Hz step with a 6-step catch-up cap.
- Storage is zod-validated per field: garbage JSON, wrong types, arrays, out-of-range records and fully blocked localStorage all fell back cleanly and the game played.
- 400 rapid mixed key presses, six extreme resizes (240x240 to 2560x600) and tab hide caused no errors; the tab-hide auto-pause works.
- Input: remappable keys, DAS/ARR sliders, gamepad, full touch gestures (swipe, tap, swipe-up verified with CDP touch), touch pad buttons 50x48 px, ghost piece toggle.
- Distinct stone facets help beyond colour; palette avoids guideline colours; ambient audio is original and non-melodic; reduced motion honoured for shake, particles and banner pop; visible 3 px focus ring; text contrast is strong (muted text 7.5:1 on panels, 9.3:1 on the background; ink 13:1; accent button 11.7:1).
- Clean, small files (largest 282 lines) and a good test suite layout (`tests/`).

## What I could not check

- Real audio output: no sound device in headless Chromium, so mix balance (STACKFALL-12) is calculated from gain values, not measured or listened to.
- Heap growth and GC pauses (`performance.memory` returns nothing without flags); long-session (30+ minute) leaks; FPS on real low-end phones (headless software renderer only).
- Real-device touch feel (haptics, iOS Safari quirks, `100dvh` behaviour with the browser chrome, safe-area insets), gamepad input (no pad attached), screen-reader output (VoiceOver/NVDA).
- Human playtest data for balance (STACKFALL-19 session lengths are estimates from the rules). Marathon levels 8 to 15 were not played by a human; only simulated state edits were used to trigger clears, wins and the stash bug.
- The `?seed` param was used for most runs; unseeded randomness paths (garbage columns for Dig/Zen) were seen once each.
- `npm test` was not run (review is read-only on source; tests were not part of the assessment).
