# Kerbside

Top-down precision parking for the browser. Steer a car with a real bicycle-model (front wheels turn, the car pivots about its rear axle), reverse into tight bays, and stop inside the highlighted bay without touching anything. 24 levels: straight-in, reverse bays, parallel, angled, garages, and finally towing a trailer. TypeScript (strict), Vite, Canvas 2D, zod. All art is drawn in code and all audio is synthesised with WebAudio: no external assets, no network.

## Run

    npm install        # uses .npmrc (legacy-peer-deps=true)
    npm run dev        # play locally
    npm test           # unit tests (rules, physics, scoring, level validation + solver, settings, RNG, contrast)
    npm run typecheck  # tsc --noEmit
    npm run build      # typecheck + production build into dist/
    npm run preview    # serve dist/

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Drive forward | Up / W | Drive pedal |
| Reverse | Down / S | Reverse pedal |
| Steer | Left / Right or A / D | Drag the wheel left or right |
| Handbrake | Space | Brake pedal |
| Pause | P or Esc | Pause button |
| Mute | M | Speaker button |

Pressing the opposite pedal brakes first, then reverses. The wheel returns to centre when you let go. On-screen pedals and wheel appear automatically on touch devices (Settings: Auto / On / Off).

## How a level works

- The clock starts on your first input, not when the level loads, and stops while paused or in any menu.
- Park by getting every corner of the car (and of the trailer, where the level asks for it) inside the glowing bay, lined up within 12 degrees of its axis in either direction, and stopped (under 0.12 m/s) for 0.7 s. A progress bar fills along the bay while you hold.
- Touching a car, kerb, wall, cone, pillar or the lot edge is a bump: +1 damage, with a 0.7 s cooldown so one scrape is one bump. Five bumps wrecks the car. Running out of time also ends the attempt.
- Stars: 1 for parking, 1 for a clean park (no damage), 1 for beating the level's par time. A level unlocks when the previous one has at least one star. Best time, damage and score per level are saved.

## Levels

| # | Theme |
| --- | --- |
| 1-3 | Straight-in and turn-in bays, then between two parked cars |
| 4-8 | Reverse bays: narrowing bays, opposite rows of cars, cones |
| 9-14 | Parallel parking between cars along a kerb, shrinking gaps (two are mirrored) |
| 15-18 | Angled bays at 20 to 45 degrees |
| 19-20 | Walled garage; garage with pillars |
| 21-22 | Trailer on: park the whole rig in a long kerbside bay |
| 23-24 | Caravan pitches: reverse only the trailer into the bay |

## Settings

Volume, Sound, Reduce motion (System / On / Off), Colour-blind assist (hatched bay, thicker outline), Text size (100 / 125 / 150%), Theme (System / Light / Dark), On-screen controls (Auto / On / Off). Stored under `kerbside-settings`, validated with zod, each bad field falls back on its own. Records live in `kerbside-progress` (per-level validation) and the first-run hint flag in `kerbside-seen`. The game auto-pauses when the tab is hidden or the window loses focus.

## Design notes

- **Physics** (`src/car.ts`): kinematic bicycle model at a fixed 60 Hz step. Rear axle is the pivot, yaw rate = v / wheelbase * tan(steer), the steering angle is rate-limited and self-centres, speed has separate forward and reverse limits. The trailer is a single-axle model with the hitch behind the rear axle; a fold of more than about 77 degrees counts as a jackknife crash.
- **Collisions** (`src/geom.ts`, `src/sim.ts`): oriented boxes with the separating-axis test. A blocked step is reverted and the car bounces back at 28% speed.
- **Fixed timestep** (`src/session.ts`): the simulation runs in whole 1/60 s steps; the renderer interpolates between the previous and current state, so 120/144 Hz screens are smooth and results do not depend on frame rate.
- **Level validation** (`src/validate.ts`, `src/solver.ts`): every level is structurally checked (start free, bay clear and large enough, par below the limit) and proven solvable by a hybrid-A* planner that searches constant-steer arcs forward and in reverse with a 10 cm safety margin (the trailer is part of the search state). The tests fail if a level cannot be solved.
- **Layout**: the whole lot is always visible. Wide lots turn 90 degrees on tall phone screens so they use the full width. In landscape the HUD moves to a side column (roomy screens) or a compact top row (phones).
- **Config** (`src/config.ts`) holds every tuning number; `src/strings.ts` holds user-facing text.
- **Debug hooks** (`window.__kerbside`) exist only with `?debug=1` or the dev server.

## Code map

| Path | Role |
| --- | --- |
| `src/config.ts`, `strings.ts`, `rng.ts` | Tuning, text, seeded PRNG (decor is deterministic per level) |
| `src/geom.ts`, `car.ts`, `sim.ts`, `session.ts` | Pure, DOM-free rules and stepping |
| `src/levels/*` | Level types, building blocks, parametric layouts, the 24 level definitions |
| `src/solver.ts`, `validate.ts`, `scoring.ts` | Planner, validation, stars and points |
| `src/settings.ts`, `progress.ts`, `storage.ts` | zod-validated persistence |
| `src/audio.ts` | WebAudio engine hum, reverse beeper, bump, park and fail cues |
| `src/render/*` | Canvas: camera fit, static layer cache, car and street art, particles |
| `src/ui/*`, `app.ts`, `wiring.ts` | DOM screens, overlays with focus trap, HUD, input, touch controls |

## What is original

The genre (top-down parking with a bicycle-model car) is generic. The name, levels, layouts, art, text, sounds, scoring and UI here were all written from scratch for this collection. A genre reference screenshot was used only to confirm the genre. No names, characters, logos, sponsor marks, text, art or level layouts from any existing parking game are used. Levels are parametric lot layouts built from public-domain parking geometry (nose-in rows, kerbside gaps, angled rows).
