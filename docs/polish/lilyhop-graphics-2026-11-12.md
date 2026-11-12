# Lily Hop graphics pass (2026-11-12)

Reference: `swfFiles/frog_leap_*` (same kind of game: frogs hopping across lily pads). Used for pond/pad/frog composition only; nothing copied.
Game is DOM + inline SVG (not canvas).

Visual changes: shaded lily pads with rim light, dew, veins, occasional blossom (`ui/padArt.ts`); gradient frogs and toads with belly, highlights, glinting eyes, lids, warts, toes (`ui/pieceArt.ts`); new pond scene with moon, light shafts, reflection, caustics, mist, lotus blossoms, two swaying reed layers (`ui/sceneArt.ts`); hop and win splashes with rings and droplets (`ui/splash.ts`, `boardView.ts`); contact shadows, pad ripple rings, page backdrop glows (`game.css`, `base.css`, `tokens.css`). `ui/svgId.ts` gives each sprite unique gradient ids (hidden-view gradients do not resolve). Motion only under `data-motion='full'`. Rules, tuning, save keys and `?debug=1` hooks unchanged.

Checks: 99 tests pass (+3 art tests), build ok, audit 0. 60.2 fps avg, worst frame 16.8 ms at 1920x1080 with hops in progress. No console errors.
Screenshots: scratchpad `shots/lilyhop/{before,after}-{desk,phone}-*.png`, `zoom.png`. Thumbnail `public/thumbs/lilyhop.webp`.
