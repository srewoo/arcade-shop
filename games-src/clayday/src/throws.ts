// Round planner: turns round parameters + a seed into the exact list of throws
// (singles, doubles, crossings) for a round. Deterministic for a given seed.
import { CONFIG } from './config';
import type { ClayKind, ClaySpec, Side } from './clay';
import { pathInBounds } from './clay';
import type { Rng } from './rng';
import type { RoundParams } from './rounds';
import { makeWorld } from './world';

export type ThrowKind = 'single' | 'double' | 'crossing';

export interface ThrowSpec {
  readonly kind: ThrowKind;
  readonly clays: readonly ClaySpec[];
  /** Wind for this throw, world widths per second squared (+ blows right). */
  readonly wind: number;
  /** Pause after the throw resolves before the next one, in seconds. */
  readonly gap: number;
}

const other = (s: Side): Side => (s === 'L' ? 'R' : 'L');

function pickKind(rng: Rng, p: RoundParams): ClayKind {
  if (rng.chance(p.goldChance)) return 'gold';
  return rng.chance(p.miniChance) ? 'mini' : 'std';
}

/** Worlds that bracket every stage shape: ultra-wide, mid, and phone-tall. */
const PROBES = [makeWorld(1000, 450), makeWorld(1000, 770), makeWorld(600, 1100)];

/** Shrink the range until the path (with wind drift) stays inside the field on every probe world. */
function fitRange(spec: ClaySpec, wind: number): ClaySpec {
  let cur = spec;
  for (let i = 0; i < 60 && !PROBES.every((w) => pathInBounds(cur, w, wind)); i++) cur = { ...cur, range: cur.range * 0.95 };
  return cur;
}

function makeClay(rng: Rng, p: RoundParams, side: Side, delay: number, wind: number, range?: number): ClaySpec {
  const c = CONFIG.clay;
  const kind = pickKind(rng, p);
  const flight = rng.range(c.flightMin, c.flightMax) * p.flightScale * (kind === 'mini' ? 0.85 : 1);
  const spec: ClaySpec = {
    side, delay, flight, kind,
    apex: rng.range(c.apexMin, c.apexMax),
    range: range ?? rng.range(c.rangeMin, c.rangeMax),
  };
  return fitRange(spec, wind);
}

function nextWind(rng: Rng, p: RoundParams, prev: number): number {
  if (p.windMax <= 0) return 0;
  const step = rng.range(-1, 1) * p.windMax * CONFIG.wind.gust;
  return Math.max(-p.windMax, Math.min(p.windMax, prev + step));
}

function makeThrow(rng: Rng, p: RoundParams, kind: ThrowKind, wind: number): ThrowSpec {
  const gap = rng.range(CONFIG.pace.gapMinMs, CONFIG.pace.gapMaxMs) / 1000;
  const side: Side = rng.chance(0.5) ? 'L' : 'R';
  const stagger = CONFIG.pace.staggerMs / 1000;
  if (kind === 'single') return { kind, wind, gap, clays: [makeClay(rng, p, side, 0, wind)] };
  if (kind === 'crossing') {
    const range = rng.range(0.6, CONFIG.clay.rangeMax + 0.1);
    return { kind, wind, gap, clays: [makeClay(rng, p, side, 0, wind, range), makeClay(rng, p, other(side), 0, wind, range)] };
  }
  const second = rng.chance(0.5) ? side : other(side);
  return { kind, wind, gap, clays: [makeClay(rng, p, side, 0, wind), makeClay(rng, p, second, stagger, wind)] };
}

function chooseKind(rng: Rng, p: RoundParams, remaining: number): ThrowKind {
  if (remaining < 2) return 'single';
  const r = rng.next();
  if (r < p.doubleWeight) return 'double';
  if (r < p.doubleWeight + p.crossWeight) return 'crossing';
  return 'single';
}

/** Plan a whole round: the clays across all throws always sum to p.clays. */
export function planRound(p: RoundParams, rng: Rng): ThrowSpec[] {
  const plan: ThrowSpec[] = [];
  let remaining = p.clays;
  let wind = p.windMax > 0 ? rng.range(-p.windMax, p.windMax) : 0;
  while (remaining > 0) {
    wind = nextWind(rng, p, wind);
    const t = makeThrow(rng, p, chooseKind(rng, p, remaining), wind);
    plan.push(t);
    remaining -= t.clays.length;
  }
  return plan;
}

/** Duration (s) of a throw if its last clay is shot `shotAge` seconds after leaving. */
export const throwDuration = (t: ThrowSpec, shotAge: number): number =>
  Math.max(...t.clays.map((c) => c.delay + Math.min(shotAge, c.flight)));
