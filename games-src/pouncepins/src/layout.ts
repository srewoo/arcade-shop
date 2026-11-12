// Cat rack layout, personalities and bonus-fish frames. Pure and seeded.
import { CONFIG } from './config';
import { between, intBetween, mulberry32, shuffled, type Rng } from './rng';
import type { CatKind, FrameSetup } from './worldTypes';

const { lane, layout, frames, cat } = CONFIG;

/** Ten rack positions, head cat first (rows of 1,2,3,4). */
export function rackSpots(): { x: number; y: number }[] {
  const spots: { x: number; y: number }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) spots.push({ x: lane.pinX + row * lane.rowGap, y: (i - row / 2) * lane.colGap });
  }
  return spots;
}

/** Choose which slots are lazy / scaredy cats. The head cat is never scaredy. */
export function assignKinds(rng: Rng): CatKind[] {
  const kinds: CatKind[] = Array.from({ length: 10 }, () => 'plain');
  const order = shuffled(rng, [...Array(10).keys()]);
  const lazy = intBetween(rng, layout.lazy[0], layout.lazy[1]);
  const scared = intBetween(rng, layout.scaredy[0], layout.scaredy[1]);
  let used = 0;
  for (const slot of order) {
    if (used < lazy) kinds[slot] = 'lazy';
    else if (used < lazy + scared && slot !== 0) kinds[slot] = 'scaredy';
    else continue;
    used++;
  }
  return kinds;
}

/** Frames (1-based, sorted) that carry a bonus fish. Deterministic per seed. */
export function pickFishFrames(rng: Rng): number[] {
  const all = Array.from({ length: frames.count }, (_, i) => i + 1);
  return shuffled(rng, all).slice(0, frames.fishFrames).sort((a, b) => a - b);
}

/** Everything random about one rack: personalities, coats and (maybe) a fish. */
export function makeSetup(seed: number, withFish: boolean): FrameSetup {
  const rng = mulberry32(seed);
  const kinds = assignKinds(rng);
  const coats = kinds.map(() => intBetween(rng, 0, cat.coats - 1));
  const fish = withFish ? { x: between(rng, frames.fishMinX, frames.fishMaxX), y: between(rng, -frames.fishHalfY, frames.fishHalfY) } : null;
  return { kinds, coats, fish };
}
