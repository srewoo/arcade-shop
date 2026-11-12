# Tile Tumble UI/UX fixes (2026-11-12)

Source: games-src/tiletumble. Build: dist/games/tiletumble. Tests: 76 pass (63 before); `npm run build` passes.

## Audit issues
1. High, colour-only by default: FIXED. Glyphs now on by default (`DEFAULT_SETTINGS.colorAssist = true`). New field `assistChosen` records an explicit toggle; saves with colorAssist=false and no assistChosen (never touched) migrate to On; an explicit Off is kept. The title hero also shows glyphs. Not added: separate rim patterns (glyphs are the non-colour cue).
2. High, settings icon looked like a sun: FIXED. Standard 8-tooth cog plus a visible "Settings" label on the title screen (icon only in game to save width).
3. Medium, layout shift: FIXED. Hint slot is fixed height (3.6rem) hidden with visibility, so dismissing moves nothing (measured: board/actions y identical before and after the first click). Hint auto-fades after 9 s and respects Reduce motion. Status line is fixed height, single line with ellipsis.
4. Medium, generic look: FIXED. Title has a hero heap of discs drawn in SVG (gentle bob, off under Reduce motion), mode cards have colour stripes, board plate has a gradient, cell lattice, vignette and a ringed frame.
5. Medium, responsive: PARTIALLY. Board now sized by `fitBoard` (whole-pixel cell) into the leftover slot. Landscape 860x400: board 352x396, cell 44 (was about 338x380, cell 42), with the HUD in a side column. Phone 400x860: board 384x432 (was 368x414), limited by width, so some vertical slack remains around the board. Desktop 1280x800: board 680x765 beside the HUD.
6. Low-Medium, feedback: FIXED. A click on a lone disc wiggles that disc (not under Reduce motion), and the status line turns danger-coloured with text. Clearing a pair says "A pair scores 0 and uses a move".
7. Low, no end card: FIXED/VERIFIED. Stuck is detected explicitly: the status line shows "No moves left..." and the card reads "No moves left. Final score N. No two touching discs match any more, with K discs left on the board." Verified at all three viewports.
8. Low, mixed icon/text styles and wrapping legend: FIXED. Pause is a labelled pill, the key legend is shorter and hidden on touch.

## Files changed (games-src/tiletumble)
src/settings.ts, src/strings.ts, src/config.ts, src/app.ts, src/ui/{boardView,draw,palette,hud}.ts, new src/ui/{fit,hero}.ts, src/style/{base,game}.css, index.html, tests/{contrast}.test.ts, new tests/layout.test.ts.

## Tests added
fitBoard maths (landscape, portrait, cap, NaN), assist default and migration, no-moves detail text, hero data, plate-top contrast >= 3:1 against all discs.

## Checks
No horizontal scroll and no console errors at 1280x800 (DPR 2), 400x860 touch, 860x400 touch.

## Screenshots (scratchpad/pw/shots)
fix-tiletumble-{desk,phone,land}-{1title,2play,3hover,4settings,5results}.png, thumb-tiletumble.png.
