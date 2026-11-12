# Corner Pocket

An original arcade mini-pool game for the arcadeShop collection, written in TypeScript (strict) and built with Vite. It is the replacement for the old Excel-embedded Flash "Mini Pool" game. Only the genre (a timed pool/golf hybrid with "hole in one" bonuses) was used as reference; all art and sound are procedural, with no external assets or network calls.

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (physics, rules, CPU, layouts, settings)
    npm run build      # tsc --noEmit + production build into dist/

Dependencies are pinned exactly: vite 7.3.7, vitest 4.1.12, typescript 5.6.3, zod 4.6.7. Add `?debug=1` to the URL to expose `window.__cp` (current game, view, settings, start(), pause(), per-sound peak level) for browser tests.

## Controls

| Input | Action |
| --- | --- |
| Drag back from the cue ball, release | Slingshot shot: pull direction is opposite to the shot, pull length is power. Release with a tiny pull to cancel. |
| Tap elsewhere on the table | Aim at that point |
| `Left` / `Right` (`Shift` = fine) | Rotate aim; the on-screen Aim buttons do the same on touch |
| Hold `Space`, release | Charge power, then shoot (or use the Shoot button) |
| `Up` / `Down` | Cue ball spin: back, centre, top (half steps); also the Spin buttons |
| Ball in hand | Move the mouse/finger or arrow keys, click/release or `Enter` to place |
| `N` next legal ball, `1` `2` `3` power presets, `Enter` shoot | Keyboard-only play |
| `P` / `Esc` pause (Resume, Restart, Settings, Quit; Restart and Quit ask first). The game also pauses when the tab is hidden or the window loses focus | |
| `M` mute, `R` restart (asks first) | |

Spin is applied once, right after the cue ball's first ball contact: top spin follows through, back spin draws back. The portrait layout (phones) rotates the table vertically.

## Modes

- **Rack Attack:** clear each scattered rack before the timer ends. Every pot adds seconds (the chain length, capped at 3 s; it was 5 s before the balance pass) and 100 x combo points; a miss breaks the combo. First shot of a rack that pots = Hole in one (+250). Clearing a rack without a miss or scratch = Clean Sweep (+500, +10 s). A scratch costs 5 s. Racks grow from 4 to 9 balls. The clock starts on your first shot, and from rack 4 each new rack gives 5 s less time (floor 15 s), so a near-perfect player still ends a run. All of these numbers live in `src/config/rack.ts`.
- **Trick Shots:** 15 hand-made puzzles, each with a shot limit. 3 stars at par, 2 at par + 1, 1 within the limit. A scratch costs a shot and the cue ball returns to its start. Par values were checked against a brute-force solver.
- **8-Ball vs CPU:** groups assigned on the first legal pot (call-free), the 8 goes last, scratch / no contact / wrong group first = foul and ball in hand for the opponent. Potting the 8 early, on the break or with a foul loses. The CPU generates ghost-ball candidates for every legal ball and pocket, simulates each with the real physics, scores them and plays the best. Easy adds about 2 degrees of aim noise and sometimes picks the runner-up; Pro adds about 0.2 degrees.
- **2-Player 8-Ball:** the same rules, hot-seat.

The Difficulty setting (menu) also controls the aim guide: Easy draws long deflection lines, Pro short ones. Settings, high scores, trick stars and CPU record are stored in localStorage (`cornerpocket-settings`, `cornerpocket-progress`) and validated with zod when read back; all storage access is wrapped in try/catch.

## Code

| File | Role |
| --- | --- |
| `src/constants.ts` | Table size, pockets, friction, restitution, timestep (240 Hz) |
| `src/physics.ts` | Sub-stepped integration, elastic ball collisions resolved at the contact point, cushions, pocket capture, spin |
| `src/sim.ts` | Shot application and headless `simulateShot` (used by tests and the CPU) |
| `src/aim.ts` | Ghost-ball aim guide: first contact and deflection directions |
| `src/rules8.ts` | 8-ball rule state machine |
| `src/rack.ts` | Rack Attack timer and scoring |
| `src/cpu.ts` | CPU candidate search, scoring, noise, cue placement |
| `src/layouts.ts`, `src/tricks.ts` | Scattered racks, the 8-ball triangle, the 15 trick layouts and star rules |
| `src/game.ts`, `src/modes/*` | DOM-free game controller (fixed-step loop, phases) and the four mode controllers |
| `src/settings.ts`, `src/progress.ts` | zod schemas, storage, result recording |
| `src/render*.ts`, `src/view.ts`, `src/fx.ts` | Canvas drawing, portrait/landscape transform, sparkles and floating text |
| `src/input.ts`, `src/pull.ts`, `src/audio.ts`, `src/ui.ts`, `src/main.ts` | Pointer/keyboard input, slingshot maths, WebAudio synth (master gain + compressor), DOM helpers, wiring |
| `src/config/*` | Every tuning number: input, Rack Attack economy, CPU, effects, audio mix, layout |
| `src/strings.ts`, `src/sfxMap.ts` | User-facing strings, outcome-to-sound mapping |
| `src/modal.ts`, `src/pauseUi.ts`, `src/settingsPanel.ts`, `src/coach.ts`, `src/prefs.ts`, `src/canvasView.ts` | Pause/confirm/settings dialogs, first-run hint, applying settings, ResizeObserver canvas sizing |

Physics is deterministic: it runs on a fixed 1/240 s step independent of rendering (subdivided further at high speed so nothing tunnels), with no randomness. The same shot on the same table always gives the same result.
