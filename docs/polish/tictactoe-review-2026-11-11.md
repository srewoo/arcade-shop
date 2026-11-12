# Tic-Tac-Toe polish assessment (Phase 1) - 2026-11-11

Game: /Users/sharajrewoo/DemoReposQA/arcadeShop/tictactoe (TS strict + Vite 7, DOM, 637 lines of source, 1 runtime dep: zod).
Method: real headless Chromium (Playwright 1.48.2), `vite preview` on :4861, desktop 1280x800, phone 400x860 touch, 320x568, landscape 860x400, dark, reduced motion, font-scale 2x, corrupted storage, rapid input, 60 FPS sampling via rAF + longtask observer. Console warnings/errors across all sessions: 0. Shots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/tictactoe-*.png` (abbreviated `SH/` below). Scripts: `.../scratchpad/pwtools/ttt-play.mjs`, `ttt-2.mjs`, `ttt-3.mjs`, `ttt-4.mjs`.
Lens translation: library checks for UX, accessibility, balance, QA, audio, art were mapped to DOM/CSS/WebAudio equivalents (e.g. "gamepad support" dropped, "colourblind mode" -> shape + contrast check, "localisation" -> noted only).

## Scorecard (1-5)

| Area | Score | Reason |
|---|---|---|
| UI | 3 | Clean warm palette and clear hierarchy, but the board rows distort once marks are placed (TICTACTOE-01) and settings chips are small |
| UX | 3 | Zero-friction start, but settings clicks silently wipe the game, no confirm on Reset, no result call-to-action |
| Gameplay | 3 | Rules and AI are correct and tested; Unbeatable Classic cannot be won so replay hooks are thin; Vanishing has no move-cap feedback |
| Graphics | 3 | Cohesive coral/teal identity with a nice stroke-draw; no vanish animation, hover preview, last-move marker or win line; dark win tile fails contrast |
| Audio | 3 | Every placement/result has a synth cue, no files, respects mute; nothing for new round/vanish warning, no gain staging, autoplay edge case |
| Accessibility | 2 | Good: shapes differ, focus ring, reduced motion honoured. Bad: focus lost after every move, invalid grid ARIA, 34px targets, win-tile contrast 1.24-2.75 |
| Performance | 5 | 60.0 FPS avg, p99 frame 16.8 ms, 0 long tasks, CPU reply 383-387 ms on Unbeatable+Vanishing (380 ms is the deliberate delay) |
| Robustness | 4 | Corrupt storage falls back cleanly, no console errors, no h-scroll at 320/400/860; landscape clipping, silent no-op input during CPU turn, no state restore |

## If you only do three

1. **TICTACTOE-01** (S2) Fix the board grid so rows/columns stay equal once marks appear (`grid-template-rows: repeat(3, minmax(0,1fr))`); today a row holding a mark renders 2x taller than empty rows on every viewport.
2. **TICTACTOE-02** (S2) Stop settings clicks from silently wiping the game in progress (and no-op clicks on the already-selected option), and add undo/confirm for Reset scores.
3. **TICTACTOE-03** (S2) Keyboard/touch accessibility pass: keep focus after a move (use `aria-disabled`, not `disabled`), fix `role=grid`, raise chips/icon buttons to 44px, fix win-tile contrast in both themes.

## Prioritised list

Severity: S1 broken, S2 significant defect/polish blocker, S3 clear improvement, S4 nice-to-have. Effort S <1h, M half-day, L multi-day.

### S2

**TICTACTOE-01 | UI/Layout | S2**
- Evidence: `SH/tictactoe-phone-dark-win.png`, `SH/tictactoe-phone-midgame.png`, `SH/tictactoe-desktop-gameover.png` (winning column wider than its neighbours). Measured with marks only in row 2: desktop cells 139x104 (empty) vs 139x209 (marked); phone 112x84 vs 112x169; 320px 85x64 vs 85x129 (ttt-3.mjs). Reproducible at every width and after animations finish. `style.css:90` (`grid-template-columns: repeat(3, 1fr)`, no rows template), `:100` `.cell` padding 12%, `:111` `.cell svg {width:100%;height:100%}`.
- Change: `.board{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr))}`, `.cell{min-width:0;min-height:0;position:relative;padding:0}`, `.cell svg{position:absolute;inset:12%;width:76%;height:76%}`.
- Effort: S. Risk: none to rules; re-check the win `pop` scale still looks right.
- Verify: Playwright asserts all 9 `.cell` rects equal (+-1px) after placing marks in only one row, at 1280, 400, 320; screenshot diff.

**TICTACTOE-02 | UX/Flow | S2**
- Evidence: `main.ts:86-99`: every option click calls `updateSettings(..., true)` -> `newRound(false)`. Measured: after one move, clicking Level "Unbeatable" turns `O...X....` into `.........`; clicking the already-selected "Classic" also wipes (ttt-4.mjs). `main.ts:116` `N` also abandons an unfinished game with no warning. Reset scores wipes `{"X":5,"O":2,"draw":1}` -> zeros on one click, 8px from "New round" (ttt-2.mjs).
- Change: (a) return early if `patch[key] === settings[key]`; (b) restart only for opponent/variant/first changes, apply `level` change to the next CPU move without restarting; (c) if a game has >=1 move and is not over and a restarting setting changes, show an inline "Start a new round with this setting? [Restart] [Cancel]" bar; (d) Reset scores becomes two-step (button turns into "Tap again to confirm" for 3 s) or shows an Undo toast for 5 s; (e) `N` mid-game needs a second press within 2 s.
- Effort: M. Risk: none for Classic fidelity.
- Verify: unit test `updateSettings` no-op; Playwright: move, click same chip, board unchanged; click Reset then Undo restores scores.

**TICTACTOE-03 | Accessibility/Keyboard | S2**
- Evidence: after Enter on a focused cell `document.activeElement` is `BODY` (ttt-2.mjs) and also after game over; `view.ts:44` sets `btn.disabled` on every placed cell and on all cells during the CPU turn, so the browser drops focus. `view.ts:23` + `index.html` use `role="grid"`/`gridcell` with 0 `role=row` elements (invalid ARIA, screen readers may mis-announce). 9 tab stops for the board (tab order measured: 2 header buttons, 9 cells, 2 actions, then options).
- Change: replace `disabled` with `aria-disabled="true"` (ignore activation in `humanMove`, already guarded) so focus survives; wrap cells in three `role="row"` divs or drop the grid role and use `role="group" aria-label="Board"`; roving tabindex with arrow-key navigation (1 tab stop, arrows move, Enter/Space place); after game over move focus to "New round".
- Effort: M. Risk: keep `1`-`9` shortcuts working; do not announce on every focus move.
- Verify: Playwright keyboard-only game: Tab, arrows, Enter x5, focus stays inside board; axe-core run shows 0 ARIA violations.

**TICTACTOE-04 | Accessibility/Contrast | S2**
- Evidence: `style.css:12` `--win:#ffd25a`: X mark 2.52:1, O mark 2.75:1; dark `--win:#b8891c` (`:20`,`:27`): X 1.24:1, O 1.47:1, light ink 2.68:1 (all below WCAG 1.4.11 3:1 for graphics). Faded vanishing mark (`.cell.fading` `:123`, opacity .38) measures ~1.7:1 against the cell. Cell edge vs grid 1.64:1.
- Change: win state = keep `--panel` background, add a 4px inset ring `box-shadow: inset 0 0 0 4px var(--win-ring)` plus a light tint (`color-mix(in srgb, var(--win-ring) 18%, var(--panel))`); `--win-ring` #b7791f light / #ffd25a dark. Marks then stay at their native 3.6-7.3:1. For fading marks use opacity .6 plus a dashed stroke (see TICTACTOE-12).
- Effort: S. Risk: the identity yellow should remain visible; use ring colour as the brand yellow.
- Verify: contrast script on rendered colours >=3:1 in light and dark for win and fading states; screenshot review.

