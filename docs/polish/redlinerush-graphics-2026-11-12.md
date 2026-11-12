# Redline Rush graphics pass, 2026-11-12

Reference: `CAR RACE (R U DIVER).` SWF shapes (pseudo-3D cars with roof/window shading, crash debris, speed-line road). Used for composition and mood only; everything is redrawn in code in the game's own style. No SWF art, text or branding copied.

## What changed (visual only; sim, tuning, save keys, debug hooks untouched)
- Cars: tapered-nose bodies with lit/shaded gradients, glass with reflections, roof panels, mirrors, tyres, lamp glow, rim light; separate sedan / taxi (lit roof sign) / van / truck art; player coupe with twin stripes, rear wing, flame jets on boost. Painted once into cached 4x sprites.
- Road: pre-rendered asphalt tile (grain, wear bands, cracks, oil stains, gravel verge with kerb shadow), kerb-style rumble strips, painted dashes with shadow.
- Scenery: pre-rendered mown-grass tile, 6 tree variants (broadleaf and pine) in two parallax layers, shrubs, shaded guard rail with reflectors, lamps that pool light on the road.
- FX: sparks as additive streaks, debris, smoke puffs, shockwave ring, glow, boost exhaust sparks, smoke from a damaged car (1 armor left), pop-in floating text. Reduce motion trims particles to 40% and stops shake/flash/parallax/scroll.
- Title: live scrolling road with cruising traffic behind a glass card (card sits left on wide screens), striped wordmark.
- Pickups: glossy gems with halo and a sweeping shine.

## Files
New: src/carPaint.ts, renderTextures.ts, renderShowcase.ts, tests/showcase.test.ts.
Edited: renderCar.ts, renderRoad.ts, renderScenery.ts, renderFx.ts, fxEvents.ts, render.ts, main.ts, config.ts (particleMax 120 -> 200, visual only), style/overlay.css.

## Results
- fps at 1920x1080 (headless Chromium, software raster, ~3 s of play): 60.
- `npm test`: 72 pass (3 new). `npm run build` passes. `npm audit`: 0 vulnerabilities. Console clean at 1280x800 and 400x860.
- Thumbnail: public/thumbs/redlinerush.webp (480x300).
- Screenshots: scratchpad/shots/redlinerush/{before,after}-{desk,phone}-{title,play,fx}.png, after-desk-boost.png, zoom-*.png.
