# Clay Day UI/UX fixes (2026-11-12)

Status per audit issue
1. Crude gun (High): Fixed. New src/draw/gun.ts: walnut stock and grained forend, blued tapered barrels with rib and brass bead, silvered receiver, ground shadow; recoil kick plus slight twist; starburst muzzle flash; muzzle smoke; hint no longer covers it.
2. Flat scene (Med): Partially. Sun glow, far pale tree layer, lit tree crowns, distinct trap launch slot with lit lip, clay ground shadows. Clouds/sky otherwise unchanged.
3. Clay readability (Med): Fixed. Thicker white halo, fading trail (off under Reduce motion), lighter tree crowns.
4. Clipped "Double! +37" (Med): Fixed. Labels clamped to the visible rect with margin (visuals.clampLabelX/Y).
5. HUD too tall (Med): Fixed. Phone HUD 235px -> 109px (header 44px separate); stats strip of 4, shells/combo/reload strip, 25 pips in one row. Landscape side panel: 2x2 stats, tally 13+12; panel narrowed. Play area: phone 74% (was 71%), 860x400 66.5% (was 61%), desktop 77%.
6. Hint covers gun (Med): Fixed. Hint now sits at top of the field, non-interactive, one line, fades on first shot, close button, or after 8 s. Shown once (same localStorage flag).
7. Colour-only pips (Low-Med): Fixed. Misses are filled red squares with a cross; pending stays hollow.
8. Settings icon (Low): Fixed (real cog). "Retry" on failed round: already present ("Try again"), not changed.
9. No landing cue (Low): Fixed. Faint pellet cloud at the aim point, radius = spread (fewer under Reduce motion).
Collection-wide: results payoff (stars fill, hit count climbs, then details card fades in; gold/silver/bronze top edge; static under Reduce motion) done. Landscape side HUD done.

Files changed (games-src/clayday): index.html, src/{palette,fx,game,strings,resultView}.ts, src/draw/{clays,renderer,scene}.ts, src/ui/screens.ts, src/style/{hud,base,panels}.css. New: src/draw/gun.ts, src/visuals.ts, src/ui/hint.ts, src/ui/resultFx.ts, tests/visuals.test.ts.
Tests added: 14 (label clamp, scatter, trail, stars/tier, count-up, hint flag, flash/recoil with Reduce motion). npm test: 123 pass; npm run build passes. Trajectories, scoring, wind untouched. game.ts is 299 lines.
Screenshots (scratchpad/pw/shots): fix-clayday-{desk,phone,land}-{0title,1aim,2fire,3hit,3b-after,4pause,5settings,6result-a,6result}.png, thumb-clayday.png. No h-scroll, no console errors.
