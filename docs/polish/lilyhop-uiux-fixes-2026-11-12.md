# Lily Hop UI/UX fixes (2026-11-12)

Status per audit issue (game section 4) and collection-wide items.

| # | Issue | Status | Notes |
|---|---|---|---|
| 1 | Perfect play + 1 hint = 2 stars with "best possible" copy; star rule not shown | Fixed | `resultKind` in scoring.ts: perfect only with no hints. Hint-capped result says "8 moves matches the best possible (8), but the hint you used caps the result at 2 stars. Replay with no hints for 3." Title no longer "Perfect". Star rule line under the HUD ("3 stars: 8 moves, no hints. 2 stars: up to 11 moves."), turns to "Hint used: 2 stars at most..." after a hint. Hint button describedby the rule. How-to text updated. |
| 2 | Pond mostly empty, moon cut, ring clipped on phone | Fixed | Pads scale up to 168px and fold to fill (fillCell 96); 20px inset; single-row ponds shrink to a roomy band; moon moved inside the crop-safe area; scene gains stars, halo, far pads and blossoms. |
| 3 | Title wraps "2 + / 2" | Fixed | Non-breaking spaces in label. Still breaks after the colon in the narrow landscape column, never inside "2 + 2". |
| 4 | Sparse menu, no frog, locked wall | Fixed | Hero pond with 2 frogs, gap, 2 toads; two-column menu at >=60rem; frog/toad icons on open tiles, lock icon on locked; first level of each group now open. |
| 5 | Hint gives full answer | Fixed | Two-tier hint: first press highlights the piece, second shows the target pad (only the first press counts). |
| 6 | Blocked state not visible | Fixed | Blocked pieces dim and desaturate; with colour assist an x badge. |
| 7 | Desktop empty areas | Partially | Control column vertically centred, larger stats, taller pond (up to 52rem); menu bottom of desktop still has free space. |
| 9/collection | Settings icon | Fixed | Standard cog. |
| collection | Win payoff before tiered card | Fixed | Staggered victory hops, confetti, sound and "Pond crossed!" banner on the pond, then the card after 1.3s (0.5s reduced motion). Card has gold stars (pop animation) and tiered title. |
| collection | Non-blocking hints | Already non-blocking | Hints are timed highlights; no modal. |
| collection | Scene fills desktop | Fixed | see 2 and 7 |

## Files changed
src/config.ts, layout.ts, scoring.ts, progress.ts, strings.ts, play.ts, main.ts, hints.ts (new), ui/boardView.ts, ui/hud.ts, ui/art.ts, ui/menu.ts, ui/panels.ts, style/{tokens,base,game}.css, index.html, README untouched. Build output: dist/games/lilyhop.

## Tests added or changed
tests/scoring.test.ts (thresholds, resultKind, copy never says perfect when hint-capped), tests/hints.test.ts (new), tests/progress.test.ts (group-first unlock), tests/layout.test.ts (updated for fill rule). 96 tests pass; `npm run build` passes. Storage keys, saved progress and debug hooks unchanged.

## Screenshots (shots/)
fix-lilyhop-{desk,phone,land}-{1menu,2levels,3play,3hint1,3hint2,4win-banner,4win-hint,5win-clean}.png, fix-lilyhop-desk-settings.png, fix-lilyhop-{desk,phone}-dark-{1menu,2levels,3play}.png, thumb-lilyhop.png. No horizontal scroll, no console errors.
