# Lantern Bridge

A night-crossing logic puzzle for the browser. Get every traveller across a rickety bridge with one lantern, at most two at a time, before the lantern oil runs out. A second pack swaps the bridge for a raft and adds who-may-ride-with-whom rules.

## Run

```
npm install        # uses .npmrc (legacy-peer-deps=true)
npm run dev        # http://localhost:5173
npm test           # vitest (rules, solver, level validation, scoring, settings, RNG)
npm run build      # tsc --noEmit && vite build
npx vite preview --port 4923 --strictPort
```

Append `?debug=1` to expose `window.__lb` (session, settings, progress, levels, `go(pack, index)`) for tests.

## Modes

- **Bridge by Night** (21 levels, 3 to 7 travellers). Each traveller has a crossing time in minutes. Two walk at the slower pace, and the lantern must walk back with someone. The oil limit is par plus a slack that shrinks across the pack, down to zero.
- **Raft Rules** (6 levels). Fox, hen and grain; keepers and magpies (the "outnumbered" rule, with a 2-seat and a 3-seat raft); and a household with a warden and a pickpocket (the classic family-and-thief rules). Only travellers with a Row badge can steer. Rules apply on both banks and on the raft.
- **Daily Lantern**. A seeded bridge (4 to 6 travellers) generated from the date; the same date always gives the same puzzle and it is solver-validated.

Stars: 3 for matching the best possible route, 2 within half the spare oil (bridge) or 2 extra crossings (raft), 1 for any solve. Using the hint caps the result at 2 stars. Results are kept in localStorage.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Pick or drop a traveller | tap | Tab + Enter/Space, or 1-9 for the nth traveller on the lantern's bank |
| Cross | Cross button | C |
| Undo | Undo | U |
| Hint | Hint | H |
| Restart (asks first) | Restart | R |
| Next level (after a win) | Next level | N |
| Pause | pause button | P or Esc |
| Mute | speaker button | M |

The game auto-pauses on `blur` and when the tab is hidden. Pause offers Resume, Restart, Settings and Quit (both destructive ones ask for confirmation in-page). Settings: volume, reduce motion (System/On/Off), colour-blind assist, text size (100/125/150), theme (System/Light/Dark).

## Design notes

- `src/puzzle/` is pure and DOM-free: `engine.ts` (move legality, transitions), `rules.ts` (pair and outnumber constraints as bitmasks), `solver.ts` (uniform-cost search, a weighted BFS, over start-bank mask and lantern side), `stars.ts` (rating, dead-end detection), `generate.ts` (daily puzzle).
- The solver proves every level solvable and computes par at load time (`levels/build.ts`); a level that cannot be solved throws. The same solver gives hints (solve from the current state) and detects "stuck" positions where no route still fits the oil. `checkSolution` replays any move list and reports validity, within-limit and optimality.
- `session.ts` holds one attempt (selection, undo history, hints, outcome). `app/` wires it to the DOM; `ui/` holds the views; native `<dialog>` elements give focus trapping, Esc and focus return.
- Tuning lives in `config.ts`, all text in `strings.ts`. Persisted data (settings, progress) is parsed with zod per field/entry so one bad value never wipes the rest.
- The game is turn-based, so there is no real-time simulation or fixed timestep; the only timers are animation and result-dialog delays, and moves animate with a small FLIP that Reduce motion disables.
- All art is code: SVG characters, CSS river, deck and banks, a seeded star field. Audio is WebAudio synthesis (no files). No network and no assets.
- Accessibility: every traveller is a `<button>` with a text label and a unique chest symbol (colour is never the only cue), 44px targets, visible focus rings, `aria-live` status, contrast checked in `tests/contrast.test.ts`.

## What is original

The bridge-and-torch puzzle and the river-crossing rule sets (fox/hen/grain, missionaries-and-cannibals style, family-and-thief) are public-domain puzzle genres. Everything else is new: the name, the seven travellers (Wren, Tobin, Ines, Odo, Hester, Bram, Quill), the raft cast, all SVG art and CSS scenery, level data and times, sounds, UI and code. No names, characters, text, art, logos or level layouts from any existing Flash game were used; the reference screenshots were looked at only to confirm the genre.
