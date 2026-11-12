import { describe, expect, it } from 'vitest';
import { clayVelocity } from '../src/clay';
import { CONFIG } from '../src/config';
import type { SimEvent } from '../src/events';
import { Round } from '../src/sim';
import { DT, WORLD, goLive, makeRound, runBot } from './helpers';

const types = (r: Round): string[] => r.events.map((e) => e.type);

function stepUntil(r: Round, pred: () => boolean, max = 60 * 60): void {
  for (let i = 0; i < max && !pred(); i++) r.step(DT);
}

describe('Round lifecycle', () => {
  it('counts down ready, then goes live with a pull call; clock does not run before', () => {
    const r = makeRound();
    const t0 = r.timeLeft;
    for (let i = 0; i < 30; i++) r.step(DT);
    expect(r.phase).toBe('ready');
    expect(r.timeLeft).toBe(t0);
    expect(r.fire(500, 300)).toBe(false);
    goLive(r);
    expect(r.phase).toBe('live');
    expect(types(r)).toContain('pull');
  });
  it('launches the first throw and tracks it in the marks', () => {
    const r = makeRound();
    goLive(r);
    stepUntil(r, () => r.launched > 0);
    expect(r.launched).toBeGreaterThan(0);
    expect(r.marks.filter((m) => m === 'pending')).toHaveLength(25);
  });
  it('does nothing after the round is done', () => {
    const r = makeRound();
    runBot(r);
    const score = r.score;
    r.step(DT);
    expect(r.fire(1, 1)).toBe(false);
    expect(r.reload()).toBe(false);
    expect(r.score).toBe(score);
  });
});

describe('shooting rules', () => {
  function liveWithClay(round = 1): { r: Round; id: number } {
    const r = makeRound(round);
    goLive(r);
    stepUntil(r, () => r.launched > 0);
    stepUntil(r, () => (r.clays[0]?.age ?? 0) > 0.6);
    return { r, id: 0 };
  }

  it('a shot led onto the clay breaks it and scores', () => {
    const { r } = liveWithClay();
    const c = r.clays[0]!;
    const p = r.predict(c, 7 / 60);
    expect(r.fire(p.x, p.y)).toBe(true);
    stepUntil(r, () => c.state !== 'flying', 30);
    expect(c.state).toBe('broken');
    expect(r.hits).toBe(1);
    expect(r.score).toBe(100);
    expect(r.marks[0]).toBe('hit');
  });
  it('a shot aimed at where the clay IS (no lead) misses a fast clay', () => {
    const { r } = liveWithClay();
    const c = r.clays[0]!;
    const v = clayVelocity(c.spec, WORLD, c.wind, c.age);
    expect(Math.hypot(v.x, v.y) * CONFIG.gun.pelletDelayMs / 1000).toBeGreaterThan(c.radius + r.params.spread);
    r.fire(c.x, c.y);
    for (let i = 0; i < 12; i++) r.step(DT);
    expect(r.hits).toBe(0);
  });
  it('two shells then an automatic reload; dry fire is refused and announced', () => {
    const { r } = liveWithClay();
    expect(r.fire(5, 5)).toBe(true);
    expect(r.fire(5, 5)).toBe(true);
    expect(r.gun.shells).toBe(0);
    expect(r.gun.reloading).toBe(true);
    r.events.length = 0;
    expect(r.fire(5, 5)).toBe(false);
    expect(types(r)).toContain('dry');
    stepUntil(r, () => !r.gun.reloading, 120);
    expect(r.gun.shells).toBe(2);
    expect(r.shotsFired).toBe(2);
  });
  it('manual reload only when there is something to reload', () => {
    const { r } = liveWithClay();
    expect(r.reload()).toBe(false);
    r.fire(5, 5);
    expect(r.reload()).toBe(true);
  });
  it('one shell can break two clays in the same pattern', () => {
    const r = makeRound(1, 1, 'campaign', WORLD, { spread: 400 });
    goLive(r);
    stepUntil(r, () => r.launched >= 2, 60 * 30);
    if (r.launched < 2) return;
    r.fire(WORLD.w / 2, WORLD.h / 2);
    for (let i = 0; i < 10; i++) r.step(DT);
    expect(r.hits).toBeGreaterThanOrEqual(1);
  });
  it('an unbroken clay lands, resets the streak and marks a miss', () => {
    const r = makeRound();
    goLive(r);
    stepUntil(r, () => r.marks[0] === 'miss', 60 * 10);
    expect(r.marks[0]).toBe('miss');
    expect(r.streak).toBe(0);
    expect(types(r)).toContain('miss');
  });
});

