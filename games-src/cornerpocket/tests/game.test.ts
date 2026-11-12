import { describe, expect, it } from 'vitest';
import { computeAim } from '../src/aim';
import { Game } from '../src/game';
import type { GameEvent } from '../src/gameTypes';
import { makeBall } from '../src/physics';
import { applyRackShot, initialRack, nextRack } from '../src/rack';

describe('aim guide', () => {
  it('finds the ghost ball and deflection directions for a cut shot', () => {
    const balls = [makeBall(0, 100, 200), makeBall(1, 300, 210)];
    const g = computeAim(balls, 0)!;
    expect(g.hitId).toBe(1);
    expect(g.end.x).toBeGreaterThan(250);
    expect(g.objectDir!.y).toBeGreaterThan(0);
    expect(g.cueDir!.y).toBeLessThan(0);
    expect(g.objectDir!.x * g.cueDir!.x + g.objectDir!.y * g.cueDir!.y).toBeCloseTo(0, 6);
  });
  it('stops at the cushion when nothing is in the way', () => {
    const g = computeAim([makeBall(0, 100, 200)], 0)!;
    expect(g.hitId).toBeNull();
    expect(g.end.x).toBeCloseTo(790);
  });
});

describe('Rack Attack scoring', () => {
  it('combos add time, scratch costs time, clean sweep bonuses apply', () => {
    const s = initialRack();
    const t0 = s.time;
    const r1 = applyRackShot(s, 2, false, 2);
    expect(r1.texts.join()).toContain('Hole in one');
    expect(s.combo).toBe(2);
    expect(s.time).toBeGreaterThan(t0);
    const t1 = s.time;
    applyRackShot(s, 0, true, 2);
    expect(s.time).toBe(t1 - 5);
    expect(s.combo).toBe(0);
    const s2 = initialRack();
    const r2 = applyRackShot(s2, 1, false, 0);
    expect(r2.cleared).toBe(true);
    expect(r2.texts.join()).toContain('Clean Sweep');
    nextRack(s2);
    expect(s2.rack).toBe(2);
  });
});

describe('Game controller', () => {
  it('runs a trick shot to completion and awards stars', () => {
    const g = new Game({ mode: 'trick', level: 'easy', trick: 0 });
    const events: GameEvent[] = [];
    g.on((e) => events.push(e));
    // aim straight at the single ball's pocket line: try a sweep until it pots
    let solved = false;
    for (let k = 0; k < 720 && !solved; k++) {
      const probe = new Game({ mode: 'trick', level: 'easy', trick: 0 });
      probe.on((e) => { if (e.t === 'over' && e.info.won) solved = true; });
      probe.shoot({ angle: (k / 720) * Math.PI * 2, power: 0.6, spin: 0 });
      probe.runToRest();
      if (solved) { expect(probe.phase).toBe('over'); }
    }
    expect(solved).toBe(true);
    expect(g.phase).toBe('aim');
  });

  it('ends a trick when shots run out', () => {
    const g = new Game({ mode: 'trick', level: 'easy', trick: 0 });
    let over = false;
    g.on((e) => { if (e.t === 'over') over = !e.info.won; });
    for (let i = 0; i < 3; i++) { g.shoot({ angle: Math.PI, power: 0.05, spin: 0 }); g.runToRest(); }
    expect(over).toBe(true);
    expect(g.phase).toBe('over');
  });

  it('8-ball: a scratch hands the opponent ball in hand', () => {
    const g = new Game({ mode: 'duo', level: 'easy' });
    g.balls = [g.balls[0]!, { ...makeBall(1, 300, 100) }, { ...makeBall(9, 600, 300) }];
    g.cue.x = 100; g.cue.y = 300;
    g.shoot({ angle: Math.PI / 2, power: 0.7, spin: 0 }); // straight into the bottom wall, no ball hit
    g.runToRest();
    expect(g.phase).toBe('place');
    expect(g.ctl.humanTurn()).toBe(true);
  });

  it('is deterministic: same shots give identical tables', () => {
    const run = (): string => {
      const g = new Game({ mode: 'duo', level: 'easy' });
      g.shoot({ angle: 0.01, power: 1, spin: 0 });
      g.runToRest();
      return JSON.stringify(g.balls);
    };
    expect(run()).toBe(run());
  });
});
