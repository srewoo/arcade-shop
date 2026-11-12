# Tile Tumble verification (2026-11-11)

Verdict: PASS (no S1/S2). Gates: tsc OK, vitest 62/62 (8 files), build OK, npm audit 0 vulnerabilities, IP grep clean.

Method: headless Playwright against `vite preview --port 4951` (scripts: pwtools/verify-tiletumble-1..6.mjs), screenshots in new-games-shots/verify-tiletumble-*.png.

Checked OK: all 4 modes start; real mouse click, touch tap, keyboard-only play; hover preview; pause spam, no input while paused; blur pauses; resize/rotate across 400x860, 860x400, 1280x800 mid-game (board fits, no horizontal scroll); corrupt localStorage (settings/stats) recovers; Move-limit target solvable (solver path meets target on 25 seeds); lose path shows result, play again resets; Daily board identical on restart; endless ends on overflow; Z pressed in end-delay window does not break result; buttons >=44px and HUD text >=12px at phone/landscape; focus ring 3px; zero console errors/warnings.

IP: no sponsor/original-name hits in source. Reference Fall Out (coloured spheres, click groups of 2+) is only the generic genre mechanic; name, UI text, art, colours and layout differ.

Issues
- S3: Hover preview text wraps to two lines at 1280x800 and 860x400 with the onboarding hint visible or not, growing the document by 18px (scrollHeight 818 vs 800), so a vertical page scroll appears while hovering a group (repro: start Classic, hover a pair, check document.scrollHeight).
- S4: cells are ~42px wide at 860x400 (below 44px), already a known gap.
- S4: pairs score 0 points (by design, (n-2)^2) but still consume a Move-limit move.