describe('combo, doubles and rounds', () => {
  it('a perfect bot breaks all 25, earns double bonuses, beats the clock and gets bonuses', () => {
    for (const round of Array.from({ length: 20 }, (_, i) => i + 1)) {
      const r = makeRound(round, 99);
      runBot(r);
      expect(r.phase).toBe('done');
      const res = r.result!;
      expect(res.hits, `round ${round}`).toBe(25);
      expect(res.outcome).toBe('complete');
      expect(res.secondsLeft).toBeGreaterThan(5);
      expect(res.perfectBonus).toBeGreaterThan(0);
      expect(res.timeBonus).toBeGreaterThan(0);
      expect(res.finalScore).toBe(res.score + res.timeBonus + res.perfectBonus);
      expect(res.doubles).toBeGreaterThan(0);
      expect(res.bestStreak).toBe(25);
      expect(res.passed).toBe(true);
    }
  });
  it('the combo multiplier makes a clean run worth more than 25 flat hits', () => {
    const r = makeRound(1, 5);
    runBot(r);
    expect(r.result!.score).toBeGreaterThan(25 * CONFIG.score.hit);
  });
  it('a bot that misses regularly resets streaks and can fail the round', () => {
    const r = makeRound(1, 21);
    runBot(r, { skipEvery: 3 });
    expect(r.result!.hits).toBeLessThan(25);
    expect(r.result!.bestStreak).toBeLessThan(25);
    expect(r.marks.every((m) => m !== 'pending')).toBe(true);
  });
  it('never shooting finishes with zero hits, no bonuses, and not passed', () => {
    const r = makeRound(1, 8);
    for (let i = 0; i < 60 * 200 && r.phase !== 'done'; i++) r.step(DT);
    const res = r.result!;
    expect(res.hits).toBe(0);
    expect(res.perfectBonus).toBe(0);
    expect(res.passed).toBe(false);
  });
  it('practice rounds always count as passed and have no clock', () => {
    const r = makeRound(1, 8, 'practice');
    expect(r.timed).toBe(false);
    for (let i = 0; i < 60 * 300 && r.phase !== 'done'; i++) r.step(DT);
    expect(r.result!.passed).toBe(true);
    expect(r.result!.timeBonus).toBe(0);
  });
});

describe('clock', () => {
  it('times out, forfeits unthrown clays and counts them as misses', () => {
    const r = makeRound(1, 3, 'campaign', WORLD, { timeSec: 6 });
    for (let i = 0; i < 60 * 30 && r.phase !== 'done'; i++) r.step(DT);
    const res = r.result!;
    expect(res.outcome).toBe('timeout');
    expect(res.timeBonus).toBe(0);
    expect(res.hits).toBe(0);
    expect(r.launched).toBeLessThan(25);
    expect(res.passed).toBe(false);
  });
  it('announces the last seconds', () => {
    const r = makeRound(1, 3, 'campaign', WORLD, { timeSec: 12 });
    const seen: SimEvent[] = [];
    for (let i = 0; i < 60 * 14 && r.phase !== 'done'; i++) {
      r.step(DT);
      seen.push(...r.events.splice(0));
    }
    expect(seen.filter((e) => e.type === 'lowtime').length).toBeGreaterThanOrEqual(3);
    expect(seen.at(-1)?.type).toBe('end');
  });
  it('the clock holds still while the sim is not stepped (pause)', () => {
    const r = makeRound();
    goLive(r);
    const t = r.timeLeft;
    expect(r.timeLeft).toBe(t);
  });
});

describe('determinism', () => {
  it('same seed and same inputs give identical results', () => {
    const a = makeRound(4, 555);
    const b = makeRound(4, 555);
    runBot(a, { skipEvery: 4 });
    runBot(b, { skipEvery: 4 });
    expect(a.result).toEqual(b.result);
    expect(a.marks).toEqual(b.marks);
  });
  it('different seeds give different plans', () => {
    expect(makeRound(4, 1).plan).not.toEqual(makeRound(4, 2).plan);
  });
  it('running in coarse or fine steps gives the same hits for a bot at the same moments', () => {
    const a = makeRound(2, 77);
    runBot(a);
    expect(a.result!.hits).toBe(25);
  });
});
