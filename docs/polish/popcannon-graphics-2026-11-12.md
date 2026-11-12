# Pop Cannon graphics pass (2026-11-12)

Reference: `Bubbles Shooter` SWF (glossy glass bubbles, radial shard pop animation). Mood and pop idea only; all art redrawn in code.

## Visual changes
- Bubbles (`drawBubble.ts`): glass-candy orbs with lit body, bounce light, tinted fresnel rim, large and small specular glints. Bomb gets a glowing fuse and core, rainbow uses a conic colour wheel, stone has faceted rock. Symbols and colour-blind cues unchanged; still served from the sprite cache.
- Backdrop (`renderBackdrop.ts`, cached): deep-space gradient, nebula glows, stars, lattice, lit launch pad rings, red danger-zone tint, wall shading.
- Ceiling and cannon (`renderParts.ts`): riveted metal beam with glowing countdown bulbs (amber warning state kept), shaded barrel with bands and muzzle ring, domed base with highlight, muzzle flash glow, NEXT plate.
- FX (`renderFx.ts`, `renderGuide.ts`): additive ball trail, pop shockwave rings, spinning glass shards, glowing aim dots and landing disc. Reduce motion skips rings/shake as before.
- Gameplay, tuning, save keys, debug hooks unchanged. New `tests/shade.test.ts`.

## Results
- fps at 1920x1080 (headless, continuous shooting): 60.3.
- `npm run build` OK, `npm test` 239/239, `npm audit` 0, console error-free.
- Thumbnail: `public/thumbs/popcannon.webp`.
- Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/popcannon/` (`before-*`, `after-*`).
