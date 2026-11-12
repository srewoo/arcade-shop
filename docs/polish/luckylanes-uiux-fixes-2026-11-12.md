# Lucky Lanes UI/UX fixes (2026-11-12)

## Audit issues
| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | HIGH scoreboard below the fold (phone, landscape) | Fixed | Page is exactly one viewport tall: phone 400x860 scrollHeight 1367 -> 860; landscape 860x400 743 -> 400; desktop 800. Scoreboard top y: 858 -> 586 (phone), 402 -> 94 (landscape). Layout is lane left, tip + scoreboard + status + meters + controls in the side column. Scoreboard compacted; on narrow screens it scrolls sideways inside its own box and centres on the current frame. |
| 2 | HIGH "GUTTER BALL" banner contrast | Fixed | All banners sit on a dark plate (rgba(14,8,34,.9)) with a coloured edge and glow; white text on near-black (>15:1). Gutter gets an amber edge, a drop-and-wobble animation, a dust puff and a small camera thump (thump skipped under Reduce motion). Strike/spare/turkey banners checked in screenshots. |
| 3 | MEDIUM lane only 33% of viewport, how-to card larger than lane | Fixed | Desktop stage 672x498 -> 774x732 (largest element). How to play moved behind a "?" header button (dialog with focus trap). Phone stage 368x468, landscape 468x342. Lane is still a portrait-shaped scene, so the 65-70% target is met only on height-limited desktop (~55% of area, 91% of height); phone/landscape are limited by the controls (see below). |
| 4 | MEDIUM two input schemes shown at once | Fixed | Single tip line in the side column: touch (pointer: coarse) shows "Drag up on the lane to throw. Tap the lane to lock a meter."; desktop shows the Space/arrows line. In-canvas chip removed. Bold for the first 3 throws, muted after. |
| 5 | MEDIUM coach covers pins; accidental Skip | Fixed | Coach now lives in the side column (compact card, Got it button), never over the lane. Skip: after a human throw, pin-fall (settle/sweep) can't be skipped; the banner wait only after 0.6 s. Button reads "Pins falling..." (disabled) meanwhile. CPU waits still skippable. Starting a game still takes Start + (optional) Got it; coach no longer blocks play. |
| 6 | MEDIUM cryptic "You F1.1 \| 0" chip | Fixed | "You · Frame 1 · Ball 1 · Score 0", 15px bold on a darker pill. |
| 7 | LOW gutter/strike juice | Fixed | Gutter thump + dust; strike confetti/ring/shake already present, verified a strike banner. |
| 8 | LOW kbd 11.2px; pocket marker | Partially | kbd now 13px. Pocket-mark triangles unchanged (white with dark outline plus label "POCKET MARKS"). |

Collection-wide: settings is now a standard SVG cog (aria-label Settings), plus "?" and speaker icons; labels collapse to screen-reader text under 560px. Hints no longer reflow or cover the lane (fixed 44px tip slot). Results: payoff first (FINAL banner, confetti and crowd for tier 2+; 0.9 to 1.5 s, 0.5 s under Reduce motion), then a tiered card (Warm-up / Solid / Great / Superb / Perfect; spare challenge by stars) with a big score. Back button became a compact undo icon with a label on wide screens. Meter rows and controls tightened.

## Measurements (before -> after)
- Phone 400x860: page 1367 -> 860, no h-scroll; lane 368x468.
- Landscape 860x400: page 743 -> 400; lane 468x342.
- Desktop 1280x800: lane 672x498 -> 774x732; page 800.
- Console/page errors: none on all three viewports.

## Files changed (games-src/luckylanes)
index.html, src/style.css, src/lane.css, src/panels.css, src/strings.ts, src/tuning.ts, src/turnFlow.ts, src/game.ts, src/juice.ts, src/hud.ts, src/bannerView.ts, src/applySettings.ts, src/coach.ts, src/main.ts, src/results.ts, src/resultsText.ts, new src/finale.ts; tests/gameNew.test.ts (skip test updated to the new rule). Build output: dist/games/luckylanes.

## Tests added
tests/polishFlow.test.ts (canSkip, Pacing guard, result tiers, payoff delay) and a new pin-fall-not-skippable case in tests/gameNew.test.ts. 163 tests pass; `npm run build` passes. Storage keys, debug hooks, scoring and physics untouched.

## Screenshots (scratchpad/pw/shots/)
fix-luckylanes-{desk,phone,land}-{title,coach,throw,gutter,strike-roll,banner2,pause,settings,payoff,results}.png, thumb-luckylanes.png (480x300).

## Not done
- 65-70% viewport play area on phone/landscape (stage ~50% of area) because of the shot meters and controls in the same view; the portrait lane scene was not re-framed.
- Scoreboard on phone portrait scrolls a few px sideways (Total column); not a page scroll.
