# Measure Up graphics pass (2026-11-12)

Reference: `swfFiles/WaterShare_*` (blue jars, pour) and `Cave - PUZZLE_*` (cave puzzle) for composition/palette only. Nothing copied; the existing Wick/gate/well concept is kept and redrawn.
(The game is DOM/inline-SVG, not canvas, so "pre-render" = static SVG plus CSS-only animation.)

Visual changes: cave scene rebuilt in `src/ui/sceneArt.ts` (new: layered lit rock, stalactites, glowing crystals, wall torches, flagstone floor, light beam, dust motes, vignette) and `src/ui/scene.ts` (block-built stone arch with keystone and plinths, cylinder-shaded rivetted gate bars, chained brass plate with bolts, lever with separate base and glossy knob, shaded well, Wick with glow, eyes, brows, blush); the gate opens into a bright glow. Glass jugs in `src/style/play.css` (rim ellipse, side reflections, glass base, ground shadow, shaded liquid with meniscus, idle bubbles, ripple on receive). Win burst flash + sparks (`ui/fx.ts`). Page glows (`base.css`, `tokens.css`). Animations only under `data-motion='full'`; Reduce motion kills all. Logic, save keys, debug hooks unchanged.

Checks: 77 tests pass (+2 scene markup tests), build ok, audit 0. 60.3 fps at 1280x800 and 1920x1080 (SVG scene with animations running). No console errors.
Screenshots: scratchpad `shots/measureup/{before,after}-{desk,phone}-*.png`, `after-win-*`, `after-dark-*`. Thumbnail `public/thumbs/measureup.webp`.