### S3

**TICTACTOE-05 | Accessibility/Touch | S3**
- Evidence: measured heights: option chips 34px (`fieldset button`, `style.css:53`, 13.6px text), icon buttons 34px, gaps ~5.6px; cells 112px and primary buttons 45px are fine. WCAG 2.2 min 24px passes, project target 44px fails.
- Change: `.icon-btn, fieldset button{min-height:44px;padding:0.5rem 1rem}`, `fieldset{gap:0.5rem}`; options area grows ~100px on phone, so also see TICTACTOE-13.
- Effort: S. Verify: Playwright `boundingBox().height >= 44` for every `button` at 400px; no horizontal scroll.

**TICTACTOE-06 | Accessibility/Text | S3**
- Evidence: hint and score labels are 12.8px (`style.css:85,146`), chips 13.6px, legend 13.6px; muted text #7a6d63 on #fbf4e8 is 4.58:1 (passes by 0.08, fails if the bg shifts). Layout survives 2x root font size (no h-scroll at 400px; `SH/tictactoe-phone-bigtext.png`).
- Change: minimum 14px for all secondary text (`font-size:max(0.875rem,14px)`), darken `--muted` to #6b5e54 (>=5.6:1 on bg).
- Effort: S. Verify: computed-style sweep: no text <14px; contrast >=4.5 (>=5 on bg).

