# Crumb Run

An original arcade maze-chase for the arcadeShop collection. Pip the mouse raids a night-time kitchen floor, eats every crumb and dodges four cats. Written in TypeScript (strict), built with Vite, drawn entirely procedurally on a Canvas 2D (no image or audio assets).

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (vitest)
    npm run build      # tsc --noEmit + production build into dist/
    npm run preview    # serve the build

Append `?debug=1` to enable the `window.__crumb` debug hook in a production build (always on under `npm run dev`). Append `?dpad=1` to force the on-screen d-pad on a desktop.

## Rules

- Eat all crumbs (10) and sugar cubes (50) to clear the maze. Cheese (500) appears twice per level for 9 s and shows a countdown ring.
- Four water pistols per maze: for 6 s (shrinking 0.8 s per level, minimum 3 s) cats are drenched (blue, dripping, with a droplet icon), flee, and blink before it ends. Touching one splashes it back to the basket: chain 100 / 250 / 600 / 1500.
- 3 lives, extra lives at 7,500 and 25,000. Levels cycle through three mazes and change colourway each level.
- Gentle opening: the cats leave the basket at 6 / 10 / 15 s on level 1 and Smudge heads for its corner for the first 4 s. Pip is faster than every cat on every level.
- Every ~20 s the cats stop and groom for 3 s: they sit still and are harmless to touch.
- Tuxedo freezes and flattens its ears for 0.35 s before a pounce (max 3 s, then a 4 s cooldown).
- From level 7 one modifier per level cycles: faster cats, dark kitchen, cats escape sooner.
- Saved in localStorage: `crumbrun-settings` (volume, mute, reduce motion, colour-blind assist, text size, high contrast, d-pad options, first-run flag), `crumbrun-highscore`, `crumbrun-scores` (top 5) and `crumbrun-stats`. All validated field by field with zod; a bad value only resets that field.

## Controls

| Input | Action |
| --- | --- |
| Arrows / WASD | Steer. A turn is buffered until it is legal. |
| Swipe (touch) | Steer; tap to start/continue |
| On-screen d-pad | Shown on coarse pointers or via Settings; slide a thumb between buttons to re-steer |
| Gamepad | D-pad or left stick steers, A starts, Start pauses |
| Enter / Space | Start, continue, or activate the focused button |
| P / Esc | Pause menu (Resume, Settings, Restart, Quit; also auto-pauses on blur or hidden tab) |
| O | Settings |
| M | Mute |

## Cats

- **Smudge** (black): chases Pip directly along the tile graph (shortest path, through the mouse-hole too).
- **Biscuit** (cream): walks a fixed patrol loop per maze; when Pip comes within 5 tiles it chases for 4 s, then resumes the patrol.
- **Tuxedo** (black/white): wanders; with a clear straight line of sight to Pip it winds up, then pounces along that line at 1.3x (levels 1-3) or 1.6x speed.
- **Ginger** (orange): targets the tile mirrored from Pip across the maze centre (nearest floor tile if that is a wall).

Cats leave the basket one by one on a timer. Drenched cats flee from Pip.

## Code map

| File | Role |
| --- | --- |
| `src/config/tuning.ts`, `src/config/feel.ts` | Every gameplay number, and every feel/audio-mix number (snapshot-guarded in `tests/tuning.test.ts`) |
| `src/strings.ts` | User-facing text |
| `src/types.ts` | Directions, tiles, PRNG |
| `src/maze.ts`, `src/mazes.ts` | ASCII parsing and tile queries; the three layouts, patrol routes, corners |
| `src/graph.ts` | BFS distance fields with tunnel wrap, maze validation |
| `src/movement.ts` | Continuous movement, buffered turns, tunnel wrap, render interpolation |
| `src/cats.ts`, `src/steer.ts` | Per-personality targets, pounce state machine; chase/flee/wander/pounce steering |
| `src/modes.ts`, `src/scoring.ts`, `src/levels.ts` | Chase/groom rhythm and drench timers, score/lives/chain, tuning curve and modifiers |
| `src/world.ts`, `src/step.ts`, `src/pipAi.ts` | World state, the 60 Hz tick, demo AI |
| `src/flow.ts`, `src/runStats.ts` | Phase state machine (title, ready, play, dying, clearing, summary, game over), pause/auto-pause, hit-stop, run results |
| `src/storage.ts`, `src/prefs.ts` | zod-validated settings, high score, top 5, stats; settings to runtime values |
| `src/render.ts`, `renderActors.ts`, `renderItems.ts`, `renderLayers.ts`, `drawStatic.ts`, `drawProps.ts`, `sprite*.ts`, `hud.ts`, `textStyle.ts`, `overlays.ts`, `particles.ts`, `theme.ts`, `layout.ts`, `contrast.ts` | Canvas rendering, fractional fit to the viewport, themes with contrast guarded by tests |
| `src/ui/*` | DOM dialogs: pause, confirmations, settings, how-to-play, game over; focus trap; screen-reader announcer |
| `src/audio.ts`, `src/sfxMap.ts`, `src/fx.ts` | WebAudio synth (compressor, volume, bass pulse); event-to-sound and event-to-effect tables |
| `src/input.ts`, `src/gamepad.ts`, `src/debug.ts`, `src/debugAudio.ts`, `src/main.ts` | Input, debug hook (only with `?debug=1`), `createApp()` loop wiring |

The simulation runs at a fixed 60 Hz (`FIXED_DT`) with an accumulator; rendering interpolates between ticks and never mutates the world. Reduce motion (Settings: System / On / Off) removes shake, flashes, strobing blinks and death spin, and cuts particle counts to 40%.
