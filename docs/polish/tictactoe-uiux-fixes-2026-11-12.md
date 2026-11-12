# Tic-Tac-Toe UI/UX fixes (2026-11-12)

Source: `games-src/tictactoe`. Build: `dist/games/tictactoe`. Tests: 13 files, 130 tests pass. `npm run build` passes. No console errors, no horizontal scroll, and no vertical overflow at 1280x800, 400x860 or 860x400.

## Audit issues
| # | Issue | Status | Before -> after |
|---|---|---|---|
| 1 | Win flash saturated red | Fixed | The winning cells were animating `background` from the panel colour with `backwards` fill, and the capture showed pure red. The background keyframe is removed. Cells now get an explicit gold `--win-fill` (#f7e3a1 light, #5b4a17 dark) with a gold ring, via a delayed transition. The strike line is kept, so the win is not colour-only. Colour-blind assist still adds a double outline. |
| 2 | Game options outweighs the board on desktop | Fixed | Options collapse once the first round finishes. They start open only before any round has been played (stored totals are 0) and on screens at least 700px on the short side. Chips are tighter and the legend is narrower, so the four CPU levels sit on one row. |
| 3 | No visual identity | Fixed | Title is 1.45rem, up from 1.3rem, at weight 800 with larger X/O glyphs. Board cap raised from 640px to 736px (46rem) on desktop. Board has an inset edge and rounder frame. Hover/focus ghost mark opacity raised from .22 to .38. |
| 4 | No result banner | Fixed | New `#result` card over the board appears after the strike line has drawn. It has a title, a one-line sub, Next round and View board. The tone tints it: gold for a win, neutral for a draw or loss. Shown at once under Reduce motion. The status line still announces the result to screen readers. |
| 5 | Landscape 9px overflow | Fixed | Tighter padding and gap at max-height 32rem. Measured overflow is 0 at 860x400 and 1280x800. |
| 6 | Spurious "Paused in background" | Partially | No wrong firing reproduced. A synthetic blur while the page had focus did not pause. Opening Settings does not open Pause. Hardened anyway: blur is re-checked after a tick and pauses only if `document.hidden` or `!document.hasFocus()` (pure `shouldAutoPause`, tested). Not testable here: a real tab losing focus to the extension chrome. |
| 7 | "Strong" vs "Unbeatable" | Fixed | The top level is "Expert" everywhere. Descriptions still say Classic cannot be beaten and Vanishing can. Stored key `hard` is unchanged. |
| 8 | Onboarding repeats "Your move" | Fixed | CPU hint is now "Get 3 in a row to win. Tap any square." |

## Collection-wide items
- **Settings icon:** replaced the sun with a real cog. Fixed.
- **Results moment before any card:** the strike line plays first, then the banner. Fixed.
- **Board fills viewport:** the board now takes 100dvh minus 2.6rem, up to 736px. Fixed.

## Files changed
- Source: `index.html`, `README.md`, `src/strings.ts`, `src/status.ts`, `src/config.ts`, `src/main.ts` (294 lines), `src/ui/chips.ts`, `src/ui/result.ts` (new), `src/style/{tokens,base,board,panels}.css`.
- Tests: `tests/status.test.ts`, `tests/contrast.test.ts`, `tests/balance.test.ts` (title only).
- E2E script: `e2e/flow.mjs` (label check now expects Expert).

## Tests added
- `resultBanner`: null mid-round; win, loss and draw tones; two-player win.
- `shouldOpenOptions`: open only before the first round and on large screens.
- `shouldAutoPause`: pauses only when hidden or unfocused.
- Contrast: win fill is gold, marks stay at least 3:1 on it, ink at least 4.5:1, in light and dark.
- Existing level-label test updated to the Expert name.

## Screenshots (`shots/`)
`fix-tictactoe-{1start,2hover,3win,4draw}-{desk,phone,land}.png`, `fix-tictactoe-5settings-{desk,phone,land}.png`, `fix-tictactoe-{1start,2hover,3win,4draw}-desk-dark.png`, `thumb-tictactoe.png` (480x300).
Desktop shots are at DPR 2. Phone and landscape shots are touch viewports, also at DPR 2.

## Caveats
- Win and draw shots use 2-player mode for determinism. A CPU "You win!" banner was not captured, but it uses the same code path.
- The e2e suite was not re-run.
