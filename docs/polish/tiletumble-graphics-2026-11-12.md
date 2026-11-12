# Tile Tumble graphics pass (2026-11-12)

Reference: `swfFiles/Square_*` is the same kind of game (clear same-colour glossy cubes); used for the bevelled, glossy-gem feel only. Nothing copied; the game keeps its discs.

Visual changes: baked gem discs (bevelled rim, dome, inset facet, gloss, contact shadow; symbols embossed) in new `src/ui/discArt.ts`; pre-rendered board plate with night gradient, light pool, recessed cell sockets, dust, bevelled frame (`plateArt.ts`); pop FX with white flash, additive shockwave rings, glowing sparks and tumbling shards, glowing score floater, one-off glint sweep on new game (`draw.ts`, `sprites.ts`, `boardView.ts`); hover halo; title hero redrawn with gradients, sockets and twinkling glints (`hero.ts`); page backdrop glows and board glow (`base.css`, `tokens.css`, `game.css`). New `colour.ts`, `symbols.ts`; tuning in `config.ts` fx. Gameplay, save keys, debug hooks unchanged. Reduce motion: no sweep, rings or particles.

Checks: 78 tests pass, build ok, `npm audit` 0. 1920x1080 with clears in progress: 60.2 fps avg, worst frame 16.8 ms. No console errors.
Screenshots: scratchpad `shots/tiletumble/{before,after}-{desk,phone}-{1title,2play,3hover,4fx}.png`. Thumbnail: `public/thumbs/tiletumble.webp`.
