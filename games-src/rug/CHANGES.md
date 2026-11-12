# Living Room GP (formerly Rug Racers): changes

Internal identifiers are unchanged on purpose so saved data and boards survive: localStorage keys `rug-racers-*`,
leaderboard boards `rug:<mapId>`, `window.__rug`, the folder name. Only user-facing strings were renamed.

## Verification
* `npm run build` and `npx vitest run` (82 tests, 7 files) pass.
* `__rug.sim()` finish times for the six original maps are bit-identical (sol 31.954166666665174, sol-twist 36.39583333333533,
  sol-mirror 34.0958333333335, claude 29.11249999999867, claude-bend 31.591666666665194, claude-wild 32.46249999999887).
  New maps: round 23.37916666666566, runner 27.09166666666545.
* Mechanism: all new gameplay objects are optional (`tune`, `tracker`, `drift`, `rubber`, `pads` default to neutral values,
  multiplications by exactly 1), no new RNG draws inside the sim; new painting/skin code uses its own RNGs.

## A. Rename
`index.html` (title, new inline SVG favicon), `src/ui/template.js` (logo "LIVING ROOM GP", "All games" link removed),
`package.json` / lock (`living-room-gp`), loader comment.

## 1. AI opponents and HUD
* `src/logic/difficulty.js` (Easy/Normal/Hard/Insane scale AI top speed, lateral budget, rubber-band gain and limits; Normal = x1).
* `src/race/aiDriver.js`: 2 extra `AI_PROFILES` (opponents 4-5), `opts.rubber`. `src/race/Race.js`: opponents 0-5, difficulty, grid slots
  (player stays on slot 3, extra AI start behind), pad set.
* HUD: `src/ui/raceHud.js` (position "n/N", gap seconds to car ahead/behind via `src/logic/gaps.js`), `template.js`, `hud-extra.css`.
* `src/main/garage.js`: opponents 4-5 get unused (kind, model) pairs from a separate RNG.

## 2. Time trial, ghost, sectors
* `src/logic/ghost.js` (20 Hz recorder, zig-zag varint + base64, validation, <=7200 samples / 60k chars), `splits.js`, `bests.js`.
* `src/race/runTracker.js` (splits, lap times, live delta, ghost record/playback), `src/main/ghostView.js` (translucent coupe),
  `src/main/records.js` (localStorage `rug-racers-best:<mode>:<map>:<laps>`, `rug-racers-ghost:<map>:<laps>`, validated on load),
  `src/main/runResults.js`, `modes.js` (T key = Time trial, laps 1/3/5 from settings).
* Online board only for race mode + 3 laps + >=1 AI + normal pads + a map with a board (`leaderboardEligible`, `hasBoard`).

## 3. Boost and drift
* `src/logic/drift.js` (points by speed and duration, combo, bank after 1.5 s, lost on hit, mini-turbo tiers 1 s / 2 s, spark colours),
  `src/race/driftBoost.js`, `src/main/driftFx.js`, `Particles.sparks`, `Car.drifting`.
* Bigger nitro meter (percent, key chip, quarter ticks, low/ready states). `boostPads.js`: `buildBoostPads(n)`, Normal 5 / More 8
  (the algorithm can skip a slice with no straight; e.g. sol gives 7), `effects/batteries.js` `setPads`.

## 4. Tuning and settings
* `src/logic/tuning.js` (8 models, stat multipliers on top speed/accel/grip/boost, applied to the player car only, bars in the garage).
* 6 new colours (17 total, appended). Camera views chase / far / top-down / cockpit on C (`main/cameraViews.js`, `CameraRig.view`).
* `src/logic/settings.js` + `main/settingsMenu.js` + `ui/settingsPanel.js` (key O or title button, Esc closes, arrows/Tab work):
  difficulty, opponents, laps, pads, camera, volume, quality, theme, pattern, floor. Stored in `rug-racers-settings`, validated.

