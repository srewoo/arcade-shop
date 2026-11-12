// Turns a compact level spec into a full Level with solver-proven par.
import { solve } from '../puzzle/solver';
import type { Actor, Level, Pack, Rule } from '../puzzle/types';
import { pickCast } from './cast';

export interface BridgeSpec {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  /** Crossing times in minutes, any order. */
  readonly times: readonly number[];
  /** Spare minutes over the optimal route. */
  readonly slack: number;
}

function withPar(base: Omit<Level, 'par' | 'limit'>, slack: number | null): Level {
  const provisional: Level = { ...base, par: 0, limit: null };
  const sol = solve(provisional);
  if (!sol) throw new Error(`Level ${base.id} has no solution`);
  return { ...base, par: sol.cost, limit: slack === null ? null : sol.cost + slack };
}

export function buildBridge(spec: BridgeSpec): Level {
  const times = [...spec.times].sort((a, b) => a - b);
  const actors: Actor[] = pickCast(times.length).map((c, i) => ({ name: c.name, art: c.art, time: times[i] as number, canRow: true }));
  return withPar(
    { id: spec.id, pack: 'bridge', title: spec.title, blurb: spec.blurb, actors, capacity: 2, rules: [] },
    spec.slack,
  );
}

export interface RaftSpec {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  readonly actors: readonly Actor[];
  readonly capacity: number;
  readonly rules: readonly Rule[];
}

export function buildRaft(spec: RaftSpec): Level {
  const pack: Pack = 'raft';
  return withPar({ ...spec, pack }, null);
}
