# Tiny Links

Top-down mini golf for one to four players on one screen. Eighteen original holes, played as the Front 9, the
Back 9 or the full 18. Everything (turf, walls, water, sand, ball, flag, particles) is drawn in code on canvas and
all sound is synthesised with WebAudio. No assets, no network.

## Run

```bash
npm install          # uses .npmrc (legacy-peer-deps=true)
npm run dev          # vite dev server
npm test             # vitest (physics, scoring, level validity incl. a putting bot that holes out every hole)
npm run build        # tsc --noEmit && vite build
```

Add `?debug=1` to the URL to get `window.__tinylinks` (`start`, `strike`, `bot`, `playHole`, `advance`, `state`).

## Controls

| Input | Action |
| --- | --- |
| Drag back from anywhere and release (mouse or touch) | Putt: the further you pull, the harder; release inside the small dead zone to cancel |
| `←` `→` (or `A` `D`) | Rotate the aim; hold `Shift` for fine steps |
| `↑` `↓` (or `W` `S`) | Power up / down; `Shift` for fine steps |
| `Space` / `Enter` or the Putt button | Putt |
| `C` | Scorecard |
| `P` / `Esc` | Pause (Resume / Restart / Settings / Quit, with in-page confirmation) |
| `M` | Mute |

The round auto-pauses when the tab is hidden or the window loses focus. Resume is always manual.

## Rules

- Players take a hole in turn; the best score on the previous hole tees off first. Eight strokes is the limit (pick up).
- Water and the void add one penalty stroke and put the ball back where it was last at rest.
- Sand is slow, ramps (chevrons) bend a rolling ball, posts are bumpers, and from hole 9 on, gates and spinners move.
- A ball that reaches the cup too fast (> 250 u/s) skips over it.

## Code map

- `src/physics`: deterministic fixed-step (1/120 s) ball simulation, collisions, movers, and a bot (`solver.ts`) used by tests and debug autoplay.
- `src/course`: the 18 holes as data, plus `validate.ts` (tee/cup/walls checks, reachability via a distance field).
- `src/game`: turn flow, match bookkeeping, scoring names, aim maths, scorecard model.
- `src/render`: pre-rendered course layer (turf stripes, bevelled walls, sand grain, water) plus the per-frame layer (shimmer, movers, flag, ball, guide, particles).
- `src/ui`: HUD, input, setup/title, scorecard, dialogs, settings panel.
- Storage keys (`tinylinks:` prefix): `settings`, `setup`, `best`, `onboarded`.
