# Corner Pocket UI/UX fixes (2026-11-12)

Source: games-src/cornerpocket. Build: dist/games/cornerpocket. `npm test` 135/135 pass, `npm run build` passes.

## Audit issues
| # | Issue | Status | Notes |
|---|---|---|---|
| 1 | Balls tiny, numerals illegible, stripes vs solids | Fixed | Table now fills the stage (ball dia ~28 css px at 1280x800, was ~22). Numerals min 11 screen px (was 8). Stripe band reworked (white caps visible, smaller badge on stripes), bigger specular. Physics untouched. Phone portrait balls ~15 px (limited by screen size). |
| 2 | Wasted play area, pillarbox | Fixed | Stage fitted to the table aspect on desktop, rotated tall stage on portrait, side HUD column on landscape. Table share of viewport: desktop ~40% -> 77.6%, 860x400 47% -> 65.3% (canvas 73%), phone portrait -> 69.8% (canvas 75%). |
| 3 | Hint dismissal reflows table 14% | Fixed | Hint is an overlay pill in the stage, auto-dismisses after 9 s. Canvas rect identical before/after (measured at all 3 viewports). |
| 4 | Flat art | Fixed | Felt noise tile, cushion shadow on cloth, wood grain + bevel + drop shadow on rails, gold/leather pocket rims, ball specular, stage shadow. Cue-ball English indicator not added (spin mark already shows when spin is set). |
| 5 | Bare title, tall Pause slab, HUD weight | Fixed | Title has logo and a live table preview with a racked set. Pause is a 44 px icon in the HUD strip with ? and a standard cog. Score is the headline stat (gold, bumps on change), time turns red under 10 s. |
| 6 | Dense key legend | Fixed | Legend moved behind a "?" dialog (pauses the game, Esc returns to pause panel). Only one hint remains. |
| 7 | Feedback: Miss floats randomly, thin results | Fixed | Floating text anchored above the cue ball and clamped to canvas, "No contact" shown when the cue ball hit nothing. Result card shows tier line plus Score/Racks/Pots/Shots/Combo chips (trick: Shots/Par). Card appears 0.7 s (0.25 s reduced motion) after the table payoff text and sparkles. |
| 8 | Landscape / phone responsive | Fixed | Landscape side column (HUD + controls), table 65%. "Got it" no longer wraps. Phone controls are 2 rows (spin, aim/shoot); power meter moved into a bar on the stage bottom edge. |

Collection-wide items: settings icon is a cog (done); colour-blind assist now defaults on for new players (stored values are kept); star copy: tiers (Perfect/Nice shot/Solved/Try again) derive from the awarded stars; HUD integrated as a dark strip fused to the stage (partial: not overlaid on the felt, to keep rails and pockets clear).

## Partial / not done
- Phone portrait: the first-run pill still covers a few ball-radii of the bottom rail and sometimes a ball for up to 9 s (non-blocking, pointer-events only on the button). Partial.
- Pocket mouths drawn at the physical capture radius (shrinking them would misrepresent capture). Not changed.
- Phone ball size is bounded by screen width.

## Files changed (games-src/cornerpocket)
index.html, src/style.css, src/main.ts, src/ui.ts, src/coach.ts, src/strings.ts, src/settings.ts (colorAssist default true), src/gameTypes.ts, src/rack.ts, src/modes/rackMode.ts, src/renderTable.ts, src/renderBalls.ts, src/renderFx.ts, src/render.ts, src/geom.ts, src/config/layout.ts; new: src/hudFormat.ts, src/results.ts, src/helpUi.ts, src/preview.ts; tests/polish.test.ts (new), tests/settings2.test.ts (default updated).

## Tests added
tests/polish.test.ts: table fill >=99% of a matching stage (landscape and portrait), number size >=11 px at desktop scales, assist default on, HUD primary/urgent rules, "No contact" vs "Miss", text clamp, tier/stat copy.

## Verification
No horizontal scroll and no console errors at 1280x800, 400x860, 860x400. localStorage keys and ?debug=1 hooks (`window.__cp`) unchanged.

## Screenshots (scratchpad pw/shots/)
fix-cornerpocket-{desk,phone,land}-{1title,2play-hint,3play-after-shot,4pause,5settings,6help,7payoff,8results}.png, fix-cornerpocket-phone-9eight.png, fix-cornerpocket-phone-9trick.png, thumb-cornerpocket.png (480x300).
