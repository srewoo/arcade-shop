# Updraft

A one-button cave flyer for the browser. Hold to rise, release to fall, and thread a scrolling,
procedurally generated tunnel that narrows the further you go. Distance plus coins is your score.

## Run

```bash
npm install          # uses .npmrc (legacy-peer-deps=true)
npm run dev          # vite dev server
npm test             # vitest
npm run build        # tsc --noEmit && vite build
npx vite preview --port 4927 --strictPort
```

Add `?debug=1` to the URL to get `window.__updraft` (state read-out and a built-in autopilot) for tests.

## Controls

| Input | Action |
| --- | --- |
| Hold `Space` / `ArrowUp` / `W`, mouse button or touch on the cave | Rise (release to fall) |
| `P` or `Esc` | Pause (Resume / Restart / Settings / Quit, with in-page confirmation) |
| `M` | Mute |

The run auto-pauses when the tab is hidden or the window loses focus. Resume is always manual.

## Modes

- **Endless**: a fresh random cave each run.
- **Daily**: one cave per UTC day, shared by everyone (seed `daily-YYYY-MM-DD`). Its best resets each day.
- **Practice**: the same cave every time, with a dashed **ghost** of your best run flying alongside.
  Daily also keeps a ghost for the current day's cave.

## Rules

- The craft starts mid-cave and waits for your first press (no timers run before that).
- Touching rock or a pillar ends the run. Coins are worth 25 points; each metre is 1 point.
- The gap shrinks from 300 to 150 units over about 7,500 units of travel (the HUD "Gap" tile shows it)
  while scroll speed ramps from 230 to 380 units/s. Pillars appear after the opening stretch.

## Design notes

- **Deterministic, fixed-timestep sim.** `sim.ts` steps at 60 Hz with no `Math.random`; `world.ts`
  generates columns strictly in order from a seeded mulberry32 RNG, so a seed always gives the same cave.
  Rendering interpolates between the previous and current sim state (`alpha`), so 120/144 Hz screens are smooth.
- **Ghost = inputs, not positions.** A run is recorded as the ticks at which the rise input toggled; the
  ghost re-simulates the same seed from those toggles (tested to match the original run exactly).
- **Level validation.** `bot.ts` is a small velocity-tracking autopilot. Tests fly it through 200 seeds past
  full narrowing, and check wall bounds, slope limits, pillar clearance and coin placement for 40 seeds.
- **Persistence.** Settings, bests and ghosts live in `localStorage` (`updraft-settings`, `updraft-best`,
  `updraft-ghosts`), parsed with zod per field with fallbacks; storage failures never throw.
- **Accessibility.** Pause/settings dialogs trap focus and restore it; 44 px touch targets; reduce motion
  (System/On/Off) removes shake, flash and parallax and cuts particles to 40%; colour-blind assist adds
  hatching on pillars and thicker outlines (coins and rock already differ in shape); text size 100/125/150;
  light/dark/system theme; contrast ratios are checked in `tests/contrast.test.ts`.
- **All art is code** (canvas shapes and gradients) and **all audio is synthesised** with WebAudio. No assets, no network.
- Tuning lives in `src/config.ts`; dynamic strings in `src/strings.ts`.

## What is original

Updraft is an original game. It shares only the generic genre idea (hold-to-rise cave flyer) with older
browser games. The name, the arrow-wing craft, the coin/pillar/narrowing/ghost/daily-seed systems, the
procedural generator, the visuals and the sounds are all written from scratch here. No text, art, names,
logos, sponsor marks or level layouts from any existing game are used.
