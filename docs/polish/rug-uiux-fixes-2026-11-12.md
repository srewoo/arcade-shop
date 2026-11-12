# Living Room GP (rug): UI/UX fixes, 2026-11-12

## Audit issues
| # | Issue | Status |
|---|-------|--------|
| 1 HIGH | Pause dialog under hint bar, "Quit to title" clipped | Fixed. `.pause/.tips/.settings` z-index 20, hint z-index 1. Hint also fades after 8 s (was 12) with a 1.2 s fade. |
| 2 HIGH | Landscape 860x400 "How to play" taller than viewport | Fixed. Short-height layout: 3 step columns, compact card, no preventScroll focus jump (card top 66px, no scroll). Pause menu is a 2x2 grid there. |
| 3 MED | Touch start needs second tap | Fixed. Touch first run: one tap starts, a non-blocking fading tip chip replaces the modal. Keyboard keeps the modal. "How to play" button copy now says "close" instead of "start". |
| 4 MED | HUD clutter | Fixed. Empty stat rows hidden until data (plate hides when all empty), more opaque plates, hint auto-fades. Hint is still a wrapped row on desktop, but overlays nothing once faded. |
| 5 MED | Gap readouts unlabelled | Fixed. "AHEAD" / "BEHIND" labels, car name dimmed. |
| 6 MED | Portrait minimap 109x77 | Fixed. 164x115 min on portrait, 140x98 min on landscape touch. Portrait chase camera `ahead` 9 to 6.5 so the car sits higher (presentation only). |
| 7 LOW | Settings clipped / oversized slider focus box | Partially. Dialog scrolls inside itself, rows tightened below 860px tall (Quality visible, last rows scroll); slider focus ring now hugs the thumb. Scrollbar styling is set but headless screenshots show none (OS overlay scrollbars). |
| 8 LOW | Phone title cramped | Not fixed (not touched; title layout is shared with desktop, risk/benefit judged low). |
| 9 LOW | Offline leaderboard on results | Fixed. Reached results screen. Offline now shows a calm note "Online leaderboard unavailable offline. Your local best is saved." instead of a name form that ends in a red "Couldn't save". No request in the extension; on the web a failure sets a 2 min cooldown, so only the first title fetch 404s. |

Collection-wide: onboarding no longer covers the action on touch (applies); HUD/results hierarchy already good.

## Files changed (games-src/rug)
src/polish-ui.css (new), src/main.js, src/ui/{template,strings,pausePanel,raceHud,boardsPanel,UI}.js, src/ui/statRows.js (new),
src/api/leaderboard.js, src/main/{overlays,runResults,modes}.js, src/config/hud.js (hintSeconds 12 to 8), src/camera/CameraRig.js (portrait `ahead`).

## Tests added
tests/statRows.test.js (3), tests/leaderboardOffline.test.js (offline cooldown). `npm test`: 20 files, 148 tests pass. `npm run build` passes; built to dist/games/rug.

## Sim finish times (window.__rug.sim(), after change; bit-identical)
sol 31.954166666665174, sol-twist 36.39583333333533, sol-mirror 34.0958333333335,
claude 29.11249999999867, claude-bend 31.591666666665194, claude-wild 32.46249999999887.

## Screenshots (scratchpad pw/shots)
fix-rug-{desk,phone,land}-{title,howto,countdown,race-early,race-late,pause,settings,results}.png, fix-rug-desk-firstrun.png, thumb-rug.png.
Console: only the expected leaderboard 404 (one per page on http).
