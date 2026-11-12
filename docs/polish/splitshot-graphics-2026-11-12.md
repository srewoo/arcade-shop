# Split Shot (new game) - 2026-11-12

Folder: `games-src/splitshot` (id `splitshot`, genre action, accent #e8743b). Thumbnail: `games-src/splitshot/thumb.webp`.

## Reference use
The old `pang_excel.swf` scripts were only used as a generic idea of the genre (bouncing, size-based splitting). No SWF art, names,
layouts, sounds or text were used. Original design: lighthouse keeper "Wick" firing a grappling cord at bouncing bubbles; 6 original
stage themes (harbour dusk, coral shallows, kelp forest, lantern caves, storm cliffs, aurora floe) and 8 original stage layouts that loop.

## Gameplay
4 bubble sizes, bounce apex per size, split into two, smallest pops; ledges and breakable blocks (no ladders); stage timer; power-ups
(twin line, sticky line, slow tide, bubble shield); combo score, time bonus, extra life every 15000; life lost restarts the stage
(score rolls back to stage start). Fixed 1/60 s sim with interpolated rendering. Keyboard (arrows/A-D, Space) and touch buttons.

## Art (all code-drawn)
Pre-rendered per-theme backdrops (sceneryA/B, floors), animated ambient layers (light shafts, lighthouse beam, kelp sway, lantern flicker,
lightning, aurora, rain/snow/bubbles), glossy translucent bubble sprites cached per size, layered hero art with idle/walk/aim/hurt/cheer
poses, cord with grapnel, themed ledges/blocks with crack states, particle pool FX, score popups, shake/flash (disabled by Reduce motion).

## Results
- `npm test`: 62 passing (physics, split rules, collisions, stage clear/timeout, power-ups, run flow, bot, settings, view, contrast, audio map).
- `npm run build` ok; `npm audit` 0 vulnerabilities.
- 1920x1080 average 60.3 fps, console error-free.
- Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/splitshot/`
- Known limits: ladders not implemented; in tall portrait the 16:10 playfield is small with scenery filling the rest.
