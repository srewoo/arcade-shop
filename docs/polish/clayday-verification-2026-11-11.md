# Clay Day verification, 2026-11-11

Verdict: PASS (no S1 or S2). Gates: tsc OK, vitest 13 files / 106 tests OK, `npm run build` OK, `npm audit` 0 vulnerabilities. Package pins and .npmrc match tictactoe (diff of dependency blocks identical).

## IP check
- Grep for optus, mousebreaker, uzinagaz, 2dplay, absolutist, arkadium, bravo, skeet across src, tests, index.html and README: no hits.
- Reference screenshot (Skeet_Shoot_Optus-1.png) is a photographic scene with a sponsor-branded header bar and photo backdrop. Clay Day uses its own vector art (red launch houses, tree line, white flag, twin barrel), its own name, strings and HUD. No breach.

## Runs (headless Playwright, production preview on 4949)
Scripts: scratchpad/pwtools/verify-clayday-1..6.mjs. Screenshots: scratchpad/new-games-shots/verify-clayday-*.png.
- Corrupt localStorage (invalid JSON, wrong types, null, string): title loads, no console errors.
- Keyboard-only: Enter on initial focus starts, Space fires, arrows aim, P/Esc pause, R reload, focus trapped in settings, 3px focus ring.
- Fire spam capped by shells; 60-key pause spam stable; blur and visibilitychange auto-pause; clock frozen while paused.
- Resize/rotate mid-game across 400x860, 860x400, 360x740, 320x480, 200x200: no horizontal scroll, no crash.
- Restart loop x5 via in-page confirm, quit to title, restart: OK.
- Full real-time rounds with a lead bot (mouse and touch tap) at 1280x800, 400x860, 860x400: 22 of 22 hits in the window, round 1 cleared 25/25, result overlay appears about 0.9 s after the last clay, Next round goes to round 2. No-shot run fails ("Run over", Try again). Wind rounds render. Practice has no clock, no wind, "Another round".
- Difficulty curve: no-lead bot 4/25 (fails), half-lead 25/25, full-lead with 30px jitter 20/25 (passes). Lead matters and the game is winnable.
- Settings (150% text, dark, reduce motion) persist across reload. `__clay` absent without ?debug=1 and with debug=0.
- Zero console errors or page errors in all runs.
- Touch targets all at least 44px, HUD text at least 12px at all three viewports.

## Issues
- S3: At 150% text on 860x400 landscape the page scrolls vertically (401 vs 400 px), the canvas (380x409) is taller than the viewport, the tally row is cut and the onboarding banner covers most of the field. Repro: Settings, text 150%, resize to 860x400, Start. Builder listed this as a known gap.
- S4: Portrait phone has a lot of empty grass under the houses and the hint banner overlays the gun until dismissed (known gap).
- S4: Practice rounds still bump `roundsPlayed` in saved stats (best scores are not saved). Spec says no saved scores; the code comment documents it.
- S4: Touch is tap-to-aim-and-fire only, so the finger covers the target. Audio mix not auditioned (known gaps).

## Cleanup
Preview server stopped, clayday/dist deleted.