**TICTACTOE-07 | UI/Responsive | S3**
- Evidence: landscape phone 860x400: board is 448px tall in a 400px viewport, page scrollHeight 990, status and half the board cut off (`SH/tictactoe-phone-landscape.png`, `.board` `max-width:30rem` only). Portrait 400x860: documentElement height 927 > 860, hint falls below the fold.
- Change: `.board{width:min(100%, 30rem, 62dvh)}` and for `(orientation:landscape) and (max-height:500px)` switch `.app` to two columns (board left, scores/status/options right). Collapse options behind a "Game options" `<details>` on phones (<=480px) once a round has started.
- Effort: M. Verify: screenshots at 860x400, 400x860, 320x568: board fully visible, no h-scroll.

**TICTACTOE-08 | Graphics/Juice | S3**
- Evidence: `style.css:124` win = flat background swap + `pop` scale 1.06; no line through the three marks, no particles/confetti, no loss/draw treatment. Win highlight starts while the last mark is still drawing: in `SH/tictactoe-desktop-gameover.png` the winning O is a half-drawn ring on yellow. Draw animation is 0.22s with a 0.12s delay on the second X stroke (`:119-120`).
- Change: delay `.cell.win` styling by `--draw-ms` (~0.3s, via `animation-delay`), then animate an SVG strike line across the winning cells (stroke-dashoffset, 0.35s); winning marks pulse once; add 12-16 CSS confetti dots on a human win only (skipped for reduced motion); on CPU win shake the board 2px for 160ms (skipped for reduced motion); status line fades in.
- Effort: M. Risk: all new motion gated by `prefers-reduced-motion`; keep it under 600ms so `N` is not blocked (input is not locked during the effect).
- Verify: Playwright with reducedMotion shows no animation names; frame sampler shows no >20ms frames.

**TICTACTOE-09 | Graphics/Vanishing feedback | S3**
- Evidence: marks vanish by `innerHTML=''` instantly (`view.ts:34-37`); only the mover's oldest mark is faded and only on their turn (measured fade mask `-f-------`: one cell). The opponent's next vanish is invisible, which is exactly what a Vanishing player needs to plan around.
- Change: on vanish, play a 150ms fade/shrink of the removed mark (clone to an overlay or add `.vanishing` class before clearing, then clear on `animationend`); show both players' oldest marks as "about to go" with a dashed outline and, for the player to move, a small "next out" tag; add a 3-dot mark counter per scoreboard card.
- Effort: M. Risk: sim unchanged (view only). Verify: Playwright captures the `.vanishing` class for 150ms and two `.fading` cells with 3 marks each.

**TICTACTOE-10 | Gameplay/Vanishing | S3**
- Evidence: draw after 60 moves (`game.ts:25`) with only the text "Draw: move limit reached." appearing at the end; players are never told a cap exists (`index.html` hint). Unbeatable in Vanishing is depth-limited to 8 plies (`ai.ts:9`) - not provably unbeatable, the label says "Unbeatable".
- Change: show "Move 12 / 60" in the status or scoreboard when variant is Vanishing, warn at 50; mention the cap in the vanish hint; rename Vanishing + hard to "Strong" in the UI or prove it with an exhaustive test over positions (see TICTACTOE-21); move 60 and 8 into the config module (TICTACTOE-20).
- Effort: S-M. Risk: sim determinism: only text changes unless the cap value changes. Verify: unit test for the counter text; exhaustive test as noted.

