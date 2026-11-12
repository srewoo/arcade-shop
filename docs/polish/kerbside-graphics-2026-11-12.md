# Kerbside graphics pass, 2026-11-12

Reference: `Parking` SWF shapes (top-down cars with roof/glass detail, caravan-style props, hedge/tree canopies, kerbed lot with yellow bay lines). Used for composition and detail only; all art is redrawn in code. No SWF art, text or branding copied.

## What changed (visual only; sim, scoring, levels, save keys and debug hooks untouched)
- Cars and caravan: tapered bodies with lit/shaded gradients, glass with reflections, roof, mirrors, seams, wheels with rims, lamp glow (brake and reverse lights glow); soft ground shadows that keep falling the same way as the car turns. Cached sprites; wheels and lamps stay live.
- Lot: lawn with mowing bands, blades and flowers; concrete pavement ring with joints; hedge shrubs and shaded trees; kerb stones with lit tops; wheel stops with yellow caps; warm lamp pools and lamp posts; asphalt with mottling, patches, cracks, oil, drain grate, puddle; worn bay paint; soft vignette.
- Furniture: slab walls and kerbs with joints, hazard-striped pillars, shaded cones.
- Live feedback: headlight beams on the tarmac, tyre marks (uses the existing `fx.skidMarks` cap) and smoke when braking or turning hard, bay glow and corner brackets (the hatch, tick and dash cues stay), smoke on impacts, tumbling confetti.
- Title: the flat icon is replaced by a lit car park illustration drawn with the game's own art (empty glowing bay, red car swinging in).

## Files (games-src/kerbside)
New: src/render/{sprites,carPaint,furniture,surface,bay,lights,titleArt}.ts, tests/fx.test.ts.
Edited: src/render/{carArt,lot,scene,fx,renderer}.ts, src/app.ts, index.html, src/style/base.css.

## Results
- fps at 1920x1080 (headless Chromium, software raster, ~3 s of play): 60.
- `npm test`: 143 pass (3 new). `npm run build` passes. `npm audit`: 0 vulnerabilities. Console clean at 1280x800 and 400x860 and on levels 4, 8, 12.
- Thumbnail: public/thumbs/kerbside.webp (480x300).
- Screenshots: scratchpad/shots/kerbside/{before,after}-{desk,phone}-{title,play,fx}.png, after-level{4,8,12}.png, after-levels.png.
