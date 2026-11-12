# Crumb Run UI/UX fixes (2026-11-12)

Tests: 16 files / 177 tests pass (was 169; +8 in `tests/layoutMode.test.ts`, `tests/hud.test.ts`). `npm run build` passes. Built into `dist/games/crumbrun`. No console errors, no horizontal scroll at 1280x800, 400x860 and 860x400.

## Audit issues
| # | Sev | Issue | Status |
|---|-----|-------|--------|
| 1 | High | Board tiny on desktop / landscape | **Partially fixed.** HUD moved out of the canvas into the DOM (side gutters on wide screens, bar above on portrait). The outer wall rows (pure scenery, asserted wall-only in a test) are cropped from the render (`BOARD_CROP`), so the board fills the full height. MAX_SCALE raised 4 to 5 so desktop is no longer capped. Simulation untouched. Desktop 40% to 59.9%; landscape 35% to 43.2%. The 65-70% target is not reachable without changing the maze (board is ~square, 21 cols x ~21.2 rows, in a 16:10 window). Landscape: d-pad left under the HUD, tools right, desktop gutters hold HUD, tools and a key legend. |
| 2 | High | Two inputs to start, no START prompt, demo HUD confusing | **Fixed.** Title has real START and How to play buttons (Enter/Space/tap on board also start). The first-run how-to modal gate is gone; Settings still has How to play. First run shows a one-line non-blocking coach mark (pointer-events none, dismissed on first steer or after 9 s, persists `seen`). On title the live stats are hidden, only HI shows (no more "DEMO / SCORE ticking"). |
| 3 | Med | Phone dead gaps | **Partially fixed.** Board is width-limited at 400 px (21 cols), so it cannot grow; HUD is now a large DOM bar on top, board directly under it, d-pad enlarged (84 px buttons) and centred in the remaining area. ~110 px of spare space still sits above and below the pad. |
| 4 | Med | HUD touches top edge; dead "SOUND [M]" | **Fixed.** HUD has padding and 20-26 px values; "SOUND [M]" removed (mute button remains). |
| 5 | Med | Crumbs low emphasis; cat badges off | **Fixed.** Crumb radius 1.9 to 2.5 (+30%) with a soft halo; colour-blind assist (cat letter badges) defaults on for new players (stored values keep working). |
| 6 | Med | "System" clipped; toggles not switch-like | **Fixed.** Label is "Auto"; toggles now draw a track and knob beside On/Off. Dialog still has 8 rows (not restructured). |
| 7 | Low | p then o left pause open | **Not reproducible.** Scripted: pause, `o` opens Settings from pause, Esc, Esc returns to play (paused false, no modal). |
| 8 | Low | Button style differs from other games | **Not fixed** (intentional: part of this game's dark theme). |
| 9 | - | Game over unverified | **Verified.** Reached via debug `killPip` loop at all three viewports; hierarchy is sound (New high score badge, stats, top 5, Play again primary). |

## Files changed (all in games-src/crumbrun)
`src/layout.ts` (boardSize, crop, layoutMode, boardShare, MAX_SCALE), `src/render.ts`, `src/overlays.ts` (title anchored to cropped canvas), `src/hud.ts` (now pure model), new `src/ui/hudView.ts`, `src/ui/coach.ts`, `src/ui/controller.ts` (how-to opens from title, start gate removed), `src/main.ts`, `src/input.ts`, `src/strings.ts`, `src/storage.ts` (assist default), `src/spriteItems.ts`, `src/style.css`, new `src/dialogs.css` (split to keep files under 300 lines), `index.html`, `tests/ui.test.ts` (cap 4 to 5), new `tests/layoutMode.test.ts`, `tests/hud.test.ts`. Also rebuilt `dist/games/crumbrun`. localStorage keys and `?debug=1` hooks unchanged.

## Measurements (board canvas / viewport)
- 1280x800 DPR2: 561x733 (40%) to 779x787 (59.9%)
- 400x860 touch: 399x522 canvas incl. HUD (board ~399x437) to 399x404 board + DOM HUD
- 860x400 touch: 306x399 (35%) to 383x387 (43.2%)

## Screenshots (in scratchpad pw/shots/)
`fix-crumbrun-{desk,phone,land}-{title,ready,play,pause,settings,over}.png` and `thumb-crumbrun.png` (480x300 gameplay).

## Caveats
- 65-70% board share not met (see #1). Phone pad area still has some slack (#3).
- Reduced-motion: new UI has no animation; water meter warning stays steady under calm.