**TICTACTOE-11 | UX/Onboarding | S3**
- Evidence: first 30 s: title screen `SH/tictactoe-desktop-title.png` is clear (turn prompt, board), but nothing says "you are X, get three in a row", what Medium/Unbeatable mean, or who starts when "Alternate" (CPU can start round 2; status just flips to "CPU is thinking..." as a surprise). Result screens have no call to action; focus is on `BODY`.
- Change: first-visit dismissible one-line banner "Get 3 in a row. You are X." (stored in `ttt-seen`, try/catch); round-start status "CPU starts this round" for 1.2s; tooltips/`title` plus `aria-describedby` under CPU level ("Easy: random, Medium: blocks and wins, Unbeatable: never loses Classic"); on game over change the status to "You win! Press N for another round" and focus + pulse "New round".
- Effort: S-M. Verify: Playwright first-visit shows banner, second visit does not; game over focuses "New round".

**TICTACTOE-12 | Accessibility/Colour | S3**
- Evidence: X coral vs O teal under a deuteranopia simulation = 4.51:1 contrast (fine) and X/O shapes differ, so colour-blind play is safe. The only colour-only cue is the faded "next to vanish" (opacity) and the score card colours.
- Change: keep as is for X/O; make vanishing cue non-colour/opacity (dashed stroke via `stroke-dasharray:6 8`, see TICTACTOE-09); add `aria-label` suffix ", will disappear next" to the faded cell (currently the label does not mention it, `view.ts:30,45`).
- Effort: S. Verify: aria-label contains the suffix for the fading cell; screenshot in grayscale filter.

**TICTACTOE-13 | UI/Hierarchy | S3**
- Evidence: options occupy 4 rows (~330px) of the ~860px phone screen at the same visual weight as the board actions; `Sound`/`Theme` labels are text chips ("Theme: system") of 127px; opponent/level/variant/first-move all visible at all times.
- Change: collapse to a "Game options" disclosure with a one-line summary ("vs CPU - Medium - Classic") that opens inline on phones; make Sound/Theme 44px icon buttons with `aria-label`.
- Effort: M. Risk: keep every option reachable by keyboard in <=2 Tab stops. Verify: phone screenshot shows board + status + New round without scrolling at 400x740.

**TICTACTOE-14 | Audio/Coverage | S3**
- Evidence: `audio.ts` has 6 cues (x, o, vanish, win, lose, draw). Measured via an oscillator counter: Theme click 0 oscillators, New round 0 oscillators. Nothing for invalid tap (cell taken / CPU turn), new round, setting change, Reset, CPU "thinking" start, or the vanishing warning. Vanish replaces (not adds to) the placement sound, so the 4th mark has no "place" click (`main.ts:44-48`).
- Change: add `start` (soft rising blip on new round), `ui` (short 1ms-click tick for chip toggles), `deny` (low 90Hz thud for rejected input), and play `vanish` followed by the placement cue; sound events go through a single `emit(event)` function (keeps UI sounds out of view code).
- Effort: M. Risk: keep default volume low; mute persisted. Verify: oscillator counter unit test per event; manual mix check.

**TICTACTOE-15 | Audio/Mix & autoplay | S3**
- Evidence: `audio.ts:36-39`: X uses a `square` wave and O a `triangle` at the same 0.18 gain (square is perceptibly louder); no master gain/limiter, each note builds its own gain to destination; win/lose jingles reuse 0.18 so overlapping rapid cues add. `AudioContext` is created lazily on the first `playSfx`; with First move = O (or alternate on round 2+) the CPU's first move runs from a timer with no user gesture (`main.ts:68-70,119`), so Chrome starts it suspended (console autoplay warning) and the first cue is lost. Not reproduced here (default starter is X), code evidence only.
- Change: one master `GainNode` at 0.5 with a `DynamicsCompressor`; per-cue gain table (X 0.12 square, O 0.2 triangle); create the context on the first `pointerdown`/`keydown` listener instead of first cue and skip cues while `state==='suspended'`.
- Effort: S. Verify: unit test that no AudioContext is created before a gesture; level meter via OfflineAudioContext shows X/O within 2 dB.

