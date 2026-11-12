# Pounce Pins UI/UX fixes (2026-11-12)

Status: 9 of 9 audit issues fixed (item 7 partly), plus the collection-wide items that apply. `npm test` 95/95 pass (13 new), `npm run build` passes, `npm audit` 0. No console errors, no horizontal scroll.

## Audit issue -> status
| # | Issue | Status | Change |
|---|---|---|---|
| 1 | Landscape lane 43% of viewport | Fixed | Scoreboard moved into the header row as a thin strip (frame number shares a line with the marks, logo visually hidden, buttons share the row). Chip, hint, curve read-out and banner are overlays on the lane. Lane (scene-wrap) share: 860x400 43% -> 71.1%, 400x860 -> 70.7%, 1280x800 -> 70.0%. |
| 2 | "NAP AS A TEAM" poster overflow | Fixed | Text is now "NAP TEAM", fitted to the card width (`render/fit.ts`, `fitFontPx`, tested); poster shifted right so the chip does not cover it. |
| 3 | No visible score feedback at impact | Fixed | Live "N down" badge on the lane while rolling; provisional mark (italic, dashed outline, not colour-only) in the frame cell; on result a "+N" flies from the banner into the frame cell, which then flashes (static highlight under Reduce motion). Pure logic in `provisional.ts`. |
| 4 | Huge centre banner | Fixed | Smaller pill (1-1.6rem) near the top of the lane (bottom in portrait), 300 ms fade/pop, off the rack. |
| 5 | "How to play" has no affordance | Fixed | Styled as a full-width pill button with a chevron that rotates when open. |
| 6 | Title has no cats | Fixed | Cat pyramid hero drawn with the in-game cat sprite (`render/titleArt.ts`); landscape phone title becomes two columns (also fixes the clipped top). |
| 7 | Focus ring at edge / long thumb reach | Fixed | `.controls` has 4px inline padding; layout is now curve-left, Throw, curve-right in one row (thumb zone), power meter above (phone) or beside (wide). |
| 8 | Sun-like settings icon | Fixed | Standard 8-tooth cog. |
| 9 | No best line / fish hint on results | Fixed | "Best N" (or "Best N (was M)" on a new record), and a one-line fish tip when no fish were caught. |
| - | 4.42:1 12px label in dark mode | Fixed | Current-frame number uses `--ink` (CSS test asserts the rule and that muted would fail). |

Collection-wide: settings cog (done); non-blocking hint (overlay on the lane, pointer-events only on "Got it", auto-fades after 14 s, no reflow); results payoff then tiered card (confetti and last banner play for 0.9 s, instant under Reduce motion; card tiers: outcome, score, best, details, primary Play again).

## Files
Changed: `index.html`, `src/{flow,events,loop,main,strings}.ts`, `src/ui/{board,controls,dom}.ts`, `src/render/{backdrop,render}.ts`, `src/style/{base,play,tokens untouched}.css`, `tests/contrast.test.ts`.
New: `src/provisional.ts`, `src/render/fit.ts`, `src/render/titleArt.ts`, `src/ui/fly.ts`, `src/style/board.css`, `src/style/title.css`, `tests/provisional.test.ts`.
Physics, scoring, localStorage keys and `window.__pp` hooks untouched. Build output: `dist/games/pouncepins`.

## Tests added
`tests/provisional.test.ts` (provisional marks incl. strike, spare, tenth frame, invalid input; frame index; font fit) and two scoreboard CSS/contrast tests in `tests/contrast.test.ts`.

## Screenshots (`scratchpad/pw/shots/`)
`fix-pouncepins-{desk,desk-dark,phone,land,land-dark}-1title.png`, `-2play-hint.png`; light only: `-3throw`, `-4impact`, `-5fly`, `-6after`, `-7pause`, `-8settings`, `-9over-payoff`, `-9over-card`. Thumbnail: `thumb-pouncepins.png`.

## Notes
Phone and landscape tested with touch contexts. Container queries for aspect ratio did not match in Chromium 141, so the lane sets `data-portrait` from the camera instead.
