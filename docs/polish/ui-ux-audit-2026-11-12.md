# arcadeShop: independent UI/UX and graphics audit (2026-11-12)

Method: all 20 games, served from the built `dist/`. Each game was played in real Chromium (Playwright) at 1280×800 (DPR 1 and 2), 400×860 portrait with touch, and 860×400 landscape. Screenshots cover title, gameplay, pause, settings, and game over or results where reached. Text contrast was computed from the rendered page, and each game's source was read to learn its controls. Judgements were formed before reading the earlier `docs/polish` reports. Scores are out of 10.

## Ranking

| # | Game | Visual | UI/HUD | UX/Flow | Resp./Touch | A11y | **Overall** | Biggest issue |
|---|---|---|---|---|---|---|---|---|
| 1 | Living Room GP | 9 | 7 | 7 | 7 | 7 | **8** | Hint bar overlaps the pause dialog ("Quit to title" clipped); landscape "How to play" modal taller than 400 px |
| 2 | Fossil Frenzy | 8 | 7 | 6 | 7 | 7 | **7.5** | Title shows "LOADING" (~3.7 s) next to "PRESS SPACE TO RUN"; cacti hidden by camera/body until the hit |
| 3 | Pounce Pins | 8 | 7 | 7 | 7 | 7 | **7.5** | Landscape lane is 43% of the viewport; score doesn't visibly tick on impact; poster text overflows |
| 4 | Stackfall | 8 | 7 | 7 | 8 | 7 | **7.5** | Default shape glyphs only 1.5–2.1:1 on their stone; assist mode off and below the fold in Settings |
| 5 | Lily Hop | 8 | 7 | 8 | 8 | 7 | **7.5** | Perfect play + 1 hint = 2 stars while the dialog says "best possible"; pond mostly empty, moon/ring clipped on phone |
| 6 | Lantern Bridge | 7 | 7 | 7 | 6 | 8 | **7** | Primary "Cross" button below the fold on phone, cut off at 860×400; empty "Rules" heading on every level |
| 7 | Clay Day | 6 | 7 | 8 | 7 | 7 | **7** | Gun is two crude rectangles and the hint card partly covers it; phone HUD ~235 px; "+37" popup clipped |
| 8 | Tic-Tac-Toe | 6 | 7 | 8 | 8 | 8 | **7** | Win highlight flashes saturated red (reads as an error); Game options panel outweighs the board on desktop |
| 9 | Crumb Run | 7 | 7 | 6 | 5 | 8 | **6.5** | Board ~40% of desktop, ~35% of landscape; dead gaps on phone |
| 10 | Pop Cannon | 7 | 6 | 5 | 7 | 7 | **6.5** | 3-step blocking tutorial covers the top rows: 4+ clicks before the first shot; touch buttons shown on desktop |
| 11 | Lucky Lanes | 7 | 6 | 6 | 5 | 7 | **6.5** | Scoreboard below the fold on phone and landscape; "GUTTER BALL" banner low contrast |
| 12 | Sudoku Dash | 6 | 7 | 7 | 6 | 7 | **6.5** | Board clipped at 860×400 with a toast over rows 7–9; 7 px pencil marks; 42 px cells; hint uses the error red |
| 13 | Kerbside | 5 | 6 | 7 | 7 | 7 | **6** | Lot is a flat dark rectangle; no live "aligned" feedback; landscape hint bar hides the car |
| 14 | Tile Tumble | 6 | 7 | 7 | 7 | 4 | **6** | Colour-only by default (deuteranopia red/green ≈1.26:1); assist off, behind a sun-looking icon |
| 15 | Measure Up | 6 | 5 | 6 | 7 | 7 | **6** | Title hero art broken (Wick cropped off an empty dark square); ~40% of desktop empty; win modal hides the gate opening |
| 16 | Updraft | 4 | 6 | 7 | 6 | 7 | **5.5** | Flat cave, ship and coins with no depth; ship ~22 px; on phone ~60% of the canvas is wall |
| 17 | Redline Rush | 4 | 5 | 7 | 6 | 7 | **5.5** | No sense of speed; road uses 38% of desktop, 27% of landscape; onboarding banner hides traffic |
| 18 | Corner Pocket | 5 | 5 | 6 | 6 | 5 | **5.5** | Balls ~20–22 px with ~7 px numerals; stripes/solids hard to tell apart; table ~40%; reflows 14% when the hint closes |
| 19 | Sky Skirmish | 4 | 5 | 6 | 5 | 7 | **5** | Prototype art: 20 px triangle ship lost on navy; HUD column ~700 px from the action; toast covers spawn |
| 20 | Rebound Row | 3.5 | 5 | 6 | 5 | 7 | **4.5** | Looks like a prototype: flat pale page, identical flat bricks, no juice; field 47% of phone, 33% of landscape |

## What's solid (don't regress)
- No console errors, no horizontal scroll at any size, and almost every control is ≥44 px.
- Every game has pause and settings. Computed text contrast passes 4.5:1 almost everywhere (one 4.42:1 label in Pounce Pins dark mode).
- Living Room GP, Fossil Frenzy, Pounce Pins, Stackfall and Lily Hop already look like finished games.

## Collection-wide problems (fix once as a pattern, apply to all)
1. **Play area too small.** 10+ games use 27–47% of the viewport, and 860×400 landscape is the weakest layout almost everywhere. Size the field to the shorter viewport dimension and, in landscape, move the HUD to a thin side strip. Target ≥65–70% of the viewport.
2. **Onboarding overlays cover the action.** Pop Cannon, Sky Skirmish, Redline Rush, Kerbside, Clay Day, Corner Pocket, Tile Tumble and Sudoku Dash all cover the playfield or shift layout when dismissed. Use a non-blocking, auto-fading hint placed off the field in reserved space, so there's no reflow.
3. **Uneven art direction.** Rebound Row, Sky Skirmish, Updraft, Redline Rush, Kerbside and Corner Pocket look like dev prototypes next to Living Room GP. They need backgrounds, depth (shadow, bevel, glow), and hit/score/fail juice (particles, shake, flashes, "+N" popups), all respecting Reduce motion.
4. **HUD outside the scene.** Sky Skirmish, Updraft, Pop Cannon and Rebound Row put a white HUD card beside a dark field, which pulls the eye away and makes them look like one template. Draw the HUD in the canvas or as translucent dark chips over it, with score as the clear primary.
5. **Colour-blind assist off where colour is the mechanic.** Tile Tumble and Stackfall (also Corner Pocket stripes/solids) should ship glyphs on by default, or ask on first run.
6. **Settings icon looks like a theme toggle.** The sun-like gear in Pounce Pins, Clay Day and Tile Tumble reads as brightness. Use a standard cog.
7. **Results screens are generic.** Win/game-over modals have weak hierarchy and cover the payoff (Measure Up's gate, Tic-Tac-Toe's line). Play the success moment first, then show a tiered card: outcome, score/stars, best, primary retry.
8. **Hint-capped stars contradict the copy** (Lily Hop, Lantern Bridge). State the star rule up front and never say "perfect" or "best possible" when stars were withheld.

## Previous polish docs vs reality
- Sudoku Dash changes doc says every control is ≥44 px, but phone cells measure 42 px and the title checkboxes 24 px.
- Measure Up's broken title art isn't mentioned in its reports (confirmed by screenshot).
- Several items filed as low severity (S4) are first-impression problems in practice: Rebound Row and Sky Skirmish visuals, Corner Pocket ball size.

## Suggested order of work
1. **Quick wins (hours each):** Measure Up title crop · Fossil Frenzy LOADING/PRESS SPACE contradiction · Living Room GP pause dialog z-order + landscape modal fit · Tic-Tac-Toe gold win highlight · Lantern Bridge empty Rules heading + sticky Cross button · Clay Day clipped popup · settings cog icon · star-rule wording · Sudoku cell/checkbox sizes and hint colour.
2. **Accessibility defaults:** glyphs on by default in Tile Tumble/Stackfall; Corner Pocket larger balls with clear stripes.
3. **Layout pass (shared pattern):** viewport-filling field + landscape side HUD + non-blocking hints, across the 10+ affected games.
4. **Art pass, worst first:** Rebound Row → Sky Skirmish → Updraft → Redline Rush → Corner Pocket → Kerbside.

Caveats: play was scripted (crude bots, software WebGL), so frame pacing and feel weren't judged. Some end states weren't reached: Crumb Run game over, a Lucky Lanes strike, Living Room GP results (so its offline-leaderboard presentation is unchecked). A Tic-Tac-Toe "paused in background" overlay seen in one run may be a headless artifact.

---

# Detailed per-game reports

Screenshots referenced below (`*.png`) were saved to a temporary session folder and are not in the repo.


## Review A - Fossil Frenzy, Crumb Run, Sky Skirmish, Updraft, Pop Cannon

Method: drove each game with Playwright (own scripts `drive-a-*.js` in the pw dir; shots `shots/a-*.png`) at 1280x800 DSF2, 400x860 touch DSF2, 860x400 touch DSF2. Reached play, pause, settings (where noted) and game over in all five. Caveats: Chromium headless on software GL (dino load time inflated); my bot play is crude. I did NOT skim docs/polish (time), so no "claimed fixed but broken" cross-check.

Scores (Visual / UI-HUD / UX-Flow / Responsive-Touch / A11y / Overall)
- dino 8 / 7 / 6 / 7 / 7 / 7.5
- crumbrun 7 / 7 / 6 / 5 / 8 / 6.5
- skyskirmish 4 / 5 / 6 / 5 / 7 / 5
- updraft 4 / 6 / 7 / 6 / 7 / 5.5
- popcannon 7 / 6 / 5 / 7 / 7 / 6.5

---
## 1. Fossil Frenzy (dino)
Strengths: Only game with real art direction - low-poly 3D desert, warm sunset palette, chunky italic display type, tilted-camera drama; cohesive cream/charcoal UI skin across title, pause, game-over. Pause/game-over panels are clean, big, focus ring (red) visible. Game-over copy has personality ("Aerodynamic. Not steerable.").

Issues
1. High / Flow: Title boots to a disabled "LOADING" button with "PRESS SPACE TO RUN" shown simultaneously (a-dino-title; captured `dino-desk-1title.png` at 1.5s). Under software GL it took ~3.7s to become START. Player is told to press a key that does nothing. Fix: hide the CTA pill until ready, or show a progress bar; make Space queue the start.
2. Medium / Onboarding: In-play hint is one long mono line (~95 chars: "Space/Up jump (again in the air with Double Jump) - Down duck - P or Esc pause - M mute") on desktop, a-dino-play2.png; mentions Double Jump before the player has it. Fix: show "Space: jump  Down: duck" for first 5s only, then fade.
3. Medium / Gameplay readability: Camera sits low behind/beside the dino; in a-dino-play2 the cactus that kills you is occluded by the dino body and only becomes visible at the hit. Obstacles are the same green-teal family as the dino body (low hazard/player separation). Fix: raise camera ~10-15% / widen FOV, add subtle rim light or outline on obstacles, telegraph cacti with ground marker.
4. Medium / Game over: Left-aligned stack of 4 translucent pills (quip, SCORE, stats line, "Leaderboard offline...") with mixed fonts is cluttered; SCORE (the key datum) is the same size as the quip (a-dino-over.png). The offline leaderboard line is noise for an offline-only product. Fix: one large score number, secondary stats grouped, drop the offline line.
5. Medium / Responsive: Landscape 860x400 title is cramped - title, 4 mode chips, weather chips, START stack in the left 55% while dino occupies right (a-dino-land-title.png); `span.chip-best` renders at 11px (report.json land smallText). Desktop title content hugs left with a large empty centre-bottom. Fix: bump chip-best to >=12px, two-column layout in landscape.
6. Low / HUD: Top-left "CLASSIC" badge always shown, tiny 14px mono, no function in play; "?" help button bottom-left on desktop (48px) duplicates the hint bar. Fix: hide badge after countdown; one help affordance.
7. Low / A11y: Colour-only distinction of mode chips (selected = dark fill) is fine, but secondary pause buttons are mid-grey on cream-dark overlay (a-dino-pause.png) - ~5:1, passes but looks disabled. Fix: use outlined style for secondary.
8. Low / Touch: Phone play has "tap to jump" red pill (good) but it sits mid-screen over the track and persists; phone pause (48px) top-right is fine. No visible duck affordance beyond a tiny "swipe down duck" line (a-dino-phone-play.png).