**TICTACTOE-16 | Gameplay/Balance | S3**
- Evidence: Classic Unbeatable can never be beaten (README test proves it never loses), Medium: wins/blocks always then 50% best/50% random (`ai.ts:68`). A human who opens a corner against Medium can fork it half the time; Easy is uniform random. No streak, win-rate or best-streak tracking: the scoreboard (`ttt-scores`) is the only replay hook; sessions are 5-30s.
- Change: add a "Hard" tier between Medium and Unbeatable in the config module (e.g. `mistakeRate` 0.15) instead of 3 hard-coded levels, and a streak/best-streak stat (`ttt-stats`) shown under the scoreboard with a celebratory pulse at 3, 5, 10; label Unbeatable "Unbeatable (draws at best)" in Classic.
- Effort: M. Risk: Classic fidelity untouched (new levels only add options); keep the exhaustive no-loss test for Unbeatable. Verify: simulated 1000-game batches per level with fixed seeds, win/draw rate tables within targets (Easy human-win ~85%, Medium ~45%).

**TICTACTOE-17 | Robustness/Persistence | S3**
- Evidence: `round` is an in-memory counter (`main.ts:15`), so after reload "Alternate" always restarts at X and the game in progress is lost; scoreboard persists. Opening the game in two tabs lets each overwrite the other's scores (no `storage` event listener).
- Change: persist `{round, state}` in `ttt-session` (validated by zod, cleared on game over), listen to `storage` events to refresh scores, and write scores with a read-modify-write on the latest stored value.
- Effort: M. Risk: stored states must be validated (zod strict) and rejected if a board is illegal. Verify: Playwright: play 2 moves, reload, board restored; two contexts' scores merge.

### S4

**TICTACTOE-18 | UI/Touch hover | S4**
- Evidence: `style.css:109` hover rule is not wrapped in `@media (hover:hover)`, so on touch the tapped/last-hovered cell keeps a hover tint; no pre-move ghost mark on desktop.
- Change: wrap hover in `@media (hover:hover)` and show a 20%-opacity ghost of the current player's mark on hover/focus of an empty cell; add a last-move ring on the most recent mark.
- Effort: S. Verify: touch emulation screenshot shows no stuck tint.

**TICTACTOE-19 | Performance/Bundle | S4**
- Evidence: build output: `index-*.js` 77.40 kB (24.12 kB gzip) for 637 lines of game, nearly all zod (`vite build` log; Rollup annotation warning from `zod/v4/core/util.js`). 0 long tasks and 60 FPS so this is not a perf blocker.
- Change: import `zod/mini` (or a tree-shaken subset) for the six-field schema; keep zod per the engineering standard.
- Effort: S. Risk: schema semantics identical (`strict`). Verify: build size < 40 kB, schema tests still green.

**TICTACTOE-20 | Code quality/Config | S4**
- Evidence: hard-coded tuning scattered: `main.ts:12` CPU_DELAY_MS 380, `ai.ts:9` VANISH_DEPTH 8, `ai.ts:68` 0.5 mix, `ai.ts:10` PREFERENCE, `game.ts:23-25` VANISH_LIMIT 3 and VANISH_MOVE_CAP 60, `audio.ts:9-14,39` note tables and 0.18 gain, `style.css:119-124` animation durations. No file >300 lines (largest `style.css` 147, `main.ts` 120), no function >50 lines. Gameplay rule from the library: tuning must live in data/config.
- Change: add `src/config.ts` (zod-validated, frozen) exporting `cpu.delayMs`, `cpu.mediumBestRate`, `ai.vanishDepth`, `rules.vanishLimit`, `rules.vanishMoveCap`, `audio.masterGain`, `fx.*Ms`; read CSS durations from CSS custom properties set from config. Tests import the same config so defaults stay in lockstep.
- Effort: M. Risk: default values must equal today's (snapshot test) so sim behaviour is unchanged. Verify: unit test comparing config to the previous literals; all tests green.

**TICTACTOE-21 | QA/Test coverage | S4**
- Evidence: `tests/ai.test.ts` + `game.test.ts` cover rules and AI; there are no UI/DOM tests, no tests for `settings.ts` corruption paths, `status.ts`, or the Vanishing "hard" claim. All verification of layout above had to be manual.
- Change: add Playwright smoke suite (equal cell sizes, focus retention, touch target heights, contrast tokens), vitest cases for `parseSettings` partial/invalid, and an exhaustive search proving Unbeatable never loses Vanishing within 60 moves or documenting the exceptions.
- Effort: M. Verify: `npm test` and `npm run e2e` in CI.

