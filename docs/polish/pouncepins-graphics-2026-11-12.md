# Pounce Pins graphics pass (2026-11-12)

Reference: `swfFiles/CatBowling_*` (dusk sky, bare-tree silhouette, pumpkins, warm vignette). The game keeps its own office-cat theme; the dusk window with a tree silhouette and a sill pumpkin are the nods to the reference. Nothing copied from the SWF. Gameplay, physics, config, save keys, debug hooks untouched.

## Visual changes
- `src/render/backdrop.ts`, `backdropProps.ts` (new): panelled wall with wainscot, dusk window (stars, moon, tree, pumpkin), hanging lamps with light cones, shelf, shaded cooler/cabinet/desk with glowing monitor, plant, clock with ticks, carpet tiles in perspective, vignette.
- `src/render/lane.ts`, `pillow.ts` (new): toned planks, gloss streaks, staggered seams, slab edge, shaded gutters, glowing foul line, deck spot marks; plump stitched cushions with shadow.
- `src/render/cat.ts`, `tint.ts` (new): gradient-shaded cats with tabby stripes, tail tips, ear shading, cheeks, eye shine, rim light.
- `src/render/ball.ts`: wound yarn ball with fuzz and loose thread, soft shadow; bonus fish with glow, fins and scales.
- `src/render/fx.ts`: comic pow-star on hits, soft fluff, sparkles with glow, tumbling confetti, speech-bubble tails.
- `src/render/titleArt.ts`, `style/title.css`: spotlight, wood stage, sparkles and a rolling yarn ball on the title card art (larger).
- `src/render/render.ts`: wall, lane and cushions are now baked into offscreen layers per size (was repainted every frame), so the richer art is cheaper than before.

## Performance
1920x1080 headless play incl. a throw: 60.0 fps average, max frame 16.8 ms.

## Results
`npm run build` ok, `npm test` 95/95, `npm audit` 0 vulnerabilities. Console error-free.

## Screenshots / thumb
`scratchpad/shots/pouncepins/` (before-*, after-*, fxsheet.png). Thumb: `public/thumbs/pouncepins.webp`.
