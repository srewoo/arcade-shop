import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { createRng } from '../src/rng';
import { Sim } from '../src/model/sim';
import { dump, layout, settle } from './helpers';

const DT = CONFIG.sim.dt;
/** Freeze the feeder so a test only sees the effect of its own zap. */
const quiet = (sim: Sim): Sim => { (sim.spawner as unknown as { interval: number }).interval = 1e9; return sim; };

describe('zap', () => {
  it('removes the whole group, scores 2^n and counts discs', () => {
    const sim = quiet(layout(['112', '211', '212']));
    expect(sim.zap(0, 9)).toBe(true);
    const ev = sim.drain();
    expect(ev[0]).toMatchObject({ t: 'zap', kind: 1, n: 5, points: 32 });
    expect(sim.score).toBe(32);
    expect(sim.cleared).toBe(5);
  });
  it('refuses a lone disc with an invalid event, no score', () => {
    const sim = quiet(layout(['12', '21']));
    expect(sim.zap(0, 10)).toBe(false);
    expect(sim.drain()).toEqual([{ t: 'invalid', col: 0, row: 10 }]);
    expect(sim.score).toBe(0);
  });
  it('ignores empty cells and out-of-range cells', () => {
    const sim = quiet(layout(['1.']));
    expect(sim.zap(1, 11)).toBe(false);
    expect(sim.zap(40, 3)).toBe(false);
    expect(sim.drain()).toEqual([]);
  });
});

const pad = (...r: string[]): string[] => r.map((x) => x.padEnd(10, '.'));

describe('gravity', () => {
  it('drops discs above a cleared group and settles them with no floaters', () => {
    const sim = quiet(layout(['3.', '2.', '1.', '1.', '12']));
    expect(sim.zap(0, 10)).toBe(true);
    expect(sim.busy).toBe(true);
    expect(sim.zap(0, 11)).toBe(false);
    settle(sim);
    expect(sim.busy).toBe(false);
    expect(dump(sim).slice(-2)).toEqual(pad('3', '22'));
  });
  it('lands each disc on the floor or on another disc', () => {
    const sim = quiet(layout(['1.2', '2.1', '1.1', '231']));
    sim.zap(2, 9);
    settle(sim);
    for (let c = 0; c < 10; c++) {
      let seenGap = false;
      for (let r = 11; r >= 1; r--) {
        const t = sim.cells[r]![c];
        if (!t) seenGap = true;
        else expect(seenGap).toBe(false);
      }
    }
  });
  it('emits one land event per dropped disc', () => {
    const sim = quiet(layout(['4.', '2.', '1.', '1.', '3.']));
    expect(sim.zap(0, 9)).toBe(true);
    sim.drain();
    settle(sim);
    const lands = sim.drain().filter((e) => e.t === 'land');
    expect(lands.length).toBe(2);
  });
});

describe('base-row compaction', () => {
  it('slides columns together after a column empties', () => {
    const sim = quiet(layout(['12.3', '12.3']));
    expect(sim.zap(1, 11)).toBe(true);
    settle(sim);
    expect(dump(sim).slice(-2)).toEqual(pad('..13', '..13'));
  });
});

describe('bomb', () => {
  it('clears the whole row, drops what was above, scores 2^removed', () => {
    const sim = quiet(layout(['12', '36', '45']));
    expect(sim.zap(1, 10)).toBe(true);
    const ev = sim.drain();
    expect(ev[0]).toMatchObject({ t: 'bomb', n: 2, points: 4 });
    settle(sim);
    expect(dump(sim).slice(-2)).toEqual(pad('12', '45'));
  });
  it('can wipe the last row and awards the board-clear bonus', () => {
    const sim = quiet(layout(['16']));
    expect(sim.zap(1, 11)).toBe(true);
    const ev = sim.drain();
    expect(ev.some((e) => e.t === 'wipe')).toBe(true);
    expect(sim.score).toBe(4 + CONFIG.score.clearBonus);
  });
});

describe('feeder', () => {
  it('builds a row, drops it, and lands the discs on the stacks', () => {
    const sim = new Sim({ level: 1, rng: createRng(11), timed: false });
    const before = sim.tiles.length;
    for (let i = 0; i < 60 * 8; i++) sim.step(DT);
    expect(sim.tiles.length).toBeGreaterThan(before + 8);
    expect(sim.drain().some((e) => e.t === 'spawn')).toBe(true);
  });
  it('ends the run as "full" when a column overflows', () => {
    const rows = Array.from({ length: 11 }, () => '1212121212');
    const sim = layout(rows, { timed: false });
    for (let i = 0; i < 60 * 12 && sim.status === 'playing'; i++) sim.step(DT);
    expect(sim.status).toBe('over');
    expect(sim.overReason).toBe('full');
  });
  it('never feeds the same sequence for different seeds but is deterministic per seed', () => {
    const run = (seed: number): string => {
      const s = new Sim({ level: 2, rng: createRng(seed), timed: false });
      for (let i = 0; i < 600; i++) s.step(DT);
      return s.tiles.map((t) => `${t.kind}${t.col}${t.row}`).join('');
    };
    expect(run(3)).toBe(run(3));
    expect(run(3)).not.toBe(run(4));
  });
});

describe('clock and level end', () => {
  it('runs out of time: over with reason "time" and a one-shot warning', () => {
    const sim = quiet(layout(['12'], { params: { seconds: 12 } }));
    let warns = 0;
    for (let i = 0; i < 60 * 13 && sim.status === 'playing'; i++) {
      sim.step(DT);
      warns += sim.drain().filter((e) => e.t === 'warn').length;
    }
    expect(sim.status).toBe('over');
    expect(sim.overReason).toBe('time');
    expect(warns).toBe(1);
  });
  it('clears the level when enough discs are zapped', () => {
    const sim = quiet(layout(['11', '11'], { params: { target: 3 } }));
    expect(sim.toGo).toBe(3);
    sim.zap(0, 11);
    expect(sim.status).toBe('cleared');
    expect(sim.toGo).toBe(0);
    expect(sim.drain().some((e) => e.t === 'cleared')).toBe(true);
  });
  it('stops simulating once the level is over', () => {
    const sim = quiet(layout(['11'], { params: { target: 2 } }));
    sim.zap(0, 11);
    const t = sim.elapsed;
    sim.step(DT);
    expect(sim.elapsed).toBe(t);
  });
});

describe('zap hold', () => {
  it('released discs hover briefly before falling', () => {
    const sim = quiet(layout(['4.', '2.', '1.', '1.', '3.']));
    sim.zap(0, 9);
    const t = sim.cells[7]?.[0] ?? sim.tiles.find((x) => x.kind === 4)!;
    const y0 = t.y;
    for (let i = 0; i < 4; i++) sim.step(DT);
    expect(t.y).toBe(y0);
    for (let i = 0; i < 30; i++) sim.step(DT);
    expect(t.y).toBeGreaterThan(y0);
  });
});
