// Deterministic track generator. Rows depend only on the seed and row order, never on
// the player, so a daily seed is the same road for everyone. Every row leaves a
// "path lane" free that drifts at most one lane per row, so a clean line always exists.
import { CONFIG, type CarKind } from './config';
import { createRng } from './rng';

export interface CarSpawn { readonly lane: number; readonly kind: CarKind; readonly hue: number }
export interface PickupSpawn { readonly lane: number; readonly kind: 'fuel' | 'boost'; readonly z: number }
export interface TrackRow { readonly z: number; readonly path: number; readonly cars: CarSpawn[]; readonly pickups: PickupSpawn[] }

const T = CONFIG.traffic;
const HUES = [210, 172, 48, 275, 135, 30, 195, 320] as const;

export const spacingAt = (z: number): number => {
  const r = Math.min(1, z / T.rampDist);
  return T.spacingStart + (T.spacingEnd - T.spacingStart) * r;
};

export const laneSpeed = (lane: number): number => T.laneSpeedBase + (CONFIG.lanes - 1 - lane) * T.laneSpeedStep;

export interface Track { peekZ(): number; next(): TrackRow }

export function createTrack(seed: number): Track {
  const rng = createRng(seed);
  let z: number = T.firstRowZ;
  let path = Math.floor(CONFIG.lanes / 2);
  let fuelAt: number = T.fuelEvery * (0.5 + rng.next() * 0.5);

  const pickKind = (): CarKind => {
    const r = rng.next();
    if (r < T.kinds.truck) return 'truck';
    return r < T.kinds.truck + T.kinds.van ? 'van' : 'sedan';
  };

  const carCount = (): number => {
    const ramp = Math.min(1, z / T.rampDist);
    const target = 1 + ramp * 2 + (rng.next() - 0.5) * 1.4;
    return Math.max(1, Math.min(T.maxCarsPerRow, Math.round(target)));
  };

  const next = (): TrackRow => {
    const step = rng.int(4);
    path = Math.max(0, Math.min(CONFIG.lanes - 1, path + (step === 0 ? -1 : step === 3 ? 1 : 0)));
    const free: number[] = [];
    for (let l = 0; l < CONFIG.lanes; l++) if (l !== path) free.push(l);
    const cars: CarSpawn[] = [];
    for (let n = carCount(); n > 0; n--) {
      const lane = free.splice(rng.int(free.length), 1)[0] ?? 0;
      cars.push({ lane, kind: pickKind(), hue: rng.pick(HUES) });
    }
    const spacing = spacingAt(z);
    const pickups: PickupSpawn[] = [];
    if (rng.chance(T.boostChance)) pickups.push({ lane: path, kind: 'boost', z: z + spacing * 0.25 });
    if (z + spacing * 0.6 >= fuelAt) {
      const lane = rng.chance(0.7) ? path : rng.int(CONFIG.lanes);
      pickups.push({ lane, kind: 'fuel', z: z + spacing * 0.6 });
      fuelAt += T.fuelEvery * (0.8 + rng.next() * 0.4);
    }
    const row: TrackRow = { z, path, cars, pickups };
    z += spacing;
    return row;
  };
  return { peekZ: () => z, next };
}
