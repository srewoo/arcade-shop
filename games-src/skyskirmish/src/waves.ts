// Wave design: pure, seeded, validated. A wave is a timed list of spawns built from a few
// formation patterns; every fourth wave is a boss wave.
import { CONFIG, ENEMY, WORLD, type DifficultyId, type EnemyKind, DIFFICULTY } from './config';
import { createRng, type Rng } from './rng';
import type { PathId } from './types';

export interface Spawn {
  /** Seconds after the wave starts. */
  at: number;
  kind: EnemyKind | 'boss';
  x: number;
  path: PathId;
  dir: 1 | -1;
}

export interface WaveSpec {
  index: number;
  boss: boolean;
  spawns: Spawn[];
}

const M = 30;
const clampX = (x: number): number => Math.max(M, Math.min(WORLD.w - M, x));
export const isBossWave = (index: number): boolean => index > 0 && index % CONFIG.waves.bossEvery === 0;

function kindsFor(index: number): EnemyKind[] {
  return (Object.keys(ENEMY) as EnemyKind[]).filter((k) => ENEMY[k].minWave <= index);
}

type Pattern = (n: number, kind: EnemyKind, rng: Rng) => Spawn[];

const line: Pattern = (n, kind) =>
  Array.from({ length: n }, (_, i) => ({ at: 0.15 * i, kind, x: clampX(((i + 0.5) / n) * WORLD.w), path: 'straight', dir: 1 }));

const column: Pattern = (n, kind, rng) => {
  const x = clampX(rng.range(60, WORLD.w - 60));
  return Array.from({ length: n }, (_, i) => ({ at: 0.45 * i, kind, x, path: 'sine', dir: 1 }));
};

const vee: Pattern = (n, kind) =>
  Array.from({ length: n }, (_, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const step = Math.ceil(i / 2);
    return { at: 0.3 * step, kind, x: clampX(WORLD.w / 2 + side * step * 38), path: 'straight', dir: 1 };
  });

const sweep: Pattern = (n, kind, rng) => {
  const dir: 1 | -1 = rng.next() < 0.5 ? 1 : -1;
  return Array.from({ length: n }, (_, i) => ({ at: 0.4 * i, kind, x: dir === 1 ? 10 : WORLD.w - 10, path: 'sweep', dir }));
};

const holders: Pattern = (n, kind) =>
  Array.from({ length: n }, (_, i) => ({ at: 0.35 * i, kind, x: clampX(((i + 1) / (n + 1)) * WORLD.w), path: 'hold', dir: i % 2 === 0 ? 1 : -1 }));

const PATTERNS: readonly Pattern[] = [line, column, vee, sweep, holders];

/** Boss-wave escorts and boss entry. The boss is always the first spawn. */
function bossWave(index: number, rng: Rng): Spawn[] {
  const spawns: Spawn[] = [{ at: 0, kind: 'boss', x: WORLD.w / 2, path: 'hold', dir: 1 }];
  const escorts = Math.min(3 + Math.floor(index / 4), 6);
  const kind: EnemyKind = index >= 8 ? 'gunner' : 'weaver';
  for (const s of sweep(escorts, kind, rng)) spawns.push({ ...s, at: 6 + s.at });
  return spawns;
}

export function buildWave(index: number, difficulty: DifficultyId, seed: number): WaveSpec {
  const rng = createRng((seed ^ Math.imul(index, 0x9e3779b1)) >>> 0);
  if (isBossWave(index)) return { index, boss: true, spawns: bossWave(index, rng) };
  const kinds = kindsFor(index);
  const groups = 2 + Math.min(4, Math.floor(index / 2));
  const spawns: Spawn[] = [];
  let at = 0.5;
  for (let g = 0; g < groups; g++) {
    const kind = g === 0 && index < 3 ? 'scout' : rng.pick(kinds);
    const size = kind === 'tank' ? 1 + (index > 9 ? 1 : 0) : Math.round((3 + index * 0.35) * DIFFICULTY[difficulty].density);
    const n = Math.max(2, Math.min(7, size));
    const pattern = kind === 'tank' ? holders : rng.pick(PATTERNS);
    for (const s of pattern(kind === 'tank' ? size : n, kind, rng)) spawns.push({ ...s, at: s.at + at });
    at += 2.4 + rng.range(0, 1.2);
  }
  spawns.sort((a, b) => a.at - b.at);
  return { index, boss: false, spawns: spawns.slice(0, CONFIG.waves.maxSpawns) };
}

/** Level validation: returns a list of problems (empty = playable). */
export function validateWave(w: WaveSpec): string[] {
  const errors: string[] = [];
  if (w.spawns.length === 0) errors.push('no spawns');
  if (w.spawns.length > CONFIG.waves.maxSpawns + 6) errors.push('too many spawns');
  if (w.boss !== isBossWave(w.index)) errors.push('boss flag mismatch');
  const bosses = w.spawns.filter((s) => s.kind === 'boss').length;
  if (w.boss ? bosses !== 1 : bosses !== 0) errors.push(`boss count ${bosses}`);
  let prev = -1;
  for (const s of w.spawns) {
    if (s.at < prev) errors.push('spawns out of order');
    prev = s.at;
    if (!(s.at >= 0 && s.at < 40)) errors.push(`bad time ${s.at}`);
    if (!(s.x >= 0 && s.x <= WORLD.w)) errors.push(`x out of bounds ${s.x}`);
  }
  return errors;
}