Top 3: (1) fix LOADING/PRESS SPACE contradiction; (2) hazard readability via camera/outline; (3) simplify game-over hierarchy.

---
## 2. Crumb Run (crumbrun)
Strengths: Distinctive Pac-Man-in-a-kitchen concept with readable sprites (mouse, 4 named cats with badges, water pistols), cohesive warm-on-dark palette, monospace arcade HUD; strong a11y settings (reduce motion, colour-blind, text size 100-150%, high contrast, left-handed d-pad); 48px targets, d-pad 60px.

Issues
1. High / Responsive: Board is tiny relative to viewport. Desktop canvas 561x733 in 1280x800 = 40% of viewport area, with ~360px black bars each side (a-crumbrun-play1.png). Landscape 860x400: canvas 306x399 = 35% of area, board ~13% wide of screen, d-pad and 3 buttons parked far left/right with ~250px dead space either side (a-crumbrun-land-play2.png). Fix: in landscape, scale board to height and place d-pad overlaid over side gutters; on desktop allow larger scale (board is height-limited at 733 of 800, so mostly fixed by aspect - consider wider maze or side panel with HUD/legend to use the bars).
2. High / Flow: First Space/Enter from title opens a "How to play" modal (a-crumbrun-ready.png) that must be dismissed with another key - 2 inputs before play; title screen is a live demo with game HUD ("DEMO", SCORE 000070 ticking) which confuses what is interactive, and no visible "Press Space to start" on the title (only "Arrows / WASD / swipe to steer" - which doesn't say how to begin). Fix: explicit START prompt on title; show how-to only on first ever launch or via "?" button.
3. Medium / Phone layout: Phone 400x860: board 399x522 sits with ~160px empty black above HUD and ~170px dead gap between board and controls (a-crumbrun-phone-play2.png). Fix: top-align and enlarge board (rows are dense, so bigger is valuable), or move pause/settings/mute into the top gap.
4. Medium / HUD: SCORE/HI text starts at y=0 touching the top edge on desktop (a-crumbrun-play1.png) - cropped feel; "SOUND [M]" bottom-right is dead text, duplicates the mute button. Fix: add 12-16px top padding; remove or make it the button label.
5. Medium / Readability: Maze is mid-tan floor blocks vs dark corridors; crumbs are small pale dots (~6px at 1x) on dark grey - low emphasis for the main collectible; cats stacked in the pen at start are visually busy but the 4 chasers are distinguishable only by fur colour (colour-blind assist exists, off by default). Fix: crumbs +30% size, soft glow; enable cat badge icons by default.
6. Medium / Settings: "System" label in Reduce motion segmented control is clipped ("Syster", a-crumbrun-settings.png). Fix: widen segment or abbreviate "Auto". Settings dialog is a dense 8-row list with four-letter "Off" toggles that do not look like switches.
7. Low / Pause: Paused modal works well (Resume focused, Esc/P). But pressing p then o in my script left pause open while settings key was swallowed - state handling between pause and settings shortcuts is unclear. Low confidence.
8. Low / Consistency: Dark monospace theme is the only game of five with a fully dark UI; fine, but button style (outlined gold) differs from the others.
9. Not captured: game-over/summary screen (script ended on pause modal). Unverified.

Top 3: (1) enlarge board on phone/landscape/desktop; (2) one-step start with explicit prompt; (3) HUD padding + remove dead "SOUND [M]".

---
## 3. Sky Skirmish (skyskirmish)
Strengths: Solid systems under the hood (waves, bosses, bombs, continues, combos, spread/shield pickups); good control surface (drag or arrows, Bomb button 71x44, pause 44x44); HUD text high contrast (#b9d3ee on #0b2a55 ~ 9:1); segmented difficulty/mode picker with check marks (not colour-only).

Issues
1. High / Visual identity: Looks like a prototype. Player ship is a ~20px white triangle with dark outline that nearly vanishes against the dark navy background (a-sky-play1.png, a-sky-phone-play.png where it is invisible behind the hint toast); enemies are flat red chevrons; player bullets are two 3x14px cyan dashes; background is flat gradient with translucent grey ellipse clouds and dark triangles. No glow, no shadows, no explosion sprites beyond a few dots. Fix: 1.5-2x ship scale, add thruster glow and bright cockpit, give enemies 2-3 silhouettes with tint, particle bursts on kill, parallax cloud layers.
2. High / Layout: The page is a pale light-blue background with a narrow dark play column and a separate dark HUD column pinned to the far right edge, ~700px away on desktop (a-sky-play1.png). Play area is 443x788 = 35% of 1280x800; HUD sits far from the eyes. Landscape 860x400: field is 218x388 and the HUD is 400px of dead dark panel (a-sky-land-play.png). Fix: dark page background, centre canvas, overlay HUD (score top-left, lives/bombs as icons) inside the canvas; in landscape fit field to height with HUD as side overlay.
3. High / Onboarding overlay: The tutorial toast ("Drag or use arrows to fly. Grab S, H, B...") sits over the bottom of the field exactly where the player ship spawns - covers the ship on desktop and phone; in landscape it is 5 lines tall and covers ~35% of the play field (a-sky-land-play.png). Fix: dock to top, one line, auto-dismiss on first move/shot.
4. Medium / Game over: "Shot down" modal is a bright white card on a dark game, no wave reached, no best-score highlight, and offers "Continue (2 left)" before showing anything about the run; "End run" is the secondary outline (a-sky-over.png). Score 9,725 is shown but WAVE/combo summary is absent. Fix: show wave/boss/accuracy, gold "New best", make Retry primary; style modal dark to match.
5. Medium / HUD hierarchy: Six stats (Score, Best, Wave, Lives, Bombs, Combo) in an equal-weight 2-col grid; Lives as digit "3" not icons; Combo "x1" tiny bottom-left. Phone HUD squashes SCORE value top-right with BEST/WAVE row beneath (a-sky-phone-play.png). Fix: Score large; lives/bombs as icons; combo flashes near the ship.
6. Medium / Feedback: Hit feedback is weak - lives dropped to 0 while the boss alive with only a dim; no screen shake/flash evident in my captures; boss HP bar is a thin red bar at top clipped under the pause button area (a-sky-over.png). Fix: damage flash + shake, bigger boss bar with name.
7. Low / Title: Title card is functional but bare (plain white card, tiny "Controls" disclosure at 13px, a-skyskirmish-desk-1title). No logo, no animated plane.
8. Low / Touch: Bomb button bottom-left 71x44 is at the edge where thumb drags may collide with it; it overlaps clouds, low emphasis when 0 bombs? Dim state ok. Phone field uses 388x689 (80% of height) which is good.

Top 3: (1) real sprites/ship visibility/FX; (2) dark integrated layout with in-canvas HUD; (3) move/shorten tutorial toast.

---
## 4. Updraft (updraft)
Strengths: Instantly understandable one-button concept; clean, calm light theme with a consistent card system; game-over modal is clear ("Crashed", big score, "New best!" pill, Fly again primary / Change mode secondary, 2 clicks to retry); modes (Endless/Daily/Practice) and a ghost/bot feature; HUD cards legible.

Issues
1. High / Visual: Art is the weakest of the five at the moment of play. Cave is two flat slate-navy slabs with a black stroke and a two-tone pale-blue gap; player is a small orange arrow (visible only at 2x zoom, a-up-ship.png ~45px at DSF2, i.e. ~22 CSS px); coins are flat brown ovals; the smoke trail is grey discs. No parallax, no light, no cave texture (a-up-play1 etc.). Reads as a debug render. Fix: gradient/textured rock with highlights, parallax background layers, brighter player with glow, coin sparkle.
2. High / Contrast of play field: Corridor interior (#bcd2e0-ish) vs pale page background (#eaf0f8) and the drifting lighter band make the gap edge rely on a 3px black outline; coins (dark orange) read OK but the player's orange arrow sits on a pale blue - fine - yet the trail is greyer than the corridor and nearly invisible. Whole screen is light so the heavy dark walls dominate attention rather than the gap. Fix: invert - dark cave interior with bright player/coins, or increase contrast of corridor boundary glow.
3. Medium / Responsive: Phone 400x860: ~ 60% of the canvas (364x697) is solid dark wall above/below the gap (a-up-phone-play.png) - the gameplay band is ~40% of the canvas height; HUD is a 5-chip row where "DISTANCE" label is clipped against its chip edge ("DISTANCE" touches border, a-up-phone-play.png). Hint "Space / ↑ / W / click: hold to rise" shows keyboard keys on a touch device with no "touch and hold" wording. Fix: shorten the cave (landscape aspect) or zoom the camera; hide kbd hints when pointer is coarse.
4. Medium / HUD: Side panel on desktop duplicates the title, has 4 stat cards + "GAP 99%" (unexplained metric) in a half-empty column; ~35% of the right column is empty (a-up-land-play.png). In-play HUD is outside the canvas, forcing eye travel. kbd labels at 10.24px (report.json) below 12px minimum. Fix: overlay score/distance in canvas, drop or explain GAP, kbd >= 12px.
5. Medium / Flow: Title card hovers over a *blurred, ghosted live HUD* (a-updraft-desk-1title) - HUD text faint and meaningless behind the modal; the play canvas is empty at title (no demo cave, no ship) so first impression is blank. Fix: render an attract-mode cave with idle bobbing ship behind the card.
6. Medium / Onboarding: No countdown/ready cue after "Play" - first frames start immediately; my bot crashed within seconds (Score 16, 103). A brief "Get ready" with ship held in the centre would reduce cheap deaths. Death also gives no on-field crash feedback beyond modal fade (a-up-over.png - blurred scene, no explosion remains).
7. Low / Consistency: Light page theme with white card modals matches Sky Skirmish's UI, not the dark play field of the others; pause icon-only 44px buttons fine; settings icon is a sun glyph (looks like brightness, not settings) - a-up-phone-play.png. Fix: use a gear/sliders icon with aria-label retained.
8. Low / Touch: Whole canvas is the input surface (good), but top icon buttons are 44px, right at the minimum.

Top 3: (1) re-skin cave/player/coins with depth and contrast; (2) integrate HUD into canvas and make phone cave use space well; (3) attract mode + ready beat.

---
## 5. Pop Cannon (popcannon)
Strengths: Glossy bubbles with highlights (best sprites among the five bubble/ball styles), clear aim guide dotted line + red danger line, score pop-ups ("DROP +20", "+165 x2") give juice; four modes + daily + colour-blind quick toggle on the menu; game-over shows accuracy, shots, best combo and cause.

Issues
1. High / Flow: First launch forces a 3-step tutorial modal that blocks the board (a-pop-start.png; "Next" x3 or "Skip tips"). My drag input did nothing until it was skipped - 4+ clicks before first shot, and the tip card covers the top bubble rows you are meant to target (it overlaps y=25..390 of 780). Fix: non-blocking coach marks near the cannon; one-line hint "Drag to aim, release to fire".
2. High / Layout: Desktop HUD panels float at far left (Pause/Sound/Score) and controls (arrows, Swap, Fire) at far right with 400px of empty navy between them and a 528px-wide board (a-pop-start.png) - board is 528x780 = 40% of the screen; mouse/keyboard users get on-screen touch buttons by default. Fix: hide touch controls when pointer is fine; stack score above board; or scale board.
3. Medium / HUD style: White/lavender cards (Pause, Sound on, score panel) clash with the dark navy playfield - bright high-attention blocks while the real focus is the board; "MISSES LEFT" and "COMBO" show "-" until used. Landscape: left column wraps "MISSES LEFT" to two lines and Pause/Sound are 160px wide x 44 (a-pop-land-play.png). Fix: dark translucent chips, icon-only pause/sound.
4. Medium / Game over: Overlay scrim is a mismatched rectangle (x=340..1660 of 2000) wider than the 587-1412 board, so the blur box is visibly wider than the play area (a-pop2-over.png); the result card is five lines of identical bold centred text - score, combo, shots, level, cause - no hierarchy, no stars/best emphasis beyond "(new best!)". "Reached level 1" in Arcade is meaningless. Fix: big score number, secondary stats in a 2x2 grid, scrim limited to board or full-screen.
5. Medium / Menu: Eight stacked buttons plus colour-blind toggle and two lines of tiny help text over the blurred board (a-pop-desk menu): Arcade and Puzzle/Time Rush have equal weight, "Colour-blind assist: Off" toggle sits in the main menu while Settings is a separate button. Hint text 12px muted. Fix: one primary Play (Arcade), modes as chips, move the toggle to Settings.
6. Medium / Readability: Blue bubble (#2a52c8-ish) vs navy background is the lowest-contrast colour; red/green pair is the CVD risk and assist is off by default. Fix: lighten blue, enable pattern marks by default or suggest on first run.
7. Low / Feedback: Fire button gets a focus ring after click, shot trail is a short fading dots - OK; but no screen shake or sound cue visible on ceiling drop; red danger zone at game-over fills a pink band over bubbles - clear. Low.
8. Low / Phone: Phone layout is good (HUD top, board centred, 4 controls bottom, 48px high) but the board is only 376x555 of 860 high (65%) with a ~60px gap above controls; the tutorial card in phone covers the first 5 bubble rows (a-pop-phone-play.png).

Top 3: (1) non-blocking tutorial; (2) restyle HUD/controls to dark chips and hide touch buttons for mouse users; (3) tiered game-over card with fixed scrim.

---
## Cross-game patterns (these 5)
- Play area is small: board/canvas uses 35-40% of the viewport on desktop for crumbrun, skyskirmish, popcannon, updraft-phone; landscape (860x400) is the weakest layout in all four non-dino games (fields 218-306px wide, big dead gutters).
- HUD lives outside the canvas in sidebars/cards (Sky, Updraft, Pop) - far from the action; only dino and crumbrun draw HUD in-scene. Equal-weight stat grids with no hierarchy.
- Two visual families: rich/themed (dino, crumbrun) vs default "white card on tinted page" UI shell (sky, updraft, pop) that makes games feel like the same template; modals are light cards over dark/tinted games.
- Tutorials and onboarding overlays cover the play area (Sky toast on the ship, Pop tips over bubbles, Crumb how-to extra step, Dino LOADING/PRESS SPACE contradiction).
- Game-over screens lack hierarchy and often bury the retry/personal-best moment; best ones: Updraft, Dino.
- Strong baseline a11y/mechanics (focus rings, 44-48px targets, pause, text-size settings in Crumb, colour-blind toggles) - but small text still appears (10-11px kbd/chip-best) and keyboard hints shown on touch.
- Weak "juice": few kill/hit particles, no shake/flash evidence, thin sprite art in Sky and Updraft.

---

## UI/UX and visual review B: reboundrow, rug, redlinerush, kerbside, luckylanes

Method: each game was driven in its own Playwright instance (scripts `drive-b-*.js` in the pw dir, shots `shots/b-*.png`). Desktop was 1280x800 at DPR 2, phone 400x860 with touch, landscape 860x400 with touch. Judgements come from the running game. The polish docs were skimmed only afterwards. Playfield % = canvas area / viewport area.

Not covered: no game reached its full results screen except redlinerush. Rebound Row was only played to a lost life, and rug was only driven for about 12 s. rug's 404 was not visible in the UI in anything I captured, so no finding is raised on it. I did not reach rug's results screen, so how it presents the offline leaderboard is untested.

Scores are 1-10.

| Game | Visual | UI/HUD | UX/Flow | Responsive/Touch | A11y | Overall |
|---|---|---|---|---|---|---|
| rug (Living Room GP) | 9 | 7 | 7 | 7 | 7 | 8 |
| luckylanes | 7 | 6 | 6 | 5 | 7 | 6.5 |
| kerbside | 5 | 6 | 7 | 7 | 7 | 6 |
| redlinerush | 4 | 5 | 7 | 6 | 7 | 5.5 |
| reboundrow | 3.5 | 5 | 6 | 5 | 7 | 4.5 |

---
## 1. reboundrow (Rebound Row)

**Strengths**
- The controls are legible: big buttons, clear tagline, 5 menu items, hearts plus number for lives.
- The pause dialog is clean (Resume is primary, Quit is red and separated). The first-run hint card is concise.
- The ball has a trail and the "W" power-up bricks are distinguishable by glyph, not colour alone.

**Issues**
1. HIGH, Visual identity. The game looks like a dev prototype. The title is a flat #f0f4fc page with a tiny 4-brick logo, and the in-game page is the same pale blue with a navy rectangle in it. The collection's own rug is lavish by comparison.
   - Evidence: `reboundrow-desk-1title.png`, `b-reboundrow-play1.png`.
   - Fix: give the title and game page a themed backdrop (dark gradient or the brick palette), use the accent #8a6cf0, add a large wordmark, and animate a demo ball and paddle on the title.
2. HIGH, Graphics/juice. Level 1 is a wall of identical flat cyan bricks, with no colour, row or HP variation.
   - The paddle is a white capsule. There are no visible hit sparks, brick-break particles or screen shake in the mid-play capture.
   - Evidence: `b-reboundrow-play1.png` shows one brick missing and no debris.
   - Fix: use per-row hues with a highlight and shadow, add shatter particles, add a paddle-hit squash, and show score pop-ups. Keep all of it behind the reduce-motion setting.
3. HIGH, Responsive. The playfield is a fixed 5:6 box: 643x771 (48% of 1280x800), 368x442 on phone (47% of 400x860) and 309x371 on landscape (33% of 860x400).
   - On phone, roughly 40% of the screen height is dead pale space between the canvas and the hint card (`b-reboundrow-phone-play.png`, canvas bottom y≈505, card top y≈720).
   - In landscape, bricks are ~11px tall and the paddle sits at the far right edge with the ball tiny.
   - Fix: let the canvas fill the available height and widen the logical field on tall screens, or add a bottom touch/drag zone and a larger HUD.
4. MEDIUM, Layout. On desktop the board and HUD column are off-centre. The composition spans x≈230-1155 of 1280 (as read from the 2000px-wide shot), leaving ~500px of empty right margin. The HUD stack, with Score/Lives/Level/Best in a narrow column, floats under two icon buttons.
   - Evidence: `b-reboundrow-play1.png`.
   - Fix: centre the game plus HUD group, or move the HUD above the board and use the side space for a themed backdrop.
5. MEDIUM, HUD. The HUD is low-priority information in plain dark text on pale blue. "Best" is shown during play, which is noise.
   - Score has the same size and weight as Level and Best, so there is no hierarchy.
   - There are no combo or multiplier cues and no power-up timer chip visible (the code has one, `hud.ts`).
   - Fix: make score large, put it inside the board header in white on the dark board, and drop Best from the in-game HUD.
6. MEDIUM, UX. The "Tap or press Space to launch" label (`b-reboundrow-over.png`, white text mid-board) has no ball-aim or paddle emphasis.
   - After losing a life the board resets with no "life lost" cue other than the heart count dropping.
   - Fix: flash and shake on life loss and pulse the launch prompt.
7. MEDIUM, Responsive/Touch. On phone the first-run hint card (~140px tall) is pinned at the bottom and covers the lower touch area until "Got it" is tapped (`b-reboundrow-phone-play.png`). A player will drag the paddle through the card.
   - Fix: place the hint above the board where the dead space is, or auto-dismiss on first drag.
8. LOW, Levels screen. All 33 locked tiles are shown as dashed grey boxes with a tiny lock (`b-reboundrow-levels.png`).
   - It reads as "nothing to do". There is no preview, star or best-score per tile.
   - Fix: show a mini brick pattern per level so players see what unlocking gives them.
9. LOW, A11y. The ~11px helper text exists only in the title stats line (`Best 0 points · level 1 of 34 unlocked`, ~14px). That one is fine.
   - Brick colours are close to one another on the colour-assist-off path. The automated audit found no small targets (report.json clean).

**Top 3 improvements**
1. Give the game a real art direction: themed backdrop, a coloured brick palette with bevel, glow on the ball, and shatter particles.
2. Fill the viewport on phone and landscape (dynamic field size) and centre the desktop composition.
3. Rebuild the HUD: large in-board score, combo and multiplier, and a power-up timer chip, with a "life lost" flash.

---
## 2. rug (Living Room GP)

**Strengths**
- It is clearly the most polished game of the five: a chunky toy-block title, a top-down rug map behind the menu, a 3D lit race scene with textured carpet and brick-toy cars, and a flyover countdown.
- Chip-style HUD with a strong hierarchy: position in red, lap in blue, timer in yellow, nitro bar in orange, plus a minimap.
- Full settings coverage (reduce motion, colour-blind assist, HUD size 100-150%, camera, AI difficulty). Touch UI has joystick, BOOST, JUMP, respawn, CAM and pause.

**Issues**
1. HIGH, UI. On desktop the pause dialog is overlapped and clipped by the persistent controls hint bar. The bar is drawn over the dialog's lower part and "Quit to title" is cut at the bar's edge. Evidence: `b-rug-pause.png`, bar y≈882-980 vs dialog bottom. The dialog should be the top layer when open.
   - Fix: raise the pause and settings z-index above the hint bar, or hide the bar while paused.
2. HIGH, Responsive. On landscape touch (860x400), the first-run "How to play" modal is taller than the viewport and its top is cut off. The heading "HOW TO PLAY" and the "Goal" line are not visible, and the dialog has scrollHeight == clientHeight so it does not scroll. Evidence: `b-rug-land-race.png`.
   - Fix: cap the modal at 100dvh minus padding with overflow:auto, or lay out as two columns in landscape.
3. MEDIUM, UX. On touch, the first Race tap opens a "How to play" interstitial instead of starting. It needs a second tap ("Got it") before the race, and its copy says "Press any key or tap to start". Clicks to play: 2 on touch, 1 on desktop (Enter).
   - Fix: show the tips as a dismissible overlay over the countdown instead of a blocking step.
4. MEDIUM, HUD. The always-on HUD gets crowded on desktop. A 7-item keyboard hint bar wraps "pause" onto a second line and overlaps the car's rear (`b-rug-race2.png`).
   - Four stat rows ("VS BEST --", "BEST LAP --", "LAST LAP --", "DRIFT 0") sit over bright house and carpet texture at top right and show only dashes for the whole first lap. The drift row also gets lost over the blue window texture.
   - Fix: hide empty rows until they have data, fade the hint bar after ~8 s, and give the stat stack a more opaque plate.
5. MEDIUM, HUD. The gap labels ("▲ +0.2s Teal Pickup", later "+19.3s") have no heading explaining that they mean ahead or behind. The first read looks like a pickup message ("Teal Pickup"). Evidence: `b-rug-race2.png`, `b-rug-race3.png`.
   - Fix: label them "Ahead" and "Behind", or use car-colour pips and a position arrow.
6. MEDIUM, Responsive. Phone minimap is 109x77 css px, so the tiny track is unreadable (`b-rug-phone-b.png`). The player's own car also disappears behind the joystick and the AI cars fill the lower half.
   - Fix: raise the minimap to ≥150px width and shift the chase-camera target slightly up on portrait.
7. LOW, Settings. The desktop Settings dialog at 1280x800 has more rows than fit: "Quality" is clipped at the bottom edge (`b-rug-settings.png`) and the first slider shows a rectangular focus box much larger than the control (looks like a bug).
   - Fix: scroll inside the dialog with a visible scrollbar and shrink the focus ring to the control.
8. LOW, Title. On phone the title block, wordmark, subtitle and 6 buttons are crammed in a 40% height strip over a tiny rug (`b-rug-phone-title.png`). The "LIVING / ROOM / GP" tiles wrap in an uneven pyramid.
   - Fix: the title is good on desktop; on portrait, enlarge the rug backdrop or tuck the secondary buttons into one row of icons.
9. LOW, Console/offline. The 404s for the leaderboard are expected. I did not reach a results screen to check how the UI presents it, so I cannot say whether the offline state is handled gracefully.

**Top 3 improvements**
1. Fix layering and fit: the pause/settings dialog above the hint bar, and landscape modals that fit 400px height.
2. Declutter the race HUD: hide empty rows, auto-fade the key bar, and label the gap readouts.
3. Make touch start a single action (no blocking tips) and enlarge the portrait minimap.

---
## 3. redlinerush (Redline Rush)

**Strengths**
- The flow is fast. A mode menu where 1/2/3 keys start a run, a clear "Wrecked" results card with 6 stats, and "Race again" as the single focused primary action.
- The mode cards carry a description and best-score line. The how-to bullets are concise.
- HUD tiles are consistent and large (fuel has a bar); touch pads are 68x68 on phone.

**Issues**
1. HIGH, Visual identity. The road is flat vector with no depth: a dark asphalt rectangle with 4 lane dashes, two green flat strips with identical circle "trees", and a pixel-ish car sprite. There is no lighting, no speed lines, no motion blur, no vignette and no road texture.
   - For a game named Redline Rush there is little sense of speed beyond scrolling dashes.
   - Evidence: `b-redlinerush-play1.png`, `redlinerush-desk-1title.png`.
   - Fix: add speed streaks at higher km/h, a parallax roadside, car shadows and headlight glow, and a screen shake plus sparks on collision.
2. HIGH, Responsive. The road canvas uses 38% of a 1280x800 viewport (490x784) and **27%** of 860x400 (240x384), with the remainder as black side bars. The player car is ~35px wide in landscape.
   - Fix: widen the logical road view on landscape or scale the road to fill the stage height and use the black area for themed scenery.
3. HIGH, Readability. The onboarding banner is anchored over the top of the road and hides incoming traffic for up to 9 s on desktop and on phone.
   - In `b-redlinerush-play1.png` it covers a teal car at the top edge. On phone it hides the first ~60px of road (`b-redlinerush-phone-play.png`). The polish docs list this only for landscape.
   - Fix: place the hint below the HUD, outside the canvas, or pause the traffic spawn until it is dismissed.
4. MEDIUM, HUD. The HUD is a left-hand column of 6 white cards plus 3 buttons. A light UI around a dark game makes the HUD the brightest object on screen and pulls the eye from the road.
   - Speed and score are not in the player's line of sight. On phone the HUD uses 3 rows (~175px of 860).
   - Evidence: `b-redlinerush-play1.png`.
   - Fix: a slim top bar on the road with white-on-translucent-dark chips; keep fuel and armor beside the car.
5. MEDIUM, Feedback. My run ended with "Near misses 0 / Best combo 0 / Crashes 3 / New best!" for a 316-point 19 s run with no skim bonus. The player's first-run experience of the headline mechanic (skimming) is unclear: the COMBO tile only shows "-" and nothing in the canvas explains skimming.
   - Fix: show a "+50 CLOSE!" pop-up and a combo meter beside the car; teach skimming in the banner with an icon.
6. MEDIUM, Visual consistency. Other cars are flat, similar rectangles (blue, teal, green outline), distinguished only by colour. The green outline on the top car in `b-redlinerush-play1.png` has weak contrast against the green verge.
   - Fix: add per-type silhouettes (truck, van, taxi) and a darker car outline.
7. LOW, UX. The result card does not suggest anything to improve (e.g., "0 near-misses, try skimming"), and "Title" is a bare secondary button. The pause button and the settings gear are small icon-only.
8. LOW, Title. The title is not a separate screen. The menu card floats over the live HUD and dimmed road (`redlinerush-desk-1title.png`), with duplicate "REDLINE RUSH" wordmarks (HUD and dialog). It is functional but cluttered.

**Top 3 improvements**
1. Add depth and speed juice: parallax, streaks, shadows and headlights, and impact sparks plus shake.
2. Use the whole viewport (wider road view on landscape, a slim translucent HUD) and move the onboarding hint off the road.
3. Make skim and combo feedback visible in the canvas, and diversify vehicles beyond colour.

---
## 4. kerbside (Kerbside)

**Strengths**
- The core idea is easy to read: a bright yellow dashed bay and a glossy red car with shading, shadow and headlights. Level 1's hint "Clock starts when you move" is well timed.
- The game uses the viewport well: 80% of desktop (1058x779), and an unusually thoughtful touch layout with a steering wheel and Reverse/Drive/Brake pedals sized ≥74x120 on phone.
- The 24-level select shows names, locked state and stars. The 72-star counter gives a progression goal.

**Issues**
1. HIGH, Visual identity. Title and Levels are flat grey-white pages with a tiny icon and black pill buttons. In play, the lot is a flat dark-slate rectangle with a thin white border and nothing else on Level 1: no bay-number markings, kerb, grass, trees or surrounding scenery.
   - There is nothing that says "car park".
   - Evidence: `kerbside-desk-1title.png`, `b-kerbside-play1.png` (~75% of the board is empty asphalt).
   - Fix: add painted bay lines, kerb stones, wheel-stop, tarmac texture and tyre tracks behind the car; use the accent green #5a9b4c on the title.
2. HIGH, Feedback. The yellow bay at 40% opacity brown-olive (`b-kerbside-play1.png`) has no visible "car in bay" progress. The bay does not change as you align. Players must guess whether angle and position are good enough.
   - Fix: tint the bay green when the car is inside tolerance and show an angle or overlap indicator.
3. MEDIUM, Responsive. In landscape touch (860x400) the board is only 634x317 (58% of the viewport) and the "Use the pedals and wheel" hint bar covers the lower ~60px, hiding the car's rear on level 1 (`b-kerbside-land-play.png`).
   - The pedal stack is three 80x51 buttons, shorter than the 74x120 phone pedals.
   - Fix: enlarge the pedals to ≥ 56px tall and move the hint to the top.
4. MEDIUM, Responsive. On phone portrait the bay sits flush against the right wall (the wall is drawn immediately beside the bay at x≈350 of 374) and the hint bar covers the bottom of the board. The play area is 374x607 (66% of 400x860), which is fine, but a lot of black bezel is spent on a 20px frame (`b-kerbside-phone-play.png`).
5. MEDIUM, HUD. On desktop the HUD is a left column with the pause button, level number chip, name, 4 stat boxes and a sound button, so the player's eyes go left while the action is centre. The persistent keyboard focus ring (thick blue ring on the pause button) looks like a stuck state right after clicking Play (`b-kerbside-play1.png`).
   - The "Gear km/h" label with "D 23" is cryptic.
   - Fix: place time and damage above the board, relabel the gear tile as "Speed", and use :focus-visible only for keyboard.
6. MEDIUM, Level select. Stars on level 1 are three hollow outlines in amber before any attempt (`b-kerbside-levels.png`). They read as "earned 0 of 3" but look like decoration; locked cards are very low contrast (~grey on grey text at ~#8a93a0 on #f6f8fb).
   - The grid leaves ~45% of the screen below it empty.
   - Fix: show a dash for unplayed and filled stars for earned, and darken locked text to ≥ 4.5:1.
7. LOW, UX. The title has a tagline and three buttons but no "how it works" or controls summary. The first-run hint exists only in game. It is short, so this is acceptable.
8. LOW, Consistency. The title uses pill-shaped buttons and a light-grey page like reboundrow, but neither matches the playful rug title. The collection has no shared title language.

**Top 3 improvements**
1. Make the lot a place: tarmac texture, painted bays, kerb, wheel stops, neighbouring parked cars with varied colours.
2. Add live parking feedback: the bay turns green when aligned, with an angle or overlap meter.
3. Fix landscape and phone layout: move the hint bar off the car, enlarge pedals, and centre HUD stats over the board.

---
## 5. luckylanes (Lucky Lanes)

**Strengths**
- The lane scene has real depth: a perspective lane with a neon pink and cyan rail, purple vignette, wood gradient, an arrow row, shadowed ball and a rack of pins with red stripes. It is the second-best art in this set.
- Layered input guidance: a first-run "How a throw works" card, meters with readouts (Aim / Power / Hook with a sweet-spot zone), a contextual primary button ("Set position", "Lock power", "Skip wait"), and a status sentence.
- A full menu: 4 modes with descriptions, best scores and stats; scoreboard with a standard frame grid.

**Issues**
1. HIGH, Responsive. On phone the scoreboard is below the fold. The page is 1367px tall at 860px viewport height (scoreboard top y=858) and in landscape 743px at a 400px viewport (scoreboard top y=402), so the player has to scroll to see their score.
   - Evidence: `b-luckylanes-phone-play.png` (Back button is cut at the bottom edge), `b-luckylanes-land-play.png`.
   - Fix: keep a one-line score ("You F1.1 | 0" already exists in the canvas chip) and enlarge it to include frame total, or collapse the scoreboard into a bottom sheet.
2. HIGH, Readability. The "GUTTER BALL" banner is pale lilac text over the lane and wood, with an estimated contrast around 1.5-2:1 against the lane (my reading of `b-luckylanes-roll2.png`, not measured by pixel sampling). The lane and rail lines run through the letters.
   - Fix: add a dark text-shadow or a plate, and use brighter colours.
3. MEDIUM, Visual. The desktop lane canvas is 672x498 (33% of the viewport), and the right side under the scoreboard is a text-heavy "How to play" card. The 3D lane is smaller than the instructions and ~280px of empty lilac space sits under it (`b-luckylanes-power.png`).
   - Fix: let the lane take the left 60% and move how-to behind a "?" disclosure (it already uses `<details>`).
4. MEDIUM, UX. Two input schemes are described at the same time. There are four sequential locks (position, aim, power, hook) and "Drag up to throw", plus keyboard.
   - The "Drag up to throw" chip sits over the lane while the status line says "Lock the power meter". A new player does not know which to use within 5 s.
   - Fix: pick the primary on touch (drag) and desktop (Space), and hide the other chip.
5. MEDIUM, Flow. The first-run coach card covers the top 40% of the lane, including the pins, and the menu modal covers the HUD.
   - Starting a game takes 2 clicks (Start game, Got it) and 4 Space presses per throw. "Skip wait" appears during roll animation as the primary button, so a mis-click or key press skips the pin-fall payoff.
   - Fix: let the coach float beside the lane and don't map Space to skip-wait until the pins settle.
6. MEDIUM, HUD. The in-canvas "You F1.1 | 0" chip is cryptic (F1.1 = frame 1 ball 1) and tiny (~14px).
7. LOW, Feedback. In my run the gutter ball had a banner but no visible camera shake or pin interaction, and the pins' standing rack looked fine. I did not capture a strike, so I cannot judge pin-fall juice.
8. LOW, A11y. `kbd` hints are 11.2px (automated audit: `kbd. 11.2px "M"`), under the 12px target. The ball marker for "Pocket marks" is a small white triangle, colour-light on wood.

**Top 3 improvements**
1. Keep score and frame visible on phone and landscape without scrolling.
2. Raise banner contrast and juice (plate, glow, shake) and make the lane the largest element on desktop.
3. Simplify the throw flow: one primary input per device, a non-blocking coach, and no accidental skip.

---
## Cross-game patterns
- **Quality is uneven across the collection.** rug has a real art direction, whereas reboundrow, kerbside and redlinerush share a generic "light page + white cards + pill buttons" look with flat fills and no depth. The collection lacks a shared title-screen language (rug is playful, the others are utilitarian).
- **The play area underuses the viewport on phone and landscape**: reboundrow 47% / 33%, redlinerush 69% / 27%, kerbside 66% / 58%, luckylanes lane 49% / 47% (plus a scoreboard below the fold). Fixed-aspect boxes are the cause.
- **Onboarding hints cover the playfield** in four of the five games (redlinerush hides traffic, kerbside hides the car in landscape, reboundrow covers touch space, luckylanes covers the pins). The remedy is a slot outside the canvas.
- **Light HUDs around dark scenes pull attention away from the action** (redlinerush, kerbside, reboundrow). A translucent in-scene HUD like rug's is better.
- **Hit and fail feedback is weak or invisible in screenshots** (no particles, shake or score pop-ups captured in reboundrow, redlinerush and kerbside). The reduce-motion plumbing is present, but little juice appears to go through it.
- **Accessibility basics are in place and consistent**: pause and settings panels, focus traps, ≥44px targets (report.json shows none under 44px, only luckylanes `kbd` text at 11.2px), no horizontal scroll. The remaining problems are contrast of overlay text (luckylanes banner, kerbside locked tiles) and always-visible focus rings after mouse clicks.

---

## Review C: UI/UX and visual audit of 5 games (Pounce Pins, Corner Pocket, Clay Day, Stackfall, Tile Tumble)

Method: drove each game with Playwright at 1280x800 (DPR 2), 400x860 (touch, DPR 2) and 860x400 (touch), using the `?debug=1` hooks for deterministic play (bowl, lead-aim, solver path). I captured title, mid-play, result, pause and settings screens, plus dark theme and colour-assist. I judged from the screens first and read the polish docs afterwards. Scripts are `c-*.js` and screenshots are `shots/c-*.png` in `.../scratchpad/pw/`. Paths below are relative to that `shots/` dir.

Canvas 0x0 on title (pouncepins, cornerpocket, tiletumble): NOT a layout bug. The canvas lives in a `display:none` play screen until start. Measured after start: pounce 1245x465 css, corner 1036x523, tiletumble board 679x764.

Automated contrast sweep (computed fg vs effective bg, all visible text, light and dark scheme, title and play): zero text under 4.5:1, with one 4.42:1 at 12px in Pounce Pins dark (scoreboard frame number). Text contrast is genuinely good in all 5. The accessibility issues below are non-text.

Clicks to first play action: Pounce 1 (+1 to dismiss hint), Corner 1-2, Clay 1, Stackfall 2 on first run ("Got it", then "Play Marathon"), Tile 1.

---

## 1. Pounce Pins

Scores: Visual 8 | UI/HUD 7 | UX/Flow 7 | Responsive/Touch 7 | Accessibility 7 | Overall 7.5

Strengths
- Real visual identity. Outlined cartoon cats with tie and personality (sleeping "z", "Hsss!/Eek!/Meeeow!" speech bubbles on impact), cushion gutters, office-wall props and a dashed foul line. This is the best character art of the five (c-pounce2-desk-roll.png).
- Clear three-step aim, power, curve input. The power bar has a hatched sweet-spot zone, and the primary button relabels Lock aim / Throw! / Rolling..., so it always says what Space does next (c-pounce-desk-c-aimlocked.png).
- Game-over card is tidy, with a pun grade ("Pawsitively solid"), a strikes/spares breakdown, and a full 10-frame scoreboard still readable behind it (c-pounce2-desk-over.png).

Issues
1. **Medium, Layout/Responsive.** Landscape 860x400 wastes space. The lane is about 578x258 css (43% of the viewport) while the right column holds the scoreboard, which is only about 40% filled; the lower half of that column is empty white (c-pounce-land-c-aimlocked.png). Pins are tiny there (cat about 25px tall). Fix: in landscape put the scoreboard as a one-row strip above or in a thin overlay (current frame plus total), and give the lane the full width and about 75% of the height. The polish doc rates this S4; I would rank it higher because it is the main way phones get played.
2. **Medium, Visual.** The wall poster text "NAP AS A TEAM" is wider than its card and overflows both sides in every shot (c-pounce2-desk-roll.png at about x=355-460 vs a card of 56px). It reads as a bug on the first screen. Fix: shorten to "NAP TEAM", or scale or clip the text to the card width in `render/backdrop.ts`.
3. **Medium, Feedback.** Score and frame cell do not tick up visibly on a hit. After "6 cats pounced!" the header still reads 0 and the frame cell shows "6" only (c-pounce2-desk-roll.png). First-time players read this as the hit not counting. Fix: show a running "pins down" or provisional score, or animate "+6" flying into the frame cell.
4. **Medium, Visual/Readability.** Pinfall banner text ("6 cats pounced!", "Missed them all!") is about 80px bold and sits dead centre over the lane, covering the approach and partly the standing cats (c-pounce-desk-e-roll2.png). Fix: move to the top third of the canvas or shrink to about 40px with a pill background, and fade in 300ms.
5. **Medium, Onboarding/Affordance.** On the title, "How to play" is a `<details>`/`<summary>` with the disclosure marker removed (`.how summary` in play.css:57, no chevron). It looks like a static heading, so the control instructions are effectively hidden (c-fin-pounce-phone-title.png, pouncepins-desk-1title.png). The first-play hint banner covers the instructions at start, so this is partly mitigated. Fix: add a chevron or "+", or make it a button styled like the other pills.
6. **Low-Medium, Visual.** Title screen is a plain white card on beige. The cats, the game's whole hook, never appear before Play. 45% of the 1280x800 title is empty. Fix: render the cat pyramid (reuse `render/cat.ts`) behind or above the card, as Clay Day does with its scene preview.
7. **Low, Responsive/Touch.** The focused Play/Throw button's 3px blue ring plus offset reaches the right screen edge at 400px (c-pounce-phone-c-aimlocked.png), and the curve arrows are 52px with a 125px "Straight" gap between them and the 190px throw button, which is a long thumb reach from the bottom-left. Fix: add 4px side padding in `.controls`, and put the throw button in the thumb zone with curve arrows beside it.
8. **Low, Consistency/Icon.** The settings button uses a sun-like icon. In the same header row the theme icon would be a sun, so it reads as a brightness or theme toggle and not "Settings" (title screen, all views). Clay Day and Tile Tumble use the identical icon. Fix: use a gear, and add `title` text.
9. **Low, Flow.** The game-over card has no "best" or "new record" line, although the title shows "Best: 0 · Games · Fish". The fish bonus shows "Fish bonus 0" without saying how it is earned. Fix: add "New best!" or "Best 152", and a one-line fish hint.

Top 3 improvements
1. Re-layout landscape and phone so the lane gets 70%+ of the viewport (scoreboard as a thin strip).
2. Make score feedback visible at the moment of impact (provisional pins, "+N" into the frame cell) and move or shrink the centre banner.
3. Fix the poster overflow and add cats plus a disclosure affordance to the title.

---

## 2. Corner Pocket

Scores: Visual 5 | UI/HUD 5 | UX/Flow 6 | Responsive/Touch 6 | Accessibility 5 | Overall 5.5

Strengths
- Mode picker is clear and complete: Rack Attack, 15 star-rated Trick Shots, 8-Ball vs CPU, 2-player hot seat, plus an Easy/Pro toggle. Pause and settings dialogs are solid (c-corner-desk-e-pause.png, c-corner2-settings.png).
- Aim guide and cue are well drawn (dashed ghost-ball path, bounce line, cue stick with power bar). Drag-back slingshot, keyboard, tap-to-aim and Aim/Shoot buttons all work.
- Phone portrait rotates the table to vertical, which uses the screen well (c-corner-phone-a-start.png).

Issues
1. **High, Visual/Readability.** Balls are tiny and numbers illegible. Ball diameter is about 22px css on a 1280x800 screen (BALL_R=10 table px) against about 64px pockets, so pockets are about 3x the ball. In the 8-ball rack the 15 balls are about 20px and their numerals about 7px, so telling stripes from solids, which the game rules depend on, is hard (c-corner3-8ball.png). Fix: scale the table to fill the viewport width (see issue 2), raise `numberMetrics` minimum font, add a stripe band to striped balls, and shrink pocket mouths.
2. **High, Layout.** The play field wastes space. The canvas is 1036x523 but the table inside it is about 81% wide, with dark green pillarbox bands each side. The table occupies about 40% of the viewport on desktop, and the HUD, hint strip and a 2-line key legend consume the rest of the height (c-corner-desk-a-start.png). Fix: remove the pillar bands (fit the table to the canvas) and cap non-canvas chrome at about 25% of the height.
3. **High, UX/Layout shift.** Dismissing the first-run hint resizes the whole table mid-game. Table rect changes from 1036x458 to 1036x523 at y=225 to 160, so the table jumps and scales about 14% (c-corner-desk-a-start.png vs d-after.png; rects measured). This also breaks any drag begun on the old position (my own scripted shot missed for this reason). The polish doc acknowledges the 0.59 vs 0.688 scale difference on phone as a "note". Fix: reserve the hint's height permanently, or overlay it on the canvas.
4. **Medium, Visual.** The art is flat. Plain radial-gradient felt, no cloth texture, no cushion bevel or shadow under the rails, no ball highlights beyond a small dot, no cue-ball English indicator (c-corner-desk-a-start.png). It reads as a dev prototype next to Pounce Pins and Stackfall. Fix: add a subtle felt noise, a rail inner shadow and a specular highlight on balls (`renderTable.ts`, `renderBalls.ts`).
5. **Medium, UI/HUD.** The title screen is bare. Four cards, then 45% empty page, no logo art, no table preview (c-corner3-phone-title.png, corner-desk-1title.png). The "Pause" button is a 128px-tall box beside the HUD with no icon, an odd tall slab that visually outweighs the score. HUD labels (TIME SCORE RACK COMBO) are all one weight; the time is not emphasised even though it is the core pressure. Fix: constrain the Pause button to a compact icon, make the time large and turn it red under 10s.
6. **Medium, Onboarding.** The bottom legend is a 2-line dense paragraph of 9 kbd chips (c-corner-desk-a-start.png). On first impression it is overwhelming, and it appears while the hint strip also tells you to "drag back". The kbd chips are 10.88px (report.json smallText). Fix: collapse the legend behind a "?" button and keep only the single hint.
7. **Medium, Feedback.** The "Miss" label floats over a random ball (above ball 3) in c-corner2-mid.png and says nothing about why (no contact? wrong ball?). A timed game ending "Score 0 · reached rack 1 · best combo x0" has no stats beyond that and the modal covers the balls (c-corner2-end2.png). Fix: anchor feedback to the cue ball, say "No contact" or "Scratch", and show pots and shots on the result.
8. **Low-Medium, Responsive.** Landscape 860x400: table about 618x259, which is 47% of the viewport, with the hint strip eating about 55px (c-corner-land-a-start.png). Phone portrait: "Got it" wraps to two lines in the hint (c-corner-phone-a-start.png); controls stack to 3 rows (spin row, Aim/Shoot row, power row).
9. **Low, Consistency.** Spin options "Back / Centre / Top" lack explanation of what they do, and "Spin: Centre" is label text rather than a control. Fix: a tooltip or a tiny cue-ball diagram.

Top 3 improvements
1. Make the table fill the viewport and enlarge balls (and numerals, stripes).
2. Stop the layout reflow when the hint is dismissed.
3. Raise the production values (felt, rails, ball lighting), and give the title screen a hero visual.

---

## 3. Clay Day

Scores: Visual 6 | UI/HUD 7 | UX/Flow 8 | Responsive/Touch 7 | Accessibility 7 | Overall 7

Strengths
- Best flow of the five. One click on Start, aim with the mouse, fire at once; clear lead hint; Reload button doubles as shell indicator; pause, results and round flow work (c-clay-desk-c-shot.png, c-clay-desk-g-result.png).
- Informative HUD: round, score, time, wind, shell icons, combo multiplier, and a 25-pip tracker with a hit/miss colour. Floating "+225", "Double! +375" score text gives strong juice.
- Result card is clear and complete (hits needed, shells fired, doubles, streak, bonus), with a primary Next round button.

Issues
1. **High, Visual.** Gun art is crude. Two parallel dark rectangles leaving the bottom edge at an angle, with no stock, hands or recoil, and it is partly hidden by the hint card (c-clay-desk-c-shot.png). It is the one thing you look at all game. Fix: draw a proper double barrel with a muzzle flash and recoil kick.
2. **Medium, Visual.** The scene is flat and sparse: circles for clouds, a pale disc for the sun, one-colour tree blobs, bare red rectangles for trap houses; the top 40% of the canvas is empty sky (c-clay-desk-c-shot.png). The title card preview shows a nicer picture than the live play field. Fix: gradient sky, parallax tree layers, a shadow under each clay, a distinct trap-house opening.
3. **Medium, Readability.** Targets are small (about 12px at 960 wide) and spend most of their flight against the dark tree band; a mid-flight clay is beige on dark green. Fix: add a thin light outline or a bright inner highlight, and a short trail.
4. **Medium, Responsive bug.** Floating score text is clipped at the canvas edge on phone: "Double! +37..." is cut at the right side (c-clay-phone-d-after.png). Fix: clamp the label's x to the canvas bounds with a margin, or right-align text near the edge.
5. **Medium, Layout.** HUD takes too much room on narrow screens. Phone: 4 stat cards + shells/combo row + 25-pip tracker occupy about 235px of the top, so the field is 366x661 (71%) (c-clay-phone-d-after.png). The 25 pips wrap 21+4, leaving an orphan row. Landscape: six cards stack in a 290px column and Time and Wind get a full row each, which wastes height (c-clay-land-d-after.png); field is 548x382 (61%). Desktop: sidebar content fills only the top 40% of the right column (c-clay-desk-c-shot.png). Fix: compact HUD strip (round / score / time / wind on one line), tracker pips as a single row of 13+12 or a progress bar.
6. **Medium, Onboarding.** The first-play hint is a white card sitting over the bottom of the field, covering the gun and any low clays for the whole of the first round unless the tiny "x" (button is 44px hit area, visually about 20px) is clicked (c-clay-phone-d-after.png, hint takes 4 lines at 400px). Fix: auto-dismiss on the first shot, or show it before the round starts.
7. **Low-Medium, Accessibility.** Hit/miss pips and combo colour rely on colour (green vs hollow ring; the orange combo). Hits are filled and misses hollow-with-red-marker, so shape does carry some meaning, but misses are not distinguishable from "pending" (both hollow) after the fact (c-clay-desk-c-shot.png). Fix: use a cross for missed pips.
8. **Low, Consistency.** The settings icon is the sun-like glyph again (see Pounce 8). The result card gives no "Retry round" button on a failed round, only per the doc a "Try again" flow; verified only the pass path.
9. **Low, Feedback.** No on-screen sign of how far a shot "lands" (the shot takes time to arrive, and the hint says to lead the clay). A faint pellet-cloud burst at the aim point would teach leading better.

Top 3 improvements
1. Redraw the gun and add muzzle flash and recoil.
2. Condense the HUD (all breakpoints) and auto-dismiss the hint.
3. Improve clay contrast against the treeline, and fix the clipped score text on phone.

---

## 4. Stackfall

Scores: Visual 8 | UI/HUD 7 | UX/Flow 7 | Responsive/Touch 8 | Accessibility 7 | Overall 7.5

Strengths
- Strong cohesive look: a glass-terrarium well, glossy gem-like stones with a glyph on each shape, a ground strip of pebbles, glow and gradient background (c-stack-desk-b-mid.png).
- Clean HUD: SCORE/LINES/LEVEL/TIME/BEST labels with right-aligned values, ghost-piece outline, a red danger tint at the top of the well, a clear stash/next column.
- Colour-blind assist is genuinely good. The alternate palette adds outlines on every cell and seven distinct glyphs (c-stack3-assist.png). The touch control bar (◀ ▶ ▼ ↺ ↻ Stash Drop) is large and well placed on phone (c-stack-phone-b-mid.png).

Issues
1. **High, Accessibility.** The default palette relies on low-contrast glyphs. The glyph vs stone body contrast, sampled from c-stack-desk-b-mid.png, is about 1.5:1 (tan plus), 1.9:1 (orange bar), 2.0:1 (red circle), 2.1:1 (pink square, blue diamond), against the 3:1 needed for graphical objects. The pink square vs red circle pair has delta-E 8.5 under deutan (from the polish doc) and similar luminance. The glyph is the only differentiator for colour-blind players on the default palette. Fix: draw glyphs dark (as the assist mode does) in the default palette too, or make assist the default.
2. **High, Accessibility/Discoverability.** Colour-blind assist is off by default and hidden. Settings opens on the Audio section (3 sliders + 2 checkboxes), and "Display and accessibility" is below the fold of a scrolling dialog (c-stack2-settings.png). Fix: put Display and accessibility first, or prompt on first run, and respect `prefers-contrast`.
3. **Medium, Layout.** The well is small relative to the canvas. On desktop it is about 295x590 css, which is about 17% of the viewport, while the canvas is 1022x782 (78%). On landscape 860x400 the well is about 190x360 (20% of the viewport) with cells about 18px (c-stack-land-b-mid.png). Fix: scale the well to the canvas height and move stash/next into the side margins or over the well.
4. **Medium, Flow.** First run needs two clicks before play ("Got it", then "Play Marathon") and the how-to box sits above the mode cards (c-stack-desk-0title.png, c-fin-stack-phone-title.png). Fix: make the how-to a collapsible "?" and keep Play as the first focus.
5. **Medium, Consistency.** The settings dialog uses native checkboxes and sliders in a long scroll list, unlike the segmented pill buttons that the other four use (c-stack2-settings.png vs c-tile3-settings.png). Fix: segmented toggles for booleans and a section jump bar.
6. **Medium, Readability.** The desktop key legend is 9 kbd chips in a 4-line paragraph at about 11px (report.json smallText), in the sidebar under BEST, and it is the most prominent text on the left (c-stack-desk-0title.png). Fix: show it in a "Controls" popover and collapse it after the first game.
7. **Low-Medium, Visual.** The ghost piece is a thin 1.5px outline in a muted tone; on the dark well it is faint when the stack is tall (c-stack-desk-b-mid.png, pink outline). Fix: a 2px outline plus a subtle fill, and a brighter drop-column highlight.
8. **Low, UI.** The Pause button uses a text label "Pause P" while Sound toggles show "Sound on M". The key hint chips duplicate the legend. On phone the "Pause / Sound on / Settings" row uses 3 pill buttons, 105-190px wide, eating the header. Fix: icon buttons on phone.
9. **Low, Game over.** The result card is informative (score, delta to best, shapes per second), but "Copy seed link" is the third-weight button with no confirmation text visible (c-stack-desk-e-over.png), and a game over reached via spam instantly shows the card behind the blur (the polish doc handled this with a 700ms input lock).

Top 3 improvements
1. Make default-palette glyphs high contrast (or make assist default) and surface it in the first screen of Settings.
2. Enlarge the well within its canvas, particularly in landscape.
3. Streamline first-run (collapsible how-to, a single Play click) and unify the settings dialog style.

---

## 5. Tile Tumble

Scores: Visual 6 | UI/HUD 7 | UX/Flow 7 | Responsive/Touch 7 | Accessibility 4 | Overall 6

Strengths
- Instant to understand: the board is the screen, discs glow, group preview on hover ("7 discs, +25 points" with a white outline on the group) teaches the rule (c-tile2-hover.png).
- Fast, clean HUD (Score / Best / Moves / Discs), a solver-backed daily board, Undo and New game one click away.
- Pop animation plus "+25" floating text and particles gives satisfying feedback (c-tile2-clearing.png).

Issues
1. **High, Accessibility (critical).** Default mode is colour-only. Four hues (red, green, blue, yellow) with no shape or pattern (c-tile-desk-a-start.png). Simulated deuteranopia: red vs green RGB distance 64 and luminance contrast 1.26:1, green vs yellow 1.29:1; protanopia: green vs yellow 1.04:1 luminance contrast, 62 distance. These cannot be separated. The "Colour-blind assist" mode works well (dark glyph per colour, c-tile4-assist.png) but is Off by default and reachable only via the settings icon. Fix: default glyphs on (they look good), or ask on first run, and add a subtle always-on cue such as distinct disc rim patterns.
2. **High, Discoverability.** The settings icon is a sun with rays, so it reads as a theme or brightness toggle (title screen, c-tile-desk header). Colour-blind users will not look behind it. Fix: use a gear and a visible label on the title screen.
3. **Medium, Layout shift.** Closing the onboarding hint pulls the status line and the Undo/New game/Menu row up 108px (c-tile2-hover.png vs c-tile-desk-a-start.png), and the status text can wrap to two lines on hover, growing the document by 18px (the polish doc itself lists this as S3). Fix: reserve fixed heights (min-height) for the hint and the status line.
4. **Medium, Visual.** The look is clean but generic: glossy discs on a navy board, pale lavender page, no theme, no particle atmosphere, no background art. The title screen is a form-like list of 4 cards with 50% empty page (tiletumble-desk-1title.png). Fix: add a hero disc cluster to the title, and a gradient or textured board edge.
5. **Medium, Responsive.** Landscape 860x400 board is about 338x380 (37% of the viewport) beside a mostly empty right column; cells about 42px, below the 44px target (the polish doc records this as S4) (c-tile-land-a-start.png). Phone portrait: the board is 368x414 and about 20% of the screen below the buttons is unused (c-tile-phone-a-start.png). Fix: in landscape use a 2-column layout with the HUD in a 120px strip and the board at full height; on phone grow the board to the remaining height.
6. **Low-Medium, Feedback.** Pairs score 0 but still consume a move in Move-limit mode (polish doc S4). The status message "No group here. Need 2+ matching." sits in the same slot as the preview, easy to miss. Fix: shake the clicked disc, and tint the status line.
7. **Low, UX.** No end-of-run summary seen when no moves remain: after 9 moves the board sat stuck at 32 discs with only the status line (c-tile2-end.png; no result card appeared in my run). Fix: detect "no moves left" explicitly and show a result card with Play again.
8. **Low, Consistency.** The "Pause" icon button sits in the header while game controls (Undo/New/Menu) are text pills, mixed icon and text styles; the keyboard legend wraps to 2 lines at 1280 (c-tile-desk-a-start.png).

Top 3 improvements
1. Turn on glyphs by default (or on first-run prompt) and rename or icon the settings control properly.
2. Fix layout shift (fixed heights for hint and status) and the landscape layout.
3. Add an explicit no-moves result card, plus more personality on the title and board.

---

## Cross-game patterns

1. **Consistent shell, uneven art.** All five share the same pause/settings/reduce-motion/text-size plumbing and pass text contrast. Art quality varies widely: Pounce Pins and Stackfall feel like finished games, Clay Day and Tile Tumble are tidy but generic, Corner Pocket looks like a prototype.
2. **The settings icon looks like a sun.** Pounce, Clay and Tile use the same radial-ray glyph, which reads as theme or brightness. The most important accessibility switch (colour assist) is behind it. Use a gear and label it.
3. **Hint or onboarding banners cause layout shift or cover play.** Corner (table rescales 14%), Tile (controls jump 108px), Clay (card over the gun), Pounce (banner above controls). Reserve space or overlay.
4. **Play area under-uses small viewports.** Landscape 860x400 gives the play area 43% (Pounce), 47% (Corner), 61% (Clay), 20% (Stackfall well), 37% (Tile). HUD columns are much larger than needed. Desktop in Stackfall (well 17% of the viewport) and Corner (table about 40%) is similar.
5. **Colour-only or low-contrast non-text cues.** Tile Tumble (colour-only by default) and Stackfall (glyph about 1.5-2.1:1) both hide their working assist options behind settings. Make accessible modes the default or surface them on first run.
6. **Title screens are plain.** Every game except Clay Day opens on a card or list with no hero art and 45-50% empty page. A visual hook (the cat pyramid, a rack, a falling piece) would lift first impression.
7. **Key-legend clutter.** Corner, Stackfall and Tile print long paragraphs of key chips at about 11px on screen permanently; collapse them behind a "?".
8. **Polish docs vs reality.** Their verdicts of PASS hold on mechanical criteria (scroll, targets, console), but several items they downgraded to S4 are real first-impression issues here: Pounce landscape size, Corner hint reflow, Tile hover reflow and 42px cells.

## Scores summary

| Game | Visual | UI/HUD | UX/Flow | Resp/Touch | A11y | Overall |
|---|---|---|---|---|---|---|
| Pounce Pins | 8 | 7 | 7 | 7 | 7 | 7.5 |
| Corner Pocket | 5 | 5 | 6 | 6 | 5 | 5.5 |
| Clay Day | 6 | 7 | 8 | 7 | 7 | 7 |
| Stackfall | 8 | 7 | 7 | 8 | 7 | 7.5 |
| Tile Tumble | 6 | 7 | 7 | 7 | 4 | 6 |

---

## Review D: Sudoku Dash, Lantern Bridge, Measure Up, Lily Hop, Tic-Tac-Toe

Method: Playwright (own browser per script) on the live build. I played real moves, reached win states, and used hints, notes, wrong moves, settings, keyboard, dark theme, 400x860 touch, 860x400 and a 2x DPR capture. Scripts: `drive-d-*.js`, `d-vp.js`, `d-contrast.js`. Screenshots: `shots/d-*.png`, all in /private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/b7605c7b-2b5d-4812-a937-a4ce388cd3f2/scratchpad/pw/shots/. I formed my judgement first, then skimmed docs/polish.

Contrast: a computed-style sweep of HTML text (4.5:1 normal, 3:1 large) found no failures in any game on title or play screens. The SVG text hits in the sweep (Lantern "Start", "Wren", Measure Up "HOLD") are false positives from background detection. Visually they are light-on-dark and fine. Contrast is not a problem anywhere.

---
## 1. Sudoku Dash
Scores (1-10): Visual 6, UI/HUD 7, UX/Flow 7, Responsive/Touch 6, Accessibility 7, **Overall 6.5**

Strengths
- Best-in-set information design for its genre. The HUD (Time / Score / Combo / Mistakes) is clear. The wrong-cell cue is a pink hatch plus a red x, so it is not colour-only. Hints are explained ("NAKED SINGLE... r1c7 can only be 2") with a "Place it" button.
- Onboarding is a single 1-line toast ("Tap a cell, then a number. Wrong numbers show red."). The title screen lets you start in 1 click (Play).
- Digit pad shows remaining counts under each number. Pencil marks are in a distinct colour.

Issues
1. **High / Responsive.** Landscape 860x400: the 9x9 board is taller than the viewport (page scrollHeight is 90px over, `d-sudokudash-land-play.png`). The bottom row is cut off, and the "Tap a cell" toast sits on top of rows 7-9 and covers them. Fix: in short landscape, size the board to `100dvh - header`, drop the logo row, and anchor the toast over the side panel rather than the board.
2. **High / Accessibility and Visual.** Pencil-mark text is 7px (computed `fontSize` 7px on every `svg text`; `d-sudoku2-phone.png`). On a 42px phone cell, "1 2 3 / 4" is barely legible. The notes also wrap onto 2 lines, with the 4th mark on its own row in a different colour. Fix: use a fixed 3x3 candidate grid per cell (digit n in its own slot) at >=9px on phone. Slot positions make notes scannable and remove the wrapping and colour mix-up.
3. **Medium / Touch.** Phone cells are 42x42, below the 44px target (measured, 81 cells). The title screen checkboxes are 24x24 inputs (`report.json`), although their labels are larger. Fix: make the labels the hit area (`label{min-height:44px}`), and reclaim width by shrinking the board gutter. The changes doc claims every control is >=44, but cells and the title checks are not.
4. **Medium / Feedback.** The floating "-10s" penalty overlaps the notes of the neighbouring cell (`d-sudoku2-phone.png`, over the "4" note). The "-8s" next to the clock after a hint is pale pink (#f6c8d0-ish) at ~12px, nearly invisible. Fix: show the delta as a pill on the HUD clock only, in the danger colour at >=14px, and don't float it over the grid.
5. **Medium / Visual.** The hint view is loud. Red 3px boxes on the 8 "reason" cells, yellow row/col wash, a green dashed target, plus the panel (`d-sudoku-1hint.png`). The red boxes are the same red as a wrong entry, which contradicts the "red = mistake" onboarding. Fix: use a neutral blue/indigo outline for hint reasons and reserve red for errors.
6. **Medium / UX.** Hint costs time silently in Dash mode (-8s). The Hint button doesn't say so before you press it. Fix: label "Hint (-8s)" in Dash mode.
7. **Low / Layout.** Phone numpad is 5+4 with a half-empty second row, and the header chips wrap to a second row (page 48px too tall at 400x860). Fix: a single 9-key row at 400px (keys 40px wide is too small, so keep 5+4 but centre and equalise), and move Pause/Sound/Settings into one row next to the logo.
8. **Low / Identity.** The title screen is a form (mode cards, difficulty chips, checkboxes, a table) with a 90px lightning-bolt thumbnail. The bolt is the only brand moment. The rest looks like a settings page. Fix: lead with a bigger hero and make Play the dominant control; collapse "3-mistake limit / Auto-remove notes" into Settings.
9. **Low / Consistency.** Uses text chips ("Pause (P)", "Sound on (M)") where the sibling games use icon buttons. Fix: adopt the collection's icon-btn row.

Top 3 improvements: (1) fix landscape board clipping and toast overlap; (2) redesign pencil marks as a fixed 3x3 grid at >=9px; (3) change hint highlighting from red to a neutral colour and add the time cost to the Hint label.

---
## 2. Lantern Bridge
Scores: Visual 7, UI/HUD 7, UX/Flow 7, Responsive/Touch 6, Accessibility 8, **Overall 7**

Strengths
- Theme comes through. A night sky with moon and stars, a lit lantern that glows on the bridge, a river, and distinct character figures with shape badges (circle, square, triangle) and walking-time bubbles (`d-lantern-2selected.png`). The 3-card mode menu with "0 of 63 stars" is clear and attractive.
- Excellent flow. Title, mode, level, play is 3 clicks. The win dialog is clear: "Everyone is across", stars, best possible, and 4 sensible buttons.
- Accessibility is strong. Selected state uses a check badge plus an outline (not colour-only), the focus ring is a visible 3px dashed white/blue ring, keys are shown on buttons, and every control is >=44px.

Issues
1. **High / Responsive.** Landscape 860x400: the Cross button, the primary action, is cut off at the bottom of the side panel (`d-lanternbridge-land-play.png`). On phone 400x860 the Cross button sits 120px below the scene and Undo/Hint/Restart are off-screen (page overflows 122px on level 1, more on 7-traveller levels). The verification doc lists this as known (S3). Fix: a sticky bottom action bar with Cross, Undo, Hint on phone and landscape.
2. **Medium / UI.** An empty "Rules" heading renders with no body on level 1 (visible in every desktop play screenshot). It looks broken. Fix: hide the section when there are no rules or collapse it as a `<details>` with a one-line summary.
3. **Medium / Visual.** The scene is mostly empty flat green. Banks are huge solid #234130 rectangles, and the figures sit in the top third (`d-lantern-1level.png`). The moon is cut off by the bank at 1280 wide (`d-lantern-2selected.png`, moon clipped at the horizon). Fix: scale the figures up, add foreground detail (grass, rocks, a lamp post), and size the sky to include the whole moon.
4. **Medium / Feedback.** The win dialog says "Perfect, that is the best possible route" while showing 2 of 3 stars, because the Hint cap is mentioned only in grey small print ("Hints cap the stars at 2."). It reads as contradictory. Fix: say "Best route, but a hint was used" and show the capped star in a different state; show the star cap before the player presses Hint.
5. **Medium / Onboarding.** The in-panel hint is a 4-line dashed box ("Pick up to two travellers and press Cross. The lantern must come back with someone each time.") that pushes the controls down. It is also not obvious that a number badge means minutes. Fix: shorten it to 1 line and add a "min" unit to the badges.
6. **Low / Interaction.** The tap model is: select 1-2 on a bank, press Cross, press a different traveller to return. The bridge crossing animation takes about 1.5s with no skip. In my scripted run each crossing needed ~1.8s of waiting. Fix: allow Cross while animating or add a 2x skip.
7. **Low / Consistency.** The title scene is a better illustration than the in-level scene. The same characters walk on the title bridge but look flatter and sparser in play.

Top 3: (1) sticky action bar for phone/landscape; (2) richer foreground and bigger figures in the scene; (3) remove the empty Rules heading and reword the hint-capped stars.

---
## 3. Measure Up
Scores: Visual 6, UI/HUD 5, UX/Flow 6, Responsive/Touch 7, Accessibility 7, **Overall 6**

Strengths
- Strong concept art. The cave gate with a "HOLD 3" brass plate and a frowning lamp mascot (Wick) that smiles on win gives the puzzle a goal. Jug heights are proportional to capacity, with a red dashed target line and a star marking the goal level on every jug (`d-measure-2hint.png`).
- The phone layout is better than desktop: scene on top, stats, jugs, then action buttons in one column (`d-measureup-phone-play.png`). All targets >=44px.
- Tap model is explained in 1 line, and the status line gives specific prompts ("Pour jug A into which jug? Or fill it, empty it, or pick it again to cancel.").

Issues
1. **High / Visual (bug).** The title-screen hero art is broken. The mascot/gate illustration renders as a dark rounded square with Wick's face sliced in half at the right edge (`d-measure-0title.png`, 2x). Looks like a wrong viewBox/crop on the title SVG (scene.ts "Also used (alone) on the title screen"). This is the first thing a player sees. Fix: render the title variant with its own viewBox so Wick is centred and complete, or reuse the gate scene.
2. **High / Layout.** Desktop 1280x800 play is unbalanced (`d-measureup-probe.png`). The scene card sits low-left, the HUD hugs the top right, the jugs sit low-centre and the buttons are pinned at the bottom (y~765, within 35px of the viewport edge). Roughly 40% of the viewport is empty, and the eye has to travel scene -> HUD -> jugs -> buttons in a Z. Docs call this a "known gap". Fix: a two-column layout with the gate scene and jugs in one vertically centred stage (jugs in front of the gate), with HUD above and the action row directly under the jugs.
3. **Medium / UX.** The selection and pour model is easy to misread. In my run I tapped B (selected) and then A, and nothing poured because A was the "pour source" state shown by an outline and a triangle icon on the label. The only cue is a 14px triangle next to the jug letter plus a blue outline. Fix: when a jug is selected, show an arrow or a ghost stream towards the valid targets, and highlight the target jugs.
4. **Medium / Feedback.** The win state is flat. A modal covers the scene ("Gate open!", three black stars), so the one payoff, Wick freed and the gate open, is hidden behind the dialog (`d-measure-5win.png`). The stars are black, not gold, and there is no celebration. Fix: delay the modal 1.2s so the gate animation reads, make earned stars gold with a pop, and add confetti or sparkles.
5. **Medium / Visual.** Jugs are plain tubes with no handle, glass highlight or water surface. The water is a flat teal gradient (`d-measure-2hint.png`). The theme says "water jugs" but it reads as test tubes. Fix: add a meniscus line and a bubble or ripple on pour, and a rim or handle silhouette.
6. **Medium / Flow.** The level list is plain: a 12-column grid of numbers with "Locked" and "2 jugs" at 11px, filling the top 40% of the screen with no level names or art (`d-measureup-probe.png`, levels screen). 31 of 35 tiles say "Locked", which discourages. Fix: show only the next ~8 and tease the rest, show the level name ("First Drip"), and group by jug count with a heading.
7. **Low / Consistency.** The title menu has no logo mark, the "Measure Up" title is a small 22px wordmark in the header, and the page is a lone mascot and three pill buttons on beige. Compare Lantern Bridge's hero scene.
8. **Low / Info.** Hint text "fill jug A from the well" assumes the player has found "the well", and no well is drawn. Fix: draw a tap/well above the jugs, or say "Fill".
9. **Low / A11y.** The Time stat updates every second and sits in the HUD with Moves/Par. A timer on a no-pressure logic puzzle adds stress. Fix: hide behind a setting.

Top 3: (1) fix the title art crop; (2) re-compose desktop play into one centred stage; (3) show the gate opening before the win modal, with gold stars.

---
## 4. Lily Hop
Scores: Visual 8, UI/HUD 7, UX/Flow 8, Responsive/Touch 8, Accessibility 7, **Overall 7.5**

Strengths
- Most polished illustration of the five. The pond has a depth gradient, fireflies, ripples, reeds and a moon. Green frogs and orange spotted toads are distinct by colour and by species shape, and pads have a lily-wedge cut (`d-lily-2hint.png`).
- Excellent onboarding and flow. Play is 1 click from the menu, a 1-line rule ("Pieces only move forward: one step into an empty pad, or a jump over one rival"), a clear hint ("the glowing frog hops to the glowing pad"), a blocked-frog message, and "Best possible 8" shown up front so par is known. Win dialog has Next level / Play again / Menu.
- Layout works at every size. Pads are 112px, no h-scroll, phone and landscape stack cleanly.

Issues
1. **Medium / Feedback.** Perfect play (8 moves = best possible) with one hint gives 2 stars. The dialog says "8 moves (best possible 8)" and still withholds the third star (`d-lily-4win.png`). The star criteria are not shown anywhere before play. Fix: show "3 stars: no hints" on the HUD or a star-rule line.
2. **Medium / Visual.** The pond is mostly empty. On 2+2 the 5 pads sit in a thin band in the middle of a 750x575 scene, and most of the scene is blank water (`d-lilyhop-probe.png`). The moon is cut in half by the right edge, and on phone the first pad's selection ring is clipped against the pond's left edge (`d-lilyhop-phone-play.png`). Fix: scale pads to fill the width, and add an inset padding so rings are not clipped.
3. **Medium / HUD.** The level title wraps awkwardly in the header ("Classic crossing: 2 + / 2") at desktop and landscape (`d-lilyhop-probe.png`, `d-lilyhop-land-play.png`). Fix: `white-space:nowrap` on "2 + 2", or drop the prefix.
4. **Medium / UI hierarchy.** The menu is a sparse list at 1280x800 with the top-left aligned cards occupying about 45% of the width (`lilyhop-desk-1title.png`). Nothing shows a frog. A locked grid of 9 of 10 dashed boxes ("Locked") is the loudest element. Fix: add a hero frog/toad pad, show frogs on the tiles, and open the first row of each group.
5. **Low / Feedback.** The "Hint" button has no cost cue (stars) and gives the full answer. A softer first-tier hint (highlight the frog only) would keep puzzle value.
6. **Low / A11y.** Frog vs toad is distinguishable by shape but the "can hop" cue is a dashed ring only, and the "blocked" state is only in the aria-label. Visible blocked state (dimmed) would help colour-blind and new players.
7. **Low / Consistency.** Desktop HUD stat cards and button row sit top-right while the scene is left, leaving large empty areas below both. Same unused-space pattern as Measure Up.

Top 3: (1) fill the pond (scale pads, inset the clipped edge and moon); (2) state the star rule up front and don't contradict "best possible"; (3) add illustration to the menu and open the first levels in each group.

---
## 5. Tic-Tac-Toe
Scores: Visual 6, UI/HUD 7, UX/Flow 8, Responsive/Touch 8, Accessibility 8, **Overall 7**

Strengths
- Instantly understood. Board is 640x640 (80% of the viewport height), X is red and O is teal, with different shapes, so it is not colour-only. A "last move" outline is shown and the winning line is struck through.
- Great scoring and options. A scoreboard with the active player outlined, a streak line, CPU levels, Vanishing mode that shows "next out" and 3-dot mark counters, and a keyboard map (1-9, N, P, M) printed under the board.
- Dark theme (`d-tictactoe-dark.png`, rgb(27,24,22)) is well balanced. Phone is clean: the options collapse to a one-line summary.

Issues
1. **Medium / Visual.** The win highlight flashes pure saturated red (#ff0000-like) behind X (`d-ttt-3end0.png`, captured mid-animation) before settling to beige (`d-ttt-3end1.png`). The raw red clashes with the warm palette and will read as an error, not a win. The CPU-win/draw states were not evidenced to look different. Fix: animate the winning cells to a warm gold or the player's colour at low alpha.
2. **Medium / Hierarchy.** At 1280x800 the "Game options" panel is expanded and is the largest block in the right column (~320px, taller than the scoreboard, status and buttons combined). Setup chips get more visual weight than "Your move" (`tictactoe-desk-1title.png`). "Unbeatable" wraps to its own row. Fix: collapse by default (as on phone) after the first round, and shorten labels so CPU levels fit a row.
3. **Medium / Visual identity.** The board is white tiles on a tan frame, with no marks to guide a first move and no illustration or title treatment. It is the plainest of the five, and the "Tic·Tac·Toe" wordmark is 20px. Fix: a stronger brand moment (bigger title, or tile hover previews of the ghost mark).
4. **Medium / Flow.** After a round ends, the next-round affordance is the text "Press N for another round" and a pulsing New round button. There is no auto-advance and no end-of-round overlay, so the result is shown in small text in the status line (`d-ttt-3end0.png`). Fix: show a clear result banner ("You win!") over the board.
5. **Low / Responsive.** Landscape 860x400: board is fully visible but the side panel overflows by 9px (`vs: 9`), a trivial scroll with the options section hidden (`d-tictactoe-land-play.png`). Fix: trim 10px of padding.
6. **Low / Behaviour.** The "Paused while the page was in the background" overlay triggered during my scripted vanishing run, when focus moved. Inside a test harness this can happen spuriously. Real tabs may see it only on blur, so verify it does not fire on window-focus loss from alert dialogs. (Not confirmed as a bug.)
7. **Low / Consistency.** Vanishing mode's top CPU level is labelled "Strong" while Classic says "Unbeatable". Use one term.
8. **Low / UX.** The empty-state helper "Get 3 in a row. You are X." with an x dismiss is good, but "Your move" below it repeats the same information.

Top 3: (1) replace the red win flash with a warm gold highlight and add a visible result banner; (2) collapse Game options after the first round on desktop; (3) give the board a hero treatment (bigger title, hover ghost marks).

---
## Cross-game patterns (these 5)
- **Responsive gaps in short landscape and on phone.** Primary controls or board parts fall off-screen in 3 of 5 games (Sudoku board clipped at 860x400; Lantern Cross button below the fold; Tic-Tac-Toe 9px overflow). Docs claim these were handled. A shared "short landscape" rule (board = 100dvh, controls in a side column or a sticky bar) is needed.
- **Desktop layouts leave 35-45% of the viewport empty** (Measure Up, Lily Hop, Lantern title). Scenes are not scaled to the stage, and the HUD hugs a corner.
- **Illustration quality varies widely.** Lily Hop is polished, Lantern Bridge is good, Measure Up has strong concept art but a broken title crop, and Sudoku and Tic-Tac-Toe have almost no theme art. Tic-Tac-Toe and Sudoku read as clean tools, not games.
- **Win states are generic dialogs.** All 4 puzzle games use the same modal (title, 3 stars, 3-4 buttons) that covers the scene's payoff. Nothing celebratory is visible (Measure Up's black stars are the weakest). Delay the modal and let the scene animate first.
- **Hint-capped stars are confusing.** Lantern Bridge and Lily Hop both say "best possible" or "perfect" while awarding 2 stars. Show the star rule before the first hint.
- **Strengths shared:** contrast passes in all games (no HTML text under 4.5:1), >=44px targets nearly everywhere, visible focus rings and shortcut hints on buttons, shape-plus-colour cues, one-line onboarding, 1-click start in 4 of 5 games, and a consistent icon-button row.
- **Header consistency:** Sudoku uses text chips; the others use icon buttons. Tic-Tac-Toe has no title screen and the others do.

---
