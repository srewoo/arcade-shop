# Fossil Frenzy - customisations

The game was "Dino Run: Locked In". It is now **Fossil Frenzy** (user-facing strings only: `<title>`, meta description,
title screen, tagline, one quip, `package.json` name). **Unchanged on purpose** so saved data and boards survive:
localStorage keys, leaderboard board ids (`dino`, `dino:*`), the `window.__dino` debug hook, the `dino/` folder.

Run: `cd src && npm test` (vitest, pure logic) and `npx vite build`.

## Modes (`modes.js`, `ui-modes.js`, `session.js`, `crash.js`)
Title chips, keys `<-`/`->` or `1`-`4`. Classic = original tuning. Hardcore = start 17 / max 36 / accel 0.32, no Shield pickups.
Zen = a hit tumbles the dino 1.3 s (ragdoll), then it gets up with 2 s grace; `Esc` or END RUN ends it; no leaderboard.
Time Attack = 60 s clock, a hit still ends the run. Bests per mode (`dino-run-locked-in:best[:mode]`, Classic key unchanged).
Boards: `dino`, `dino:hardcore`, `dino:timeattack` (`leaderboard.js` takes a board argument).

## Power-ups (`powerups.js`, `obstacles/pickups.js`, `fx/bubble.js`, `ui-power.js`)
Shield (visible bubble, absorbs one hit), Double Jump, Slow-Mo (0.6 time scale incl. ragdoll physics), Score x2.
Pickups sit mid-gap between obstacle meeting points (never on an obstacle), so they cannot make a section unwinnable.
Off in Classic unless "Classic Plus"; on in the other modes (settings toggle). HUD chips with timers.
Autopilot: `autopilotMath.js` + `Autopilot._wantsAirJump` spend the second jump at the last moment that still clears.

## World and obstacles (`world/biomes.js`, `world/daynight.js`, `obstacles/{boulder,log,meteor,difficulty,meteorMath}.js`)
Score-driven cycle: Desert -> Dusk Canyon -> Moonlit Desert (stars, moon) -> Dawn Dunes, 3200 score per loop (sky, fog, lights,
tints, toast on biome change). New obstacles fade in by distance (boulder 250 m, log 340 m, meteor 480 m, 250 m ramp):
rolling boulder (jump), hanging log (duck, cannot be jumped), meteor with ground marker (lands >= 1.3 s before arrival, then a
rock to jump). New obstacles appear in every mode except Classic (unless Classic Plus). Autopilot handles all of them.

## Environments (`world/weatherModes.js`, `weather.js`, `snow.js`, `rain.js`, `particles.js`)
Auto (cycle above), Day, Night (locked; fill light near the dino keeps obstacles readable), Snow (white ground texture, shader
dusting of up-facing surfaces, flakes, falling gravity x0.92 for floatier landings: the only gameplay effect), Rain (overcast, dense
fog, streaks, lightning flash + delayed thunder, wet sheen). Title chips, key `W` (title), settings panel; persisted as `weather`.
Particles are camera-relative preallocated buffers, capped by quality (`particleBudget`), x0.6 on mobile, x0.4 count/speed and no
lightning flash with reduced motion. Cosmetic: leaderboard boards unchanged.

## Settings and skins (`settings.js`, `storage.js`, `ui-settings.js`, `apply-settings.js`, `skins.js`, `dino/recolor.js`, `quality.js`)
Panel via title button or `S`, `Esc` closes: difficulty (x0.85/1/1.15 speed), volume, graphics quality (auto/high/medium/low via
`qualityLevels.js`), camera shake, reduced motion (defaults from the OS), power-ups, Classic Plus, environment, skins unlocked at
best 500/1000/2000/4000 in any mode. All stored as one validated JSON (`dino-run-locked-in:settings`); every access try/catch.
Input: `S`/`W` only act as hotkeys on title / game over (they duck / jump while running); `Esc` on game over returns to title.

## Other
`window.__dino` gained `skip(metres)`, `world`, `settings`, `powers`, `hud`. Tests: `src/tests/*.test.js`.
