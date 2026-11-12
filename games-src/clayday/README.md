# Clay Day

A first-person clay target shooting game for the browser. Aim over a countryside backdrop, break
clays thrown from the two houses at the edges of the field, and clear rounds of 25.

Everything is drawn in code (Canvas 2D shapes and gradients) and every sound is synthesised with WebAudio.
There are no external assets and no network access.

## Run it

```sh
npm install        # uses .npmrc (legacy-peer-deps=true)
npm run dev        # vite dev server
npm run build      # tsc --noEmit && vite build
npx vite preview --port 4929 --strictPort
npm test           # vitest
```

Add `?debug=1` to the URL to expose `window.__clay` (state, clay positions, fast-forward, jump to a round)
and `?seed=N` for a fixed round plan. Neither exists without `?debug=1`.

## Controls

| Input | Action |
| --- | --- |
| Mouse move / touch drag | Aim |
| Click / tap | Fire at that point (a tap aims and fires in one go) |
| Arrow keys or WASD | Aim with the keyboard |
| Space or Enter | Fire |
| R, right-click, Reload button | Reload early |
| P or Esc | Pause / resume |
| M | Mute |

## Rules and modes

- A round is 25 clays: singles, doubles (two clays, one or both houses, slightly staggered) and crossing
  pairs launched together from opposite houses. Minis (smaller, faster, worth more) arrive from round 2 and
  gold clays (worth the most) from round 3.
- The gun holds **2 shells**. After the second it reloads by itself (0.85 s), or press R to top up early.
  Before a pair is thrown the range tops the gun up so a double is always winnable.
- Pellets arrive about 0.11 s after the click, so you must **lead** a moving clay. The pattern breaks every
  clay inside the ring shown around the crosshair.
- **Combo**: consecutive hits raise a score multiplier (x1.25 per extra hit, up to x3). A miss resets it.
  Breaking both clays of a double or crossing adds a **double bonus**, also multiplied by the combo.
- **Clock**: campaign rounds have a time limit. Unthrown clays are forfeited when it hits zero. Clearing the
  round early pays a time bonus; a perfect 25/25 pays a perfect bonus.
- **Wind** from round 3 pushes clays sideways. The HUD shows speed and direction (text plus arrow) and a wind
  sock stands in the field.
- **Ratings** by hit share: Straight Down the Line (25), Sharp Shot, Steady Hand, Sporting Effort,
  Warming Up, Just Watching.
- **Campaign**: each round needs a minimum number of hits (15 rising to 21). Pass and the next round is
  faster and windier; fail and the run ends. Best run is saved.
- **Practice**: pick a round pace (1, 3, 5, 8, 10). No clock, no wind, no pass mark, scores not saved.

## Polish conventions

Implements the arcadeShop polish conventions: pause overlay (P / Esc) with in-page confirmation for restart
and quit, auto-pause on blur and tab hide, settings (volume, sound, reduce motion System/On/Off, colour-blind
assist, text size 100/125/150, theme), 44 px touch targets, contrast tests, keyboard focus ring and dialog
focus trap, `aria-live` status line, layouts for 1280x800, 400x860 and 860x400, a one-time dismissible hint,
fixed-timestep simulation with interpolated rendering, and settings/stats validated with zod per field.

## Design notes

- `sim.ts` is the DOM-free rules engine (ready countdown, throws, shots, scoring, clock). It runs at a fixed
  60 Hz step; the renderer interpolates clay positions with `alpha`. Clay paths are closed-form in age, so
  there is no integration drift and tests can predict exact positions.
- `throws.ts` plans a round from a seed. Every clay path is validated to stay on the field for the narrowest
  and widest stage shapes (wind drift included); `tests/throws.test.ts` checks this across rounds and aspects.
- The world size is fixed per round from the stage aspect (wide on desktop, narrower and taller on phones).
- All tuning lives in `src/config.ts` (zod-validated, frozen). All copy is in `src/strings.ts`.
- Tests: RNG determinism, planner and level validation, clay physics, scoring, gun, simulation (including
  a perfect-lead bot that clears rounds 1 to 20 inside the clock), settings/stats parsing, clock, world,
  contrast ratios for the UI tokens and the canvas scene.

## What is original

The game name, house art, gun, wind sock, scoring, rating names, round structure, modes and all text are
original to this project. Only generic genre mechanics are shared with other clay-shooting games: aiming at
thrown discs from a first-person view, two shells per load, doubles and crossing pairs, a time limit, a combo
and wind. No names, logos, sponsors, art, text or layouts from any existing game are used.
