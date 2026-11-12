import { describe, expect, it } from 'vitest';
import { RACK } from '../src/config/rack';
import { rackBallCount } from '../src/layouts';
import { applyRackShot, initialRack, nextRack, rackTime } from '../src/rack';
import { Game } from '../src/game';
import type { GameEvent } from '../src/gameTypes';
import { RackMode } from '../src/modes/rackMode';
import { EightMode } from '../src/modes/eightMode';

describe('rack time ramp (balance tuning)', () => {
  it('matches the original economy before the ramp starts', () => {
    for (let r = 1; r < RACK.rampFromRack; r++) expect(rackTime(r)).toBe(15 + 5 * rackBallCount(r));
  });
  it('shrinks once the ramp starts, never below the floor', () => {
    for (let r = RACK.rampFromRack; r < 40; r++) {
      expect(rackTime(r)).toBeLessThanOrEqual(rackTime(r - 1));
      expect(rackTime(r)).toBeGreaterThanOrEqual(RACK.minRackSeconds);
    }
    expect(rackTime(RACK.rampFromRack)).toBe(15 + 5 * rackBallCount(RACK.rampFromRack) - RACK.rampSeconds);
    expect(rackTime(40)).toBe(RACK.minRackSeconds);
  });
  it('caps the per-pot time bonus', () => {
    const s = initialRack();
    applyRackShot(s, 6, false, 3); // combo 1..6 in one shot
    const bonus = [1, 2, 3, 4, 5, 6].reduce((a, c) => a + Math.min(c, RACK.comboBonusCap), 0);
    expect(s.time).toBe(35 + bonus);
    expect(bonus).toBe(1 + 2 + 3 * 4);
  });
  it('keeps the scoring formulas unchanged', () => {
    const s = initialRack();
    applyRackShot(s, 2, false, 2); // 100 + 200 + hole in one 250
    expect(s.score).toBe(550);
    const clear = initialRack();
    applyRackShot(clear, 1, false, 0); // 100 + 250 + 200 + 500 sweep
    expect(clear.score).toBe(100 + 250 + 200 + 500);
    nextRack(clear);
    expect(clear.time).toBeGreaterThan(rackTime(2));
  });
});

describe('outcome sounds and texts', () => {
  it('rack clear emits rackClear, a clean sweep emits sweep', () => {
    const run = (clean: boolean): string[] => {
      const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
      const ev: GameEvent[] = [];
      g.on((e) => ev.push(e));
      const m = g.ctl as RackMode;
      m.state.clean = clean;
      g.balls = [g.balls[0]!, { ...g.balls[1]!, pocketed: true }, ...g.balls.slice(2).map((b) => ({ ...b, pocketed: true }))];
      m.onShotEnd({ firstHit: 1, potted: [1], cuePotted: false, onTableBefore: [1] });
      return ev.filter((e) => e.t === 'sfx').map((e) => (e as { name: string }).name);
    };
    expect(run(true)).toEqual(['sweep']);
    expect(run(false)).toEqual(['rackClear']);
  });
  it('8-ball: a turn change plays the turn sound and a CPU miss reads "CPU missed"', () => {
    const g = new Game({ mode: 'cpu', level: 'easy', seed: 2 });
    const ev: GameEvent[] = [];
    g.on((e) => ev.push(e));
    const m = g.ctl as EightMode;
    m.state = { ...m.state, current: 1, groups: [null, null], message: '' };
    m.onShotEnd({ firstHit: 1, potted: [], cuePotted: false, onTableBefore: [1, 2, 3] });
    expect(ev.some((e) => e.t === 'text' && e.text === 'CPU missed' && e.tone === 'bad')).toBe(true);
    expect(ev.some((e) => e.t === 'sfx' && e.name === 'turn')).toBe(true);
  });
  it('8-ball highlights legal targets only after groups are assigned and on the human turn', () => {
    const g = new Game({ mode: 'cpu', level: 'easy', seed: 2 });
    const m = g.ctl as EightMode;
    expect(m.highlight()).toEqual([]);
    m.state = { ...m.state, groups: ['stripes', 'solids'] };
    expect(m.highlight().every((id) => id >= 9)).toBe(true);
    expect(m.highlight().length).toBe(7);
    m.state = { ...m.state, current: 1 };
    expect(m.highlight()).toEqual([]);
  });
});