**TICTACTOE-22 | UX/Input feedback | S4**
- Evidence: while the CPU thinks (380ms) keys/taps are dropped silently (ttt-play.mjs: pressing `9` and `3` right after `5` did nothing; second tap in `touchscreen.tap` pair ignored). All 9 cells are `disabled` during the CPU turn but look identical (`view.ts:44`).
- Change: dim the board slightly (opacity .92 + "CPU is thinking" dots animation) during CPU turns, and buffer one premove (apply it when the CPU finishes if legal).
- Effort: S-M. Risk: premove must be re-validated against the current state to avoid illegal moves. Verify: Playwright double-press yields two X marks if legal.

**TICTACTOE-23 | Graphics/Identity | S4**
- Evidence: identity is only a text logo "Tic·Tac·Toe" (`index.html` h1), no wordmark mark, no empty-state personality, board has no grid-line style (cells vs grid contrast 1.64:1).
- Change: use the favicon's X/O glyphs in the title, thicken board separators to a 3-colour "chalk" style at 3:1, add a subtle idle animation (X and O lean) and a "your turn" pulse on the score card of the player to move.
- Effort: M. Verify: art review against the existing palette; no new colours outside tokens.

**TICTACTOE-24 | Robustness/Visibility | S4**
- Evidence: no `visibilitychange` handling: the CPU timer keeps running in a background tab (browser throttles to >=1s), then plays a cue when the tab is hidden; no pause concept (turn-based, so acceptable).
- Change: on `visibilitychange` hidden clear `cpuTimer`; on visible reschedule. Skip cues while `document.hidden`.
- Effort: S. Verify: Playwright emulate hidden/visible, no cue while hidden.

## Bugs found (repro)

1. **Board rows/columns unequal after marks (TICTACTOE-01).** Load page, choose 2 Players, press `5`, then `6`. Row 2 cells measure 209px tall vs 104px for rows 1 and 3 (desktop). Visible in `SH/tictactoe-phone-dark-win.png`.
2. **Settings click wipes the game, including no-op clicks (TICTACTOE-02).** Press `5` vs CPU (board `O...X....`), then click "Unbeatable" or the already-selected "Classic": board resets to empty.
3. **Focus lost after every move (TICTACTOE-03).** Focus cell 1 with Tab, press Enter: `document.activeElement` is `BODY`.
4. **Win highlight begins while the last mark is drawing (TICTACTOE-08).** Finish a game vs CPU: last winning mark shows half-drawn on the yellow tile (`SH/tictactoe-desktop-gameover.png`).
5. **Reset scores has no confirmation (TICTACTOE-02).** Set scores to 5/2/1, click Reset scores: zeros immediately, persisted.
6. **Autoplay edge (TICTACTOE-15, code-evidence only).** Choose "First move: O" and reload with sound on: the CPU's first move cue is likely suppressed by the autoplay policy.

## What already works well

- Rules, AI and persistence logic are pure, small and tested (exhaustive Unbeatable-never-loses test); zod validation of stored data worked: corrupted `ttt-settings`/`ttt-scores` fell back to defaults ("Your move", score 0) with no errors.
- 60.0 FPS, p99 frame 16.8 ms, 0 long tasks, 0 console errors in every session; CPU replies in 383-387 ms on Unbeatable+Vanishing.
- Shapes (X cross, O ring) differ so colour-blind play is safe; reduced motion disables strokes and win pop (`animation-name: none` verified); dark theme and `system/light/dark` toggle work; keys `1`-`9`/`N` work; no horizontal scroll at 320, 400, 860 px or 2x text.
- Warm cohesive palette, clear status line with `role=status`, synthesised audio with mute persisted.

## What I could not check

- Real audio output (headless, no sound device): only counted oscillators per action; mix/loudness is by code reading.
- Real iOS/Android touch behaviour, safe-area insets, dynamic type and haptics; only Chromium touch emulation.
- Screen reader behaviour (VoiceOver/NVDA) - ARIA findings are from DOM inspection only.
- Whether Vanishing + Unbeatable can ever lose (depth-8 search); no exhaustive proof run.
- Firefox/Safari rendering of `color-mix`, `aspect-ratio` rows (TICTACTOE-01 repro is Chromium only).
- Multi-tab storage collisions (reasoned from code, not run) and the First-move-O autoplay warning.
