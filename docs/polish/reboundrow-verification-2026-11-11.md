# Rebound Row verification, 2026-11-11

Verdict: PASS (no S1/S2). Gates: tsc OK, vitest 42/42 OK, build OK, npm audit 0 vulnerabilities, pins and .npmrc match tictactoe, no sponsor/original-name strings in source (grep clean). The reference Ping_Bricks shots show only a game-over splash; nothing reused.

Playwright (headless, port 4950): corrupt localStorage falls back cleanly; 3 viewports no overflow and no targets <44px; pause spam (30 toggles) ends consistent; blur auto-pauses; resize mid-game fine; bot clears levels 4-30, 32, 34 and level 1 writes progress (unlocked 2); lose path, restart loops and endless run fine; settings->Esc returns to pause; zero console errors.

Issues
- S3: Level 33 "Vault" is extremely slow. Shipped bot gets 0 hits in 2400s of game time; a randomised-offset player cleared it in 1 of 6 runs within 1200s game time (769s when it did). Solvable, but a grind. Rebalance (wider gap or fewer 3-hit bricks) or add to bot test.
- S4: Playfield is a fixed 5:6 box: on 400x860 phone it fills width but leaves ~45% of the height empty; at 860x400 it is only 309x371.
- S4: Debug dropBalls does nothing useful in the ready phase (hook-only).
