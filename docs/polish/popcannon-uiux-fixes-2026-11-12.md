# Pop Cannon UI/UX fixes (2026-11-12)

## Audit issues
1. High, blocking tutorial: Fixed. Modal coach removed (coach.ts deleted). First run shows a one-line, auto-fading hint ("Drag to aim, release to fire. Tap NEXT (or press X) to swap.") in a reserved strip off the board (left column in landscape, under the board in portrait), no reflow. Clicks load to first shot: 4+ -> 2 (Play, drag-fire) on all three viewports.
2. High, layout / touch buttons on desktop: Partially. Touch pad hidden for `(pointer: fine) and (hover: hover)`; shown for touch. Score/HUD stacked in left column, pause/sound in the right column, so the layout is balanced. Board is bound by its 0.68 aspect ratio and was already full height: desktop board still 528x780 (40% of viewport, unchanged), phone 376x555 (61%, was ~65% measured by audit with different gaps), landscape phone 261x387 (29%). Reaching 65-70% would require changing the board's logical size/gameplay, not done.
3. Medium, HUD style: Fixed. Dark translucent chips, score primary (1.75rem), icon-only pause and sound (inline SVG), combo chip hidden until x2+, "Misses left" no longer wraps.
4. Medium, game over: Fixed. Scrim is full-viewport; card = big count-up score, "New best!" badge, 2x2-ish stats grid (best combo, accuracy, shots; level only when >1), cause note, Play again primary. Entrance animations respect Reduce motion. Payoff-first uses the existing 900 ms result delay over the live board.
5. Medium, menu: Fixed. One primary Play (Arcade), Daily/Puzzle/Time Rush chips, Settings/How to play; colour-blind toggle removed from menu (still in Settings). Hint text 0.85rem.
6. Medium, readability: Partially. Blue lightened #2e6bdc -> #4a86f2. Assist stays off by default (no first-run suggestion added).
7. Low, feedback: Already present (ceiling drop shake + sound exist in resolve.ts/audioPlan); no change. Fire focus ring left as the keyboard focus indicator.
8. Low, phone: Partially. Tutorial no longer covers rows; HUD chips are compact. Board still width-limited at 376 px.
Settings icon (cog): game has no settings icon; Settings is a text button in menu/pause. Not added.

## Files changed (games-src/popcannon)
index.html, src/main.ts, src/hud.ts, src/screens.ts, src/result.ts, src/strings.ts, src/config.ts (firstRunHintMs), src/palette.ts, src/style.css; deleted src/coach.ts; added tests/result-card.test.ts (6 tests). Build output: dist/games/popcannon.

## Verification
npm test: 237 passed (15 files). npm run build OK. No h-scroll and no console errors at 1280x800, 400x860, 860x400.

## Screenshots (scratchpad/pw/shots)
fix-popcannon-{desk,phone,land}-{title,firstrun,play,pause,settings,over}.png, thumb-popcannon.png (480x300). Script: fix-popcannon-1.js.
