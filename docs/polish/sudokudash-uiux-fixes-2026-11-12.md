# Sudoku Dash UI/UX fixes (2026-11-12)

Source: games-src/sudokudash. Build: dist/games/sudokudash. Tests: 16 files / 127 tests pass (was 118); `npm run build` passes.

## Audit issues
| # | Issue | Status | Notes |
|---|---|---|---|
| 1 | High: landscape 860x400 board clipped, toast over rows 7-9 | Fixed | Board uses `100dvh - 4px`, fits (bottom 398 of 400), page scrollHeight 400 (was 490). Rows are now fixed `repeat(9, minmax(0,1fr))`; before, row 1 was squashed to ~11px. Toast moves into the side column in landscape and no longer reserves page padding. |
| 2 | High: pencil marks 7px | Fixed / audit premise wrong | The 7px were the decorative title-hero `svg text`, not the notes. Notes were already a fixed 3x3 grid at 11-15px. Verified: 12px on phone, 15px desktop/landscape, digit n always in slot n. Hero art kept. |
| 3 | Medium: phone cells 42px, title checkboxes 24px | Fixed (landscape Partially) | Phone 400px: cells 42.2 to 44.2 (board bleeds to the screen edges). Checkboxes: labels are 44px+ tall hit areas, inputs 28px, and moved off the title into Settings under "Game options". Landscape 860x400: 43.5px (physically limited by 400px height). |
| 4 | Medium: floating -10s over notes, pale -8s | Fixed | Penalties no longer float over the grid (`floatsOnBoard`). The HUD clock delta is a pill in danger colour at 14px, held visible for 70% of its life. |
| 5 | Medium: hint highlight red | Fixed | Reason cells use the new `--hint` blue (#2358c7 light / #7db4ff dark). Yellow wash lowered 26% to 20%. Red now means error only. |
| 6 | Medium: hint cost not on label | Fixed | Dash: "Hint (-8s)"; Classic: "Hint (H)". |
| 7 | Low: header chips wrap, page 48px too tall | Fixed | One-row header of 44px icon buttons. Phone page height 860 = viewport (was 908). Numpad 5+4 stays centred. |
| 8 | Low: title looks like a form | Partially | Hero enlarged (~96px to 144px max), Play is a full-width 56px primary, checkboxes moved to Settings. Mode and difficulty cards remain. |
| 9 | Low: text chips vs icon buttons | Fixed | Pause, sound and settings are icon buttons with aria-label and title. |

Collection-wide items: board fills the viewport (landscape board is 99% of height; phone is full-bleed width); the onboarding toast is non-blocking (`pointer-events: none` except its button), never reflows, and sits off the board; standard cog icon (original SVG); results card is tiered (hero score or time, gold record badges, compact breakdown, then Play again). Opening a hint on phone and landscape swaps the digit pad for the compact hint sheet, so nothing scrolls off-screen (page height stays equal to the viewport with a hint open; before, 994/860 on phone and 445/400 landscape). Reduce motion handling is unchanged (global rule covers the new animations).

## Measurements (before to after)
- Phone cell: 42.2 to 44.2 px. Landscape cell: 42.3 (row 1 was 10.9 tall) to 43.55 px. Desktop 65.1 (unchanged).
- Header buttons: text chips (wrapped to two rows on phone) to 44x44 icon buttons, one row.
- Settings checkboxes (label hit area): 323x44 phone, 505x44 wide. Input 28px.
- Notes font: 12px phone, 15px elsewhere (the 7px was the hero svg).
- 860x400: board 396x396 at y=2..398, scrollHeight 400, no horizontal scroll at any size.
- No console or page errors across the runs.

## Files changed
index.html, src/style.css, src/game.css, src/board.css, src/overlays.css, src/fx.css, src/strings.ts, src/app/preferences.ts, src/app/gameScreen.ts, src/app/events.ts, src/ui/popups.ts, src/ui/hintPanel.ts, src/ui/endScreen.ts, new src/ui/endModel.ts.

## Tests added or changed
- New tests/endModel.test.ts (4 tests: hero, badges, classic/assisted rows, combo floor).
- tests/appearance.test.ts: hintLabel and floatsOnBoard.
- tests/layoutCss.test.ts: the coach toast no longer reserves padding and moves off the board in landscape (replaces the old padding test); hint colour is neutral; the grid has fixed rows.

## Screenshots (scratchpad/pw/shots/)
fix-sudokudash-{title,play,pencil,hint,error,settings,win}-{desk,phone,land}.png, plus the -dark variants for desk (title-desk-dark, play, pencil, hint, error, settings, win). Before: fix-sudokudash-before-{desk,phone,land}.png. Thumbnail: thumb-sudokudash.png (480x300). Scripts: fix-sudokudash-run.js, fix-sudokudash-before.js, fix-sudokudash-thumb.js.

## Caveats
- While a hint is open on phone or landscape the digit pad is hidden (keyboard digits still work; Dismiss restores it).
- The 3-mistake limit and auto-remove-notes options now live in Settings rather than on the title.
- Cells reach 44px only at viewport widths of 400px or more.
