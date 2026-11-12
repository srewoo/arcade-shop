import { CONFIG } from '../src/config';
import { createSim, step } from '../src/sim';
import type { Input, Mode, Sim } from '../src/simTypes';
import { laneSpeed, type TrackRow } from '../src/track';

export const GAS: Input = { steer: 0, gas: true, brake: false };

/** A sim already past the countdown. */
export function runningSim(mode: Mode = 'endless', seed = 1): Sim {
  const s = createSim(mode, seed);
  while (s.phase === 'countdown') step(s, GAS);
  s.events.length = 0;
  return s;
}

/** Remove traffic so a test controls exactly what is on the road. */
export function clearRoad(s: Sim): void {
  s.cars = [];
  s.pickups = [];
}

/**
 * Oracle driver: follows each row's guaranteed free "path lane". Proves a clean line
 * exists through generated traffic, i.e. the track is always passable.
 */
export function driveOracle(mode: Mode, seed: number, maxSteps: number): Sim {
  const sim = createSim(mode, seed);
  const rows: { row: TrackRow; t: number }[] = [];
  const next = sim.track.next;
  sim.track.next = () => {
    const row = next();
    rows.push({ row, t: sim.runT });
    return row;
  };
  for (let n = 0; n < maxSteps && sim.phase !== 'over'; n++) {
    const cur = rows.find((r) => r.row.z + laneSpeed(r.row.path) * (sim.runT - r.t) > sim.z - 7);
    const off = (cur?.row.path ?? Math.floor(CONFIG.lanes / 2)) + 0.5 - sim.x;
    step(sim, { steer: off > 0.08 ? 1 : off < -0.08 ? -1 : 0, gas: true, brake: false });
    sim.events.length = 0;
  }
  return sim;
}
