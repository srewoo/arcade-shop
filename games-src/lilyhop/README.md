# Lily Hop

A pond puzzle for the browser. Two teams, green frogs and amber toads, start on opposite ends of a row of lily pads. Swap the teams using forward-only hops.

## Run

```
npm install        # uses .npmrc (legacy-peer-deps=true)
npm run dev        # or: npm run build && npx vite preview --port 4925 --strictPort
npm test           # vitest
npm run typecheck
```

Append `?debug=1` to the URL to expose `window.__lilyhop` (state, solve, start, unlockAll). It is not installed otherwise.

## Rules

- Frogs hop right (and down on grid ponds). Toads hop left (and up).
- A piece may step into an adjacent empty pad, or jump over exactly one adjacent rival into the empty pad behind it. Jumping does not capture.
- Nobody moves backwards. The puzzle is solved when every frog sits where the toads began and vice versa.
- If the swap can no longer be finished from the current position, the game says **Stuck** (detected exactly, not by "no legal moves") and points you at Undo.

## Modes and levels

| Group | Levels | Notes |
|---|---|---|
| Classic crossing | 2+2, 3+3, 4+4, 5+5 | One gap. Optimal is n² + 2n (8, 15, 24, 35). |
| Two gaps | 2+2, 3+3, 4+4 | Two empty pads in the middle. Optimal computed by the solver. |
| Grid ponds | 3+3 on 3x3, 3+3 on 4x3 | 2D boards: frogs move right or down, toads left or up. |
| Daily Hop | one per local date | Seeded scramble of a 3+3 or 4+4 line that is guaranteed solvable. |

Levels unlock in order. Progress and best results are saved in `localStorage`.

## Controls

Tap or click a frog to hop (if it has one move it goes straight away; if it has two, it is selected and its targets glow, then tap a target). Tapping an empty pad hops the only piece that can reach it.
Keyboard: arrows move between pads, Enter or Space hops, `U` undo, `H` hint, `R` restart (asks first), `P` or `Esc` pause, `M` mute.

## Scoring

- Move counter against the solver's optimal move count, shown as "Best possible".
- Stars: 3 at optimal, 2 within 30% of optimal (rounded up), 1 for any finish. Using a hint caps the result at 2 stars. Undo is free: the counter shows net moves; the result screen also lists undos and hints.
- The timer starts on your first hop and stops while paused, in any dialog, in the menu, and when the tab is hidden.

## Conventions followed (production/polish/CONVENTIONS.md)

Pause overlay (Resume, Restart, Settings, Quit to title) on `P`/`Esc`, auto-pause on blur and `visibilitychange`, confirmations are in-page dialogs. Settings: volume, sound, reduce motion (System/On/Off), colour-blind assist (F/T badges and a dashed toad outline), text size 100/125/150, theme System/Light/Dark, all validated with zod per field. Touch targets are at least 44px (long lines fold into a serpentine so pads never shrink below that). One-time onboarding hint. Focus ring, dialog focus trap and focus return. Tuning lives in `src/config.ts`, strings in `src/strings.ts`. The game is turn-based, so there is no fixed-timestep loop; only the timer uses a clock, which is injected and unit-tested.

## Design notes

- `board.ts` holds the pure rules; `solver.ts` enumerates every state reachable from the start (at most about 18,000 for the shipped levels) and runs a reverse BFS from the goal. That one table gives the optimal count, hints, and exact stuck detection.
- A 4x4 grid with three per team was tried and dropped: about 155,000 states and roughly 700 ms to build, too slow for a level start.
- Long lines are folded into a serpentine (`layout.ts`) with a dashed trail so adjacency stays readable on a phone.
- All art is code: SVG lily pads, frog and toad sprites, reeds, moon, fireflies, ripples. Audio is synthesised with WebAudio. No external assets or network access.
- Dependencies are pinned exactly as in the other games: zod 4.6.7, typescript 5.6.3, vite 7.3.7, vitest 4.1.12.

## What is original

The genre (a frogs-and-toads / leapfrog swap puzzle) is a public-domain classic and its rules are generic. Everything else here is new: the name, the pond art and characters (drawn from scratch), the levels and level order, the 2D grid and two-gap variants, the daily puzzle, the scoring and star rules, the sounds and the UI. No names, art, text or level layouts from any existing Flash game were used.
