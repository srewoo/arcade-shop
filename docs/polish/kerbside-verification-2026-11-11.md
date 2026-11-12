# Kerbside verification, 2026-11-11

Verdict: PASS (no S1/S2).

Gates: tsc OK; vitest 12 files / 124 tests pass; build OK (JS 61 kB); npm audit 0 vulnerabilities; package.json deps and .npmrc match tictactoe; no file >300 lines.
IP: grep for Optus/Mousebreaker/Uzinagaz/2DPlay/Absolutist/Arkadium/bravo and "Parking Perfection" found nothing. Art is a plain orange car, so no resemblance to the purple Beetle shown in Parking-1.png.

Browser (Playwright, port 4946, scripts verify-kerbside-a/b/c.mjs): 1280x800, 400x860 and 860x400 had no scroll and filled the viewport (canvas 1058x778, 374x607, 634x316). Pause spam, blur and visibilitychange auto-pause, rotation mid-game, restart loops, quit, a wreck (damage 5) with the retry overlay, and keyboard driving to a park (progress saved, 2 stars) all worked. Corrupt localStorage fell back per field. Touch targets: pause is 44x44 and the pedals are 73x120. Touch pedal drive worked. 0 console errors.

Issues:
- S3/S4: Level 1 can be parked by driving into the back wall (damage 3, 2 stars). This is known and only costs the no-damage star.
- S4: A pure-brake stop at y 6.4 was not in the bay, so the first level needs fine creep control.
- S4: Not verified, same gaps the builder listed: audio, real touch/multi-touch, human playtest of hard levels (14 and the trailer levels), and levels other than 1/2.
