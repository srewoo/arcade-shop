# arcadeShop polish conventions (Phase 2+, 2026-11-11)

Every game implements these in its own code. There is no shared library: each game stays an independent folder. Each game's review report (`<game>-review-2026-11-11.md`) is the work list. This file decides how the cross-game items behave, so the games feel like one collection.

## 1. Pause (every real-time game; turn-based games only need the auto-pause of timers)
- `P` and `Esc` open a **pause overlay** during play: **Resume** (default focus), **Restart**, **Settings**, **Quit to title**. Esc on the overlay = Resume.
- A single key or tap must never forfeit or end a run. Restart and Quit from pause ask for an in-page confirmation (never `window.confirm`).
- **Auto-pause** on `visibilitychange` (hidden) and `window` `blur` during active play. Clear held inputs on pause. Resume is manual.
- Opening Settings from anywhere pauses the simulation and timers. Closing returns to where you were (paused stays paused).
- Touch: a visible pause button ≥44 px in a corner while playing.
- Any countdown (Dash, Rack Attack, Time Attack, Ultra…) stops while paused, in menus, and before the first player action where the report says so.

## 2. Settings panel (same items and wording where the game has them)
- **Volume**: master slider 0–100 (plus SFX/Music sliders if the game has music). Mute key `M` stays.
- **Reduce motion**: `System` (default, follows `prefers-reduced-motion`) / `On` / `Off`. "On" disables screen shake, flashes, long tweens, parallax and confetti, and cuts particle counts to ≤40%.
- **Colour-blind assist**: on/off. Where colour carries meaning, add a non-colour cue (symbol, pattern, outline or label). Default off unless the review says the default palette fails.
- **Text/HUD size**: 100% / 125% / 150%.
- **Theme**: System / Light / Dark where the game has light UI chrome.
- Persist under the game's existing localStorage key prefix. Validate every field on load (zod or the game's existing validator) and fall back per field. Wrap storage in try/catch.
- Keep existing keys, board ids and debug hooks working (no data loss for current players).

## 3. Accessibility floor
- Touch targets ≥44×44 CSS px (padding counts). Gap between destructive and common buttons ≥8 px.
- Text contrast ≥4.5:1 (≥3:1 for ≥24 px bold). UI and graphics contrast ≥3:1 for anything you must see to play (walls vs floor, piece vs background, ball vs table).
- HUD text ≥12 px at 400 px width (11 px absolute minimum for secondary labels).
- Everything works keyboard-only with a visible focus ring. Dialogs trap focus, Esc closes them, and focus returns to the opener.
- Semantic roles: buttons are `<button>`, live status uses `aria-live="polite"`, and canvases get an `aria-label` plus an off-screen status line for key events (score, game over).
- No information conveyed by colour alone.

## 4. Feel
- Fixed-timestep games render with **interpolation** between the previous and current state (alpha = accumulator/step) so 120/144 Hz screens are smooth. Simulation results must not change.
- Every player action and outcome has visual + audio feedback (press, success, fail, combo, level up, win, lose). Respect Reduce motion and volume.
- Destructive or irreversible actions (reset scores, Solve all, quit run) need confirmation or undo.
- First-run onboarding: a short, dismissible, contextual hint, shown once (flag in localStorage). No walls of text.

## 5. Layout
- Fill the viewport sensibly at 1280×800, 1920×1080, 400×860 portrait and 860×400 landscape phone. The play area should use most of the shorter dimension, and HUD panels move to the side in landscape.
- No horizontal page scroll at 360 px. Respect safe-area insets.
- Canvas uses devicePixelRatio (capped at 2) for crisp rendering.

## 6. Code
- Gameplay tuning numbers live in a config/tuning module (one place), not scattered.
- Files ≤300 lines and functions ≤~50 lines: split modules rather than grow them.
- Pure logic stays DOM-free and gets unit tests for every behaviour you add or change (vitest).
- Debug hooks are exposed only with `?debug=1` or in dev.
- No new runtime dependencies unless a report item truly needs one. Keep the current pins (zod 4.6.7, vite 7.3.7, vitest 4.1.12, typescript 5.6.3; three where already used). `npm audit` must stay at 0.
- User-facing strings for new UI go in a `strings` module per game (no i18n framework).

## 7. Hard constraints (never break)
- **rug (Living Room GP):** `window.__rug.sim()` finish times on the 6 original maps stay bit-identical (sol 31.954166666665174, sol-twist 36.39583333333533, sol-mirror 34.0958333333335, claude 29.11249999999867, claude-bend 31.591666666665194, claude-wild 32.46249999999887). Never touch the seeded RNG call order.
- **dino (Fossil Frenzy):** Classic mode on Normal difficulty with power-ups off plays like the original.
- **crumbrun:** stays clearly original. No Pac-Man names, look, maze layout, ghost rules or sounds.
- **stackfall:** never the word "Tetris"/"tetromino", no guideline colours, no Korobeiniki.
- **sudokudash:** independent solver. No code from the GPL workbook.
- `dino/original`, `dino/beautified`, `rug/original` and `rug/beautified` are reference mirrors: never edit them.
