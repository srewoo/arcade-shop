# Pop Cannon

An original arcade bubble shooter in the arcadeShop collection. TypeScript (strict), Vite, Canvas 2D. All art and sound are generated in code: no image or audio files, no network calls.

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (grid, snapping, matching, aim maths, levels, settings, simulation)
    npm run build      # tsc --noEmit + production build into dist/

Browser-test hook: `window.__pc` (start a mode, fire shots, step the simulation, render an offline audio burst) exists only in `npm run dev` or a build made with `VITE_E2E=1 npm run build`, and only when the URL has `?debug=1`. The normal production build does not contain it.

Puzzle calibration: `scripts/solve-puzzles.ts` is a beam-search solver (dev tool, not shipped). Bundle and run it with esbuild, for example `npx esbuild scripts/solve-puzzles.ts --bundle --platform=node --format=esm --outfile=/tmp/solve.mjs && node /tmp/solve.mjs 2500`. Its output is stored in `tests/puzzle-solutions.json`, and `tests/puzzles.test.ts` replays every solution through the real simulation.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Aim | Press and drag on the playfield | Left / Right arrows (or A / D), or the on-screen arrow buttons |
| Fire | Release the drag (release below the cannon to cancel) | Space / Up arrow, or the Fire button |
| Swap current and next bubble | Tap the NEXT bubble, or the Swap button | X |
| Pause (Resume / Restart / Settings / How to play / Quit) | Pause button | P or Esc (Esc also goes back on every menu screen) |
| Mute | Sound button | M |

A dotted guide shows the shot path with one wall bounce.

## Modes

- **Arcade**: endless levels. Each level adds colours (3 up to 6) and rows. The ceiling drops after N shots in a row that pop nothing (a miss budget; N shrinks with the level, 8 down to 3), and any pop resets the count. Clear the board to advance. Game over when a bubble crosses the red danger line.
- **Daily Arcade**: Arcade with a fixed seed per calendar day (`yyyymmdd`), so everyone on the same day gets the same boards; its best is stored separately.
- **Puzzle**: 12 hand-made layouts with a fixed shot queue (the queue length is the shot limit, about 1.6 x par). Clear all coloured bubbles for 1 to 3 stars: par (solver best + 1 or 2) is 3 stars, par plus a quarter of the slack up to the limit is 2 stars. No ceiling drop. Stars are saved per level.
- **Time Rush**: 90 seconds, endless boards (a cleared board gives a bonus, 3 extra seconds and a fresh one), ceiling drops after 7 misses. The HUD turns red and ticks in the last 10 seconds.

Scoring: pops are worth more for bigger groups, consecutive popping shots build a combo multiplier, and bubbles that lose their link to the ceiling drop for a growing bonus.

Special bubbles appear from level 3 (and in Puzzle levels 3+ and Time Rush):
- **Bomb** pops everything within two cells (except stones).
- **Rainbow** matches any colour; it joins the best neighbouring group when it lands.
- **Stone** never pops; it only falls when its support is gone. A board counts as cleared once only stones remain.

## Accessibility and settings

Settings (title or pause screen) are saved in localStorage and validated field by field with zod when read back:
- Volume 0 to 100 and Sound on/off (also `M`).
- Reduce motion: System / On / Off. On disables shake, flashes, pops, trail, recoil and the pulse, and cuts particles to 40%.
- Colour-blind assist: every colour gets its own shape (circle, triangle, square, diamond, star, cross). Also a one-click toggle on the title. Starts on when the OS asks for more contrast.
- Text size 100 / 125 / 150% (page and canvas text) and a high-contrast aim guide.
- Theme: system / light / dark.

Menus trap focus (the page behind is inert), Esc goes back, and focus returns to the opener. The first game shows a three-step coach card once; special bubbles and the ceiling counter get a one-line hint the first time they appear. The game auto-pauses when the tab is hidden or the window loses focus.

Storage keys: `pc-settings`, `pc-scores` (high score per mode, today's Daily best and puzzle stars; version 2, older saves keep their point bests but restart puzzle stars because the pars changed). All storage access is wrapped in try/catch.

Gameplay numbers live in `src/config.ts` (zod-validated, frozen). UI text lives in `src/strings.ts`.

## Code map

| File | Role |
| --- | --- |
| `src/hex.ts` | Pure grid geometry: constants, offset-row coordinates, neighbours, pixel to cell snapping, collision |
| `src/match.ts` | Pure rules: flood-fill match, bomb blast, floating detection, ceiling drop, clear check |
| `src/aim.ts` | Pure aim maths: angle clamp, wall reflection, shot tracing (shared by the guide and the real shot) |
| `src/levels.ts` | The 12 puzzle layouts, parser and star rating |
| `src/rules.ts` | Arcade difficulty curve, seeded RNG, shooter and row generation |
| `src/config.ts` | Frozen, zod-validated tuning (speeds, scoring, odds, timers, fx) |
| `src/state.ts` | Game state, board loading, shooter queue |
| `src/shoot.ts`, `src/resolve.ts` | Fire, swap, flight; landing, scoring, ceiling drops, win/lose checks |
| `src/update.ts`, `src/clock.ts` | Fixed-timestep tick (60 Hz) and the accumulator / interpolation factor |
| `src/effects.ts` | Particles, pops, falling bubbles, ball trail, score popups |
| `src/preview.ts`, `src/bot.ts` | Aim preview (landing and pop group) and the greedy bot used by tests and the debug hook |
| `src/render*.ts`, `src/sprites.ts`, `src/drawBubble.ts`, `src/palette.ts` | Canvas drawing: scene, parts, guide, effects layer, cached sprites, colours and symbols |
| `src/audio.ts`, `src/audioPlan.ts` | WebAudio bus (master gain + compressor) and the pure per-event sound plan |
| `src/input.ts` | Keyboard, mouse and touch handling |
| `src/overlay.ts`, `src/screens.ts`, `src/settingsScreen.ts`, `src/coach.ts`, `src/dom.ts` | Overlay (focus trap, Esc), screens, settings panel, coach card |
| `src/hud.ts`, `src/hints.ts`, `src/result.ts`, `src/strings.ts`, `src/canvasFit.ts` | HUD text, first-seen hints, result content, UI strings, canvas sizing |
| `src/settings.ts` | zod schemas, defaults, localStorage access, score recording |
| `src/main.ts`, `src/debug.ts` | Wiring and the `?debug=1` hook |

The simulation runs on a fixed 1/60 s step with an accumulator, independent of the render frame rate; rendering interpolates between the previous and current state, so 120 and 144 Hz screens are smooth. The ball flies in fixed 4 px slices, so the aim guide and the real shot land in the same cell. Rows are offset by half a cell; a ceiling drop shifts the grid data down one row and flips a `phase` flag, so cell positions stay consistent without moving any bubble sideways.
