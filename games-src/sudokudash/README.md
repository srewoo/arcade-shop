# Sudoku Dash

An arcade-style Sudoku for the arcadeShop collection, written in TypeScript (strict) and built with Vite. It replaces the old "SuDoku Solver VBA version 0.1" Excel workbook, keeping the idea (a solver you can ask to solve or step through, and remember/recall of a grid) and adding a generator, explained hints and an arcade layer.

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (the Hard generator test takes ~15 s)
    npm run build      # typecheck + production build into dist/

Pinned versions: Vite 7.3.7, vitest 4.1.12, TypeScript 5.6.3, zod 4.6.7 (`.npmrc` sets `legacy-peer-deps=true` because npm 10 crashes resolving vitest 4 optional peers).

## Controls

| Key | Action |
| --- | --- |
| `1`-`9` | Enter a digit (or a pencil note in notes mode) |
| Arrows | Move the selection |
| `Backspace` / `Delete` / `0` | Erase (only wrong entries and notes can be erased; correct digits lock) |
| `N` | Toggle notes (pencil) mode |
| `H` | Hint: explains the next logical step and highlights the cells involved |
| `Ctrl/Cmd+Z` | Undo |
| `Shift+Z` or `Ctrl/Cmd+Shift+Z` | Redo |
| `P` / `Esc` | Pause (overlay with Resume, Restart, Settings, Quit); `P` / `Esc` again resumes |
| `M` | Mute / unmute |

On touch screens use the on-screen number pad (each digit shows how many are still to place) and the tool buttons. Wrong digits are flagged red, rule clashes get a red outline, and the selected digit is highlighted everywhere.

## Modes

- **Dash:** a countdown (3:40 / 4:25 / 4:40 / 4:45 for Easy to Expert). A correct placement adds 3 / 3.5 / 4 / 4.5 s, a mistake costs 10 s, a hint costs 8 s. Correct entries within 6 s of each other build a combo (up to x8) that multiplies the points. Each cell pays only once (undo + re-entry earns nothing). Finishing with time left pays 10 points per second, except after Solve step / Solve all. The clock is capped at 1.25x the starting time. All numbers live in `src/config/dash.ts`; `tests/balance.test.ts` simulates a reference player and keeps the loss rate at 10-30%.
- **Classic:** relaxed, with an elapsed timer and an optional 3-mistake limit.
- **Daily puzzle:** seeded from the local date and difficulty, so everyone gets the same grid for a day.
- **Enter my own puzzle:** paste 81 cells (digits, `0` or `.` for blanks; spaces, line breaks and `| + -` are ignored). It is rejected with a clear message for bad length or characters, rule clashes (naming the row/column/box), too few clues, no solution, or more than one solution. "Check and solve" runs the solver straight away.
- **Records:** best time and best Dash score per difficulty. Runs that used Solve step / Solve all, and custom puzzles, do not count.
- The game in progress is saved automatically (the modern take on remember/recall) and offered as "Continue saved game".
- Sound is synthesised with WebAudio (no audio files) through a master gain and limiter; Settings has volume, reduce motion (system/on/off), text size, theme and a colour-blind palette. Confetti and shakes are skipped with Reduce motion.
- The game pauses itself when the tab is hidden or the window loses focus, when you open Settings, and when you go back to the Menu (Continue then shows a "Ready?" cover).
- Daily puzzles keep a result log, a streak and a "Copy result" share grid. Debug handle `window.__sudokudash` exists only with `?debug=1`.

## Solver techniques and grading

The logical solver always applies the easiest available technique first:

1. Naked single, hidden single (level 1: **Easy**)
2. Naked pair, hidden pair, pointing pair/triple, box/line claiming (level 2: **Medium**)
3. X-wing (level 3: **Hard**)
4. Anything else, i.e. backtracking needed (**Expert**)

A puzzle's difficulty is the hardest level the solver needs. The generator builds a random full grid, then removes clues in random order while the puzzle stays solvable at the target level (a complete logical solve also proves the solution is unique); Expert puzzles use a solution counter that stops at 2 instead. Everything is seeded, so a seed always gives the same puzzle.

Hints name the technique and explain it in words, for example "Only 5 fits in r3c5 for row 3: ...". Elimination hints (pairs, pointing, X-wing) can be applied, which remembers the eliminations and shows pencil marks. When no supported technique applies the hint says so and suggests a cell from the backtracking search. Solve step applies one logical step; Solve all fills in the grid.

Timing: Easy, Medium and Expert puzzles take about 5-100 ms. Hard puzzles (an X-wing must be genuinely required, which is rare) average roughly 1-2 s and occasionally 5 s, so generation runs in a Web Worker, the UI shows a cancellable "Building..." message, and a second worker pre-builds Hard puzzles in the background (kept in localStorage, validated and re-checked when read back).

## Code

| File | Role |
| --- | --- |
| `src/core/grid.ts` | Grid model, houses, peers, conflicts |
| `src/core/candidates.ts` | Candidate bitmasks and solver state |
| `src/core/singles.ts`, `subsets.ts`, `intersections.ts`, `xwing.ts` | One file per technique family; each returns an explained `Step` |
| `src/core/steps.ts`, `solver.ts` | Step type, ordered logical solver |
| `src/core/counter.ts` | Backtracking solver, solution counter (stops at a limit), random full grids |
| `src/core/grader.ts`, `generator.ts` | Difficulty grading, seeded generator |
| `src/core/puzzleInput.ts` | Parsing and validation of user-entered puzzles |
| `src/core/game.ts`, `hint.ts`, `history.ts` | Game state operations, explained hints, undo/redo stack |
| `src/core/scoring.ts` | Dash timer/combo/score maths, classic score |
| `src/core/rng.ts` | Seeded RNG, daily seed |
| `src/storage.ts`, `src/bests.ts`, `src/daily.ts`, `src/savedGame.ts` | zod-validated settings, per-mode bests, Daily log, saved game (all storage access in try/catch) |
| `src/config/*` | Tuning: Dash numbers, timing, juice, audio cue table |
| `src/strings.ts` | UI copy for the polish-pass screens; Dash rules text is generated from config |
| `src/dashRules.ts`, `src/sessionBase.ts` | Dash scoring rules and session data, split out of `session.ts` |
| `src/app/*` | App wiring: screens, lifecycle (tick, rAF, auto-pause), bindings, results |
| `src/session.ts`, `sessionTypes.ts` | One play session: moves, modes, win/loss (no DOM) |
| `src/generation.ts`, `src/worker/gen.worker.ts` | Web Worker generation, Hard pool |
| `src/ui/*` | DOM rendering: board, pad, HUD, hint panel, popups, title, dialogs, keys, theme |
| `src/main.ts` | Entry point |

Tests live in `tests/` (techniques on hand-made positions, solution counter, generated puzzles per level, a known Expert puzzle, scoring maths, puzzle parsing, settings/save validation, session rules).

## Licence note

The solver is an independent implementation written from scratch. It does not copy any code from the GPL-2 "SuDoku Solver VBA version 0.1" workbook that it replaces; only the general idea (candidate lists, eliminations, naked singles, solve or step) is shared, so this project is not bound by that licence.
