# Kerbside UI/UX fixes (2026-11-12)

Source: games-src/kerbside. Build: dist/games/kerbside. `npm test` 140/140 pass, `npm run build` passes, 0 console errors, no horizontal scroll at any size.

## Audit issues
| # | Issue | Status | Notes |
|---|---|---|---|
| 1 HIGH | Flat lot, no identity | Fixed | Grass verge + bushes, kerb stones, tarmac patches/cracks/tyre marks, bay numbers, wheel stops, camera margin 0.4 to 1. Title is a dark lot with green accent. New file src/render/lot.ts. |
| 2 HIGH | No live alignment feedback | Fixed | src/alignment.ts: overlap and angle. Bay tints amber to green continuously, hatch + tick when in bay, bay axis vs car heading line, HUD "Align n% / In bay" stat. |
| 3 MED | Landscape: hint hides car, small board, small pedals | Fixed | Hint moved to a reserved toast row (no reflow, auto-hides after 9 s, never over the lot). Pedals stretch full height (>=56 px). Play area 58% to 69%. |
| 4 MED | Phone: bay at wall, hint covers board, bezel | Partially | Hint off the field, play area 66% to 77%. Bay position is level geometry (untouched). |
| 5 MED | HUD column on left, focus ring stuck, "Gear km/h" | Fixed | HUD floats over the scene (large Time primary, Par, Damage, Speed, Align). Focus goes to canvas after Play (no stuck ring). "Speed" label. |
| 6 MED | Level select stars / locked contrast | Fixed | Dash for unplayed, filled/outline for played; locked cards use full-contrast muted text (no opacity), larger cards. |
| 7 LOW | No how-it-works on title | Fixed | Two-line goal + controls summary on title. |
| 8 LOW | Title language inconsistent | Partially | New own dark title with rounded-rect buttons; no shared collection language is possible within one game. |

Collection-wide: play area >=65-70% (done), non-blocking hint (done), HUD in scene with time primary (done), art + juice (hit flash/sparks/shake, confetti, +score pop, win flash; all gated by Reduce motion), colour-blind cues on by default (colorAssist default true; hatch/tick/dash styles carry meaning), settings cog (n/a: no sun icon exists; settings stay on title/pause), results payoff first (1.3 s confetti/flash/pop, 0.65 s if Reduce motion) then tiered card (perfect/good/ok/fail styling and titles), star copy never contradicts award (starNote).

## Files
Changed: index.html, src/app.ts, config.ts, strings.ts, settings.ts, debug.ts (added `bay()` hook), scoring.ts, ui/hud.ts, ui/result.ts, ui/levelSelect.ts, render/{camera,fx,palette,renderer,scene}.ts, style/{base,game,panels,tokens}.css, tests/contrast.test.ts.
New: src/alignment.ts, src/render/lot.ts, tests/alignment.test.ts.

## Tests added
alignment/overlap/closeness/mixHex, fitView top inset, tier + starNote + starGlyphs, particle scaling under Reduce motion, colorAssist default, title contrast tokens.

## Measured play area (canvas / viewport)
1280x800: 80% to 95%. 400x860 touch: 66% to 77%. 860x400 touch: 58% to 69%.

## Screenshots (shots/)
fix-kerbside-{desk,phone,land}-{title,levels,play0,play-misaligned,play-aligned,payoff,results}.png, fix-kerbside-desk-pause.png (stale, pause not re-captured after the last change), fix-kerbside-desk-settings.png, thumb-kerbside.png (480x300).

## Notes
Existing players with saved settings keep their stored colorAssist value. Pause/settings sheets were not re-inspected visually beyond the settings capture.
