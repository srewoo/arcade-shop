# Sudoku Dash graphics pass, 2026-11-12

Reference: none (no SWF exists for this game). Upgraded on its own merits. Solver and all core logic untouched (section 7); gameplay, tuning, save keys and `?debug=1` hook unchanged.

Changes:
- `src/art.css` (new): ambient gradient + faint lattice page background, glossy title card and buttons, bevelled board (top-light/bottom-shade per cell, glow frame, selection glow + pulse), keycap number pad, gradient HUD with glowing time and combo bars, win celebration (rotating gold rays, glowing card, gold-shine heading, shaped confetti, radial spark burst). Dark theme has its own highlight/shade tokens.
- `src/ui/hero.ts`: title art redrawn (framed board, glowing gradient bolt, twinkling sparks).
- `src/ui/board.ts` + `src/board.css`: alternating 3x3 box tint; placed digits pop in (skipped under Reduce motion).
- `src/ui/endScreen.ts`, `src/config/juice.ts`: confetti shapes (rect/dot/star/ribbon), spark burst, `won` class on the end overlay.
- Reduce motion: pop, pulse, sparkle, rays and confetti all off (existing global reduce rule + guards).

Verification: build ok, 127/127 tests, `npm audit` 0 vulnerabilities. 1920x1080 play: 60.3 fps (60.2 dark, 60.3 reduced motion). Console clean.
Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/sudokudash/` (`before-*`, `after-*`). Thumbnail: `public/thumbs/sudokudash.webp`.
