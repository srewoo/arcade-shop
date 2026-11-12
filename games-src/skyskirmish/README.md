# Sky Skirmish

A vertical-scrolling arcade air-combat shooter for the browser. Fly a lone fighter up the screen, shoot down enemy waves, survive a boss every fourth wave, and chase a high score. Canvas 2D, all art drawn in code, all audio synthesised with WebAudio, no assets, no network.

## Run

```bash
cd skyskirmish
npm install        # uses .npmrc (legacy-peer-deps=true)
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build      # tsc --noEmit && vite build -> dist/
npm run preview    # serve the production build
```

Add `?debug=1` to the URL to expose `window.__sky` (summary, god mode, killAll, gotoWave, downNow). Without it nothing is exposed.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move | Arrow keys or WASD | Drag anywhere on the field (the plane keeps its offset from your finger) |
| Fire | Space or Z (or turn on Auto-fire) | Fires while dragging |
| Bomb | B | Bomb button |
| Pause | P or Esc | Pause button |
| Mute | M | Settings, Sound |

Auto-fire is on by default. Pausing also happens automatically when the tab loses focus or is hidden.

## Modes and difficulty

- **Campaign**: 12 waves with bosses on waves 4, 8 and 12. Beat the last boss to win (win bonus).
- **Endless**: no end; waves and bosses keep scaling.
- **Easy / Normal / Hard** change lives (5/3/2), continues (3/2/1), starting bombs, enemy health, enemy bullet speed, fire rate, wave size, drop rate and the score factor.
- **Continues**: when the last life goes you can continue (keeps score and wave, refills lives, clears the screen) until the difficulty's continues run out.
- **High score**: best score and wave are stored per mode and difficulty.

## Game rules

- **Enemies**: scouts (fly straight or in sine columns), weavers (fire straight down), gunners (aimed shots), tanks (heavy, three-way aimed fan, always drop a power-up). Kinds unlock by wave number. Formations: line, column, V, diagonal sweep, hold-and-shoot.
- **Bosses** enter, then sweep side to side. Three attack phases switch as health drops: fan, aimed bursts plus a wide fan, then a rotating spiral. They only take damage once fully on screen.
- **Power-ups** (letters on the pickups, so they never rely on colour): **S** spread shot (stacks to three levels, timed; a hit knocks one level off), **H** shield (absorbs one hit), **B** bomb (clears enemy fire and heavily damages everything on screen; stock of 3).
- **Score multiplier**: every 4 kills in a chain raises the multiplier (max x8). It drains one step if you stop scoring for a few seconds and resets when you are hit. Wave clears and boss kills give bonuses.

## Settings

Volume, Sound, Auto-fire, Reduce motion (System/On/Off; On disables shake, flashes and parallax and cuts particles to 40%), Colour-blind assist (yellow diamond enemy fire with a heavy outline, blue/yellow pairing), Text size (100/125/150%), Theme (System/Light/Dark). Everything is validated with zod on load, field by field, and stored under `sky-settings` / `sky-scores` / `sky-hint-seen`.

## Design notes

- `src/config.ts` holds every tuning number. `src/strings.ts` holds every UI string.
- The simulation (`step.ts`, `player.ts`, `combat.ts`, `enemies.ts`, `boss.ts`, `director.ts`, `scoring.ts`, `waves.ts`) is DOM-free, runs at a fixed 60 Hz, and draws all randomness from one seeded mulberry32 RNG, so a seed plus an input script replays exactly. The renderer interpolates between the previous and current step (alpha = accumulator / step), so 120/144 Hz screens stay smooth without changing results.
- Waves are generated from the seed and wave number, then checked by `validateWave` (bounds, order, boss placement, spawn caps); tests validate waves 1 to 80 on every difficulty.
- Layout: 9:16 field fitted to the stage; HUD strip on top in portrait, side column in landscape. Canvas uses devicePixelRatio capped at 2. Touch targets are at least 44 px, HUD text at least 12 px, focus rings and focus traps on dialogs, `aria-live` status line for key events.
- Production build ships a strict CSP (no remote hosts, no inline script, no eval).

## What is original

The game, its name, art, wave patterns, enemy roster, boss behaviours, sounds and level design were written from scratch. The only reference was the general genre of vertical shooters; no names, characters, logos, text, sponsors, art or level layouts from any existing Flash game are used. Plane and enemy shapes are plain polygons drawn in code.

## Known limits

- Fixed 9:16 field (not stretched in landscape; the HUD fills the side instead).
- No gamepad support and no music, only sound effects.
- Particle and shake effects use `Math.random` (render only, never feeds the simulation).
