# Crumb Run - polish changes, 2026-11-11

Work list: `crumbrun-review-2026-11-11.md`. Rules: `CONVENTIONS.md`. All paths below are under `/Users/sharajrewoo/DemoReposQA/arcadeShop/crumbrun/` unless noted.

**Result: 25 report items - 19 done, 6 partial, 0 declined (two sub-parts declined, listed below).**

Final gates: `tsc --noEmit` clean, `npx vitest run` 14 files / 163 tests passed (was 6 files / 75), `npm run build` ok (162.0 kB JS, 51.5 kB gzip; was 110 kB / 35.6 kB, the growth is the dialogs, settings, audio and UI code), `npm audit` 0 vulnerabilities, 0 console errors in every headless scenario, 60.0 fps with p99 frame 16.8 ms and 0 long tasks over 5 s of play. `dist/` deleted and preview server on 4872 stopped. `.npmrc` kept.

Verification columns use: **U** = vitest unit test, **B** = isolated headless Chromium (Playwright 1.48.2) at 1280x800, 400x860 touch dpr2, 860x400 touch dpr2, 360x640, with `?debug=1` hooks used only to skip levels, force deaths and read state. Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/after-crumbrun-*.png`.

## Report items

| ID | Status | What changed (files) | Verified |
| --- | --- | --- | --- |
| CRUMBRUN-01 canvas fills viewport | done | `layout.ts` `fitScale` now fractional (floor to 4 decimals), DPR capped at 2, scale capped at 4; `render.ts` `resize` | U `ui.test.ts`, `layout.test.ts`. B: 1280x800 canvas 378x472 -> **568x733** (99.9% of the 734 px stage, 2.3x the area); 400x860 378 wide -> **399.5x522.5** (full width; aspect ratio is the limit); 360x640 -> 353x461; 860x400 landscape 126x157 -> **306x399.5** (99.9% of height, 6.2x the area) |
| CRUMBRUN-02 theme luminance | done | `theme.ts` (new floor/wall palettes, high-contrast theme, `ACTOR_COLORS`), `contrast.ts`, `spriteOutline.ts` (dark line + light rim), `spritePip.ts`, `spriteCat.ts`, `spriteItems.ts` (crumb `#fff0c0`), `drawStatic.ts` | U `theme.test.ts` (wall top/face vs both floors >= 3:1, floorA:floorB <= 1.1:1, floor luminance <= 0.15, Pip/rim/crumb/halo vs floors >= 3:1, all 4 themes). B: screenshots of all three themes, Pip clearly visible on Slate at level 5. Numbers below |
| CRUMBRUN-03 gentler opening | done | `config/tuning.ts`, `levels.ts` (release 2/6/10/15 s, cat speed 4.4+0.2/level capped 5.6, Smudge corner grace 4 s fading by level 4, pounce 1.3x on levels 1-3), `step.ts`, `renderItems.ts` (pulsing ring on nearest pistol during level-1 READY) | U `tuning.test.ts` (Pip faster than every cat at levels 1-60), `balance.test.ts`, `rules.test.ts`. Idle player caught 3.0 s -> **8.8 s** after READY (browser), median 3.5 s -> 9.2 s over 20 seeds (unit). Demo bot with 0-4.5 s reaction delay, median time to first death 9.1 s -> **29.6 s** (target >= 25 s) |
| CRUMBRUN-04 first-run how-to | done | `ui/views.ts` `howToView`, `ui/controller.ts` (shown on first Enter/tap, dismiss on any key/tap, `seen` flag), `storage.ts` (`seen` field, old saves still parse), `ui/dialog.ts` (400 ms guard so the opening tap's click cannot dismiss it) | U `storage.test.ts` migration. B: card shows on first Enter and on touch tap, dismiss starts the run, `seen:true` persisted, not shown again after reload; also reachable from Settings |
| CRUMBRUN-05 originality | partial | (a) chain 100/250/600/1500, extra lives at 7,500 and 25,000 (`config/tuning.ts`, `scoring.ts`); (b) cats no longer reverse on phase change or pistol pickup (`step.ts`); (d) rest phase replaced by grooming: active cats stop at the next tile centre for 3 s and are harmless to touch (`step.ts`, `world.ts` `isGrooming`, `modes.ts`, sprite zzz). **Declined (c)**: the closing cupboard door needs a new maze, a passability change mid-run and distance-cache invalidation, plus the designer sign-off the report asks for | U `rules.test.ts`, `pounce.test.ts` (grooming, no reversal). B: grooming screenshot (cats sitting, zzz, "GROOMING" HUD tint). See hard-constraint check |
| CRUMBRUN-06 text size | done | `textStyle.ts` (12 logical px floor, 100/125/150% scale, word wrap), `hud.ts`, `overlays.ts` (wrapped, panels sized from content; two-line controls block; 7 px pistol line dropped for the how-to card), settings `textSize` | U `ui.test.ts` (never below 12 logical px, scales, >= 12 css px at 400 wide). B: smallest text 7 px logical (7.4 css at 400 wide) -> **12 logical = 12.7 css px at 400 wide**; 150% title and HUD screenshots checked, no clipping |
| CRUMBRUN-07 pause menu | done | `flow.ts` (`paused`/`frozen`/`autoPaused`, `restart`, `quitToTitle`, held input cleared), `ui/controller.ts`, `ui/views.ts` (Resume default focus, Settings, Restart, Quit; in-page confirm for destructive ones), `ui/dialog.ts` (focus trap, focus returns to opener), `input.ts` | U `flow.test.ts` (pause, auto-pause, timers stop, frozen, restart/quit). B: Esc/P toggle, Tab stays inside, Esc from settings returns to pause, restart confirm and cancel, backdrop tap resumes (mouse and touch), pause button on touch |
| CRUMBRUN-08 audio coverage | done | `audio.ts` new sounds (release, drenchTick, drenchEnd, phase, cheeseAppear, pounce, gameOver, ui) plus a quiet bass pulse that speeds up as crumbs run out; `sfxMap.ts` maps every `EventType`; `main.ts` (game-over jingle, pause/menu ui blips); master volume in settings. Not done: tunnel-wrap and low-lives cues (listed as "possible" in the report) | U `ui.test.ts` (every event has a sound and a visual decision, every named sound exists). Audio not listened to (headless); peaks measured offline |
| CRUMBRUN-09 mix | done | `audio.ts` DynamicsCompressor, gain table in `config/feel.ts`, noise buffers rendered once per duration, meow now trails the splash by 120 ms | B via `__crumb.audioPeaks()` (OfflineAudioContext, real graph): worst peak **-10.9 dBFS** (target <= -3), quietest -24.8 (squeak), splash -21.2, jingle -10.9; squeak-to-jingle spread 14 dB (was about 20 dB by gain values) |
| CRUMBRUN-10 juice and smoothness | partial | Render interpolation (`movement.ts` `lerpMover`, `step.ts` snapshot, `render*.ts` alpha, no lerp across the tunnel wrap or respawn); 80 ms death / 60 ms splash hit-stop and 150 ms 2 px shake (`flow.ts`, shake off under Reduce motion); popups scale-pop. **Not done**: crumb-eaten flicker | U `interp.test.ts` (lerp, wrap guard, simulation unchanged), `flow.test.ts` hit-stop. Not checked on a real 120/144 Hz display (headless is 60 Hz) |
| CRUMBRUN-11 colour-blind and high contrast | done | Settings "Colour-blind assist" (letter badge S/B/T/G, wavy ring on drenched cats) and "High contrast" (flat floor, white counters, bold outlines, no vignette); always-on droplet icon on drenched cats and white halo on pistols; Reduce motion makes the blink steady | U `theme.test.ts`. B: screenshots with assist + high contrast at 150% |
| CRUMBRUN-12 settings panel | done | `ui/settingsView.ts` (Volume, Reduce motion System/On/Off, Colour-blind assist, Text size, High contrast, Show d-pad, Left-handed d-pad, How to play), `storage.ts`, `prefs.ts`, `main.ts` `applySettings`, `O` key and a settings button in the tool bar | U `storage.test.ts`, `prefs.test.ts`. B: change settings, reload, values and UI state restored; Reduce motion On, 150% text, volume 40, assist and high contrast all persisted |
| CRUMBRUN-13 pacing and replay | partial | `levels.ts` modifiers from level 7 (faster cats 1.05x, dark kitchen, cats escape sooner), drench floor 2 s -> 3 s, best chain tracked and shown on summary and game over, best-level stat in `crumbrun-stats`. **Not done**: "two Smudges" (needs a fifth cat) and an accuracy stat (best chain used instead) | U `tuning.test.ts`, `storage.test.ts`. Dark kitchen not screenshotted |
| CRUMBRUN-14 pounce fairness | done | `cats.ts` `stepPounce` state machine: 0.35 s wind-up (frozen, ears flat, wide eyes, "!" mark, rising-saw sound), dash max 3 s, 4 s cooldown, 1.3x on levels 1-3; `step.ts`, `spriteCat*.ts` | U `pounce.test.ts` (wind-up, cancel, 3 s cap, cooldown, frozen in the live world) |
| CRUMBRUN-15 HUD feedback | done | `renderItems.ts` cheese countdown ring (turns pink when low), `hud.ts` cool HUD tint and "GROOMING" label during rest, 140x10 drench meter under LEVEL, "1UP" popup (`fx.ts`) | B: drench, grooming and 1UP screenshots |
| CRUMBRUN-16 screen reader | done | `index.html` canvas `role="application"` with instructions, `#live` polite region, `ui/announcer.ts` (rate limited, urgent bypass), `main.ts` announces level start, rest/chase, drench, pounce, extra life, caught, level clear, game over | U `ui.test.ts` (rate limit, urgent, re-announce). Not tested with VoiceOver |
| CRUMBRUN-17 touch and landscape | done | `style.css` landscape grid (d-pad left, tools right, `display: contents`), 48 px tool buttons with SVG icons and `aria-pressed` mute, d-pad slide-to-steer (`input.ts`), left-handed option | B: landscape 860x400 canvas 399.5 of 400 px high; d-pad slide D to U without lifting; all buttons >= 44 px (tools 48, d-pad 60, dialog 44+); left-handed layout swaps |
| CRUMBRUN-18 hot loops | partial | Cached colour mixes, for-loop item drawing, in-place particle compaction, noise buffers cached, canvases reused on resize. **Not done**: pre-rendered HUD labels and full particle pooling | B: 60.0 fps, p99 16.8 ms, 0 long tasks (unchanged, was already 60). No heap profile taken |
| CRUMBRUN-19 resize robustness | done | `main.ts` rAF-debounced `fit`, `render.ts` no-op on unchanged size, `renderLayers.ts` reuses its two canvases, "small screen" hint below 0.75 css scale | U `ui.test.ts`. B: 60-step resize loop ends at a correct size, no errors |
| CRUMBRUN-20 tuning config | done | `config/tuning.ts` (frozen `TUNING`), `config/feel.ts` (`FEEL`), consumed by `levels`, `scoring`, `modes`, `step`, `cats`, `flow`, `audio`, `renderLayers` | U `tuning.test.ts` inline snapshot of every default |
| CRUMBRUN-21 file size and wiring | done | `main.ts` `createApp()`, `fx.ts` and `sfxMap.ts` tables keyed by every event, `renderActors/Items/Layers.ts`, `runStats.ts`, `debugAudio.ts`; largest file `flow.ts` 296 lines, no function over 50 lines | tsc, 163 tests |
| CRUMBRUN-22 game over | done (guard fixed in follow-up) | `ui/views.ts` `gameOverView` (score, level, splashes, best chain, best level, top 5, Play again / Title, buttons inert for 0.7 s since the follow-up fix; the first version of the guard was dead code), `storage.ts` top-5 zod array with dates | U `storage.test.ts`. B: game over shows a new high score and the top-5 row, Play again and Title work |
| CRUMBRUN-23 controls | partial | Gamepad (`gamepad.ts`: d-pad/stick steer, A start, Start pause); `input.ts` no longer hijacks Enter/Space on a focused button. **Not done**: "arrow hold vs tap" options (not specified) | U `ui.test.ts` (gamepad intent, `isInteractive`). B: Tab to Pause, Enter pauses; Tab to Settings on title, Enter opens settings instead of starting the game |
| CRUMBRUN-24 visual identity | partial | Vignette outer alpha 0.78 -> 0.55 (none in high contrast), outer counter ring now light with a dark edge, four non-collidable props (mug, toaster, loaf, salt) in `drawProps.ts`. **Not done**: a floor-board texture for the margin (there is no separate margin; the ring is counter) | B: screenshots of all themes |
| CRUMBRUN-25 storage robustness | done | `storage.ts` per-field `safeParse`, one `console.warn` per discarded key, unknown keys ignored | U `storage.test.ts` (one bad key keeps the rest, warns once, legacy `{muted}` migrates) |

## Contrast before and after (WCAG, computed from the palette literals)

| Pair | Before | After |
| --- | --- | --- |
| Checker: floorA vs wallTop / floorB vs wallTop | 2.51 / 1.63 | **4.85** / 4.85 (face 3.33) |
| Terracotta: floorA vs wallTop / vs wallFace | 1.03 / 1.72 | **5.73** / 4.04 |
| Slate: floorA vs wallFace | 1.38 | **4.87** (top 6.46) |
| floorA vs floorB (checker noise) | 1.17-1.54 | **1.08-1.10** |
| Pip body vs floor, Slate / Checker | 1.01 / 1.54 | **5.47** / 5.71 (plus light rim 6.6-6.9) |
| Biscuit cat body vs Checker floor | 1.22 | **6.0** (crumb now `#fff0c0`: 7.10 vs the same floor) |
| Cats | unprotected (Smudge/Tuxedo dark, Ginger vs Terracotta 1.47) | dark line + light rim on every actor; rim vs floor 5.6-7.4. Dark cat bodies still rely on the rim, not their fill |

## Conventions items

| Item | Status | Notes |
| --- | --- | --- |
| Pause overlay, restart/quit confirmation, auto-pause (blur and hidden tab), held input cleared, resume manual, settings pauses | done | Pause button 48 px on touch tool bar. U `flow.test.ts`; B blur and visibilitychange both paused with the "lost focus" note |
| Settings: volume, reduce motion (System/On/Off), colour-blind assist, text size, persisted per field | done | Theme System/Light/Dark not added: the game has no light UI chrome |
| Reduce motion | done | No shake, no clear flash (steady tint), no strobing drench/cheese blinks, no popup pop, no spin, particles at 40%. B: `emulateMedia` reduced motion honoured by System |
| Dark scheme | done | The game is dark-only by design (`color-scheme: dark`); B under `colorScheme: 'dark'` identical, no errors |
| Accessibility floor | done | Targets >= 44 px (the "On" segmented button was 43.6 px, fixed with `min-width`), focus rings, dialogs trap focus / Esc closes / focus returns (B: `btn-settings` regained focus), `<button>` semantics, `role="switch"`, live region, 360 px no horizontal scroll (B) |
| Interpolation | done | See item 10 |
| Onboarding | done | See item 04 |
| Layout | done | 1280x800, 400x860, 860x400, 360x640 checked; safe-area padding kept; DPR capped at 2 |
| Tuning config, strings module, debug gating | done | `config/*`, `strings.ts`; `window.__crumb` only with `?debug=1` or dev (B: undefined without the flag). Added debug `audioPeaks`, `advance`, `grant` |
| Extra hardening | done | Production CSP meta (`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:`) and no-referrer, injected at build by `vite.config.ts`; B: no CSP violations |

## Bugs from the report

1. Landscape phone unplayable: fixed (item 01 and 17).
2. Pip invisible on Slate: fixed (item 02).
3. Enter on a focused button started the game: fixed (item 23).
4. Tap while paused did nothing: fixed, backdrop tap resumes (item 07).
5. Auto-pause unclear: the pause menu now says "Paused because the window lost focus." (item 07).

## Extra bugs found and fixed

- A tap that opened the how-to card was dismissing it at once (synthesized click landed on the new dialog): 400 ms guard in `ui/dialog.ts`. Found in headless touch testing.
- Reduce motion left two strobing blinks (drench meter/cat fur, cheese expiry): now steady.
- Tools were pinned to the screen edge in landscape (specificity clash with the d-pad rule): fixed.
- HUD rows overlapped at 150% text: rows are now positioned from the scaled font sizes.
- Per-run totals were double counted once a level was banked early: `RunTracker` banks on leaving the level (`runStats.ts`, tested).

## Hard-constraint check (stays clearly original)

Passed. `grep -iE "pac-?man|blinky|pinky|inky|clyde|waka|ghost|pellet|namco|scatter"` over `src`, `README.md` and `index.html` returns nothing. Names (Pip, Smudge, Biscuit, Tuxedo, Ginger, water pistols, basket), mazes, art and synthesised sounds are unchanged originals. Mechanics moved further away from the reference: different chain curve (100/250/600/1500), extra lives at 7,500 and 25,000, no reversal on phase change or power-up, a grooming rest instead of a scatter retreat, Tuxedo wind-up and cooldown, level 7+ modifiers. Remaining structural similarity (basket door with timed release, side tunnel, four drench pickups, symmetrical 21x23 mazes) is the part of CRUMBRUN-05 not done; the report asks for designer sign-off on the asymmetric maze.

## Known remaining issues

- CRUMBRUN-05(c): no asymmetric maze or closing cupboard door; all three mazes are still symmetrical.
- Pip standing on a grooming cat when the rest ends is caught on the next tick (no overlap grace).
- Dark-kitchen modifier, pounce wind-up art, assist letters and the audio were checked by unit tests or measurement only, not played for feel; real-device touch latency, iOS notch, Safari/Firefox, 120/144 Hz smoothness and screen-reader output were not tested.
- Balance numbers (release 2/6/10/15 s, speed curve, 3 s grooming, 100/250/600/1500 chain) are from tuning maths and a scripted bot, not skilled-player telemetry; all live in `src/config/tuning.ts`.
- The d-pad shows on coarse pointers whatever the "Show d-pad" setting says; the setting only adds it on desktop.
- Crumb-eaten flicker, full particle pooling, pre-rendered HUD labels and the board-margin floor texture were skipped (items 10, 18, 24).
- Bundle grew from 110 kB to 162 kB JS (51.5 kB gzip).

## Follow-up fixes 2026-11-11

Verifier round 1 found a false claim and one cosmetic layout issue; both are addressed here.

- **CRUMBRUN-22 status corrected.** The earlier "buttons inert for 0.7 s" was not true: `gameOverView` set `b.onclick` while `btn()` had already registered the action with `addEventListener`, so the `aria-disabled` check never ran and a press ~150 ms after the dialog started a new run. Now `btn()` registers a single click handler wrapped in `whenEnabled(() => aria-disabled === 'true', action)` (`ui/dom.ts`, `ui/views.ts`); the second registration is removed. Unit test: `tests/ui.test.ts` "whenEnabled". The test covers the helper only (no DOM environment in vitest here); the wiring was verified in a real browser.
- **Browser check (headless Playwright, preview on 4902):** die with 0 lives, press Enter 150 ms after the Game over dialog: dialog stays, phase stays `gameover`. After 0.9 s `aria-disabled` is gone and Enter on the focused Play again starts a new run. No console errors.
- **Narrow screens.** Could not reproduce a horizontal scroll at 320x568 (title, settings, how-to, play, pause, game over; mouse and touch): scrollWidth equals the viewport. The overflow below 300 px was real (200x300 touch: scrollWidth 272 from the d-pad row; 200x300 mouse: settings segmented buttons and game-over buttons). Fixed in `style.css`: `.controls` wraps, d-pad cells are `minmax(44px, 60px)` (still 60 px whenever there is room, 51 px at 200 px wide, never below 44), `.seg` wraps, game-over buttons use `auto-fit`. Verified scrollWidth equals viewport width in every state at 320x568, 200x300, 360x640 (touch and mouse).
- Gates: `npx tsc --noEmit`, `npx vitest run` (164 tests), `npm run build`, `npm audit` (0 vulnerabilities).
