# Fossil Frenzy (dino) UI/UX fixes, 2026-11-12

Source: games-src/dino/src. Build output: dist/games/dino (theme-boot.js present). Tests: 177 pass (169 before, 8 new).

## Audit issues
| # | Issue | Status | What changed |
|---|---|---|---|
| 1 High | LOADING button next to "PRESS SPACE TO RUN" | Fixed | START shows LOADING with a real progress bar (engine, idle, warm-up steps). CTA reads "SPACE OR TAP QUEUES YOUR START". Space/Enter/tap/click while loading queues the start ("STARTING", "STARTING THE MOMENT IT LOADS") and the run begins when physics is ready. Queue is dropped if the player left the title or opened a dialog. Verified by delaying the rapier chunk 12 s. |
| 2 Med | Long in-play hint line | Fixed | In-play line is "Space jump · Down duck" (touch: tap jump · swipe down duck), fades after about 5 s (COACH.hintsAutoHideS 8 to 5). Pause/mute/Double Jump text only on the title and when "?" is pressed. |
| 3 Med | Cacti hidden by dino/camera, same hue as dino | Fixed (outline everywhere, camera gated) | Every cactus gets a dark inverted-hull outline and a red-orange ground telegraph strip. Camera lifted 0.55 units in all configurations except Classic + Normal + no Classic Plus. |
| 4 Med | Game-over hierarchy | Fixed | Large SCORE number (display font) in its own centred card, NEW BEST/UNRANKED tags under it, quip then single stats line, centred. Offline leaderboard note is now screen-reader-only. |
| 5 Med | Landscape title cramped, chip-best 11 px | Partially | chip-best is now 12 px in landscape. Two-column landscape layout not done (risk to existing layout/camera shift). |
| 6 Low | CLASSIC badge always shown, ? duplicates hint bar | Partially | Mode badge fades out about 5 s into a run. "?" kept because it is now the only way to bring back the hint line. |
| 7 Low | Secondary pause buttons look disabled | Fixed | Pause secondary buttons are outlined (transparent, 3 px ink border), filled on hover. |
| 8 Low | Touch coach pill persists, no duck affordance | Not fixed | Coach pill already auto-hides after 4.2 s and was left alone. No new duck affordance. |

Collection-wide: results payoff then tiered card (crash/ragdoll plays about 2 s before the card, now with one clear score tier), non-blocking hint (fades, no reflow): applied.

## Classic / Normal constraint
No physics, spawn, timing or scoring code was touched. Camera lift is a pure function (cameraMath.hazardLift) that returns 0 for mode classic, difficulty normal, classicPlus off, so that configuration keeps the exact original framing. Outlines and ground strip are render-only children of obstacle meshes (no colliders, no spawn change). Start queue only changes when startRun is called, never how it runs.

## Files
New: startFlow.js, ui-start.js, cameraMath.js, css/start.css, tests/uiuxFixes.test.js.
Edited: strings.js, tuning.js, state.js, ui-chrome.js, controls.js, main.js, camera.js, ui-over.js, obstacles/field.js (295 lines), index.html, css/hud.css, css/title.css, css/overlay.css.

## Tests added (8)
Start action/phase/queued-fire rules, load steps monotonic, CTA text per phase, hazardLift gating (Classic Normal = 0), short hint/auto-hide.

## Screenshots (scratchpad pw/shots)
fix-dino-title-loading, title-queued, title-ready, play-hint, play-approach, play-hardcore, over, pause, settings, phone-title-loading, phone-title, phone-play, phone-over, land-title-loading, land-title, land-play, land-over, thumb-dino.png (480x300).

## Notes
No horizontal scroll at any size. One 404 resource request appears in the console (not identified; present before? unverified). Landscape game over still shows the quip pill.
