# Lily Hop verification, 2026-11-11

Verdict: PASS (no S1/S2).

Gates: tsc clean; vitest 86/86 (10 files); build ok; npm audit 0 vulnerabilities; package.json pins and .npmrc match template; all files <=300 lines; no sponsor or original-name strings found (grep); art is original (code-drawn cartoon frogs/toads on lily pads, differs from the frog_leap reference).

Played in headless Playwright (verify-lilyhop-a/b/c.mjs, port 4945):
- All 9 levels solved at exactly the optimal move count via the solver; daily puzzle solvable and deterministic.
- Stuck detection works; restart loop, 50x pause spam, key spam, blur auto-pause all stable.
- Resize through 400x860, 860x400, 1280x800, 320x568: no horizontal scroll, pads >=44px.
- 7 corrupt localStorage variants fall back cleanly.
- Phone and landscape touch taps hop; keyboard-only full solve (Tab/Enter/H) wins.
- No debug hook without ?debug=1; 0 console errors or warnings.
- Hint-used win capped at 2 stars.

Issues:
- S4: desktop menu leaves the lower ~40% of the viewport empty.
- S4: status line fades in via an opacity ramp, so mid-transition screenshots look faint; settles to full opacity.
- S4: undo is free, so 3 stars are reachable by trial and error (builder-known).

Screenshots: scratchpad/new-games-shots/verify-lilyhop-*.png
