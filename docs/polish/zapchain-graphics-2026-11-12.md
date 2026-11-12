# Zap Chain: new game, 2026-11-12

Folder: `games-src/zapchain` (id `zapchain`, genre puzzle, accent #7b5cf0). Thumbnail: `games-src/zapchain/thumb.webp` (480x300).

## SWF reference used
`Fall Out.swf` decompiled scripts (frame_11 holds the whole game): 10 columns x 12 rows (row 0 is the feeder), disc kinds 2..6 = five colours, 7 = bomb.
Rules carried over: click a 4-connected same-colour group of 2+ (single disc = error buzz), score +2^n, columns fall, the base row
compacts towards the centre, feeder builds a row one disc at a time (rising tones) then drops it in random order and each row builds 10%
faster, bombs from level 2 (1 in 30) clear the whole row, colours = min(level+2, 5), start rows = min(level+4, 8), clock = 80 + 5 x level,
target = 40 + 10 x level, board-clear bonus 2000, "LEVEL n COMPLETED / TIMES UP / GAME OVER" flow, input locked while discs from a zap settle.
Only the SWF text ("discs to go", "zappin' score") and palette feel were used; no bitmaps/SVGs/sounds copied. Name, art and audio are original.

Deliberate deviations (all in `src/config.ts` / `src/model/rules.ts`): time bonus uses time REMAINING (the original used elapsed time, which looks like a bug);
level clears at `cleared >= target` (original `>`); zap exponent capped at 2^20 so scores stay displayable; a clicked empty cell does nothing
(original paused); 1.4 s "ready" intro before the clock starts; a short 0.13 s hover before released discs fall so the zap reads first.

## Visuals
Glossy pre-rendered discs (bevel rim, radial body, bounce light, specular + glint), colour-blind symbols (triangle, square, diamond, ring,
star) baked into the sprites, bomb disc with bolt and pulsing halo, violet circuit-lattice backdrop with the board well, socket grid, feeder rail,
pylons and floor glow (all pre-rendered), electric arcs travelling along the chain (parent to child, flickering, 3-pass glow), disc pop with
white flash + sparks/shards, shock rings, bomb beam, score pop-ups with chain tiers (NICE / SHOCK / MEGA CHAIN / OVERLOAD), squash on landing,
stretch while falling, spawn pop-in, danger glow on near-full columns, hover/cursor group preview with "n . +points" tag, twinkle glints, screen
shake and flash (off with Reduce motion; particles cut to 40%), title screen is a live bot-played attract board.

## Files
`src/{config,game,attract,audio,audioCues,sfxMap,scores,settings,storage,strings,rng,loop,debug,main}.ts`,
`src/model/{types,grid,rules,world,fall,spawner,sim,bot}.ts`, `src/render/{palette,view,sprites,backdrop,arcs,particles,popups,fxEvents,tiles,frame}.ts`,
`src/ui/{appearance,countUp,dialogs,dom,hud,input,screens,settingsPanel}.ts`, `src/style/*.css`, `index.html`, `tests/*`.

## Results
- `npm run build` ok, `npm test` 75 tests pass (grid/groups, gravity, compaction, bombs, scoring, level params + progression, seeded feeder, game flow, settings, view, fx budgets, contrast), `npm audit` 0 vulnerabilities.
- FPS at 1920x1080 headless Chromium with the bot playing: 60.3 avg (max frame 16.8 ms), up to 27 live particles.
- Console clean in all runs. No horizontal scroll at 360 and 860x400.
- Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/zapchain/` (d-/m-/s-/l- title, play, zap, bomb, cleared, timeup, assist, reduced).
