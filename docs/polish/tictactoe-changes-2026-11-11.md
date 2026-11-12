# Tic-Tac-Toe polish changes (Phase 2-4) - 2026-11-11

Game: `/Users/sharajrewoo/DemoReposQA/arcadeShop/tictactoe`. Work list: `tictactoe-review-2026-11-11.md`. Conventions: `CONVENTIONS.md`.
Final state: `tsc --noEmit` clean, `vite build` OK, `vitest run` 12 files / 122 tests green (was 2 / 22), `npm audit` 0 vulnerabilities, Playwright smoke suite 95/95 checks with 0 console errors/warnings. Hard constraints: none apply to this game (rug/dino/crumbrun/stackfall/sudokudash rules are for other folders); no other game folder, CONVENTIONS.md or review report was touched.
Verification used `e2e/*.mjs` (headless Chromium 1280x800, 400x860 touch, 860x400 landscape touch, 320x568, light/dark and reduced motion via emulation; `npm run e2e` with `PLAYWRIGHT_PATH` + `BASE_URL`) plus vitest. Screenshots: `.../scratchpad/polish-shots/after-tictactoe-*.png`.

Counts: **24 items: 21 done, 3 partial (13, 19, 21), 0 declined.** (Corrected after verification: 06 was partial; see Follow-up fixes. Final: 21 done, 3 partial, with 06 restored to done by the follow-up.)

## Report items

