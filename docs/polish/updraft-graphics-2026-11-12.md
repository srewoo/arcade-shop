# Updraft graphics pass (2026-11-12)

Reference: `Chopper Challenge` SWF (cave flyer with hatched ceiling, orange teardrop flames, spinning rotor). Mood and flame shapes only; everything redrawn in code.

## Visual changes
- Cave walls and pillars (`render/rockTexture.ts`, `render/rock.ts`): textured stone (strata, stones, cracks, mineral flecks) painted once as a device-resolution pattern with depth shading baked in; pillars get side shading and a glowing tip. Collision edges unchanged.
- Backdrop (`render/terrain.ts`, `render/caveDeco.ts`, `render/caveMath.ts`): cached gradient/glow layer, light shafts, hanging stalactites, three parallax ridge layers, glowing crystal clusters (cyan/violet, pulsing), floor mist, drifting motes.
- Craft (`render/craft.ts`): faceted hull, glass canopy, blinking wingtip lights, additive teardrop thruster flame, softer halo. Hit radius unchanged.
- Coins: embossed rim with highlight. Particles: additive glowing sparks, soft smoke. Crash: fireball flash plus shockwave.
- Gameplay, tuning, save keys, debug hooks unchanged. New `tests/caveMath.test.ts`.

## Results
- fps at 1920x1080 (headless software rendering, autopilot): 56-58 (original build measured 60 in the same harness; first draft was 24 and was fixed by caching the static layer, sprite light shafts and a pixel-snapped rock pattern). Real GPU Chrome has far more headroom.
- `npm run build` OK, `npm test` 124/124, `npm audit` 0, console error-free.
- Thumbnail: `public/thumbs/updraft.webp`.
- Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/updraft/` (`before-*`, `after-*`).
