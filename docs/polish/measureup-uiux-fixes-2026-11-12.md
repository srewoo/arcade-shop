# Measure Up UI/UX fixes (2026-11-12)

Source: games-src/measureup. Build: dist/games/measureup. Tests: 12 files, 75 passing (66 before). `npm run build` passes (tsc + vite). No console errors, no horizontal scroll at 1280x800, 400x860, 860x400 (light) or 1280x800, 400x860 (dark).

## Audit issues
| # | Issue | Status | What changed |
|---|---|---|---|
| 1 | High: title hero art broken (Wick cropped in dark square) | Fixed | Title now renders the full gate scene (320x210 viewBox, rounded card, ids prefixed so hidden-SVG gradients cannot clash). Wick is whole, plate reads "HOLD 3". |
| 2 | High: desktop 40% empty, Z-shaped eye path | Fixed | App widens to 90rem on play; scene card and a vertically centred panel (HUD, status, jugs, action row directly under the jugs) sit side by side. Scene viewBox taller (0 -20 320 240) so it fills more height. Jugs scale up (up to 20rem). Short landscape phone keeps a compact top-aligned panel. |
| 3 | Medium: pour model easy to misread | Fixed | Picking a jug tags it "FROM" with a down arrow and every other jug gets a dashed accent outline plus "POUR HERE" with an arrow (non-colour cue). Tag row has reserved height, so no reflow. Status line shortened. |
| 4 | Medium: win modal hides payoff, black stars | Fixed | Win delay 1300 to 1700 ms so gate and Wick hop play first. Card is tiered: "Gate open!", gold stars (pop, staggered; plain outlines for unearned), tier label (Perfect measure / Well measured / Gate open), moves vs par, best, primary Next. Sparkles unchanged (respect Reduce motion). Star copy derived from the award (new winCopy.ts): hint cap note only when the hint actually cost a star, exact moves needed for next star, "1 move" pluralised. Selection cleared when the gate opens. |
| 5 | Medium: jugs read as test tubes | Fixed | Handle, glass highlight, meniscus ellipse on liquid, bubbles when receiving (full motion only). |
| 6 | Medium: level list is a wall of "Locked" | Fixed | Levels grouped under "N JUGS" headings with level names; only the playable levels plus 4 locked are listed, the rest become "27 more levels waiting further on" (pure planLevels, tested). Tiles 6.6rem wide, 12px names. |
| 7 | Low: no logo mark / small wordmark | Fixed | Large wordmark with a drawn jug mark under the hero. |
| 8 | Low: "the well" not drawn | Fixed | Well and floor drain drawn in the cave scene; copy now "Fill and Empty use the well and drain" was dropped for brevity, hint text says "fill jug A to the brim". |
| 9 | Low: timer stress | Fixed | New "Show timer" setting, default off (HUD shows Level/Moves/Par). Clock still runs internally; setting persisted and validated (new field falls back per field, old saves keep working). |

## Collection-wide items
- Board fills viewport: done (see 2).
- Non-blocking, non-reflowing hint: onboarding banner now overlays the cave floor inside the stage, so showing or dismissing it never moves the jugs (measured: jugs rect identical before and after dismiss at all three viewports, previously a reflow).
- Settings icon: standard cog (toothed ring and hub) replaces the sun.
- Results: payoff first, then tiered card with gold stars, copy consistent with the award.

## Files changed
index.html; src/: settings.ts, strings.ts, config.ts (winDelayMs 1700, peekAhead 4), scoring.ts (twoStarLimit), nav.ts, main.ts, play.ts, ui/scene.ts, ui/jugs.ts, ui/screens.ts, ui/appearance.ts; style/: base.css, play.css, panels.css, tokens.css (--gold, light and dark). New: src/winCopy.ts, src/levelList.ts, tests/polish.test.ts. tests/contrast.test.ts extended (gold on panel and bg, all palettes).

## Tests added
polish.test.ts (9 tests): star copy for 1/2/3 stars and hint cap, twoStarLimit boundary, starsMarkup, level plan grouping and teaser count, timer setting default and validation. Contrast test for --gold.

## Measured before to after
- Title hero: cropped dark square to full gate scene.
- Desktop play (1280x800): scene card 479x314 css low-left, buttons at y~765 to scene 472x354 centred beside a vertically centred panel, actions under jugs; jug height up to 320px.
- Hint dismiss layout shift: table jumped (audit) to 0 px.
- Level screen: 35 tiles to 8 tiles plus teaser; "Locked" tiles 31 to 4.

## Screenshots (shots/)
fix-measureup-{desk,phone,land,dark-desk,dark-phone}-{1title,2levels,3play,4picked,5hint,6gate,7win,8settings}.png and thumb-measureup.png (480x300).

## Not done / caveats
- Jugs are not literally drawn in front of the gate (side-by-side layout instead).
- No ghost pour-stream animation, only the FROM/POUR HERE tagging and bubbles.
- Level 1 solves in one move, so the hint screenshot is trivial.
