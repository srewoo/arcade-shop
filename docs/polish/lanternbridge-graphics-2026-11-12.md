# Lantern Bridge graphics pass, 2026-11-12

Reference: `CanUSolveThis` SWF checked and NOT a match (a timed "Go!" puzzle by another studio, no bridge/lantern content). Upgraded without a reference. Gameplay, tuning (except confetti count 36 to 56), save keys and debug hooks unchanged.

Changes (all DOM/SVG/CSS, no assets):
- New `src/art/backdrop.ts`: ridge + pine skyline with mist, moon glow, tiled water ripples, moon glitter, seeded fireflies. New `src/art/scope.ts` (unique SVG gradient ids so gradients survive hidden views).
- `src/art/figures.ts`: shaded bodies and heads (gradient rim/shade), cheeks, brows, mouth, scarf, ground shadow.
- `src/art/decor.ts`: bushes, flowers, lamp posts with light pools and richer glow.
- `src/ui/scene.ts`, `src/ui/menu.ts`: new layers (water, deck with rails, skyline, fireflies, vignette); title art now matches the scene.
- `src/style/art.css` (new), `scene.css`, `panels.css`: textured banks and shoreline shading, animated river, planked bridge with rails/shadow, dirt path, swinging lantern, bobbing raft, idle breathing, flicker, win flare. `src/ui/fx.ts`: confetti shapes/sizes.
- Reduce motion: no animations (drift, swing, breathe, fireflies halved, confetti off as before).

Verification: `npm run build` ok, `npm test` 82/82, `npm audit` 0 vulnerabilities. 1920x1080 play with idle animations: 60.1 fps. Console clean.
Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/lanternbridge/` (`before-*`, `after-*`). Thumbnail: `public/thumbs/lanternbridge.webp`.
