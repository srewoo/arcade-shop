# Stackfall graphics pass (2026-11-12)

Reference: `Tetris_*` SWF only for general polish ideas (layered scene, faceted blocks); no shapes, colours, wording or audio carried over. Stays the glass terrarium with its own stone palette. Gameplay, tuning, save keys and `__stackfall` hooks unchanged.

## Visual changes
- New `src/ui/terrarium.ts`: cached scenery behind the glass (light shafts, bokeh, hanging vines, layered ferns, wooden tray). It is clipped out of the well rectangle so the stone contrast tests (well fill under the glass) still hold.
- New `src/ui/glassBox.ts` (moved out of `background.ts`): green-tinted glass frame, brass lid rim, reflections, condensation droplets, layered soil with shaded pebbles and moss.
- `stones.ts`: cut-gem stones with four lit bevel facets, polished table behind the glyph, rim and specular glints. Glyph ink/halo and assist outlines unchanged.
- `background.ts`/`renderer.ts` wire the scenery layer in; scenery and glass are pre-rendered per layout/hue bucket.

## Results
- fps at 1920x1080 (headless): 60. Console errors: none.
- `npm run build` ok; `npm test` 132/132; `npm audit` 0 vulnerabilities.
- Thumbnail: `public/thumbs/stackfall.webp`.
- Screenshots: scratchpad `shots/stackfall/{before,after}-{title,ready,play,play2}-{1280,400}.png`.
