# Redline Rush

A top-down endless traffic racer for the browser. Thread a five-lane highway, skim past cars for near-miss bonus, grab fuel and boost, and survive as the speed climbs. Canvas 2D, all art drawn in code, all audio synthesised with WebAudio. No external assets, no network.

## Run

```
npm install          # uses .npmrc (legacy-peer-deps=true)
npm run dev          # dev server
npm run build        # tsc --noEmit + vite build
npx vite preview --port 4921 --strictPort
npm test             # vitest
npx tsc --noEmit
```

Debug hooks (`window.__redline`: `sim()`, `phase()`, `settings()`, `records()`, `patch()`) exist only with `?debug=1` or in the dev server.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Steer | Left / Right or A / D | left and right pads |
| Accelerate | Up or W | up pad |
| Brake | Down or S | down pad |
| Pause | P or Esc | pause button |
| Mute | M | speaker button |

Touch pads appear automatically on coarse-pointer devices while playing.

## Modes

- **Endless**: three armor points and a fuel tank. Top speed keeps rising with distance until a cap. The run ends when armor or fuel hits zero.
- **Time Trial**: no fuel. Five checkpoints over 3200 units; each one adds time. Reach the last one (the finish line) before the clock hits zero. Finishing pays a bonus plus points for time left.
- **Daily Seed**: Endless on a road seeded from today's local date. Everyone gets the same traffic and pickups that day; the personal best is kept per day.

## Rules and scoring

- Hitting a car costs one armor, drops you to a crawl, resets your combo and gives 1.8 s of invulnerability.
- **Near miss**: pass a car with a gap under 0.4 lane without touching it. Each one adds 50 points times a multiplier that grows every 3 chained misses (cap x5). The chain expires after 3 s. Boost doubles the bonus.
- Distance pays 0.5 points per unit. Pickups pay 25.
- **Fuel** pickups restore 40%. **Boost** gives 2.6 s of extra top speed and stronger acceleration.
- Personal bests persist in localStorage (`redline-records`), validated with zod per field.

## Settings (all persisted under `redline-settings`, validated per field)

Volume, sound, reduce motion (System / On / Off), colour-blind assist, text size (100 / 125 / 150), theme (System / Light / Dark). Reduce motion removes screen shake, flashes, speed lines and scenery, and trims particles to 40%. Colour-blind assist adds text labels and heavier outlines to pickups, a dashed outline on your car and a hatch pattern on the fuel gauge. Low fuel always shows a "LOW" label, not just a colour change.

## Design notes

- **Fixed-timestep sim** (60 Hz) with render interpolation (`alpha = accumulator / step`), so 120 and 144 Hz screens are smooth and results do not depend on frame rate. The sim is pure TypeScript with no DOM access.
- **Deterministic track**: rows depend only on the seed and row index, never on the player. Every row leaves a "path lane" free; the path moves at most one lane per row, and row spacing is chosen so a lane change fits between rows at top speed. A test drives an oracle along the path lane across 20 seeds and requires a crash-free finish, which validates that the generated road is always passable.
- **Pause**: P / Esc, auto-pause on window blur and tab hide, held inputs cleared, restart and quit confirm in-page, settings opened mid-run pause first.
- **Layout**: canvas keeps a 400x640 logical size and fits the stage with a DPR-aware backing store (capped at 2). Portrait puts the HUD above the road, landscape moves it to a side column.
- **Accessibility**: 44 px touch targets, WCAG contrast checked in tests for both themes and the canvas palette, focus ring, focus-trapped dialogs, `aria-live` status line for key events, canvas `aria-label`.
- Tuning lives in `src/config.ts`; user-facing text in `src/strings.ts`.

## Source map

`sim*.ts` rules and step, `track.ts` road generator, `scoring.ts`, `rng.ts`, `records.ts` and `settings.ts` (zod), `render*.ts` canvas drawing, `audio*.ts` WebAudio synth and pure sound plans, `main.ts` phases and frame loop, `ui/` DOM helpers, `style/` CSS.

## What is original

This is an original game. The only reference was the generic genre (a top-down, lane-dodging traffic racer). The name, car art, HUD, mode set, scoring rules, track generator, sounds and all code were written from scratch for this project; no character, logo, sponsor name, text, art or level layout from any existing Flash game is used. The lane-dodging idea, fuel pickups and near-miss bonuses are standard genre mechanics.
