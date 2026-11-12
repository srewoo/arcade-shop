# Stackfall

An original falling-block puzzle game for the arcadeShop collection, written in TypeScript (strict) and built with Vite. It replaces the old Excel-embedded Flash clone. Visual identity: a glass terrarium with polished-stone blocks, a gradient sky that shifts per level, and glowing shatter particles on line clears. All art and audio are generated in code (Canvas 2D and WebAudio); there are no assets and no network calls.

## Run

    npm install
    npm run dev        # play locally
    npm test           # unit tests (pure game logic, settings validation)
    npm run build      # typecheck + production build into dist/
    npx vite preview --port 4855 --strictPort

Add `?seed=123` to the URL for a fixed shape sequence (the result card has a "Copy seed link" button). `?debug=1` exposes `window.__stackfall` (`state()`, `phase()`, `settings()`, `layout()`, `audio()`, `measureMix()`) for browser tests; without it nothing is exposed.

## Controls

| Action | Keys (all remappable in Settings) |
| --- | --- |
| Move | Left/Right arrows, A/D |
| Soft drop | Down arrow, S |
| Hard drop | Space |
| Rotate clockwise | Up arrow, X, W |
| Rotate counter-clockwise | Z |
| Stash | C, Shift |
| Pause | P, Esc (Esc on the Pause card resumes) |
| Mute | M |

Touch: swipe left/right to shift, swipe down (and hold) to soft drop, tap to rotate, swipe up to hard drop. An optional on-screen button bar is in Settings. Gamepad: D-pad or left stick moves, A/B rotate, D-pad up hard drop, bumpers stash, Start pauses.

## Modes

- **Marathon:** levels 1 to 15 (a level every 10 lines); the run is won at 150 lines.
- **Sprint:** clear 40 lines; best time is recorded.
- **Ultra:** 2 minutes, highest score.
- **Zen:** no game over (a full well resets itself). Optional rising garbage toggle on the title screen.
- **Dig:** 10 pre-filled garbage rows; clear every garbage block, best time recorded.

Rules: 7-bag randomiser, 5-shape next queue, Stash (hold, once per drop), ghost shape, lock delay of 30 frames with at most 15 move/rotate resets, own wall/floor kick table, Twist detection for the spur shape (3-corner rule, with Mini Twist), combo and back-to-back bonuses, all-clear bonus. DAS and ARR are configurable in Settings (ms).

Pause: P/Esc or the Pause button opens the Pause card (Resume, Restart, Settings, Quit to menu; Restart and Quit ask for confirmation). The run also pauses automatically when the tab is hidden or the window loses focus, and while Settings is open; resuming is always manual.

Settings (all persisted, each field validated with zod and defaulted on its own): master, effects and music volume, mute, reduce motion (System / On / Off), screen shake, flashes, particles (Off / Low / Full), colour-blind assist (alternate palette plus outlines on every stone), text size (100 / 125 / 150%), ghost, touch buttons, vibration, handling (DAS, ARR, swipe distance, start level) and the difficulty preset (`Classic` keeps the original gravity and score ladder; `Tuned` starts faster, ramps steeper and uses Stackfall's own score ladder). Keys can be replaced or extended per action; a key that would leave another action unbound swaps instead.

Best scores/times are stored in localStorage (`stackfall-settings`, `stackfall-records`, `stackfall-seen-help`). Zen keeps no records; quitting a run never records. Reduced motion (system setting or override) turns off shake, tweens and flashes (rows get an outline pulse instead) and cuts particles to 40%.

## Code map

| File | Role |
| --- | --- |
| `src/config/` | One place for tuning (gravity, lock, scoring presets, touch), feel (shake, particles, timings), audio mix and SFX table, layout constants |
| `src/core/rng.ts`, `bag.ts` | Seeded PRNG; 7-bag |
| `src/core/shapes.ts`, `kicks.ts` | Shapes and rotation states; wall/floor kicks |
| `src/core/board.ts` | Board, collision, line clear, garbage |
| `src/core/twist.ts`, `scoring.ts` | Twist detection; scoring, combo, back-to-back |
| `src/core/das.ts`, `modes.ts` | DAS/ARR timer; mode rules, levels |
| `src/core/state.ts`, `spawn.ts`, `end.ts`, `actions.ts`, `lock.ts`, `step.ts` | State and events; spawning; run end and top-out; piece actions; locking; one 60 Hz tick |
| `src/session.ts` | Run state machine (title / playing / paused / ended), fixed-step loop, interpolation snapshot (DOM-free) |
| `src/records.ts` | Result info, record rules, pace, live best |
| `src/settings/` | zod schemas, safe key rebinding, localStorage |
| `src/strings.ts` | User-facing strings for the UI |
| `src/input/` | Keyboard and gamepad (`controls.ts`), touch gestures (`touch.ts`), on-screen pad (`pad.ts`) |
| `src/audio/` | Mixer buses, synthesised SFX, event-to-sound map, ambient loop, offline mix meter (debug) |
| `src/ui/renderer.ts` and `boardView.ts`, `panels.ts`, `layout.ts`, `anim.ts`, `effects.ts`, `background.ts`, `stones.ts`, `palette.ts`, `interp.ts`, `motion.ts`, `view.ts` | Canvas drawing: cached static layers, interpolation, dissolve and stash tweens, motion profile |
| `src/ui/cards.ts`, `screens.ts`, `hud.ts`, `cues.ts`, `announce.ts`, `settings/` | Overlay cards, focus and inert handling, HUD and live status line, settings dialog |
| `src/flow.ts`, `src/app.ts`, `src/main.ts` | Overlay flow (title, pause, result), wiring and render loop |

The simulation (`src/core`) has no DOM access and is deterministic: the same seed and the same per-tick inputs produce the same board (covered by `tests/replay.test.ts`).
