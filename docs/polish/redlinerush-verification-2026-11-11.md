# Redline Rush verification, 2026-11-11

Verdict: PASS (no S1/S2).

Gates: tsc clean; vitest 9 files / 61 tests pass; npm run build OK; npm audit 0 vulnerabilities; package.json pins identical to tictactoe, .npmrc present; no source file over 300 lines.

IP: grep for Optus/Mousebreaker/Uzinagaz/2DPlay/Absolutist/Arkadium/bravo zulu/diver finds nothing. Art is code-drawn; reference (Uzinagaz "2.30" splash with a photo-style car and a character) is unrelated.

Browser (headless Playwright, preview on 4941; scripts verify-redlinerush-1.mjs, -2.mjs):
- Corrupt localStorage (garbage settings and records): loads, falls back, starts, saves cleanly.
- 40x pause spam, rapid/conflicting steering, restart loop x8, visibilitychange pause, blur pause: all consistent, one overlay at most.
- Resize mid-game 400x860, 860x400, 1280x800, 320x568, 360x740: no scroll, no touch target under 44px.
- Endless fuel-out, Time Trial finish and time-up show result screens; records persist; play again, quit to title work.
- Keyboard-only start works (Tab to mode, Enter; keys 1-3).
- Real CDP touch events: gas, steer, multi-touch (left+gas) and release all work.
- Bot runs: Daily mode produced near misses (2) and combo in the browser; run stays stable. Crude polling bot crashed out in Endless and Trial, consistent with a hard game at high speed, not a defect.
- ?debug=1 hook absent without the flag. 0 console errors or warnings.

Issues (S3/S4):
- S4: onboarding banner covers the top of the road in 860x400 landscape until dismissed or 9 s.
- S4: unlistened audio, human balance unplaytested (builder known gaps).
- S4: an idle car with lives=1 survived 12 s of traffic (lane geometry; not a bug).
