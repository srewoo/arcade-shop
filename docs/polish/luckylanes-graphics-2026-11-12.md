# Lucky Lanes graphics pass (2026-11-12)

Reference: `swfFiles/Bowling_*` (wood lane look, classic red-banded pin, swirled marble balls). Everything redrawn in code; no SWF assets or text carried over. Gameplay, physics, tuning, save keys and debug hooks untouched.

## Visual changes
- `src/sceneWood.ts` (new): 21 individually toned maple boards, staggered plank seams, board lines, lacquer light pools, glossy gutter channels with lip highlight, refined arrows/dots, glowing foul line, approach boards.
- `src/sceneBackdrop.ts` (new): arcade hall behind the lane (converging ceiling lamps, bokeh, neon haze), pit curtain, neon sign plate with pin icon.
- `src/scene.ts`, `src/sceneGeo.ts`: kickback walls with kick plate, panel seams, lamps, glow-stroke neon trim; shaded sweeper bar.
- `src/renderPin.ts` (new): smooth lathe pin silhouette, cylinder shading + cyan rim light, curved red neck bands, gloss streaks, soft contact shadow, faint lane reflection.
- `src/renderBall.ts` (new): marbled ball with rolling swirls, holes with depth, terminator shade, rim light, specular.
- `src/drawFx.ts` (new): glow-sprite sparks with streaks, tumbling splinters, double-ring shockwaves; strike flourish adds pink and cyan rings (`juice.ts`).
- `index.html`, `src/panels.css`: inline SVG hero emblem on the title menu (hidden at short heights).
- `src/project.ts`: exports `BREAK_Y` only.

## Performance
Static lane layer still pre-rendered via `LaneCache`. 1920x1080 headless play incl. a throw: 59.8 fps avg (vsync capped), max frame 33 ms (one frame).

## Results
`npm run build` ok, `npm test` 163/163, `npm audit` 0 vulnerabilities. Console error-free.

## Screenshots / thumb
`scratchpad/shots/luckylanes/` (before-*, after-*, fx-1080-*, fxsheet.png). Thumb: `public/thumbs/luckylanes.webp`.
