# Pounce Pins verification, 2026-11-11

Verdict: PASS (no S1/S2).

Gates: tsc 0 errors; vitest 82/82 in 8 files; build OK; npm audit 0 vulnerabilities; dependency pins and .npmrc match tictactoe.
IP: grep for sponsor/original names (Optus, Mousebreaker, Uzinagaz, 2DPlay, Absolutist, Arkadium, bravo zulu, Cat Bowling) finds nothing. Art, text and layout are original (office cats, yarn ball, cushions); the reference shows a witch/pumpkin theme.

Play checks (Playwright, port 4942; scripts verify-pouncepins-1.mjs and -2.mjs): keyboard-only throws register; mashing Space/arrows and pause spam leave state consistent; pause freezes the aim; blur auto-pauses; full 10-frame games reach the results sheet with a fish bonus; 10 restart loops are clean; 5 corrupt localStorage payloads fall back to the title; no hscroll at 400x860, 860x400, 1920x1080; rotate mid-game is fine; touch tap lock and throw work; no debug hook without ?debug=1; 0 console errors.

Issues:
- S4: the page scrolls 1px vertically at 400x860, 860x400, 1920x1080 and 360x640 (documentElement overflow).
- S4: in 860x400 landscape the canvas is small (576x254).
- S4: the builder's Playwright scripts are not in the repo, so there is no e2e script.
Screenshots: new-games-shots/verify-pouncepins-*.png
