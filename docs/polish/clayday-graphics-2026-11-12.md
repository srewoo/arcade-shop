# Clay Day graphics pass, 2026-11-12

Reference: `Skeet Shoot Optus` SWF (scenery and targets only: grey-and-yellow clay discs, shatter fragments, dust puffs, post-and-rail fence, mountain and farmland backdrops, double-barrel gun). All Optus and other branding and text were ignored; everything is redrawn in code in the game's own style.

## What changed (visual only; sim, scoring, rounds, tuning values, save keys and debug hooks untouched)
- Sky: three-stop gradient, sun with glow and faint rays, cirrus streaks, horizon haze; shaded cumulus cloud sprites (3 variants) drifting by.
- Land: lit mountains with snow caps and haze, perspective farmland patchwork, mown field bands with blades and flowers, 3 shaded tree sprites in the treeline, post-and-rail fence, redrawn trap houses (same launch slot position), banded wind sock, edge vignette.
- Clays: domed, lit discs with flange ring and glint (cached sprites; white halo and dark outline kept for contrast), gold clay glints.
- Gun: baked sprite with wood grain, gloss on the blued barrels, barrel band, engraved receiver.
- FX: tumbling two-tone shards, soft dust and smoke puff sprites, shockwave ring, gold star burst. Reduce motion trims counts as before.
- Title: the flat SVG banner is now a canvas of the real scene with two clays in flight.

## Files (games-src/clayday)
New: src/draw/{sprites,far,houses,fxDraw,gunArt,titleArt}.ts, tests/fx.test.ts.
Edited: src/draw/{scene,clays,gun}.ts, src/fx.ts, src/palette.ts (new keys only; existing values unchanged), src/game.ts, index.html, src/style/panels.css.

## Results
- fps at 1920x1080 (headless Chromium, software raster, ~3 s of play with shots): 60.
- `npm test`: 126 pass (3 new). `npm run build` passes. `npm audit`: 0 vulnerabilities. Console clean at 1280x800 and 400x860.
- Thumbnail: public/thumbs/clayday.webp (480x300).
- Screenshots: scratchpad/shots/clayday/{before,after}-{desk,phone}-{title,play,fx}.png, after-fxzoom.png.
