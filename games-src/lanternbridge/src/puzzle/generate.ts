// Seeded daily bridge puzzle: same date, same level, always solvable by construction.
import { buildBridge } from '../levels/build';
import { CONFIG } from '../config';
import { createRng, hashSeed, type Rng } from '../rng';
import type { Level } from './types';

export const dailyKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function drawTimes(rng: Rng, count: number): number[] {
  const { minTime, maxTime } = CONFIG.bridge.daily;
  const times = new Set<number>([minTime]);
  while (times.size < count) times.add(rng.int(minTime, maxTime));
  return [...times];
}

export function generateBridge(seed: number, id = `daily-${seed}`): Level {
  const d = CONFIG.bridge.daily;
  const rng = createRng(seed);
  const count = rng.int(d.minTravellers, d.maxTravellers);
  return buildBridge({
    id,
    title: 'Daily Lantern',
    blurb: 'A fresh crossing every day.',
    times: drawTimes(rng, count),
    slack: rng.int(d.minSlack, d.maxSlack),
  });
}

export const dailyLevel = (date: Date): Level => {
  const key = dailyKey(date);
  return generateBridge(hashSeed(key), `daily-${key}`);
};
