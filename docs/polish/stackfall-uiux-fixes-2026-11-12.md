# Stackfall UI/UX fixes (2026-11-12)

Status per audit issue (section 4). Tests: 132 pass (16 existing files + glyph.test.ts, layout.test.ts). `npm run build` passes; `npm audit` 0 vulnerabilities. Built to dist/games/stackfall. Playwright runs at 1280x800 DPR2, 400x860 touch, 860x400 touch: no console errors, no horizontal scroll.

| # | Issue | Status | What changed |
|---|---|---|---|
| 1 | High: default glyphs 1.5-2.1:1 | Fixed | Glyph is now near-black ink (#12141c) with a white halo on every stone. Ink vs stone body is >= 4:1 on all 8 default and 7 assist stones; halo vs shaded corner >= 3:1 (tests/glyph.test.ts). |
| 2 | High: assist off and below the fold | Fixed | Colour-blind assist now defaults to on for new players. An explicit saved value (true or false) is kept; invalid values fall back to the new default. Settings opens on "Display and accessibility" with assist as its first row; Audio is collapsed below it. |
| 3 | Medium: well small in canvas | Partially | Measured: well was already about 94% of canvas height (desktop 37.8px cells, 755 of 782px; the audit's 295x590 figure did not match). Trimmed top/bottom gap and pebble bed: landscape phone cell 18 -> 18.5px, desktop 37 -> 37.8px. Stash/Next minis enlarged (miniFactor 0.62 -> 0.74) to use spare width. Height is the hard limit, so the well cannot grow much more without overlaying HUD. |
| 4 | Medium: two clicks on first run | Fixed | The how-to is a collapsed "How to play" disclosure under the buttons, no "Got it". Play is the initial focus: one click starts. |
| 5 | Medium: settings dialog style | Fixed | Booleans and 2-3 option choices are segmented pill groups (aria-pressed, 44px). Long lists keep a select. Section jump bar not added: only Display is open by default and sections are collapsible. |
| 6 | Medium: key legend clutter | Fixed | Legend is a collapsed "Controls" disclosure; it still hides after the first run (existing behaviour). |
| 7 | Low-Med: faint ghost | Fixed | Ghost is a 2px white outline plus a faint tinted fill. |
| 8 | Low: Pause/Sound/Settings pills | Fixed | Pause, speaker and standard cog icons; labels hidden at <=520px (aria-labels kept); kbd chips hidden on short landscape. |
| 9 | Low: game over card | Partially | Result is now score hero, delta, Play again/Menu, then collapsible "Run details" (open on a win), then Copy seed. Existing grace lock and the copy confirmation text (seed-out live region) kept. Copy seed is still last-weight. |

Collection-wide: hints stay non-blocking (coach has pointer-events none); settings icon is a cog; results payoff then tiered card done.

Files changed (all in games-src/stackfall): index.html, src/style.css, src/strings.ts, src/flow.ts, src/config/layout.ts, src/settings/schema.ts, src/ui/{palette,stones,boardView,apply,cards}.ts, src/ui/settings/{controls,sections,dialog}.ts. Added tests/glyph.test.ts, tests/layout.test.ts. localStorage keys and debug hooks unchanged.

Not done: a screenshot of an actual line-clear moment is not guaranteed (4clear shots are mid-play); `prefers-contrast` is not handled separately.

Before -> after: glyph contrast 1.5-2.1:1 -> >= 4:1; assist default off, below fold -> on, first row; clicks to play on first run 2 -> 1.

Screenshots (pw/shots/): fix-stackfall-{desk,phone,land}-{1title,2firstrun,3play,4clear,5settings,6over}.png and thumb-stackfall.png (480x300).
