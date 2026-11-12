# Keepy Up: new game build report (2026-11-12)

Status: done. New standalone game `games-src/keepyup` (genre sports, accent #d4c22a). Lead still needs to add the catalogue entry; thumbnail is at `games-src/keepyup/thumb.webp` (480x300).

## Reference used
`/Users/sharajrewoo/Desktop/swfFiles/tennis_*`: only the core mechanic (click the ball to knock it up, hit position sets angle/spin, walls bounce, gravity ramps, score-tier callouts). The SWF art is a tiny Optus-branded basket graphic and was not used. No branding, scoreboard-submit or email features. All art is original and code-drawn; audio is WebAudio synthesis.

## What was built
- Modes: Classic, Two Balls (unlocks at 25 in Classic), Windy (gusts, windsock, streaks, HUD wind chip with arrow + direction/strength text).
- Tiers (config): 10 Warm-up, 20 Nice!, 30 Smooth, 40 On fire, 50 Pro, 60 Champion, 80 Legend, 100 Untouchable, with a callout and crowd cheer.
- Keyboard play: arrows move an aim reticle, Space/Enter kicks, X snaps the reticle under the lowest ball. Pointer and touch tap the ball directly.
- Art: sunny sky + sun glow, drifting pre-baked clouds, floodlights, hills, grandstand with ~170 animated fans (batched fills, excitement bob on milestones), pennants, back wall, perspective hard court with lines, net, hedge and side walls; fuzzy tennis ball sprite (fibres, felt speckle, seam, spin rotation, fixed lighting overlay, dark outline for contrast, squash on hit); ball shadow shrinks/fades with height; impact ripples (double ring for sweet-spot hits, dashed single ring off-centre with colour-blind assist); fuzz/dust particles, popups, screen shake on landing.
- Reduce motion (System/On/Off): no shake, no cloud drift, no crowd bob, no streaks/flutter, particles cut to 40%.
- Conventions: pause overlay (P/Esc, confirm on restart/quit, auto-pause on blur/hidden), settings panel (volume, sound, reduce motion, colour-blind assist, text size, theme), focus trap, aria-live status, `keepyup:` localStorage keys with zod validation, strings module, config module, `?debug=1` hooks (`window.__keepyup`: state, autopilot, setBest), fixed-step sim with render interpolation.

## Files (src)
config, modes, physics (hit/gravity/walls/miss), tiers, wind, sim, game, scores, settings, storage, rng, loop, audio, audioCues, strings, debug, main; render/{view,layout,palette,backdrop,backdropBack,backdropFront,crowd,clouds,ballSprite,fx,scenery,frame}; ui/{appearance,dialogs,dom,hud,input,screens,settingsPanel,countUp}; style/{tokens,base,overlay}.css. Max file 168 lines.

## Verification
- `npm run build` ok, `npm test` 62 tests pass (hit-angle maths, gravity ramp, tiers, miss detection, deterministic sim, wind, two-ball spawn, scores/unlock, settings, view, reduce motion, contrast), `npm audit` 0 vulnerabilities. (`npm install` hit an npm arborist bug on a fresh resolve, so the lockfile was seeded from `updraft`'s identical pins.)
- Average 60.1 fps at 1920x1080 (headless Chromium, 3 s sample during autopilot play). Console error-free.
- Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/keepyup/` (after-{desk,phone}-{title,ready,play,play2}, m-windy, m-aim, m-over2, reduced, pause, thumb). No "before" shots since the game is new.
