# Crumb Run graphics pass (2026-11-12)

Reference: none by design (the matching SWF is a different, well-known maze game; CONVENTIONS section 7 requires Crumb Run to stay original). Only its own kitchen/mouse/cat art was upgraded. Maze, rules, tuning, sounds, save keys and `__crumb` hooks unchanged.

## Visual changes
- New `src/drawDecor.ts`: ambient shadows cast by counters onto the floor, tile glaze highlights and speckle, wood grain and lit surface on counter tops, recessed cabinet doors with brushed pulls and drop shadow. Skipped in the high-contrast (flat) theme; theme colours untouched so contrast tests stay valid.
- `drawStatic.ts`: shaded wicker basket, glossier door ribbon, deeper mouse holes. `drawProps.ts`: shaded mug/toaster/loaf/salt with contact shadows.
- Actors: soft ground shadows under Pip and cats, fur sheen gradients on both, eye catch-lights (`spriteCat.ts`, `spritePip.ts`, `renderActors.ts`).
- Items (`spriteItems.ts`): shaded crumbs, bevelled sugar cubes, radial-glow pistol halo, gradient cheese.
- Title/summary panels (`overlays.ts`): gradient panels with warm top rim, glowing title (glow off under Reduce motion).

## Results
- fps at 1920x1080 (headless): 60. Console errors: none.
- `npm run build` ok; `npm test` 177/177; `npm audit` 0 vulnerabilities.
- Thumbnail: `public/thumbs/crumbrun.webp`.
- Screenshots: scratchpad `shots/crumbrun/{before,after}-{title,ready,play,drench,death}-{1280,400}.png`, `after-zoom.png`.
