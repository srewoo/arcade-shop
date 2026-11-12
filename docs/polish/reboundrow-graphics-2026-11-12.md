# Rebound Row graphics pass (2026-11-12)

Reference: `Ping Bricks_*` SWF assets (only five plain flat shapes: rectangles and a dot), so used for composition only; everything is redrawn in code. Gameplay, tuning, save keys and `__rr` hooks unchanged.

## Visual changes
- New `src/ui/scene.ts` + `stars.ts`: pre-rendered backdrop (nebula, bottom skyline, drifting twinkling parallax stars) and cached playfield layer (floor gradient, nebula, stars, perspective-ish grid, paddle-lane glow, metal rails with rivets and glow edge, vignette).
- New `src/ui/brickSprite.ts`: cached glossy bevelled brick sprites (gloss band, hot top line, rim, shadow), riveted steel, glossy power gem; hp rings/dots/assist hatch+numerals kept.
- New `src/ui/actors.ts`: metal capsule paddle with core glow, end caps and laser cannons; shaded sphere ball with cached halo and cooling comet tail; glossy glowing capsules; glowing laser bolts.
- `renderFx.ts`/`fx.ts`: spark streaks + shards, shockwave rings on brick break, glow on hit flash, softer banner band with glow (rings skipped under Reduce motion; particle counts/shake unchanged).
- `titleArt.ts`: glossy bricks, nebula, stars, glow paddle and sphere ball.
- `render.ts` now only orchestrates; `drawBricks.ts` blits sprites.

## Results
- fps at 1920x1080 (headless, autoplay): 60. Console errors: none.
- `npm run build` ok; `npm test` 59/59; `npm audit` 0 vulnerabilities.
- Thumbnail: `public/thumbs/reboundrow.webp`.
- Screenshots: scratchpad `shots/reboundrow/{before,after}-{title,ready,play,play2}-{1280,400}.png`.
