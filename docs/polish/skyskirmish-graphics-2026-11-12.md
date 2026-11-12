# Sky Skirmish graphics pass (2026-11-12)

Reference: `Air Fighting` SWF (dark mottled blue backdrop, gradient-shaded swept jets). Used for mood and palette only; everything is redrawn in code.

## Visual changes
- Background (`renderBg.ts`, `renderSprites.ts`): cached static layer (sky gradient, stars, low-sun glow, god-rays, vignette); pre-rendered volumetric cloud sprites in 3 parallax layers, shaded floating islands with grass and pine trees, wind streaks, twinkling stars, glowing lane rails.
- Aircraft (`renderPlayer.ts`, `renderEnemies.ts`, `renderBoss.ts`, `renderKit.ts`): side-lit volume shading, panel lines, canopy glass with specular, twin afterburner plus cyan core flame, blinking nav lights, silhouette cast shadows, pulsing engine glows and trails on enemies, armoured boss with reactor core. Shield is now a translucent bubble.
- Shots and pickups (`renderShapes.ts`): shaded power-up orbs with orbiting ring and glint, plasma enemy shots, brighter player capsules.
- FX (`fx.ts`, `renderFx.ts`): layered explosions (fireball flash, additive fire, streaking sparks, rising smoke, shockwave). Reduce motion keeps particle cut and no rings.
- Title (`renderTitle.ts`, `render.ts`): attract scene drawn in screen space; large tilted hero jet with contrails and shots on the left, enemy fleet on the right, framing the card.
- Gameplay, tuning, save keys, debug hooks unchanged. New test `tests/fx.test.ts`.

## Results
- fps at 1920x1080 (headless, wave 5): 60.1.
- `npm run build` OK, `npm test` 74/74, `npm audit` 0 vulnerabilities, console error-free.
- Thumbnail: `public/thumbs/skyskirmish.webp` (480x300).
- Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/skyskirmish/` (`before-*`, `after-*`).
