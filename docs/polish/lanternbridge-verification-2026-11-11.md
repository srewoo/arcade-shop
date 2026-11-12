# Lantern Bridge verification (2026-11-11)

Verdict: PASS (no S1/S2). Gates: tsc 0 errors, vitest 73/73 (5 files), build ok, npm audit 0 vulnerabilities.

## Method
Independent tsc/vitest/build/audit; `vite preview --port 4943`; headless Playwright scripts `verify-lanternbridge-{1,2,3}.mjs` in the pwtools scratchpad. Screenshots: `new-games-shots/verify-lanternbridge-*.png`. Server stopped, dist/ deleted.

## Results
- Solvability: all 27 levels (21 bridge, 6 raft) plus the daily puzzle completed via UI Hint+Cross to a win; 2 stars each (hint cap works). Zero console errors.
- Abuse: 30x rapid key mashing/undo/hint, 40x P and 20x Esc spam (never more than 1 dialog), repeated blur/visibilitychange, 10x restart loop, resize/rotate through 5 viewports mid-game (selection kept, no hscroll): no crash.
- Storage: garbage, null, array, 100KB string, wrong types, and throwing localStorage all load; settings fall back per field (valid theme/reduceMotion/textSize kept, invalid volume/colorAssist reset). Bad progress rows dropped.
- Pause: Resume (focused)/Restart/Settings/Quit; Quit asks confirmation; Settings opens from pause.
- Layout: no horizontal scroll at 1280x800, 400x860, 860x400, 360x640; all tap targets >=44px; no text <12px; focus ring 3px solid. Touch tap play works on phone and landscape emulation.
- Network: zero external requests.
- IP: compared with CanUSolveThis-1/2.png (pink figures, log bridge, purple sky). Lantern Bridge uses its own cast (Wren, Tobin, Ines, Odo, Hester, Bram, Quill), own art, own level times/titles. grep for Optus/Mousebreaker/Uzinagaz/2DPlay/Absolutist/Arkadium/bravo found nothing. Bridge-and-torch and river-crossing are generic public-domain puzzles. No breach.
- Code: all files <=300 lines (largest 132), no `any`, debug hooks only with ?debug=1, config and strings modules present, zod persistence.

## Issues
- S3: On 400x860 phone the primary Cross button starts at about y=830 on 7-traveller levels (page scrolls 1064/860; 360x640 scrolls 1316/640), so after picking travellers the player must scroll to press Cross. Conventions ask the play area plus HUD to fill the viewport. Repro: 400x860, open level 21, Cross is at the bottom edge. (Builder listed this as a known gap.) Mitigation: keyboard C, or sticky action bar.
- S4: Phone menu also scrolls (983/860); landscape level list scrolls slightly (452/400).
- S4: Esc pressed right after the final move (before the win dialog opened) opens Pause instead of nothing; harmless.
- S4: Not verifiable here: audio by ear, Firefox/Safari Esc behaviour, Lighthouse.
- Note: levels are not locked and stars/par tuning is untested by humans.
