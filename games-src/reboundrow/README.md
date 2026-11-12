# Rebound Row

A browser brick-breaker. Steer a paddle, bounce the ball, clear 34 hand-made boards or play an endless run. Everything is drawn on a canvas in code and every sound is synthesised with WebAudio: no images, audio files, fonts or network access.

## Run

```
npm install        # uses .npmrc (legacy-peer-deps=true)
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build      # tsc --noEmit && vite build
npx vite preview --port 4930 --strictPort
```

Add `?debug=1` to the URL to expose `window.__rr` (state, autoplay, start, power, fast, dropBalls) for tests. `?seed=N` fixes the RNG seed.

## Controls

| Input | Action |
| --- | --- |
| Mouse move / touch drag | Move the paddle |
| Arrow keys or A / D | Move the paddle |
| Space, Enter, click or tap | Launch the ball |
| P or Esc | Pause (Resume, Restart level, Settings, Quit to title) |
| M | Mute |

The game auto-pauses when the tab is hidden or the window loses focus. Restart and Quit ask for confirmation.

## Modes

- **Campaign**: 34 levels, unlocked in order, with a level-select grid. Score and lives carry from level to level; the best score is saved.
- **Endless**: seeded random boards that get taller, tougher and slightly faster. The best score and deepest board are saved.

## Rules and power-ups

- Bricks take 1, 2 or 3 hits (colour plus dots; assist mode adds stripes and numerals). Steel bricks (hatched grey) never break.
- Where the ball hits the paddle sets its angle: centre goes straight up, the edges up to 60 degrees out.
- Chain brick hits without touching the paddle for a score multiplier (x2 per 5 hits, up to x4). Extra life every 5000 points (max 6).
- Capsules drop from lettered bricks and from about 10% of others: **W** wide paddle (14 s), **M** multiball (splits every ball into three, max 8), **S** slow ball (10 s), **L** laser (10 s, auto-fires).

## Settings

Volume, sound on/off, reduce motion (System / On / Off), colour-blind assist, text size (100 / 125 / 150%) and theme (System / Light / Dark). Stored under `rr-settings` and validated per field with zod; progress is stored under `rr-progress`.

## Level format

One string per level: `Name|row/row/row`, top to bottom, 12 columns per row.

```
.  empty            1 2 3  bricks needing that many hits      #  indestructible
w m s l  one-hit bricks that always drop wide / multi / slow / laser
~  prefix: the row lists only the left 6 columns and is mirrored
```

`validateLevel` checks row width and count, that something is breakable, and that no brick is sealed behind steel. Tests run it on every level and on generated endless boards, and a deterministic bot clears a sample of campaign levels.

## Design notes

- `src/config.ts` holds every tuning number. `src/strings.ts` holds all UI text.
- The simulation (`src/sim`) is DOM-free and runs at a fixed 120 Hz step. The renderer interpolates between the previous and current positions, so 120/144 Hz displays are smooth and results do not depend on frame rate.
- Collision is swept: the ball is a circle cast against walls, the paddle and every brick in its path, resolved in time order with up to 8 contacts per step. A test fires a 20000 px/s ball at a full wall to prove it cannot tunnel.
- All randomness in the simulation uses a seeded mulberry32 generator, so the same seed gives the identical run.
- The playfield is always dark so ball, bricks and paddle keep at least 3:1 contrast in both themes; this is enforced in `tests/contrast.test.ts`.
- Layout: portrait stacks HUD over the board; landscape puts the HUD beside it. Touch targets are at least 44 px; the canvas uses devicePixelRatio capped at 2.

## What is original

This is an original game built on the generic brick-breaker genre (paddle, ball, bricks, power-ups). The name, art, level layouts, sounds, text and code are all new; nothing is taken from any existing game. Levels are hand-written for this project and the endless boards come from a seeded generator.
