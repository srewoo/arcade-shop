# Balance sweep (RUG-25)

Headless sweep, 2026-11-11: for each of the 8 maps, a 3-lap race with 3 AI opponents at each difficulty, with the **player car on the autopilot** (top 37, aLat 92, nitro on). One run per cell, so single numbers are noisy (random cat events and traffic); the per-difficulty mean over 8 maps is the usable signal. Time-trial par = the same autopilot driving a clean 3-lap time trial / 3 (or the 1-lap time if lower); it is the base of the medal targets.

## Time trial par and medal targets (per lap, seconds)

| Map | Par/lap | Gold (x1.04) | Silver (x1.12) | Bronze (x1.25) | 3 laps gold |
|---|---|---|---|---|---|
| sol | 22.03 | 22.91 | 24.67 | 27.54 | 68.7 |
| sol-twist | 22.25 | 23.14 | 24.92 | 27.81 | 69.4 |
| sol-mirror | 19.75 | 20.54 | 22.12 | 24.69 | 61.6 |
| claude | 16.55 | 17.21 | 18.54 | 20.69 | 51.6 |
| claude-bend | 17.64 | 18.35 | 19.76 | 22.05 | 55.0 |
| claude-wild | 18.91 | 19.67 | 21.18 | 23.64 | 59.0 |
| round | 13.06 | 13.58 | 14.63 | 16.32 | 40.7 |
| runner | 13.20 | 13.73 | 14.78 | 16.50 | 41.2 |

## AI finish time by difficulty (mean of 3 AI cars, seconds, 3 laps)

| Map | Easy | Normal | Hard | Insane |
|---|---|---|---|---|
| sol | 66.3 | 63.0 | 62.5 | 61.7 |
| sol-twist | 73.6 | 68.8 | 68.6 | 68.2 |
| sol-mirror | 67.7 | 63.2 | 64.7 | 63.1 |
| claude | 53.9 | 51.4 | 52.0 | 49.4 |
| claude-bend | 59.0 | 54.2 | 54.9 | 54.8 |
| claude-wild | 65.7 | 61.1 | 56.7 | 56.8 |
| round | 43.2 | 40.1 | 41.4 | 38.8 |
| runner | 47.4 | 44.1 | 40.9 | 38.7 |
| **mean** | **59.6** | **55.7** | **55.2** | **53.9** |
| vs Normal | +6.9% | +0.0% | -0.9% | -3.2% |

## Autopilot placing (1 = first of 4)

| Map | Easy | Normal | Hard | Insane |
|---|---|---|---|---|
| sol | 2 | 4 | 3 | 4 |
| sol-twist | 2 | 2 | 3 | 4 |
| sol-mirror | 1 | 3 | 2 | 3 |
| claude | 1 | 1 | 4 | 4 |
| claude-bend | 2 | 3 | 4 | 2 |
| claude-wild | 2 | 1 | 2 | 2 |
| round | 1 | 2 | 2 | 1 |
| runner | 1 | 2 | 2 | 3 |

## Reading
* The table is monotonic: Easy is about 7 % slower than Normal, Hard about 1 % and Insane about 3 % faster. The nominal scales are +4 % / +8 % top speed, but corner speed (sqrt(aLat / curvature)) limits most of every lap, so top speed only matters on the straights.
* Normal (x1 on every term) is the reference. Its numbers are untouched, and the six original maps' deterministic demo times are unchanged (the gate in the changes log).
* The autopilot is a bot, not a human: it places 1st-4th at every difficulty, so no difficulty is trivial or impossible for a driver at the AI's own top speed.
* **Not changed:** Hard and Insane are only 1-3 % faster than Normal in practice. If playtesting says they do not feel harder, raise `aLat` in the `hard` / `insane` rows of `DIFFICULTY` in `src/config/ai.js` (for example 1.10 / 1.18) and re-run this sweep. That is a feel decision for a human playtest, so the table was left alone.
* The chosen difficulty is now shown on the results card.

## Reproduce
Open the built game with `?debug=1&map=<id>`, then in the console build `new __rug.Session({demo:false, laps:3, kind:'race', opponents:3, difficulty})`, set `session.race.player.ai = {top:37, aLat:92}`, call `session.race.startCountdown(3)` and call `session.step(__rug.STEP, null)` until every car has finished.
