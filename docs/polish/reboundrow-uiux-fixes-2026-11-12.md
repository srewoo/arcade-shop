# Rebound Row UI/UX fixes (2026-11-12)

Source: games-src/reboundrow. Build: dist/games/reboundrow. `npm test` 59 passed (43 before), `npm run build` OK, no console errors, no horizontal scroll.

## Audit issues
| # | Sev | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 1 | High | Prototype look, flat title/page | Fixed | Always-dark themed title and game page (indigo gradient, accent #8a6cf0 glow), large wordmark, animated demo scene (ball, paddle, regrowing bricks; static under Reduce motion). |
| 2 | High | Flat identical bricks, no juice | Fixed | Per-row hues with bevel, shadow and highlight; armoured bricks get ring frames plus dots; shatter particles (rotating), brick hit flash, paddle squash, ball halo, "+N xM" popups, combo shake nudge, life-lost vignette plus banner. All behind Reduce motion. |
| 3 | High | Fixed 5:6 field, 47% / 33% of viewport | Fixed | Logical field fits the screen (layout.ts): width 600-760, height 520-1200 (min raised for tall boards). Wall bricks stay centred. Canvas fills the stage. |
| 4 | Med | Desktop composition off-centre | Fixed | Field is centred, HUD overlays it, backdrop fills the sides. |
| 5 | Med | Weak HUD, Best shown, no hierarchy/combo/timer | Fixed | Translucent in-scene chips, score 1.7rem white primary, Best removed, combo chip, power-up timer chips with progress bar. |
| 6 | Med | Launch prompt weak, no life-lost cue | Fixed | Pulsing prompt (static under Reduce motion), "Ball lost - N left" banner, flash and shake. |
| 7 | Med | Hint card covers touch area | Partially | Now a pointer-events:none pill in the empty mid-field (no reflow, no Got it button), hides on launch or after 12 s. Still on the playfield, not off it, because the field fills the screen. |
| 8 | Low | Levels screen: locked tiles read as empty | Fixed | Mini brick preview per level (dimmed when locked) with lock badge. No stars/best per tile (not tracked by the game). |
| 9 | Low | A11y: brick colours close | Fixed | Hue no longer carries hit points: ring frames and dots always show, assist adds hatch and numerals. Colour assist default stays off (hp is not colour-only). |

Collection-wide: settings icon is now a cog (was a sun); results play the payoff first (banner, confetti, 1.1 s, 0.25 s under Reduce motion) then a tiered card (Flawless / Steady hands / Close call from lives lost, plus "New best score!"). The game has no stars, so no star copy.

## Measured play area (field box / viewport)
- 1280x800: 48% -> 89.5%
- 400x860 touch: 47% -> 89.3%
- 860x400 touch: 33% -> 65.3%

## Files changed (src/ under games-src/reboundrow)
New: layout.ts, ui/stageLayout.ts, ui/renderFx.ts, ui/titleArt.ts, tests/layout.test.ts, tests/ui-pure.test.ts.
Edited: index.html, config.ts (brick top 64->80 for the HUD band, fx and field limits), palette.ts, strings.ts, run.ts, sim/{world,balls,bricks,outcome,bot,step,powerups,scoring}.ts, ui/{render,drawBricks,fx,events,hud,loop,input,onboard,menu,flow,debug}.ts, main.ts, style/*.css, tests/contrast.test.ts.
Sim change: world now carries field, ox, paddleY, rows (default values equal the old constants, so seeded runs and existing tests are unchanged). The field only changes while the ball is on the paddle. localStorage keys and debug hooks are kept.

## Tests added
Field fit limits, aspect behaviour, tall-board clearance, placement, >=65% coverage on 3 viewports, setField re-anchoring and wall/floor behaviour in the sim, clear tier, level preview markup, title demo bounds, reduced-motion effects, row palette contrast and dark-scope tokens.

## Screenshots (arcade scratchpad pw/shots)
fix-reboundrow-{desk,phone,land}-{title,play0,play1,play2,pause,settings,lost,clear-payoff,results}.png, fix-reboundrow-desk-levels.png, thumb-reboundrow.png (480x300).

## Not done / caveats
Hint is not off-playfield (see #7). Landscape phone is 65.3%, just above the target. Theme setting now affects dialogs only (title and game are always dark).
