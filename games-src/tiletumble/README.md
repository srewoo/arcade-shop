# Tile Tumble

A same-colour group-clearing puzzle for the browser. Click a group of two or more touching discs of one colour and it
clears: discs above fall down, and empty columns slide left. Bigger groups score far more.

## Run

```bash
npm install            # uses .npmrc (legacy-peer-deps=true)
npm run dev            # http://localhost:5173
npm test               # vitest
npm run build          # tsc --noEmit && vite build
npx vite preview --port 4931 --strictPort
```

Debug hooks (`window.__tt`, plus `?seed=N`) are only installed with `?debug=1`.

## Rules and scoring

- Board is 8 columns x 9 rows. A group is 2+ discs of the same colour that touch horizontally or vertically.
- Clearing a group of `n` discs scores `(n - 2)^2`. A pair is worth 0, so patience pays: 3 = 1, 4 = 4, 5 = 9, 8 = 36.
- Clearing the whole board adds a 250 point bonus.
- Hovering (or keyboard-focusing) a disc previews the group, highlights it and shows its size and points.
- Undo takes back the last move (one level).

## Modes

| Mode | What changes |
| --- | --- |
| Classic | 4 colours. Play until no group is left. Wipe the board for the bonus. |
| Move limit | 12 moves. A beam-search solver plays the dealt board, and the target is 45% of its best score (rounded to 10). Reach it before the moves run out. |
| Endless | Starts with 5 columns. Every 3 moves a new column rises on the right (immediately if no move is left). The run ends when a column must rise and the board is already full. |
| Daily | 5 colours. The board is seeded from the local date, so everyone gets the same one each day. Your best is stored per date. |

Every dealt board is checked by the solver: all colours must appear at least 6 times and the solver must be able to
play it down to at most 25% leftover discs, otherwise the generator re-rolls (deterministically).

## Controls

| Input | Action |
| --- | --- |
| Mouse / touch | Click or tap a disc to clear its group |
| Arrow keys, Enter / Space | Move the cursor between discs, clear the group |
| Z or U | Undo |
| N | New game (asks first if a game is in progress) |
| P or Esc | Pause (Esc on a dialog closes it) |
| M | Mute |

The game auto-pauses when the tab is hidden or the window loses focus.

## Accessibility

- Colour-blind assist (Settings) draws a different symbol on each colour (ring, square, triangle, diamond, plus).
  Hovered groups are also marked by an outline, not by colour alone.
- Settings: volume, sound, reduce motion (System / On / Off), colour-blind assist, text size 100/125/150, theme
  (System / Light / Dark). Stored in `localStorage` under `tt-settings`; every field is validated with zod and falls
  back on its own.
- Touch targets are at least 44 px, dialogs trap focus and return it, the board has an `aria-label` and a polite live
  region announces clears and results.
- Reduce motion removes particles, score pop-ups, shake and the slow falls (discs snap into place).

## Design notes

- Pure logic (`board`, `scoring`, `solver`, `generator`, `game`, `rng`, `stats`, `settings`) has no DOM and is unit tested.
- The board is a canvas drawn entirely in code (gradients and paths). A sprite layer mirrors the logical board and
  eases towards it, so input never waits for animation. The game is turn-based, so there is no fixed-timestep loop;
  rendering runs only while something is moving.
- Tuning lives in `src/config.ts`; UI text in `src/strings.ts`.
- Audio is synthesised with WebAudio (no files). No network, no external assets, no analytics.
- Persisted data: `tt-settings`, `tt-stats` (best per mode, best per daily date) and `tt-onboarded`.

## What is original

This is an original game. It is only in the same genre (colour-group clearing) as classic web puzzle games; it shares no
name, art, text, sounds or levels with any of them. The scoring curve, the four modes, the solver-validated deals, the
solver-derived move-limit targets, the rising-column endless mode, the daily seed and the colour-blind symbols are this
project's own design. All art is drawn in code and all sounds are synthesised.
