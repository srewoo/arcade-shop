# Zap Chain

A colour-matching puzzle. A 10-column board of glossy discs fills from a feeder row at the top.
Click or tap a group of two or more touching discs of the same colour to zap it; the bigger the
chain, the higher the score (2^n points, capped). Discs above fall, the base row slides together
towards the centre, and bombs zap an entire row.

Rules follow a classic zap-the-discs game: 3 colours on level 1 up to 5 from level 3, bombs from
level 2, a clock of 80 s + 5 s per level, and a "discs to go" target of 40 + 10 per level. Clearing
the whole board is worth 2,000. Finishing a level pays a time bonus of `level x 5000 x (time left /
level time)`. A full column or an empty clock ends the run (GAME OVER / TIME'S UP).

## Run

```bash
npm install          # uses .npmrc (legacy-peer-deps=true)
npm run dev          # vite dev server
npm test             # vitest (pure logic: groups, gravity, compaction, bombs, scoring, levels, flow)
npm run build        # tsc --noEmit && vite build
```

Add `?debug=1` for `window.__zapchain` (state, grid, zap, autoplay, nearWin, nearTimeUp,
fillColumn, placeBomb).

## Controls

| Input | Action |
| --- | --- |
| Click / tap | Zap the group (or bomb row) under the pointer |
| Arrow keys / WASD | Move the cursor |
| Enter / Space | Zap at the cursor |
| P / Esc | Pause |
| M | Mute |

Settings (gear): volume, sound, reduce motion (System/On/Off), colour-blind assist (a distinct
symbol on every disc colour), text size, theme for the menus. Saved under `zapchain:settings`;
best score under `zapchain:scores`.

## Layout

- `src/model/` pure, seeded, DOM-free rules (`grid`, `rules`, `sim`, `fall`, `spawner`, `bot`)
- `src/game.ts` run flow (title, ready, playing, paused, cleared, over); `src/attract.ts` title demo
- `src/render/` canvas art (sprites, backdrop, arcs, particles, pop-ups, tiles, frame)
- `src/ui/` DOM HUD, dialogs, screens, input, settings panel
- `src/config.ts` all tuning
