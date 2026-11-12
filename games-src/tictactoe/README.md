# Tic-Tac-Toe

A standalone game in the arcadeShop collection, written in TypeScript (strict) and built with Vite.

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (rules, AI, balance, settings, controller, audio, contrast)
    npm run build      # typecheck + production build into dist/
    npm run e2e        # Playwright smoke suite against a running preview (see below)

## Options

- **Opponent:** play the CPU (Easy / Medium / Hard / Expert) or 2 players on one device. You are always X against the CPU. Expert never loses Classic; in Vanishing the same level searches 8 moves ahead and can still be beaten.
- **Variant:** Classic, or Vanishing, where each player keeps only 3 marks and the oldest (dashed, with a "next out" tag for the player to move) disappears when its owner places a 4th. Vanishing games are called a draw after 60 moves (a move counter warns from move 50).
- **First move:** Alternate each round, or always X, or always O.
- **Settings panel (gear):** volume, sound, reduce motion (System/On/Off), colour-blind assist, text size (100/125/150%), theme. Opening it pauses the CPU.
- **Pause:** `P` / `Esc` or the pause button. The CPU timer also auto-pauses when the tab is hidden or the window loses focus during a round; resume is manual.
- **Keys:** `1`–`9` place a mark, top-left to bottom-right; arrows move around the board, Enter/Space place. `N` starts a new round (press twice to abandon a round in progress), `M` mutes.
- You can queue one premove while the CPU is thinking.

Persistence (localStorage, all validated with zod when read back, each field falls back on its own):
`ttt-settings`, `ttt-scores` (merged across tabs), `ttt-stats` (win streak), `ttt-session` (round in progress, replayed through the rules on load), `ttt-seen` (first-run hint).

Debug hook `window.__ttt` exists only with `?debug=1` (or the dev server).

## Code

| File | Role |
| --- | --- |
| `src/config.ts` | All tuning numbers (CPU delay, AI rates, vanish rules, audio gains, FX timings), zod-validated and frozen |
| `src/strings.ts` | User-facing text |
| `src/game.ts` | Pure rules: moves, wins, draws, vanishing marks |
| `src/ai.ts` | CPU: random (easy), win/block + best-move rate (medium 50%, hard 85%), negamax with alpha-beta (unbeatable; depth 8 in Vanishing) |
| `src/controller.ts` | Turn controller: CPU timer, pause reasons, premove (DOM-free, unit tested) |
| `src/settings.ts`, `scores.ts`, `session.ts`, `storage.ts` | Schemas, persistence, streak maths, session replay |
| `src/results.ts`, `src/status.ts` | Round result bookkeeping, round order and status text |
| `src/audio.ts`, `audioCues.ts` | WebAudio cues behind one master gain + compressor, unlocked by the first gesture |
| `src/ui/*` | DOM rendering, overlays (focus trap), roving tabindex, FX, appearance |
| `src/style/*.css` | Tokens (contrast-tested), layout, board, panels |
| `src/main.ts` | Wiring |
| `e2e/*.mjs` | Playwright smoke suite |

Run the e2e suite with a preview server up: `PLAYWRIGHT_PATH=/path/to/node_modules/playwright/index.mjs BASE_URL=http://localhost:4173 npm run e2e` (Playwright is not a project dependency).

The tests include an exhaustive check that the Unbeatable CPU never loses a Classic game, whether it moves first or second.
