# Sky Skirmish verification, 2026-11-11

Verdict: PASS (no S1/S2).

Gates: tsc OK; vitest 57/57 (7 files); build OK; npm audit 0 vulnerabilities. package.json dependencies and .npmrc match tictactoe. No source file over 300 lines.

IP: grep for sponsor names and "Air Fighting" in the project (excluding node_modules, dist) returns nothing. The reference screenshot is a splash screen from a different vendor. Sky Skirmish art, name and layout are unrelated. OK.

Playwright (script verify-skyskirmish-1.mjs, port 4948): corrupt and bad-field localStorage loads cleanly; keyboard-only play scores and spawns pickups; 40x pause spam ends in a consistent state; blur auto-pauses; resize 400x860, 860x400, 360x740, 1280x800 and 300x300 keeps the canvas in the viewport with no horizontal scroll; god-mode jumps to boss waves 4/8/12 render; 6 lose/continue/again restart loops work (continues 2, then game over with again/quit); touch drag on a 400x860 emulated phone, bomb button is 44px high; zero console errors or warnings.

Issues
- S4: the onboarding hint banner overlaps the player ship at the start (dismissable).
- S4: at 1280x800 the 9:16 field is 443px wide with large empty margins (known gap).
- Not verified: audio by ear, Safari/Firefox, real touch hardware, human balance.

Cleanup: server stopped, dist/ deleted.
