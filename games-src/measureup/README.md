# Measure Up

A water-jug measuring puzzle in the browser. Wick, a small lamp sprite, is stuck behind a stone gate in a cave. The gate's brass plate shows an amount. Make the jugs hold exactly that amount and the handle turns, the bars rise and Wick walks free.

35 campaign levels (2, 3 and 4 jugs), a quick-puzzle mode with seeded random puzzles, undo, hints and a three-star rating. Every level and every generated puzzle is checked by a breadth-first solver, and the solver's shortest path is the level's **par**.

## Run

```bash
npm install          # uses .npmrc (legacy-peer-deps=true)
npm run dev          # http://localhost:5173
npm test             # vitest
npm run typecheck
npm run build && npx vite preview --port 4924 --strictPort
```

Append `?debug=1` to the URL for the test hooks (`window.__measureup.state()`, `.solution()`, `.levels()`). They are not exposed otherwise.

## How to play

You have 2 to 4 jugs with fixed sizes and no markings. Three things are allowed:

- **Fill** a jug to the brim from the well.
- **Empty** a jug completely down the drain.
- **Pour** one jug into another until the source is empty or the target is full.

Tap a jug to pick it (it gets a border and a marker), then tap **Fill**, **Empty**, or another jug to pour into. Tap the picked jug again to cancel. The dashed line with a star on a jug marks the plate amount. Some plates say **HOLD TWICE** (for example `8 + 8`): two jugs must each hold that amount, so you split the water into two equal shares.

### Controls

| Input | Action |
| --- | --- |
| Tap / click a jug | Pick it, or pour the picked jug into it |
| `1`-`4` | Same as tapping jug A-D |
| `F` / `E` | Fill / empty the picked jug |
| `U` | Undo the last move |
| `H` | Hint (shows the best next move) |
| `R` | Restart the level (asks first if you have moved) |
| `P` or `Esc` | Pause; `Esc` closes dialogs |
| `M` | Mute |
| `Tab`, `Enter`, `Space` | Everything is reachable by keyboard with a visible focus ring |

### Stars

- 3 stars: finish in par moves or fewer (par is the BFS optimum, so this means a perfect solve).
- 2 stars: within `max(2, ceil(par / 2))` moves of par.
- 1 star: anything else.
- Using any hint caps the result at 2 stars. Undo is free and just removes the move from your count.

Progress (best stars and fewest moves per level) is stored in `localStorage`. You can open the first unfinished level plus 3 beyond it, so one stuck level never blocks the rest.

## Modes

- **Campaign**: 35 hand-ordered levels. Levels 1-8 use two jugs, 9-15 three jugs, 16-21 are split-water puzzles on three jugs (including the public-domain 8/5/3 "halve the water" and a 19/13/7 set), and 22-35 use four jugs, some with a full starting jug that has to be split or measured.
- **Quick puzzle**: Easy, Medium or Hard. A seed produces the same puzzle every time. The generator keeps only puzzles whose solver par lands inside the tier's window (see `config.ts`). Quick puzzles are not saved to campaign progress.

## Settings and accessibility

Pause menu (Resume, Restart, Settings, Quit) with in-page confirmations; auto-pause when the tab is hidden or the window loses focus. Settings: volume, sound on/off, reduce motion (System / On / Off), colour-blind assist (adds a distinct fill pattern per jug), text size 100/125/150%, theme (System / Light / Dark). All of it persists, and every stored field is validated with zod and falls back on its own. Touch targets are at least 44px, jugs are labelled A-D (colour is never the only cue), and the status line is an `aria-live` region. Contrast of the palette is asserted in `tests/contrast.test.ts`.

## Design notes

- **Rules** (`src/jugs.ts`) are pure functions with no DOM. A move that changes nothing returns `null`, so illegal moves cost nothing and make no sound of success.
- **Solver** (`src/solver.ts`) is a plain BFS over jug states, keyed by a base-(max capacity + 1) integer. The same code produces par, the hint (first step of the shortest path from where you are now) and generator validation. Because hints are re-solved from the current position, they stay correct after a detour.
- **Levels** (`src/levels.ts`) are rows of capacities, starting water and a goal. Par is never typed in: it is computed at load, and an unsolvable row throws. `tests/levels.test.ts` also pins a few pars as a regression guard.
- **Goal model**: "at least `count` jugs each hold exactly `amount`". `count = 1` is a measure, `count = 2` is a split.
- **Turn-based**, so there is no fixed-timestep simulation. The only clock is the elapsed-time display, which runs between your first move and the win and stops while any dialog is open or the tab is hidden.
- **Tuning** lives in `src/config.ts` (scoring slack, hint cap, unlock window, quick tiers, animation timings). **Strings** live in `src/strings.ts`; `index.html` labels carry `data-s` keys filled from it, and a test checks every key exists.
- DOM and CSS for the jugs, SVG drawn in code for the cave, gate, handle and Wick. Audio is synthesised with WebAudio (no files). No network access, no external assets, no dependencies beyond `zod`.

## What is original

All of it. The cave scene, Wick, the plate-and-handle gate, level list, names, level data, scoring, solver-based hints, quick-puzzle generator, sounds and code are new for this project. The only inherited ideas are genre mechanics: fixed-capacity jugs with fill, empty and pour moves, and the classic public-domain puzzles (such as measuring 4 with a 3 and a 5, or halving 8 with 8/5/3). No names, characters, art, text, sponsors or level layouts from any existing game are used.

## Layout

```
src/
  jugs.ts solver.ts levels.ts generator.ts rng.ts   rules, BFS, content, seeded puzzles
  game.ts scoring.ts progress.ts settings.ts timer.ts   state, stars, persistence
  play.ts nav.ts input.ts main.ts                    controllers and wiring
  ui/                                                scene, jugs, dialogs, settings panel, fx
  style/                                             tokens, base, play, panels
tests/                                               vitest (rules, solver, levels, scoring, settings, rng, contrast)
```
