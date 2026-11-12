# Tiny Links: new game, graphics and build report (2026-11-12)

Folder: `arcade-extension/games-src/tinylinks` (id `tinylinks`, genre sports, accent #3a9d5d). Thumbnail: `games-src/tinylinks/thumb.webp` (480x300).

## Reference used
`/Users/sharajrewoo/Desktop/swfFiles/golf_*` (decompiled scripts only for mechanics: aim angle plus power/8 launch speed, a stroke
cap of 7, ramps that redirect the ball, hazard resets). The 18 holes, all art and all sound are original and code-drawn; nothing was copied.

## What was built
- Physics (`src/physics`): fixed 1/120 s step, constant rolling deceleration plus drag, sand (4x friction), ramps (constant acceleration),
  wall bounces with soft-contact damping, bumper posts, sliding gates and spinners (moving segments with surface velocity), water and void
  hazards (+1 stroke, back to the last rest spot), cup with lip pull and a too-fast skip speed. No randomness, so shots are repeatable.
- 18 holes (`src/course`): Front 9 (straight, dogleg, sand, bumpers, keyhole, cross slope, pond bridge, zigzag, sliding gate) and Back 9
  (dune corner, stepping-stone ponds, ramp rally with a void pit, pinball pit, twin gates, spinner, sand and sea, switchback, finale gauntlet).
- Game: 1-4 hot-seat players (name + ball colour + non-colour marker), honours order, scorecard (Out/In on the 18), Birdie/Eagle/Albatross/
  Hole in one callouts, pick up at 8 strokes, solo best round per course.
- Input: drag back from anywhere (mouse/touch) with dead-zone cancel, keyboard aim (arrows/WASD, Shift = fine), Putt button.
  Portrait screens rotate the course 90 degrees so it fills the phone.
- UX per CONVENTIONS: pause overlay with in-page confirmations, auto-pause on blur/hidden, settings (volume, mute, reduce motion,
  colour-blind assist, text size, theme), focus-trapped dialogs, 44 px targets, aria-live status, zod-validated `tinylinks:` storage.

## Visual changes (all in `src/render`)
- `courseLayer.ts`, `walls.ts`, `surfaces.ts`, `decor.ts`, `textures.ts`: pre-rendered layer: turf gradient, mowing stripes (angle per hole),
  speckle and blade texture, wall ambient occlusion, bevelled walls (cast shadow, dark edge, lit body, top highlight, rivets), sand with grain and
  ripples, water with rim and inner shadow, void with hatching, bumper posts, tee box, cup, scenery (bushes, rocks, flowers) from a seeded RNG.
- `dynamic.ts`: animated water shimmer and sparkles, flowing slope chevrons, striped moving gates and spinners with shadows, waving flag.
- `ball.ts`, `guide.ts`: ball with shadow, radial shading, rotating marker (roll cue), specular highlight; aim guide predicted with the real
  physics (bounces included), power label, arrow, putter pulled back with the power.
- `particles.ts`, `callout.ts`, `frame.ts`: dust, sand, splash drops and rings, confetti (hole in one / birdie), big outlined callout text.
- Colour-blind assist: dashed hazard outlines, larger ball marker and an initial above the ball. Reduce motion: no shake/parallax, static
  shimmer/chevrons, no callout animation, particles cut to 40%.

## Verification
- `npm run build`: pass. `npm test`: 127 tests in 9 files pass (physics, scoring, aim and view maths, scorecard, match, game flow incl. water
  penalty and pick up, settings/storage validation, contrast, particles, and per-hole validity).
- Level validity: every hole has tee and cup on playable ground, no mover sweeps over them, slopes are gentle enough to hold a resting ball,
  and a distance-field check proves the cup is reachable. A brute-force putting bot (`src/physics/solver.ts`) then holes out every hole with the
  real physics within par + 4 (it needs 1-5 strokes). A random-shot test also checks the ball never leaves the walls on any hole.
- `npm audit`: 0 vulnerabilities.
- FPS (headless Chromium, software canvas, 1920x1080, rAF over 3 s): 60.0 on the title demo, hole 18 aiming (movers, water, sand, guide),
  hole 12 (slopes) and hole 18 rolling; p95 frame 16.7 ms. The rough/vignette background is cached in an offscreen canvas.
- Console: no errors or warnings in any screenshot run.

## Screenshots (scratch)
`/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/1c38a79e-79b3-4e1f-9245-1155693b49e2/scratchpad/shots/tinylinks/`
(`final-d-*`, `final-m-*` title/aim/roll at 1280x800 and 400x860, `b-hole*.png` per-hole at 1280x800, `fx-splash/ace/sand.png`, `m2-*` portrait,
`u-*` UI flows including setup, drag, pause, scorecard, and the 860x400 landscape).

## Notes for the lead
- No edits outside the game folder except this report. Catalogue entry is yours to add (`id: tinylinks`, title "Tiny Links", genre sports,
  accent #3a9d5d, thumb `games-src/tinylinks/thumb.webp`).
- Build uses the default Vite config with the relative `--base ./` passed by `scripts/build-games.mjs`; no `vite.config` needed.
