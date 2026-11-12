// Seeded generator for endless mode. Same seed + level number gives the same board.
import { CONFIG } from '../config';
import { createRng, type Rng } from '../rng';
import { type Cell, type ParsedLevel, type PowerKind } from './format';
import { validateLevel } from './validate';

const POWERS: readonly PowerKind[] = ['wide', 'multi', 'slow', 'laser'];
const HALF = CONFIG.field.cols / 2;

function pickCell(rng: Rng, n: number): Cell {
  const roll = rng.next();
  if (roll < 0.28) return null;
  if (n > 2 && roll < 0.28 + Math.min(0.12, n * 0.01)) return { kind: 'steel' };
  if (rng.next() < 0.07) return { kind: 'brick', hp: 1, power: rng.pick(POWERS) };
  const heavy = Math.min(0.6, n * 0.05);
  const hp = rng.next() < heavy ? (rng.next() < 0.5 ? 3 : 2) : 1;
  return { kind: 'brick', hp, power: null };
}

function buildOnce(rng: Rng, n: number): ParsedLevel {
  const rows = Math.min(CONFIG.endless.maxRows, 4 + Math.floor(n / 2));
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const half = Array.from({ length: HALF }, () => pickCell(rng, n));
    cells.push([...half, ...[...half].reverse()]);
  }
  return { name: `Endless ${n}`, cells };
}

const FALLBACK: ParsedLevel = {
  name: 'Endless fallback',
  cells: [Array.from({ length: CONFIG.field.cols }, () => ({ kind: 'brick', hp: 1, power: null }) as Cell)],
};

export function generateLevel(seed: number, n: number): ParsedLevel {
  const rng = createRng((seed ^ Math.imul(n, 0x9e3779b1)) >>> 0);
  for (let attempt = 0; attempt < 30; attempt++) {
    const level = buildOnce(rng, n);
    if (validateLevel(level).length === 0) return level;
  }
  return FALLBACK;
}