| ID | Status | What changed (files) | How verified |
|---|---|---|---|
| TICTACTOE-01 board rows unequal | done | `style/board.css`: `grid-template-rows: repeat(3, minmax(0,1fr))`, `.cell{min-width:0;min-height:0;padding:0}`, `.cell svg{position:absolute;inset:12%}`. Before: marked row 139x209 vs 139x104 (desktop), 112x169 vs 112x84 (phone), 85x129 vs 85x64 (320). After: 203x203 / 112x112 / 85x85, all 9 equal. | e2e: all 9 cell rects equal +-1px with marks only in row 2 at 1280, 400, 320, 860x400 |
| TICTACTOE-02 settings wipe / no confirm | done | `main.ts` `changeSetting`/`confirmPending`/`requestNewRound`/`resetScores`, `ui/armed.ts`, `settings.ts` `RESTART_KEYS`. Same-value click is a no-op; `level` changes apply to the next CPU move with no restart; opponent/variant/first mid-game shows inline "Start a new round with this setting? [Restart][Cancel]"; Reset scores and New round/`N` mid-game are two-step (3 s / 2 s, in-page, no `window.confirm`). Chose two-step over Undo toast. | e2e: same chip keeps board, level keeps board, bar appears and Cancel keeps, Restart applies, reset needs 2nd tap and disarms after 3 s, `N` twice. Unit: `settings.test.ts` (RESTART_KEYS), `appearance.test.ts` (armed timer) |
| TICTACTOE-03 focus/ARIA | done | `ui/board.ts`: `aria-disabled` instead of `disabled`, `role="group"` board, roving tabindex + arrow keys (`ui/roving.ts`), focus moves to New round on game over (`main.ts` `celebrate`). Cells 9 tab stops -> 1. | e2e: Tab reaches board, arrows move, Enter/Space keep focus on cell, no `role=gridcell`, game-over focus on New round. Axe-core not run (no dependency) |
| TICTACTOE-04 contrast | done | `style/tokens.css`: win = panel tint + 4px inset ring `--win-ring` (#b7791f light / #ffd25a dark); X/O darkened in light theme (#d6432c / #117d75, were #e8553e / #178f86) so marks hold 3:1 on the tint; grid #9a8873 / #7a6e63; fading marks dashed at 0.8 opacity. Before: X on win 2.52 (light) / 1.24 (dark), O 2.75 / 1.47, cell vs grid 1.64. After (light/dark): X on win tile 3.91 / 4.31, ring vs cell 3.64 / 10.98, cell vs grid 3.42 / 3.18, fading marks >= 3 + dashed | `tests/contrast.test.ts` (token maths, both themes) and e2e (rendered computed colours via canvas) |
| TICTACTOE-05 touch targets | done | `style/base.css`: `.icon-btn, .btn, fieldset button {min-height:44px;min-width:44px}`, `fieldset{gap:.5rem}`, header Sound/Theme/Settings/Pause are 44px icon buttons with `aria-label`. Before: chips 34px, icon buttons 34px | e2e at 400px: every visible button/summary >= 44x44; chips >= 44 high expanded; New round/Reset gap 12px |
| TICTACTOE-06 text size/contrast | done (was partial after verification: `<kbd>` hints were 10.5px; fixed in follow-up) | all secondary text >= 14px (`0.875rem`), `--muted` #7a6d63 -> #6b5e54 (4.58 -> 5.73 on bg, 6.26 on panel); dark muted 6.45. Text size 100/125/150% setting | e2e computed-style sweep: no text under 14px at 400 and 1280; contrast test >= 5 on bg; 150% shot has no h-scroll |
| TICTACTOE-07 landscape/portrait layout | done | grid areas: one column portrait; at `(orientation:landscape) and (min-width:40rem)` board left (`min(100dvh-2rem, 62vw, 40rem)`), panel right; options are a "Game options" `<details>`, open by default only when `min(innerWidth,innerHeight) >= 700`; key hint hidden in short landscape. Before: 860x400 board cut (448px tall, scrollHeight 990). After: board 16-384 of 400, scrollHeight 509 only from the side panel; portrait 400x860 New round bottom at 627 | e2e: board fully inside viewport at 1280x800, 400x860, 320x568, 860x400; no h-scroll; New round visible within 740px on phone |
| TICTACTOE-08 win juice | done | `ui/fx.ts`, `ui/strike.ts`, `board.css`: win ring waits `drawMs+stagger` (340 ms) so the last mark finishes drawing, strike line (350 ms) through the winning cells, board shake 160 ms on CPU win, 14 confetti dots on a human win, status fades in. All skipped/static under reduced motion; none blocks input. | e2e: `.cell.win` animation-delay 0.34s, strike line present, confetti on human win, reduced motion: animation-name none, no confetti, static strike. Shake/confetti timing by code review (screens at `after-tictactoe-desktop-gameover.png`) |
| TICTACTOE-09 vanishing feedback | done | `ui/board.ts`: 150 ms `.vanishing` ghost fade-out on removal; both players' oldest marks flagged `.fading` (dashed) with a "next out" tag for the mover; 3-dot mark counter per score card (`ui/scoreboard.ts`) | e2e: 2 fading cells (X and O), one `next-out`, `.vanishing` observed and removed, 3 pips lit |
| TICTACTOE-10 move cap | done | `status.ts` `moveCounter` ("Move n / 60", warning text from 50), hint mentions the cap, 60/8 moved to `config.ts`. Exhaustive search (`balance.test.ts`) found a reachable line where the depth-8 "Unbeatable" CPU loses Vanishing, so the label is "Strong" in Vanishing (`strings.ts` `levelName`) and the description says it can be beaten | unit `status.test.ts`, `balance.test.ts` (counter-example exists), e2e label/counter |
| TICTACTOE-11 onboarding | done | first-visit dismissible banner (`ttt-seen`, also dismissed on first move), "CPU starts this round" for 1.2 s, level chips `title` + `aria-describedby` description line, game-over status "You win! Press N for another round" + focus/pulse on New round | e2e: banner on first visit and not after dismiss; game-over text and focus |
| TICTACTOE-12 colour-blind | done | vanishing cue is dashed stroke + tag + aria-label suffix ", will disappear next" / "...on its owner's next move"; Colour-blind assist setting adds X/O letters in cells, a check mark on selected chips, a pointer before the active player's label, a double outline on win tiles | e2e aria-label check; assist flag persisted/applied; `after-tictactoe-phone-dark-win.png` |
| TICTACTOE-13 options hierarchy | partial | options collapsed into "Game options" with a one-line summary; Sound/Theme/Settings/Pause are 44px icon buttons. Board + status + New round fit within 627px at 400x860 (<740). Chips use roving tabindex (1 tab stop per group, 5 stops for options), not the "<=2 tab stops" wording | e2e measurements above; screenshots phone/landscape |
| TICTACTOE-14 audio coverage | done | `audioCues.ts`: new `start`, `ui`, `deny`, `warn` cues; vanish now plays then the placement cue (+0.1 s); single `emit(name, delay)` API (`audio.ts`), UI sounds out of view code | `audio.test.ts` (oscillator count per cue, mute, volume 0, hidden tab) |
| TICTACTOE-15 mix and autoplay | done | master `GainNode` 0.5 x volume into a `DynamicsCompressor`; per-cue gain table (X square 0.12, O triangle 0.2, others 0.18, was 0.18 for all, X and O now within 4.4 dB); context created only on the first pointerdown/keydown (`installAudioUnlock`) | e2e: 0 AudioContexts when CPU opens as O before any gesture, 1 after first key; unit tests for gating. Real loudness not measurable headless |
| TICTACTOE-16 balance/streak | done | `strong` tier "Hard" (85% best move after win/block) between Medium and Unbeatable (stored key `hard` still means Unbeatable, no migration); win streak/best (`ttt-stats`, shown under the scoreboard, pulse + announcement at 3/5/10); Unbeatable described as "draws at best" in Classic. Casual-human sim, 500 seeded games per level, Classic (human wins/CPU wins/draws): easy 409/17/74 (81.8%), medium 38/173/289 (7.6%), hard-tier 8/169/323 (1.6%), unbeatable 0/174/326 | `balance.test.ts` (reproducible seed, win-rate ladder, Unbeatable 0 losses), `scores.test.ts`. Medium at 7.6% is below the report's ~45% estimate, which assumed a different human model; left unchanged to keep Classic fidelity |
| TICTACTOE-17 persistence | done | `session.ts` (`ttt-session` = round, starter, variant, move list, validated by replaying through the rules, cleared on game over), `scores.ts` read-modify-write on the latest stored scores, `storage` event refreshes scores/stats | `session.test.ts` (illegal/finished/oversized/variant mismatch rejected); e2e: reload restores board, Alternate order survives reload, two tabs merge scores |
| TICTACTOE-18 hover/ghost/last move | done | hover wrapped in `@media (hover:hover)`, 22% ghost of the current mark on hover/focus of empty cells, last-move ring | e2e: media rule present; `after-tictactoe-desktop-hover-ghost.png` |
| TICTACTOE-19 bundle | partial | `zod` -> `zod/mini` (`settings.ts`, `scores.ts`, `session.ts`, `config.ts`). JS 77.40 kB -> 50.08 kB (24.12 -> 17.53 kB gzip) while adding all new features. Target < 40 kB not met: zod core remains | `vite build` log; schema tests green |
| TICTACTOE-20 config | done | `src/config.ts` (zod-validated, deep-frozen): `cpu.delayMs/mediumBestRate/strongBestRate`, `ai.vanishDepth`, `rules.*`, `audio.*`, `fx.*`, `ui.*`, `stats.milestones`; CSS durations exported as custom properties (`ui/appearance.ts`) | `config.test.ts` pins the old literals (380, 0.5, 8, 3, 60, 220, 120, 0.18) and checks freezing |
| TICTACTOE-21 tests | partial | 12 vitest files (22 -> 122 tests): settings corruption, session, scores/streak, controller timers/pause/premove, audio, contrast, balance, vanishing counter-example, status/strings, appearance. `e2e/` Playwright suite with `npm run e2e` (95 checks). Not wired into CI and Playwright is not a project dependency (kept out per the no-new-dependency rule) | `npm test`, `npm run e2e` |
| TICTACTOE-22 CPU-turn feedback | done | board dims to 0.92 with a breathing status while the CPU thinks; one buffered premove (`controller.ts`) revalidated when the CPU finishes (dropped if the cell is taken, the game ended, or paused) | `controller.test.ts` (5 cases), e2e: premove shown, played after CPU reply |
| TICTACTOE-23 identity | done | X and O glyphs in the title (slow lean, motion-gated), 3:1 board separators, active player's score card outlined and pulsing | screenshots; contrast tests |
| TICTACTOE-24 visibility | done | auto-pause on `visibilitychange` hidden and window `blur` during a round (see Pause below); cues dropped while `document.hidden` | e2e + `controller.test.ts` + `audio.test.ts` |

## Conventions items

| Item | Status | What / where | Verified |
|---|---|---|---|
| Pause | done (turn-based adaptation) | `P`/`Esc`/44px pause button open an overlay: Resume (default focus), New round, Settings; Restart asks in-page confirmation; Esc on overlay = Resume; focus trap via `inert` + Tab loop, focus returns to opener (`ui/overlay.ts`, `ui/panels.ts`, `controller.ts` pause reasons manual/auto/settings). "Quit to title" omitted: the game has no title screen | e2e: CPU does not move while paused, resumes after, background inert, Esc resumes |
| Auto-pause | done | hidden tab and window blur while a round is in progress (including a CPU opening move) open the overlay; resume is manual | e2e blur and visibilitychange; unit tests for reasons |
| Settings opens pause | done | opening Settings pauses; closing returns to where you were; opened from Pause it stays paused | e2e |
| Settings fields | done | volume 0-100 + mute (`M`), reduce motion System/On/Off, colour-blind assist, text size 100/125/150, theme; persisted under `ttt-settings`, per-field zod validation with fallback, old saves upgrade (`settings.test.ts`); existing keys unchanged | e2e persistence and per-field fallback |
| Reduce motion | done | `data-motion` on root from setting + `prefers-reduced-motion` (`appearance.ts`); disables strokes, win pop, strike animation, confetti, shake, vanish fade, logo lean, transitions | e2e emulateMedia |
| Text size | done | root font-size 100/125/150% (rem layout) | 150% at 400px: no h-scroll |
| 44px targets, contrast, HUD >= 12px | done | see items 04-06 | e2e/vitest |
| Destructive confirmation | done | Reset scores, New round mid-game, settings restart, pause restart | e2e |
| Interpolation | n/a | turn-based, no fixed-timestep loop | - |
| Onboarding | done | `ttt-seen` one-line banner | e2e |
| Layout | done | 1280x800, 400x860, 860x400, 320x568; safe-area padding on all sides; no h-scroll at 320/360/400/860 | e2e |
| Tuning config / strings module | done | `config.ts`, `strings.ts` | tests |
| Debug-hook gating | done | `window.__ttt` only with `?debug=1` or dev (`debug.ts`); there were no hooks before | e2e: undefined without the flag |
| Files <= 300 lines, functions <= 50 | done | largest source: `main.ts` 279, `controller.ts` 163 lines | scripted scan |
| Canvas dpr | n/a | DOM/SVG game | - |

## Extra bugs found and fixed

1. `[hidden]` was overridden by `display:flex` on the new confirm bars (restart bar showed permanently); added a global `[hidden]{display:none!important}`.
2. A `position: sticky` board in the landscape grid rendered 16px too low (cropped bottom); removed sticky and instead hid the key hint in short landscape.
3. Settings sheet clipped the volume readout at 360px (grid item min-width); fixed with `min-width:0`.
4. A stale pending settings-restart could reappear in the next round; cleared whenever no round is in progress.
5. Settings chips now report the right label per variant ("Unbeatable" vs "Strong").

## Known remaining issues

- Bundle is 50.08 kB, not under 40 kB (zod core), TICTACTOE-19 partial.
- No axe-core run, no screen reader pass, real audio loudness and iOS/Android touch behaviour unverified; Firefox/Safari untested.
- Medium vs a casual (win/block, otherwise random) human wins only 7.6% in simulation; real-human tuning needs playtests.
- Vanishing "Strong" can be beaten from reachable positions (documented by a test), not improved.
- E2E suite is not in CI and needs an external Playwright install.
- Options group needs 5 tab stops, not 2.
- Confetti and shake are verified by class/DOM presence and screenshots, not by frame sampling.

## Follow-up fixes 2026-11-11

- TICTACTOE-06 (S4): verification found `<kbd>` key hints rendering at 10.5px (`0.75em` of 14px), below the 11px minimum, and the original "no text under 14px" sweep claim was wrong for kbd. Fix: `src/style/base.css` `kbd` now `font: 600 0.75rem/1.4 ui-monospace, monospace` (12px, independent of parent size, scales with the text-size setting). New test `tests/kbd.test.ts` guards a rem size >= 11px. Status: 06 was partial after verification, now done. Counts: 24 items, 21 done, 3 partial (13, 19, 21), 0 declined.
- Verified in headless Chromium at 320, 400 and 1280 wide: all 6 kbd elements compute to 12px, New round button height unchanged (45px), no horizontal scroll, 0 console errors/warnings.
- Gates: `tsc --noEmit` clean, vitest 13 files / 123 tests pass, `npm run build` OK (JS 50.08 kB), `npm audit` 0 vulnerabilities. dist/ removed, preview server stopped.
- Note: the "no text under 14px" claim is accurate only for non-kbd text; kbd and small tags (0.75rem) are 12px, within the conventions' 11px floor.
