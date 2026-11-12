# Redline Rush UI/UX fixes, 2026-11-12

Audit items (section 3 of ui-ux-audit-2026-11-12.md): 8 issues. Result: 7 Fixed, 1 Partially, 0 Not fixed.

| # | Sev | Issue | Status | What changed |
|---|---|---|---|---|
| 1 | High | No depth or speed feel | Fixed | New renderScenery.ts and renderRoad.ts: two-layer parallax trees with shadows, guard rail posts, lamp posts with glow, rumble strips, tyre-wear bands and scrolling asphalt speckle, speed streaks that scale with speed (cyan on boost), speed-driven vignette. Car shadows, tail glow on traffic, player headlight cones and sheen. More crash sparks (3 bursts), shake and flash. All of it respects Reduce motion (parallax, streaks, vignette growth, shake, flash off; particles at 40%). |
| 2 | High | Road canvas 38% / 27% of viewport | Fixed | Canvas now fills 100% of the viewport at every size; the logical view widens sideways with scenery, road stays centred and larger (viewport.ts `computeLayout`). Road scale vs old: desktop 1.25 -> 1.6, landscape phone 0.6 -> 0.8, phone 0.9 -> 1.25. Player car 26px wide in 860x400 (was ~20). |
| 3 | High | Onboarding banner hides traffic | Fixed | Hint moved off the road: beside the road in the scenery on wide screens (top right, under the buttons), in the empty road behind the car above the pads on portrait. Non-blocking (pointer-events none except its close button), fades from 6.5 s, gone at 7.5 s; no reflow. Copy now teaches skimming with an icon. |
| 4 | Med | Light HUD pulls the eye | Fixed | HUD is dark translucent glass chips over the scene. Score is the primary chip (1.7rem italic). Phone: one 52px bar (was ~175px); wide: compact column in the scenery. Fuel and armor stay in the HUD, combo is beside the car. |
| 5 | Med | Skim/combo feedback unclear | Fixed | "CLOSE! +N" pop-up and bigger sparks on each near miss, a combo pill beside the car (multiplier, chain count, draining timer bar), hint teaches skimming, result tip covers "0 near misses". |
| 6 | Med | Cars differ only by colour | Fixed | Sedan (windshield, rear glass), taxi (every 5th sedan: yellow, roof sign), van (stripes, ridge), truck (cab, trailer ribs); shadows and tail glow separate them from the verge. |
| 7 | Low | Result card advice; "Title" button; small icons | Fixed | Payoff first: dim plus big outcome word in the canvas for 1.5 s (overDelay 0.9 -> 1.5), then card with tier badge (Rookie / Street racer / Road ace / Redline legend), score count-up (instant under Reduce motion), one tip chosen from the run, "Main menu" button. Settings icon is a standard cog (was a sun). No star copy exists. |
| 8 | Low | Title not separate, duplicate wordmark | Partially | The in-game HUD and buttons are hidden on the title, so one wordmark remains, with a checkered strip and a stronger gradient backdrop. It is still a dialog over the dimmed live road (not a separate scene). |

Collection-wide items: colour-blind cues were already on request (assist outlines, labels, fuel pattern); pickups differ by shape and icon, so no default change was needed. Sound and Settings buttons are hidden on narrow portrait phones to fit the bar; both stay in the pause menu (Settings has the sound toggle) and M still mutes.

## Files changed (games-src/redlinerush)
New: src/viewport.ts, src/renderScenery.ts, src/renderOverlay.ts, src/result.ts, tests/viewport.test.ts, tests/result.test.ts.
Edited: index.html, src/main.ts, render.ts, renderRoad.ts, renderCar.ts, fxEvents.ts, palette.ts, config.ts (overDelay, tier thresholds), strings.ts, screens.ts, ui/canvasFit.ts, style/base.css, hud.css, overlay.css.
Kept: gameplay rules and tuning, localStorage keys, `?debug=1` hooks, versions, no new deps. Dist: dist/games/redlinerush.

## Tests
Added 11 (69 total, all pass): layout maths (fills viewport, centred road, bigger than old, >= 40 u look-ahead, fits 320 px), tier thresholds, tip selection, count-up curve. `npm run build` passes (tsc strict).

## Measured (canvas share of viewport, road centre scale)
| Viewport | Before | After |
|---|---|---|
| 1280x800 | 38% | 100% canvas; road 448 px wide (was 350) |
| 860x400 | 27% | 100% canvas; road 224 px (was 175) |
| 400x860 | 69% | 100% canvas; road 350 px (was ~315) |
No horizontal scroll, no console errors at all three sizes. HUD on phone 52 px tall.

## Screenshots (scratchpad/pw/shots/)
fix-redlinerush-{desk,phone,land}-{title,play0,play,pause,settings,payoff,results}.png, thumb-redlinerush.png (480x300).

## Not verified
Time Trial and Daily HUD layouts were reviewed in CSS only (trial chips wrap on the phone bar), not screenshotted. A skim pop-up and combo pill were not captured in a screenshot (code path unit-light; verified by compile only).
