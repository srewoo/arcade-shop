# Measure Up verification, 2026-11-11

Verdict: PASS (no S1/S2). Gates: tsc OK, vitest 63/63 (10 files), build OK, npm audit 0 vulnerabilities. package.json pins and .npmrc identical to tictactoe.

## Checks
- All 35 campaign levels solved through the real UI with the solver path: every one reached par, goal met, 3 stars; L35 has no Next. Quick puzzles easy/medium/hard (6 seeds each): solvable, par matches solver.
- Corrupt localStorage (bad JSON, wrong types, array, throwing storage): boots and plays. Locked levels not clickable.
- Pause: P/Esc, blur auto-pause, P spam (1 overlay), clock frozen while paused, Settings from pause and Esc back, restart confirm, focus trap, focus returns to a jug.
- Rapid key mashing, restart loops, undo spam, hint spam (stars capped at 2): no errors.
- Viewports 1280x800, 400x860, 860x400, 360x740, mouse and touch: no horizontal scroll, no sub-44px buttons, no vertical page scroll. Resize/rotate mid-game keeps state. Console errors: 0 across all runs.
- Keyboard-only play works (Tab order, Enter, 1-4/F/E/U/H/R), focus ring 3px.
- IP: grep for sponsor/original names clean. Reference (Cave PUZZLE) shows a character locked behind a cave gate with a handle needing exact litres. Measure Up shares only that genre premise; name, character (Wick), art, text and levels are different.

## Issues
- S3: Solve a level then press Back (or Esc to levels) during the win delay: the win sheet appears over the level-select screen (cancelWin is not called on leave). Next still works.
- S3: Press P during the win delay: win sheet and pause overlay stack; Resume reveals the win sheet. Pressing R in the delay shows a restart confirm on a solved level.
- S4: Premise (cave, locked-in character, gate and handle needing exact amount) is close to the reference; art and text are original. Consider a less similar framing.
- S4: Builder's known gaps stand (wide-desktop scene card with empty space, panel scrolling at 150% text on small screens, no e2e script, audio unheard).

Screenshots: scratchpad/new-games-shots/verify-measureup-*.png. Scripts: scratchpad/pwtools/verify-measureup-{a,b,c,d}.mjs. Server stopped, dist/ deleted.
