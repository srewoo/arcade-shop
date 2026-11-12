# Corner Pocket graphics pass (2026-11-12)

Reference: `swfFiles/Mini Pool_*` (table with soft felt vignette, metal-trimmed rails, glossy shaded balls, blurred pocket shadows, slim tapered cue). Redrawn in code in the game's own green-felt / mahogany style; nothing copied. Gameplay, physics, tuning, save keys and debug hooks untouched.

## Visual changes
- `src/renderRail.ts` (new): mahogany rail with grain, top-left light bevel, inner inlay line, pearl-and-brass diamond sights, leather-collar pockets with stitching, brass rims, deep shaded holes.
- `src/renderTable.ts`: felt with lamp pool, brighter centre, rubber cushion bevel, baulk D, stronger cushion shadows.
- `src/tableLayer.ts` (new), `src/render.ts`: the static table is baked once per size into an offscreen layer and blitted each frame (screen shake offsets the blit), instead of being repainted with shadowBlur every frame.
- `src/renderBalls.ts`: soft contact shadows, curved shading, bounce light, double specular, numbered badge outline; gradients cached per size (fewer per-frame allocations than before).
- `src/renderGuide.ts`: tapered cue with ferrule, chalked tip and highlight line.
- `src/renderFx.ts`: pot flashes get a glow disc and white inner ring; particles are glowing four-point sparkles.
- `src/style.css`: title table preview is larger.

## Performance
1920x1080 headless play incl. a shot and pot effects: 59.8 fps average (vsync capped), max frame 33 ms (one frame).

## Results
`npm run build` ok, `npm test` 135/135, `npm audit` 0 vulnerabilities. Console error-free.

## Screenshots / thumb
`scratchpad/shots/cornerpocket/` (before-*, after-*, fx-*, balls-zoom.png, fx-zoom.png). Thumb: `public/thumbs/cornerpocket.webp`.
