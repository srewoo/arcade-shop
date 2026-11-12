# Tic-Tac-Toe verification, round 1 (2026-11-11)

Verdict: PASS (with one S4 regression and one false claim, below).

## Commands
- `npm run build` (tsc --noEmit + vite build): OK, JS 50.08 kB / 17.53 kB gzip (matches log).
- `npx vitest run`: 12 files, 122 tests passed.
- `npm audit`: 0 vulnerabilities.
- Hard constraint: none applies to tictactoe. Diff of `ai.ts` and `game.ts` vs backup shows rules/search unchanged; constants moved to config at the same values (380, 0.5, 8, 3, 60).
- Implementer e2e suite run 4x against :4881: 95/95 three times; once 94/95 ("resume is manual and the CPU then plays"), which is a test-logic flake (easy CPU randomly took cell 1, so the test's own `1` press was a no-op and it was the human's turn), not a game bug.
- Own adversarial Playwright runs (desktop, 400x860 touch, 860x400 touch, 320x568, 360, dark, reduced motion): 0 console errors/warnings/pageerrors.

## Diff vs backup
Changes match the log (new controller/session/scores/config/strings/ui/style modules, CSS split, e2e/, 11 new test files). Largest source file main.ts 279 lines; no file >300.

## S1/S2 items
| Item | Result |
|---|---|
| 01 equal cells | PASS: all 9 cells equal at 1280, 400, 320, 860x400 with marks in one row; board fully inside viewport |
| 02 settings wipe / confirm | PASS: same-value click no-op, level change keeps board, variant change shows confirm bar, Cancel keeps, Restart applies, Reset scores needs 2nd tap, `N` needs 2nd press |
| 03 focus/ARIA | PASS: 1 roving tab stop, Enter/Space/arrows keep focus on cells, no gridcell/row roles, game-over focus on New round |
| 04 contrast | PASS: mark on win tile >=3:1 light and dark (measured from computed colours), win ring visible in screenshot |

## Sample of S3/S4 (14 checked)
05 targets PASS (all visible buttons/summary/chips >=44 at 400, 320, 860x400, plus Settings and Pause overlays; pause button 44x44). 07 PASS (no h-scroll at 320/360/400/860; board in view; rotate mid-play keeps state). 08 PASS (strike line, win delay). 09 PASS (2 fading cells, one next-out tag, `.vanishing` class appears then clears). 10 PASS (Move 6 / 60, Unbeatable renamed Strong in Vanishing). 11 PASS (onboarding once, game-over text). 12 PASS (aria suffix). 17 PASS (reload restores board; invalid session rejected). 22 PASS (rapid keys/taps keep legal counts, state.moves consistent). 24 PASS (hidden/blur auto-pause, no auto-resume). 15/audio: covered by unit + implementer e2e. **06 FAIL (see below).**

## Conventions
Pause (P/Esc, Resume default focus, restart confirm in-page, focus trap, keys ignored while paused): PASS. Auto-pause on blur/visibilitychange incl. CPU opener, manual resume: PASS. Settings opens pause and closing returns to paused state: PASS. Quit to title omitted (no title screen): acceptable. Settings persist; corrupt/out-of-range fields fall back per field; blocked storage still plays: PASS. Reduce motion System/On/Off incl. Off overriding OS: PASS. Keyboard-only flow, visible focus ring on every tab stop, Esc returns focus to opener: PASS. 150% text no h-scroll at 400/320/860x400: PASS. Pause/blur/Esc races and 30x P spam leave consistent state: PASS.

## Findings
1. S4 regression / false claim (TICTACTOE-06): `<kbd>` key hints (1, 9, N, P, M) render at 10.5px at 1280 and 400, below the conventions' 11px absolute minimum, contradicting the log's "no text under 14px at 400 and 1280" sweep. Item 06 should be partial. Not blocking.
2. Test-suite flake noted above (e2e/state.mjs line 40 assumes the `1` press is legal).
3. Minor: at 150% text on 320x568 the board bottom is at 643 > 568 (page scrolls); acceptable.

## Counts after correction
24 items: 20 done, 4 partial (06, 13, 19, 21), 0 declined.