## B/C. Themes and patterns
* `src/logic/appearance.js` (ids, palettes, colour grading), `src/world/paint/restyle.js`, `printTexture.js` (`paintPrintTexture(progress, style)`).
* Themes: Classic, Autumn, Winter (snow speckle), Neon Night (grade + emissive map + dark lights, glows through the bloom), Pastel.
  Patterns: Playmat (original, same `mulberry32(4242)` order), Persian (own seeded painter; lakes kept visible), Blueprint (edge-detected line art).
* `main/appearance.js` repaints the existing canvas/texture in place and regrades prop vertex colours; routes, masks and colliders are not rebuilt.

## D. New maps
* `round` (oval rug, bean loop) and `runner` (strip rug, chicanes and tight end hairpins): `src/logic/shapeRoutes.js`
  (route, clip shapes, zones, roundabout centres), `src/world/pathGeometry.js`, `config/maps.js`, `solTrack/solRoute/solRoads/solArrange`
  (sol family, seeded scenery generator), alpha-clipped rug (`restyle.maskToShape`), shape clamp in `carCollision.js`, top view fit in `CameraRig`.
* Previews: `extra-maps/*.png` + `routes-extra.json`, merged by `scripts/copy-static.mjs`. No online board (local bests only).

## E. Floors
`src/world/floors.js` (dark wood, tiles, grass; parquet = the existing procedural texture), `scene.js` `applyEnvironment` (walls, sky, lights).

## Tests
`tests/*.test.js`: settings (incl. theme/pattern/floor), difficulty, ghost, drift, splits/bests, tuning/gaps, shapeRoutes. Run `npm test`.

## Polish pass (2026-11-11)
Full list with verification: `production/polish/rug-changes-2026-11-11.md` (one row per review item). Summary:
* Pause (P / Esc / touch pause button, auto-pause on hidden tab or blur), first-run how-to card, Reduce motion, colour-blind assist,
  HUD size 100/125/150 %, nitro hold/toggle, SFX and Engine volume, 44 px touch targets, HUD text floor of 12 px, contrast fixes.
* New cues: lap, split, drift tier/bank/lost, wrong way, nitro ready, overtake, new best, pad, mini-turbo (per tier), pause/resume.
* Medals per map (par = autopilot lap, `config/medals.js`, sweep in `docs/balance.md`), difficulty shown on the results card.
* Tuning moved to `config/` (ai, drift, camera, hud, audio, medals); user strings for new UI in `src/ui/strings.js`.
* **Debug hooks (`window.__rug`) now need `?debug=1`** (or the dev server). The sim gate script must open `/?debug=1&map=<id>`.
* The sim gate is unchanged: `__rug.sim()` for the six original maps stays bit-identical; round 23.37916666666566 and runner 27.09166666666545 also still match.
* Render interpolation (240 Hz sim, drawn blended by accumulator / step) is draw-only: `Session.step` only records the previous pose.

## 2026-11-12: Simple loading bar and title refresh

- **Loading screen:** the pixel-art construction scene (`public/loader.js`, about 3,500 lines, run in a Worker on an OffscreenCanvas) is replaced by a plain DOM progress bar (`public/boot.js` and `public/boot.css`). The interface is unchanged: `window.__bootLoader.set(p, text)`, `stop()` and `window.__bootStart()`. The bar never runs backwards and has `role="progressbar"` with `aria-valuenow`. `src/boot/loader-worker.js` was removed, and so was the copy step in `scripts/copy-static.mjs`.
- **Title screen** (`src/title-look.css`, loaded before `touch.css` so touch sizing still wins):
  - The menu sits on a cream card.
  - A soft vignette pushes the rug back, and the logo tiles overlap the card's top edge.
  - Buttons no longer sway.
  - The small buttons (Skins, Maps, Settings, How to play) are white chips with a coloured label and key.
  - `src/ui/template.js` wraps the tagline, menus and best time in `.title-card`.
