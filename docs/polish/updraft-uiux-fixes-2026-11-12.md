# Updraft UI/UX fixes (2026-11-12)

| # | Audit issue | Status | Notes |
|---|---|---|---|
| 1 High | Flat art, tiny ship, no depth | Fixed | Dark cave with gradient, 3 parallax ridge layers, dust motes, speckled rock with inner rim light and glowing edge; ship drawn 1.35x with halo, gradient body, flicker flame; glowing gradient coins with sparkle; "+25" popups and gold sparks on pickup. Parallax frozen under Reduce motion. |
| 2 High | Light field, weak corridor contrast | Fixed | Scene is dark in all themes; bright rim (>=3:1 vs cave and rock, tested). |
| 3 Medium | Phone: ~60% wall, clipped HUD chips, kbd hint on touch | Fixed | Camera zoom (minLogicalW 520 to 300): cave band 38% to 69.8% of height at 400x860 (corridor 46.5%). HUD is now chips with >=12px labels. Touch wording ("Touch and hold") via pointer:coarse; kbd hints hidden on coarse pointers. Side effect: less look-ahead on narrow portrait screens (300 units visible). |
| 4 Medium | HUD outside canvas, GAP unexplained, kbd 10px | Fixed | Score (2.6rem) primary, translucent chips over the scene; GAP removed; side panel and keys line removed; stage is 100% of viewport at all sizes. |
| 5 Medium | Blank canvas behind title | Fixed | Attract mode: self-flying ship through a demo cave behind the title card (static under Reduce motion). HUD and top buttons hidden on title. |
| 6 Medium | No ready beat, no crash feedback | Partially | Ready state already waits for first press; now ship holds centre with a pulsing ring and an on-field "Hold to launch" prompt (no countdown added, to keep tuning intact; the first 320 units are flat). Crash now has shockwave ring, fire and white sparks, shake and flash (disabled when reduced), scene stays visible 0.9 s before the results card. |
| 7 Low | Sun-like settings icon, theme mismatch | Fixed | Proper 8-tooth cog; dark HUD chips match the field. |
| 8 Low | Top buttons at 44px minimum | Not fixed (by design) | 44x44 meets the floor; measured 44x44, gap 6px. |
| Collection | Results payoff first then tiered card | Fixed | Crash plays first; card has New best badge, count-up score (instant under Reduce motion), 3 stat tiles, Fly again primary. Scrim lighter, no blur on results/title. |
| Collection | Non-blocking hint off playfield | Fixed | Coach mark absolutely positioned over floor rock, pointer-events none (except "Got it"), no reflow. |

## Measured
- Stage / viewport: 1280x800 100% (was ~35-40% canvas), 400x860 100%, 860x400 100%.
- Cave band share of height: phone 38% to 69.8%; desktop and landscape 100%.
- No horizontal scroll, no console or page errors in any of the three viewports.

## Files changed (games-src/updraft)
index.html, src/style/{tokens,base,overlay}.css, src/config.ts (minLogicalW), src/strings.ts, src/main.ts, src/ui/{hud,screens}.ts, src/ui/countUp.ts (new), src/render/{frame,terrain,entities,particles,view}.ts, src/render/{rock,popups,attract}.ts (new), tests/{contrast,appearance}.test.ts, tests/fx.test.ts (new). Build output: dist/games/updraft. localStorage keys and debug hooks unchanged.

## Tests
121 passing (was 105 or so): new caveShare/zoom view test, attract-mode bounds and reduced-motion, count-up, popups cap, hash, strings.pick; contrast test reworked for the shared dark scene (rim/craft/coin/glow vs cave and rock >=3, HUD text >=4.5). `npm run build` passes.

## Screenshots (pw/shots/)
fix-updraft-{desk,phone,land}-{1title,2ready,3play,4pause,5settings,6crash,7results}.png (DPR 2) and thumb-updraft.png (480x300).
