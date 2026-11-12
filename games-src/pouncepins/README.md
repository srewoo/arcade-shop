# Pounce Pins

Comic ten-frame bowling where the pins are goofy office cats. Cats are never hurt: when struck they tumble, bounce, and either land on their feet or dive into a cushion, then complain about it. The ball is a ball of yarn.

Canvas 2D, TypeScript (strict), Vite. All art is drawn in code and all audio is synthesised with WebAudio. No assets, no network, one runtime dependency (`zod`).

## Run

```bash
npm install          # uses .npmrc (legacy-peer-deps=true, needed for vitest 4 on npm 10)
npm run dev          # http://localhost:5173
npm test             # vitest
npm run build        # tsc --noEmit + vite build
npx vite preview --port 4922 --strictPort
```

Debug hooks (`window.__pp`: `state()`, `bowl(angle, power, curve)`, `ff(seconds)`, `restart(seed)`) exist only with `?debug=1` (or in the dev server). `?seed=123` fixes the game seed.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Lock the ghost arrow, then throw | Space or Enter | tap the lane, or the Bowl button |
| Bend the curve (-3..+3) | Left / Right (or A / D) | the arrow buttons beside Bowl |
| Pause | P or Esc | pause button (top right) |
| Mute | M | speaker button |

Each throw has two presses: the first freezes the ghost arrow (aim), the second stops the power meter. Aim the arrow, pick a curve, and try to stop power in the hatched sweet spot. Settings and Pause are dialogs with a focus trap; Esc closes them.

## Modes

- **Solo**: ten frames, standard scoring (strike = 10 + next two rolls, spare = 10 + next roll, three-ball tenth frame, max 300).
- **Two players**: pass-and-play, alternating frames.
- **Arrow speed** (difficulty): Lazy Sunday / Office hours / Zoomies scales how fast the arrow sweeps. The sweep speed also changes randomly on every throw, and the chip above the lane tells you whether this one is slow, steady, quick or zippy.

## Design notes

- **Cat personalities.** Each rack gets a seeded mix: plain office cats; 1-2 *lazy* cats (heavier, they wobble for half a second after being hit and only then fall, so they can still be knocked over by a neighbour first); 0-2 *scaredy* cats (they leap early when the ball gets close, and a ball that arrives while they are airborne passes underneath them, so a fast throw can miss a scaredy cat). Icons (zzz, sweat drop) show the type; colour-blind assist adds an `L` / `S` badge.
- **Bonus fish frames.** Three frames per game (seeded) hide a golden fish on the lane. Roll over it for +5. The fish is added on top of the bowling score and shown separately, so the bowling score stays standard.
- **Aim.** The arrow sweeps with a sine, at a different speed each throw. The dashed ghost path previews the unobstructed route including the curve hook that starts partway down the lane.
- **Simulation.** Circle physics on a plane (`physics.ts`), 60 Hz fixed step with render interpolation. A struck cat counts as "down" the moment it is knocked off its spot; the tumble, landing on its feet and cushion dives are presentation of that state (`render/pose.ts`). Everything is deterministic for a seed (RNG: mulberry32 + FNV hash of seed/player/frame/roll, so racks are reproducible).
- **View.** A 3/4 side-on projection with upright cat sprites. Landscape canvases run the lane left-to-right, portrait canvases bottom-to-top. The pin deck is stretched so the rack stays readable on a phone.
- **Conventions.** Follows `production/polish/CONVENTIONS.md`: pause + auto-pause (blur, visibility), settings (volume, reduce motion, colour-blind assist, text size, theme), 44 px targets, keyboard + focus ring, `aria-live` status, tuning in `src/config.ts`, strings in `src/strings.ts`, zod-validated localStorage with per-field fallback (`pp-settings`, `pp-scores`, `pp-onboarded`), onboarding hint shown once.

## Layout of the code

```
src/config.ts       all tuning        src/scoring.ts   ten-pin scoring (pure)
src/layout.ts       rack, kinds, fish src/physics.ts   lane simulation (pure)
src/match.ts        turn flow         src/matchStep.ts per-tick update
src/render/*        canvas painters   src/ui/*         DOM panels, overlays
src/flow.ts         screens/pause     src/events.ts    sound + fx from events
tests/              vitest (rules, scoring, physics, RNG, settings, contrast, audio)
```

## What is original

This is an original game. The only reference was the *genre* of a comic cat-bowling flash game (ten frames, a sweeping aim arrow, a cat-themed rack). Nothing else is shared: name, characters, setting (a cartoon office), art, text, sound, rack behaviour (lazy and scaredy cats, cushions, fish frames) and scoring presentation are new. No third-party names, logos, sponsors, art or level layouts are used. Standard ten-pin scoring is a public-domain rule set.
