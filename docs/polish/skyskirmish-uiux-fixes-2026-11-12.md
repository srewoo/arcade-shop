# Sky Skirmish UI/UX fixes (2026-11-12)

Status: tests 71/71 pass, `npm run build` passes, built to dist/games/skyskirmish. No console errors, no horizontal scroll at 1280x800, 400x860, 860x400.

## Audit issues
1. High / Visual identity: **Fixed.** Player ship drawn 1.55x with gradients, cockpit, wing lights, thruster glow, cast shadow and a visible hit core. Four enemy silhouettes plus boss redrawn at 1.3x with tints, engine glow, shadows. Glowing capsule player shots, glowing enemy shots, pulsing pickups. Sky has stars, horizon glow, 3 parallax cloud layers, islands, dimmed lane with glowing rails. Kill rings, particles, "+N" popups.
2. High / Layout: **Partially.** The canvas is now full-bleed (100% of viewport), the page is dark, HUD is translucent chips in the free zones beside the lane (landscape/desktop) or a top strip and bottom dock (portrait). The 9:16 gameplay lane itself is unchanged (changing world width would alter gameplay): 35% of 1280x800 (was 35%), 26% at 860x400 (was ~22%), 83% at 400x860 (was ~?%). The scenery fills the rest, so the screen no longer has dead panels.
3. High / Onboarding overlay: **Fixed.** One-line hint lives in the dock (portrait) or left zone (landscape), never over the lane, absolute so no reflow, fades and auto-dismisses 1.5 s after the first move or shot.
4. Medium / Game over: **Fixed.** Explosion plays first (1 s, 0.3 s with Reduce motion), then a dark card: rank, counting-up score, gold "New best", stats (wave, kills, accuracy, best combo, bosses, continues), Play again primary. Continue card shows the run summary first, Continue primary and End run as a full-size button. Panels dark by default.
5. Medium / HUD hierarchy: **Fixed.** Score is large; lives and bombs are icons (with aria-labels); combo shown in HUD and as a label above the ship that pops on increase.
6. Medium / Feedback: **Fixed.** Red damage vignette, ring and shake on hit, bigger boss bar with "WARLORD I/II/III" name, explosion on death, bomb ring and flash. All flashes/shake/rings off with Reduce motion, popups static, particles at 40%.
7. Low / Title: **Fixed.** Wordmark logo with plane glyph, attract scene (plane, formation, shots) behind the card, controls as always-visible chips (keyboard or touch variants).
Collection-wide: settings icon is not applicable (text Settings buttons). Star copy not applicable. Colour-blind assist untouched (enemy fire already has shape plus outline). Theme control is now Dark/Light (old "system" stored value renders dark).

## Files changed (src/ in games-src/skyskirmish)
New: layout.ts, summary.ts, renderShips.ts, renderOverlay.ts, renderTitle.ts, ui/logo.ts, ui/countUp.ts, tests/layout.test.ts, tests/summary.test.ts.
Edited: index.html, view.ts, render.ts, renderBg.ts, renderShapes.ts, fx.ts, palette.ts, input.ts, loop.ts, main.ts, session.ts, events.ts, appState.ts, types.ts, state.ts, combat.ts, scoring.ts, player.ts, strings.ts, ui/hud.ts, ui/screens.ts, ui/overlay.ts, ui/settingsScreen.ts, style/*.css, tests/contrast.test.ts.
Gameplay rules and tuning untouched. New RunStats (shots, hits, best combo) are render-only. localStorage keys and ?debug=1 hooks kept.

## Tests added
layout (side/stack modes, insets, tiny window, pointer mapping), summary (accuracy, tier, count-up), run stats, fx reduce-motion behaviour; contrast test updated for dark default, light opt-in and gold token.

## Measured (viewport -> lane share; canvas is 100% in all)
1280x800: lane 35%, side HUD. 860x400: lane 26%, side HUD. 400x860: lane 83%, stack HUD. Touch targets: pause 44x44, bomb 92x52 / 180x52.

## Screenshots (shots/)
fix-skyskirmish-{desk,phone,land}-{1title,2hint,3play(0-3),4boss,5pause,6settings,7explode,8continue,9results}.png, thumb-skyskirmish.png.
Note: in god-mode debug shots the plane blinks (invulnerability), so some frames hide it; 2hint frames show it.
