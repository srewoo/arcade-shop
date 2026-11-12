# Stackfall verification, round 1 (2026-11-11)

Verdict: **PASS**. Build, tests, audit and the hard constraint are clean. There are no S1/S2 regressions and no console errors. Every S1/S2 item is genuinely done.

## Commands (exact results)
- `npm run build`: tsc and vite OK, 164 modules, `dist/assets/index-*.js` 164.28 kB. Only a rollup annotation notice from `node_modules/zod`.
- `npx vitest run`: 14 files, **120 tests passed**. This matches the log (57 to 120, 9 to 14 files). `tests/replay.test.ts` is byte-identical to the backup.
- `npm audit`: found 0 vulnerabilities.
- Hard constraint: a case-insensitive grep over the whole folder (excluding node_modules and dist) for the two banned trademark words and for the famous tune name found nothing. A grep for the guideline hex values found nothing. The assist and default palettes differ from the guideline mapping. The built page text has no banned words. `window.__stackfall` is absent without `?debug`.
- `diff -rq` against the backup matches the log: `core/end.ts`, `core/spawn.ts`, `config/*`, `session.ts`, `flow.ts`, `ui/*` and `settings/` are new; `settings.ts`, `ui/menus.ts` and `ui/settingsDialog.ts` are removed. The largest file is 181 lines. A TypeScript AST scan found 0 functions over 50 lines and 0 files over 300 lines. `app.ts` has 177 lines, as logged. The localStorage keys are unchanged (`stackfall-settings`, `stackfall-records`).

## Browser (isolated Playwright 1.48.2, preview on :4887)
Contexts: desktop 1280x800, phone 400x860 with touch, 860x400 with touch, 360x640, 320x568, 240x240, reduced motion, dark, forced-colors. Screenshots: `polish-shots/verify1-stackfall-*.png`. Console errors and warnings across all runs: **0**.

### S1/S2 items
| ID | Result | Evidence |
| --- | --- | --- |
| 01 stash top-out freeze | PASS | Blocked stash set `status=over`. The card with Play again appeared 786 ms later. A safety `end` event is emitted. |
| 02 stray Space on result card | PASS | Space pressed every 60 ms for 40 presses. The phase stayed `ended`. Buttons were `disabled` while mashing and enabled afterwards, with focus on `btn-again`. Enter then restarted once. |
| 03 Settings pause / Esc | PASS | Ticks stayed flat (24 to 24, 38 to 38) with the dialog open, from both the pause card and the chip. Esc closes the dialog and shows the Pause card. A second Esc resumes. P is ignored inside the dialog. |
| 04 wide margins | PASS | At 1280x800 the canvas is 1022x782 and the cell is 37.1 px (was 29.6). The well fills the stage height. The log honestly notes the 30% width target is unreachable at 16:10. |
| 05 phone landscape | PASS | At 860x400 the stage is 553x389 and the cell is 18 px. The pad buttons are 56x56 on both sides. The HUD is a side column. Chips are 152x44. No horizontal scroll. |
| 07 onboarding | PASS | The help strip shows on first run. The flag `stackfall-seen-help=1` is set on dismissal. On touch, the coach reads "Swipe to move. Tap to rotate. Swipe up to drop." |

### S3/S4 sample (12 checked, all PASS)
06 small phones (320, 360 and 240: no horizontal scroll, heading visible), 08 touch targets, 09 and 25 audio (0 live ambient nodes on the title after 5 start/quit cycles, ambient not running while paused, mute persists), 14 text size (150% persists, 24 px root, no overflow at 360), 15 settings dialog, 16 rebinding (Z swapped with Rotate CCW, Esc cancels capture), 17 keyboard flow (arrows plus Enter start Ultra), 18 reduced motion, 21 records (a quit run records nothing, Zen has no Best and no records, a Sprint win records and a slower run shows "2.2 slower"), 22 result card (delta, pace, seed link), 24 size limits, 13 colour assist (screenshot, distinct glyphs, palette differs from the guideline), 02/10 danger line and X on game over visible.

### Conventions
- Pause: P and Esc work, with Resume as the default focus. Restart and Quit show an in-page confirmation with "Keep playing" as the default focus, and Esc backs out. A single key never forfeits.
- Auto-pause: blur and visibility-hidden pause the run with a held key cleared. Resume is manual.
- Pause button: 70x44 in the header chips.
- Countdowns: the Ultra clock is frozen while paused (1:59.5 to 1:59.5) and while Settings is open.
- Settings: corrupt or hostile localStorage (garbage JSON, wrong types, `__proto__`, `null`, an array, invalid records) all fall back per field with 0 errors. A valid `sfxVolume` is kept next to invalid fields. Master volume, reduced motion, text size, colour assist and start level persist across reload.
- Touch targets under 44 px: none, apart from bare checkbox inputs (28 px) that sit inside 44+ px label rows.
- Contrast: 0 failures from computed colours in the title, play and pause screens, both desktop and phone.
- HUD text: 12 px or more, except one `kbd` "Z" in the first-run hint at 10.9 px (just under the 11 px absolute minimum; S4 nit).
- Reduced motion: system `reduce` gives `{shake:false, flash:'outline', particleScale:0.4, tweens:false}`. Without it the profile is full. No animations run under reduce.
- Keyboard: a 3 px visible focus ring everywhere. Tab stays inside the card and the dialog, with one pass through the browser chrome. The page behind is inert.
- Layout: no horizontal scroll at 400, 360, 320 or 240. Resizing and rotating mid-play (7 rapid resizes, portrait to landscape) kept the run alive with correct canvas sizes.
- Touch: swipe left and right, tap-rotate and swipe-up hard-drop all work by CDP touch. Pad taps latch (3 to 2 to 4).

### Try-to-break results
Rapid input (300 random keys), 20 P presses in a row, triple-click on Play again (one game only), 60 mixed keys on the result card, P and Esc during the 900 ms end delay (ignored, card still shown), blur on the result card (no state change) and M on every screen all survived with no errors.

## Findings (all minor, none S1/S2)
1. S4: the top-bar Settings chip is clickable during the 900 ms end delay. The result card then appears behind the dialog, and after closing the dialog focus is not on the card (`activeElement` is empty). Repro: top out, click Settings within 0.9 s, press Esc.
2. S4 nit: one `kbd` in the first-run hint renders at 10.9 px.
3. The log's partial items (19 tuned difficulty, 20 first-play long task, 26 scoring ladder preset, 27 touch niceties) are described accurately. None are S1/S2. Classic stays the default, by design.

## False claims
None found. The sampled log claims reproduced (flat ticks, 786 ms card, 44 px chips, pad 49x48, 120 tests, 0 audit).

## Items
27 report items: 23 done, 4 partial (honest), 0 declined. One conventions item (Theme) is declined with a valid reason: the game has no light chrome.

Cleanup: preview server on 4887 stopped, `dist/` deleted, `.npmrc` kept.
