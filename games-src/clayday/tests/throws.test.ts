import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { clayPoint, pathInBounds } from '../src/clay';
import { Rng } from '../src/rng';
import { roundParams } from '../src/rounds';
import { planRound } from '../src/throws';
import { makeWorld, worldForStage } from '../src/world';

const plan = (round: number, seed: number, mode: 'campaign' | 'practice' = 'campaign') => planRound(roundParams(round, mode), new Rng(seed));
const count = (p: ReturnType<typeof plan>): number => p.reduce((n, t) => n + t.clays.length, 0);

describe('round planner', () => {
  it('always plans exactly 25 clays', () => {
    for (let round = 1; round <= 25; round++) for (let seed = 1; seed <= 12; seed++) expect(count(plan(round, seed))).toBe(25);
  });
  it('is deterministic per seed and varies between seeds', () => {
    expect(plan(4, 77)).toEqual(plan(4, 77));
    expect(plan(4, 77)).not.toEqual(plan(4, 78));
  });
  it('mixes singles, doubles and crossings over a round', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) plan(3, seed).forEach((t) => kinds.add(t.kind));
    expect([...kinds].sort()).toEqual(['crossing', 'double', 'single']);
  });
  it('doubles and crossings have exactly two clays; crossings leave both barns together', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const t of plan(5, seed)) {
        if (t.kind === 'single') expect(t.clays).toHaveLength(1);
        else expect(t.clays).toHaveLength(2);
        if (t.kind === 'crossing') {
          expect(t.clays.map((c) => c.side).sort()).toEqual(['L', 'R']);
          expect(t.clays.every((c) => c.delay === 0)).toBe(true);
        }
      }
    }
  });
  it('crossing clays really cross paths', () => {
    const world = makeWorld(1000, 600);
    let seen = 0;
    for (let seed = 1; seed <= 30; seed++) {
      for (const t of plan(2, seed).filter((x) => x.kind === 'crossing')) {
        const [a, b] = t.clays as [(typeof t.clays)[number], (typeof t.clays)[number]];
        const left = a.side === 'L' ? a : b;
        const right = a.side === 'L' ? b : a;
        const dx = (s: number): number => clayPoint(left, world, t.wind, s * left.flight).x - clayPoint(right, world, t.wind, s * right.flight).x;
        expect(dx(0) < 0 && dx(1) > 0).toBe(true);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(5);
  });
  it('introduces minis, gold and wind only from their configured rounds', () => {
    const kinds = (round: number): Set<string> => new Set(Array.from({ length: 30 }, (_, s) => plan(round, s + 1)).flatMap((p) => p.flatMap((t) => t.clays.map((c) => c.kind))));
    expect(kinds(1)).toEqual(new Set(['std']));
    expect(kinds(CONFIG.mix.goldFrom).has('gold')).toBe(true);
    expect(kinds(CONFIG.mix.miniFrom).has('mini')).toBe(true);
    for (let s = 1; s <= 10; s++) {
      expect(plan(CONFIG.wind.from - 1, s).every((t) => t.wind === 0)).toBe(true);
      expect(plan(6, s).some((t) => t.wind !== 0)).toBe(true);
    }
  });
  it('practice has no wind even in late rounds', () => {
    expect(plan(10, 5, 'practice').every((t) => t.wind === 0)).toBe(true);
  });
  it('wind never exceeds the round maximum', () => {
    for (let round = 3; round <= 20; round++) {
      const max = roundParams(round).windMax;
      for (let s = 1; s <= 8; s++) for (const t of plan(round, s)) expect(Math.abs(t.wind)).toBeLessThanOrEqual(max + 1e-12);
    }
  });
});

describe('level validation: every planned clay is flyable on every screen shape', () => {
  const worlds = [[1280, 700], [1920, 900], [860, 380], [400, 640], [360, 600], [320, 480]].map(([w, h]) => worldForStage(w!, h!));
  it('stays inside the field, below the sky margin, and is in the air long enough to hit', () => {
    for (const world of worlds) {
      for (let round = 1; round <= 20; round++) {
        for (let seed = 1; seed <= 6; seed++) {
          for (const t of plan(round, seed * 31)) {
            for (const c of t.clays) {
              expect(pathInBounds(c, world, t.wind), `round ${round} seed ${seed} ${world.w}x${world.h}`).toBe(true);
              expect(c.flight).toBeGreaterThanOrEqual(CONFIG.clay.flightMin * CONFIG.clay.speedFloor * 0.85 - 1e-9);
              expect(c.range).toBeGreaterThan(0.1);
            }
          }
        }
      }
    }
  });
  it('apex is never above the top of the world', () => {
    for (const world of worlds) {
      const top = world.launchY - CONFIG.clay.apexMax * world.arc;
      expect(top).toBeGreaterThan(world.h * 0.06);
    }
  });
});
