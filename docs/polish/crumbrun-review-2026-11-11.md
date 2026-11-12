# Crumb Run - Polish Assessment (Phase 1), 2026-11-11

Build: vite 7 preview of `/Users/sharajrewoo/DemoReposQA/arcadeShop/crumbrun`, Chromium 1.48.2 headless, isolated. Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/crumbrun-*.png` (abbreviated `SHOT/` below). Script: `.../scratchpad/crumb-play.mjs`.
Method note: sessions were driven with real keyboard/touch input; `?debug=1` hook (`window.__crumb`) was used only to skip levels/force deaths and read state. Sessions were scripted, not skilled play, so balance findings come from code and tuning maths plus limited observation.

## Scorecard (1-5)

| Area | Score | Reason |
| --- | --- | --- |
| UI | 2 | Canvas stuck at 378x472 CSS px on a 1280x800 window (29% of the area); 7-8px HUD/help text; wall and floor muddy. |
| UX | 3 | Clean title, demo attract mode, Ready/Pause/Summary all work; no how-to-play, no pause menu, ~3s idle death. |
| Gameplay | 3 | Solid, well-tested rules, distinct cat AIs; difficulty plateaus by L6 and structure is very close to Pac-Man. |
| Graphics | 3 | Charming sprites and drenched-cat read; terrain palette is low-contrast and Pip vanishes on Slate theme (1.01:1). |
| Audio | 3 | Synth coverage decent, rate-limited squeak; no music, no UI/pause/release/phase/drench-end cues, no volume control. |
| Accessibility | 2 | 44px buttons OK, but contrast fails on theme 2/3, no colour-blind aid, no text scaling, canvas has no live text alternative. |
| Performance | 5 | 60.0 fps, p99 frame 16.8 ms, 1-2 long tasks over 6s on title and play; 110 kB JS, no console errors. |
| Robustness | 4 | Corrupt storage, rapid input (200 keys), blur/hidden-tab auto-pause all handled; landscape phone is broken. |

Scorecard line: UI 2 | UX 3 | Gameplay 3 | Graphics 3 | Audio 3 | Accessibility 2 | Performance 5 | Robustness 4

## If you only do three

1. CRUMBRUN-01: Make the canvas fill the viewport (fractional/CSS scaling with `image-rendering` control) instead of integer-only scaling that leaves it at 378x472 on a 1280x800 window and 126x157 on a landscape phone.
2. CRUMBRUN-02: Rework the three themes for luminance separation (wall vs floor, Pip vs floor); Terracotta wall/floor is 1.03:1 and Pip on Slate is 1.01:1.
3. CRUMBRUN-03: Soften the opening: longer/gentler first 20 s (Pip faster than cats is true, but Smudge chases at once and an idle player dies ~3 s after READY ends) plus a first-run hint overlay.

## Full prioritised list

Severity: S1 broken, S2 major, S3 minor, S4 nice-to-have. Effort S/M/L.

### CRUMBRUN-01 | UI/Layout | S2
- Evidence: `layout.ts:21-29` `fitScale` floors to integer when raw>=1. Measured: 1280x800 dpr1 -> canvas 378x472 (SHOT/desk-title.png); 2x dpr -> 567x708; phone 400x860 -> 378 wide with ~280px empty above/below (SHOT/phone-play.png); landscape 860x400 -> raw<1 so fractional 0.33, canvas 126x157 with d-pad taking 146px (SHOT/phone-landscape.png).
- Change: In `fitScale` use fractional scale (raw) when it exceeds integer by >15%, e.g. scale = raw >= 2 ? floor(raw*4)/4 : raw; render static layer at that scale (already scale-keyed). Alternative: keep integer device-pixel scale but allow `image-rendering: pixelated`-style upsample of a lower-res backing store. Cap at maybe 4x.
- Effort: S. Risk: soft edges at fractional scale (mitigate by rounding to 0.25 steps); no sim impact.
- Verify: Playwright at 1280x800, 1920x1080, 400x860: canvas css height >= 90% of stage height; `tests/layout.test.ts` add cases.

### CRUMBRUN-02 | Graphics/Accessibility | S2
- Evidence: measured WCAG ratios from `theme.ts`: Checker floorA vs wallTop 2.51, floorB vs wallTop 1.63; Terracotta floorA vs wallTop 1.03, vs wallFace 1.72; Slate floorA vs wallFace 1.38; floorA/floorB 1.17-1.54 (checker noise competes with crumbs). Pip `#9ea3ad` vs Slate floor 1.01, vs Checker floor 1.54 (`spritePip.ts:42`). Biscuit vs Checker floor 1.22, Ginger vs Terracotta 1.47. SHOT/desk-play.png, SHOT/desk-level5.png (Pip nearly invisible), SHOT/desk-drench.png.
- Change: Darken floors to a narrow low-chroma band (floorA/floorB delta <=1.1:1, luminance ~0.08-0.15) and lighten walls so wall:floor >=3:1; add 1px dark outline (`#120a0e`, 1.5px) and light rim to Pip and cats (sprites) so each reads >=3:1 on every theme. Per theme: Terracotta walls to a light teal (#9fd3d1), Slate floors to #3d4f5c with cream walls; make crumbs `#fff0c0`.
- Effort: M. Risk: art-direction call; keep "kitchen at night" mood. Verify: script that computes theme contrast table in a unit test (>=3:1 wall/floor, actor/floor); eyeball screenshots at all 3 themes.

### CRUMBRUN-03 | Gameplay/Balance | S2
- Evidence: Idle player dies 3.0 s after READY ends (measured). `levels.ts:22-25` base cat 4.7 vs Pip 5.6 t/s; `BASE_RELEASE` [0,3,6.5,10]s so Smudge is already hunting at 0 s and chases directly (`cats.ts` shortest path). Overlap: catSpeed passes pipSpeed at level 5 (5.9 vs 5.8) and hits cap 6.2 vs pip 6.0 at L6, Tuxedo pounce 1.6x.
- Change: Level 1 `BASE_RELEASE` [2,6,10,15]; Smudge uses its corner for first 4 s (reuse rest-phase target); cat speed curve 4.4+0.2*l capped 5.6 so Pip always stays faster until L10; keep pounce 1.3x on levels 1-3.
- Effort: S (config only). Risk: balance only; sim determinism unaffected but update `tests/rules.test.ts` expectations. Verify: scripted bot / telemetry of time-to-first-death across 20 seeded runs: median >=25 s on L1.

### CRUMBRUN-04 | UX/Onboarding | S2
- Evidence: Title (SHOT/desk-title.png) explains goal in a 7px grey line; there is no description of sugar vs crumbs, cheese, pistol pickup meaning, rest phase, or tunnel. READY! for 2.2 s only.
- Change: First-run (flag `crumbrun-seen` in settings schema) show a 3-card overlay on first Enter: (1) steer, (2) pistol = drench, chain bonus, (3) cheese/tunnel. Dismiss on any key/tap. Also pulse the nearest pistol pickup on L1 during READY.
- Effort: M. Risk: settings zod `.strict()` schema must be extended (backward compatible default). Verify: playtest first 30 s; unit test storage migration.

### CRUMBRUN-05 | Gameplay/IP | S2
- Evidence: Structural overlap with Pac-Man: ghost-house basket with door and timed release (`world.ts`, `levels.ts:BASE_RELEASE`), tunnel on row 11, 4 pellets that frighten enemies with blink warning, chase/scatter cadence (20 s / 7->5 s, `modes.ts`), reverse on mode change (`step.ts:132`), four targeting personalities (direct, patrol, ambush, mirror), 200/400/800/1600 chain, extra life at 10,000, fruit twice per level (README). Mazes are original but all share the symmetrical 21x23 shape with centre box.
- Change: Differentiate at least: (a) drop the 200/400/800/1600 chain for a different curve (100/250/600/1500) and extra life at 7,500 and 25,000; (b) cats do not reverse on rest start (they wander off); (c) make one maze asymmetrical with a moving obstacle (a closing cupboard door every 8 s) so it plays differently; (d) replace the 'rest' corner retreat with cats grooming (stationary 3 s, vulnerable to sneak past). Keep own name/art, which are clearly distinct.
- Effort: M-L. Risk: this is the requested "clearly not a Pac-Man recreation" constraint; needs designer sign-off, tests in `rules.test.ts`. Verify: design review checklist of mechanics diff vs reference.

### CRUMBRUN-06 | UI/Text | S3
- Evidence: Fonts at logical 7-8px (`overlays.ts` title help line 7px, HUD labels 8px, `ENTER / TAP FOR NEXT LEVEL` 8px); at scale 1 these render at 7px. SHOT/desk-title.png.
- Change: Set minimum 10 logical px for all help text; after CRUMBRUN-01 (scale ~1.7) this lands ~17px. Move the control hints into a two-line block and drop the 7px pistol line (replace with the onboarding card). Add `fontScale` option 100/125/150% in settings applied to `text()`.
- Effort: S-M. Risk: HUD overlap on narrow canvas (21 tiles = 378 logical px); verify no clipping via screenshot. Verify: screenshot diff; measure min rendered font height >=12 css px at 400x860.

### CRUMBRUN-07 | UX/Pause | S3
- Evidence: Pause shows only "P or Esc to resume"; no mute/restart/quit; touch users can pause via 44px button but on paused screen tap does nothing (`flow.ts:73 action()` returns when paused). SHOT/desk-pause.png, SHOT/phone-pause.png.
- Change: Pause menu: Resume, Restart, Mute, Quit to title, with focusable options driven by arrows/Enter and on-canvas tap zones >=44 css px high. Tap anywhere resumes by default.
- Effort: M. Risk: input handler rework, `flow.ts` is 197 lines OK. Verify: keyboard and touch run-through.

### CRUMBRUN-08 | Audio | S3
- Evidence: `audio.ts` has squeak, splash, meow, pistol, cheese, extraLife, death, jingles. Missing: cat release from basket ('release' event emitted `step.ts` but unused in `main.ts:onEvent`), rest/chase 'phase' change, drench ending ('drenchEnd'), cheese spawn ('cheeseSpawn'), pause/resume, tunnel wrap, game over jingle, pounce telegraph, menu confirm, low-lives. No ambient bed/music. `play` map in `main.ts:34-41` omits 6 of 12 events.
- Change: Add `sfx.release()` (short pad blip), `sfx.drenchWarn()` (ticking at 1.6 s blink), `sfx.phase()` (low two-note), `sfx.cheeseAppear()`, `sfx.pounce()` (rising saw 0.15 s when Tuxedo flips to pounce), `sfx.gameOver()`, `sfx.ui()`. Add a quiet looping bass pulse that tempo-ups with remaining crumbs. Add master volume (0/50/100) in settings.
- Effort: M. Risk: synth-only constraint; keep splash+meow not to stack to clipping (see 09). Verify: manual listen with a table of event -> sound in a test asserting every EventType is mapped.

### CRUMBRUN-09 | Audio/Mix | S3
- Evidence: `splash()` noise vol 0.5 plus `meow()` sawtooth 0.09x2 triggered together (`main.ts:37-40`), master 0.5 with no compressor; squeak 0.05 vs jingles 0.12 vs splash 0.5: ~10x spread. Noise buffer allocated each splash (`audio.ts:55`).
- Change: Insert `DynamicsCompressorNode` before destination; normalise per-sfx gains to a table (squeak 0.08, jingle 0.14, splash 0.25); pre-render noise buffers once.
- Effort: S. Risk: low. Verify: record via OfflineAudioContext peak <= -3 dBFS.

### CRUMBRUN-10 | Graphics/Juice | S3
- Evidence: No screen shake, no hit-stop on death or splash, no pickup pop/trail; no render interpolation: render reads world state only at sim ticks (`main.ts:73-83`), so with a 60 Hz sim on 120/144 Hz displays Pip/cats update at 60 Hz (stutter), and accumulator remainder is discarded. Death is stars + paw only.
- Change: Keep previous positions per mover (`prevX/prevY` set in `advance`), render at `lerp(prev,cur, acc/FIXED_DT)` (needs `alpha` passed to `Renderer.draw`; tunnel wrap must not interpolate across the edge). Add 80 ms hit-stop on death/splash, 2 px shake for 150 ms on death (gated by `reducedMotion`), score popups scale-pop, crumb eaten flicker.
- Effort: M. Risk: sim determinism untouched if interpolation is render-only; wrap edge case. Verify: 144 Hz emulation, record frames; unit test lerp wrap.

### CRUMBRUN-11 | Accessibility | S3
- Evidence: Colour-only information: drenched cats blue vs normal (blinks to warn) and Blue pistol on Slate theme blue floor; Biscuit cream vs Ginger orange similar for deuteranopia. No colour-blind mode, no high-contrast mode.
- Change: Add icon redundancy: drenched cats get a droplet icon and wavy outline; pistol gets a white halo; add Settings -> "High contrast" (flat dark floor `#1b1b22`, bright walls, thick actor outlines) and a CVD-safe palette for cats (distinct shapes: ear size, stripe/spot).
- Effort: M. Risk: need a settings screen (CRUMBRUN-12). Verify: simulate protan/deutan filters in screenshots.

### CRUMBRUN-12 | UX/Settings | S3
- Evidence: Only setting is `muted` (`storage.ts:9`), toggled via M key; no settings UI on title; no volume, text size, reduced-motion override (follows OS only), high-contrast, or d-pad toggle on desktop (`?dpad=1` URL).
- Change: Add settings panel reachable from title (key `O` and a tap button): Volume, Reduced motion (auto/on/off), High contrast, Text size, Show d-pad, Left-handed d-pad. Extend zod schema with defaults so old saves parse.
- Effort: M. Risk: strict() schema; test migration. Verify: storage tests + manual.

### CRUMBRUN-13 | Gameplay/Pacing | S3
- Evidence: README: 3 mazes, difficulty parameters saturate: pipSpeed cap 6 at l=8, catSpeed cap 6.2 at l=5, drench min 2 s at L6 (`levels.ts:22-26`); after L6 only theme/maze cycling remains. `cheeseSec` constant 9. No other replay hook: no daily seed, no stats on title, score is the only metric.
- Change: Add level 7+ modifiers cycling (e.g. fast cats, dark kitchen with light radius around Pip, two Smudges), a per-run summary with accuracy/best chain, and a best-level stat in storage. Make `drenchSec` floor 3 s.
- Effort: M-L. Risk: balance. Verify: simulate seeds with the pipAi bot.

### CRUMBRUN-14 | Gameplay/Fairness | S3
- Evidence: Tuxedo pounce is 1.6x speed on any straight line of sight (`cats.ts POUNCE_MULT`, `step.ts:catSpeed`); at L1 Pip 5.6 vs pounce 4.7*1.6=7.5, a guaranteed catch down a long corridor with no telegraph visual beyond (`pouncing` flag drawn?) and no sound.
- Change: Add 0.35 s wind-up (cat freezes, ears flatten, eyes widen, `sfx.pounce`) before the dash; limit pounce to 3 s with a 4 s cooldown; pounce multiplier 1.3 on L1-L3.
- Effort: S-M. Risk: `cats.test.ts` needs updates. Verify: unit test cooldown; playtest corridor traversal.

### CRUMBRUN-15 | UX/Feedback | S3
- Evidence: HUD shows no cheese timer, no rest-phase indicator (`modes.ts` 5 s rest invisible except cats walking away), drench meter only at bottom centre (`hud.ts:drenchMeter`) 90x6px. Extra life at 10,000 only shows as sound + life icon (no popup). Death: lives icons only update after respawn.
- Change: Draw a 2 px ring timer under cheese; tint HUD top bar subtly cool during rest; "1UP" popup via `particles.popup`; make the drench meter 140x10 and place near the top centre under LEVEL.
- Effort: S. Risk: low. Verify: screenshots.

### CRUMBRUN-16 | Accessibility/Screen reader | S3
- Evidence: canvas has static `aria-label` only (`index.html:22`); score, lives, phase changes are never announced; `<noscript>` ok.
- Change: Add a visually-hidden `aria-live="polite"` region updated on phase change, level clear, lose life, game over, new high score (rate-limited); give the canvas `role="application"` with an instruction label.
- Effort: S. Risk: none. Verify: VoiceOver pass.

### CRUMBRUN-17 | UX/Touch | S3
- Evidence: Touch targets measured: d-pad 60x60, pause/mute 44x44 (OK, meets 44). But controls are `display:flex` only for `pointer: coarse`, the d-pad occupies 146 px in landscape (of 400), d-pad `touch-action:none` good. The d-pad does not support slide-between-buttons (pointerdown only) and gap 8px; action on desktop tap on canvas also starts game.
- Change: Add `pointermove` handling on the d-pad container to change direction when sliding; in landscape (`@media (orientation: landscape)`) move pause/mute/dpad into side columns beside the canvas so the canvas keeps full height; enlarge pause/mute to 48px and label "M" as a speaker icon with aria-pressed.
- Effort: M. Risk: layout CSS. Verify: Playwright landscape screenshot, canvas h>=85% of viewport.

### CRUMBRUN-18 | Performance/Hot loops | S4
- Evidence: FPS 60.0, p99 16.8 ms (both title and play, 3-6 s samples). Allocation in loops: `render.ts:drawItems` uses `world.items.forEach` closure each frame; `spriteCat.ts:mix()` parses hex strings each draw; `text()` re-sets fonts and strokes per call (~15 strokeText per frame); `Particles.update` pushes new arrays; `audio.noise` allocs buffers.
- Change: Cache parsed colours and mixed colours; pre-render text for static HUD labels to an offscreen canvas and only redraw the score when it changes; iterate `items` with a for loop and keep a list of remaining item indices; pool particles.
- Effort: M. Risk: low. Verify: Chrome performance profile before/after (heap sampling at 60 s), GC count.

### CRUMBRUN-19 | Robustness/Resize | S3
- Evidence: Landscape 860x400 gives 0.33 scale (CRUMBRUN-01); `Renderer.resize` re-creates both static and light canvases each resize event (staticKey reset) which on drag-resize creates a canvas per tick.
- Change: Debounce `fit()` via rAF; reuse offscreen canvases when size unchanged; clamp min scale and show "rotate device" message if canvas would be under 0.75x.
- Effort: S. Verify: resize loop test, no memory growth.

### CRUMBRUN-20 | Code quality/Config | S3
- Evidence: Gameplay constants hardcoded across modules: `step.ts:17-20` (DRENCH_SLOW 0.55, RETURN_FAST 2.2, LEAVE_SLOW 0.8, HIT_R2 0.42), `modes.ts:2-4`, `scoring.ts`, `levels.ts` curve numbers and `BASE_RELEASE`, `flow.ts:21-24` timings, `cats.ts` POUNCE/aggro 5 tiles and 4 s, `audio.ts` volumes, `render.ts` light gradients. Violates "gameplay values from config" rule.
- Change: Create `src/config/tuning.ts` (single frozen `TUNING` object with doc comments) and `src/config/feel.ts` (shake/hit-stop/audio gains); import everywhere; add a test that snapshot-guards defaults.
- Effort: M. Risk: Classic fidelity n/a; determinism preserved if values unchanged. Verify: existing 7 test files pass unchanged.

### CRUMBRUN-21 | Code quality/Size | S4
- Evidence: Largest source files: `flow.ts` 197, `render.ts` 194, `step.ts` 185, `spriteCat.ts` 152 (all <300 OK). Longest functions: `Renderer.draw`, `drawStaticLayer` (117-line file), `stepWorld` ~28 lines; most are under 50. `main.ts:onEvent` mixes particles and audio in one function (also 108-line file wires everything at module top level, untestable).
- Change: Split `onEvent` into `fxForEvent` and `sfxForEvent` with a table keyed by `EventType`; export a `createApp()` from `main.ts`.
- Effort: S. Verify: tsc + tests.

### CRUMBRUN-22 | UX/Game over | S4
- Evidence: Game over (SHOT/desk-gameover.png): score, high, "ENTER / TAP" blinks; ignored for 1 s; no stats of the run (level reached, cats splashed), no "play again vs title" choice; high score only persisted on death/hide; one value only (no top-5).
- Change: Show level reached, splashes, best chain; two buttons (Play again, Title); keep top 5 scores with date in storage (zod array).
- Effort: S-M. Verify: storage tests.

### CRUMBRUN-23 | Gameplay/Controls | S4
- Evidence: Input buffering works (turn buffered until legal; verified 200-key flood leaves state `play`). On touch, swipe needs 24 px (`SWIPE_MIN_PX`) but sampled on pointermove only: OK (measured swipe R/D worked). d-pad L at start gave `N` (blocked, expected).
- Change: Add gamepad support (Gamepad API; D-pad/left stick, A start, Start pause) and arrow hold vs tap options; allow `Space` not to double-trigger when a button has focus (key handler `preventDefault` hijacks Enter on focused buttons: measured `Enter` on focused Pause button started the game instead of activating it, `input.ts:30`).
- Effort: S-M. Verify: Tab to Pause, press Enter -> pauses.

### CRUMBRUN-24 | Graphics/Visual identity | S4
- Evidence: Vignette (alpha .78) darkens corner crumbs and pistols; the outer wall ring is the same brown as walls, wasting ~4% of canvas; static kitchen props absent (only handles); 3 themes differ only in colour.
- Change: Lighten vignette outer alpha to 0.55 with a no-vignette option; fill outer margin with floor-board texture; add 4-6 props (crumbs trail, mug, toaster) as non-collidable decor in the margin.
- Effort: M. Risk: art only. Verify: screenshot compare.

### CRUMBRUN-25 | Robustness/Storage | S4
- Evidence: Corrupt `crumbrun-highscore` `{bad` -> hi 0; `crumbrun-settings` `{"muted":"yes"}` -> default muted false (no crash, good). But a bad parse silently discards (no warn) and a valid-but-bad settings file loses other future keys because of `.strict()`.
- Change: Use `.passthrough()` or per-key safeParse so a single bad key does not reset the others; `console.warn` once on discard.
- Effort: S. Verify: storage test.

## Bugs found

1. **Landscape phone unplayable** (maps to CRUMBRUN-01/17). Repro: open at 860x400 touch viewport during play. Canvas renders 126x157 px with 146 px d-pad row.
2. **Pip invisible on Slate Plank theme (levels 3-4 first lap: mazes 1 theme 2)** Repro: debug clear level 4 times, view level 5 (SHOT/desk-level5.png). Pip `#9ea3ad` on `#8fa5b3` = 1.01:1. (Theme index formula `themeIndex` gives Slate on L5.)
3. **Enter on a focused button triggers game action** (`input.ts` keydown handler preventDefaults Enter/Space even when a `<button>` has focus). Repro: `?dpad=1`, Tab to Pause, press Enter on the title: game starts, button not activated. Keyboard-only users cannot operate the Pause/Mute buttons by Enter on title/summary.
4. **Tap does nothing while paused** (`flow.ts action()` returns early if paused), no on-screen way to resume other than the 44px pause button (touch); on desktop the player must know P/Esc.
5. **Rest phase pause after blur unclear**: window blur pauses; resuming needs P (Enter ignored while paused). Minor: no message that it was an auto-pause.
6. No console errors, uncaught exceptions, or network errors in any scenario (0 messages collected).

## What already works well

- 60.0 fps with p99 frame 16.8 ms, 110 kB JS (35.6 kB gzip), no assets, strict TS, zod storage, fixed 60 Hz sim separated from render, 7 test files.
- Four distinct cat behaviours with readable personalities, clear drench blue state with blink warning, chain scoring, clear summary.
- Reduced-motion and `prefers-color-scheme` handled sensibly (game stays dark; reduced run showed calmer clear flash). Input buffering, swipe + d-pad + keyboard parity, 200-key flood and corrupt-storage cases survived.
- Auto-pause on blur/hidden tab, high score persisted on page hide.

## What I could not check

- Real audio output (headless: read the synth code only; levels and mix are inferred).
- Long-session memory growth beyond ~20 s of play and any 5+ minute play to measure true difficulty curve/session length; balance conclusions are from code maths, not skilled-player telemetry.
- Real device touch latency, iOS safe-area/notch behaviour, Safari/Firefox rendering, high-refresh-rate displays (144 Hz stutter is inferred from the loop).
- Screen-reader behaviour, colour-blind simulation (contrast figures computed by formula only, from `theme.ts`/sprite colour literals, not sampled pixels).
- Cheese, tunnel wrap and per-cat AI behaviour visually in motion (only static captures).
