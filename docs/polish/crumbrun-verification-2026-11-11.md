# Crumb Run - adversarial verification, round 1 (2026-11-11)

Verdict: **PASS** (with one S3 regression and one false log claim, listed below, for the implementer to fix).

## Gates
| Gate | Result |
| --- | --- |
| `npm run build` (tsc + vite) | OK. 162.01 kB JS, 51.46 kB gzip. Rollup prints zod "annotation" warnings (dependency comments only). |
| `npx vitest run` | 14 files, 163 tests passed. |
| `npm audit` | 0 vulnerabilities. |
| Hard constraint (original) | OK. grep for pac-man/blinky/pinky/inky/clyde/waka/ghost/pellet/namco/scatter over src, tests, README, index.html: no hits. `mazes.ts` is byte-identical to the backup (mazes are the original author's; symmetrical 21x23 with centre box and side tunnel remains, as the log admits). Names and synthesised sounds original. Mechanics moved further away (chain 100/250/600/1500, lives 7,500/25,000, no reversal, grooming rest). |
| Console errors | None across ~12 scenarios. Only `console.warn` "ignored invalid saved ..." when storage was deliberately corrupted (intended). |
| Cleanup | Preview on 4882 stopped, dist/ deleted, .npmrc kept. No game source edited. |

Diff vs backup matches the log: new `config/`, `ui/`, `fx.ts`, `sfxMap.ts`, `gamepad.ts`, `prefs.ts`, `runStats.ts`, render split, `vite.config.ts` (CSP), 8 new test files. Largest file `flow.ts` 296 lines.

## Defects found
1. **S3 regression + false claim (item 22 / log "buttons inert for 0.7 s").** `src/ui/views.ts` `gameOverView`: `guard()` assigns `b.onclick`, but `btn()` already registered the action through `addEventListener('click')` (`h(... on: {click})`). The 0.7 s guard is therefore dead code. Repro (real keyboard, Playwright): die with 0 lives, wait for the Game over dialog, press Enter 150 ms later: phase goes to `ready` (new run) immediately, the game-over screen and top-5 are skipped. Same with an in-page `button.click()` within 2 ms. The pre-polish game ignored input for 1 s on game over, so a frantic last key press now skips the result screen. Fix: make `btn` click handler check `aria-disabled`, or drop the second registration.
2. Cosmetic: log says desktop canvas 568x733; measured 561x733 (still 99.9% of stage height). Log idle-death 8.8 s; measured 9.1 s. Not material.
3. Below the 360 px floor (200x300) the page scrolls horizontally (scrollWidth 272). Conventions only require 360; at 360 there is no horizontal scroll.

## S1/S2 items
| Item | Result |
| --- | --- |
| 01 canvas fills viewport (S2) | PASS. 1280x800: 561x733 of 734 stage; 400x860: 399.5x522.5; 860x400 landscape: 306x399.5 of 400; 360x640: 353.5x461.5. |
| 02 theme luminance (S2) | PASS. Screenshots of levels 1-7 (all three themes): Pip, cats, crumbs, walls clearly separated, Pip visible on Slate at level 5. Unit `theme.test.ts` passes. |
| 03 gentler opening (S2) | PASS. Idle player died 9.1 s after READY (was 3.0 s). |
| 04 first-run how-to (S2) | PASS. Shows on first Enter and first touch tap, dismiss starts the run, `seen:true` stored, not shown after reload, reachable from Settings. Opening tap does not dismiss it. |
| 05 originality (S2) | PARTIAL, accepted. (a), (b), (d) verified in code and tests; (c) asymmetric maze / cupboard door declined with a valid reason (needs new maze, mid-run passability change, designer sign-off, as the report itself says). |

## S3/S4 sample (10 checked)
| Item | Result |
| --- | --- |
| 07 pause menu | PASS. Esc/P toggle, Resume default focus, time frozen while paused, Tab trapped, restart/quit need in-page confirmation (default focus = Keep playing), Esc from confirm returns to pause, backdrop tap resumes (touch), touch pause button 48 px. |
| 06 text size | PASS. Settings 150% persisted and rendered without clipping (title/HUD/summary screenshots). |
| 11 colour-blind / high contrast | PASS. Letter badges S/B/T/G, droplet, white-wall HC theme verified in screenshot. |
| 12 settings panel | PASS. Volume, Reduce motion System/On/Off, assist, text size, HC, d-pad, left-handed; values persist across reload; corrupted storage (bad JSON, out-of-range volume, bad enum, wrong types, `[]`, `null`) falls back per field and keeps valid siblings. |
| 17 touch/landscape | PASS. Landscape d-pad left, tools right, canvas 99.9% of height; d-pad slide L to U without lifting changes direction; targets: tools 48, d-pad 60, dialog buttons 44, settings controls all >= 44. |
| 19 resize | PASS. 30-step rotate loop mid-play ends at correct size, game continues, no errors. |
| 23 controls | PASS. Tab to Settings and Enter opens settings (does not start game). |
| 25 storage | PASS. `{bad` highscore, bad scores/stats, throwing localStorage getter: no crash. |
| 16 live region / 20 tuning / 21 split | PASS by code/tests (`#live` present, `config/*`, file sizes). |
| 22 game over | FAIL for the "inert 0.7 s" claim (defect 1); stats, top 5, Play again/Title otherwise work. Double-clicking Play again starts one run (score 0, 3 lives). |

## Conventions
| Item | Result |
| --- | --- |
| Pause overlay, auto-pause (window blur and hidden tab, both tested, desktop and touch), resume manual, held input cleared, pause in dying freezes the death timer, settings during play pauses and stays paused after Esc | PASS |
| No single-key forfeit (Enter, Space, q, Backspace, Delete, r, x on the pause menu did nothing; 50x Esc/P spam ends consistent) | PASS |
| Settings fields persist and validate | PASS |
| 44 px targets (getBoundingClientRect) | PASS (min 44) |
| Contrast (computed colours, all dialog text) | PASS, min 7.43:1 settings/pause, 9.69 how-to |
| Gap between Restart and Quit/other pause buttons | 8 px, PASS |
| Reduced motion: OS reduce honoured under System; On forces; Off overrides OS | PASS (state flag) |
| Dark scheme / reduced-motion context | PASS, no errors |
| Keyboard-only: Tab order canvas, pause, settings, mute; 3 px yellow focus ring (rgb 255,211,107); focus returns to `btn-settings` after Esc | PASS |
| Debug hook gated by `?debug=1` | PASS (used here only with the flag) |
| Spam: Enter x15 on title (one run), Enter spam on summary (advances once after delay), Esc/P spam, game-over spam | PASS except defect 1 |
| Extra life 7,500 gives exactly one life | PASS |

## Not checked
Real audio, 120/144 Hz, real devices, screen readers, dark-kitchen modifier visuals.

Screenshots: `/private/tmp/claude-502/-Users-sharajrewoo-DemoReposQA-arcadeShop/8e55e8a6-b9e8-4f70-be6b-4a1ac6189eef/scratchpad/polish-shots/verify1-crumbrun-*.png`
