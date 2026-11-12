import { describe, expect, it } from 'vitest';
import { BLINK_SEC, CHASE_SEC, REST_SEC, drenchBlinking, newClock, newDrench, startDrench, tickClock, tickDrench } from '../src/modes';
import { CHAIN_POINTS, EXTRA_LIFE_SCORES, MAX_LIVES, addPoints, chainPoints, newScore } from '../src/scoring';
import { MIN_DRENCH_SEC, mazeIndex, themeIndex, tuning } from '../src/levels';
import { ITEM_PISTOL } from '../src/maze';
import { stepWorld } from '../src/step';
import { FIXED_DT } from '../src/types';
import { createWorld } from '../src/world';
import type { World } from '../src/world';

function placeAllCatsOnPip(w: World): void {
  for (const c of w.cats) {
    c.mode = 'active';
    c.x = w.pip.x;
    c.y = w.pip.y;
  }
}

describe('drench timing', () => {
  it('lasts the tuned number of seconds and then ends', () => {
    const d = newDrench();
    startDrench(d, 6);
    let ticks = 0;
    while (!tickDrench(d, FIXED_DT)) ticks++;
    expect(ticks / 60).toBeGreaterThan(5.95);
    expect(ticks / 60).toBeLessThan(6.05);
    expect(d.left).toBe(0);
  });

  it('blinks only in the final stretch', () => {
    const d = newDrench();
    startDrench(d, 6);
    expect(drenchBlinking(d)).toBe(false);
    d.left = BLINK_SEC - 0.01;
    const seen = new Set<boolean>();
    for (let i = 0; i < 100; i++) {
      seen.add(drenchBlinking(d));
      d.left -= 0.01;
    }
    expect(seen.has(true) && seen.has(false)).toBe(true);
    d.left = 0;
    expect(drenchBlinking(d)).toBe(false);
  });

  it('a water pistol pickup starts the window in the live world', () => {
    const w = createWorld(1);
    w.god = true;
    const idx = w.items.findIndex((i) => i === ITEM_PISTOL);
    w.pip.x = idx % w.maze.cols;
    w.pip.y = Math.floor(idx / w.maze.cols);
    stepWorld(w, FIXED_DT);
    expect(w.drench.left).toBeGreaterThan(5.9);
    expect(w.events.some((e) => e.type === 'pistol')).toBe(true);
    expect(w.items[idx]).toBe(0);
  });
});

describe('splash chain scoring', () => {
  it('pays its own 100/250/600/1500 curve and caps', () => {
    expect([0, 1, 2, 3, 4, 9].map(chainPoints)).toEqual([100, 250, 600, 1500, 1500, 1500]);
    expect(CHAIN_POINTS).toEqual([100, 250, 600, 1500]);
  });

  it('splashing drenched cats in one drench pays the chain, sends them to the basket, and chain resets on a new drench', () => {
    const w = createWorld(1);
    w.pip.x = 10;
    w.pip.y = 17;
    placeAllCatsOnPip(w);
    startDrench(w.drench, 5);
    stepWorld(w, FIXED_DT);
    const pts = w.events.filter((e) => e.type === 'splash').map((e) => e.points);
    expect(pts).toEqual([100, 250, 600, 1500]);
    expect(w.cats.every((c) => c.mode === 'returning')).toBe(true);
    expect(w.pip.alive).toBe(true);
    expect(w.stats.splashes).toBe(4);
    startDrench(w.drench, 5);
    expect(w.drench.chain).toBe(0);
  });

  it('a splashed cat is harmless while it runs home', () => {
    const w = createWorld(1);
    placeAllCatsOnPip(w);
    startDrench(w.drench, 5);
    stepWorld(w, FIXED_DT);
    const before = w.score.score;
    for (const c of w.cats) {
      c.x = w.pip.x;
      c.y = w.pip.y;
    }
    stepWorld(w, FIXED_DT); // still returning: no second splash, and no death
    expect(w.score.score).toBe(before);
    expect(w.pip.alive).toBe(true);
  });
});

describe('deaths', () => {
  it('an un-drenched cat touching Pip kills; god mode survives', () => {
    const w = createWorld(1);
    placeAllCatsOnPip(w);
    stepWorld(w, FIXED_DT);
    expect(w.pip.alive).toBe(false);
    expect(w.events.some((e) => e.type === 'death')).toBe(true);
    const g = createWorld(1);
    g.god = true;
    placeAllCatsOnPip(g);
    stepWorld(g, FIXED_DT);
    expect(g.pip.alive).toBe(true);
  });
});

describe('extra life', () => {
  it('is granted at 7,500 and again at 25,000, once each', () => {
    const s = newScore();
    expect(EXTRA_LIFE_SCORES).toEqual([7500, 25000]);
    expect(addPoints(s, 7500 - 10)).toBe(false);
    expect(s.lives).toBe(3);
    expect(addPoints(s, 20)).toBe(true);
    expect(s.lives).toBe(4);
    expect(addPoints(s, 10_000)).toBe(false);
    expect(addPoints(s, 8_000)).toBe(true);
    expect(s.lives).toBe(5);
    expect(addPoints(s, 90_000)).toBe(false);
    expect(s.lives).toBe(5);
  });

  it('a single huge award pays every threshold it crosses', () => {
    const s = newScore();
    expect(addPoints(s, 30_000)).toBe(true);
    expect(s.lives).toBe(5);
    expect(s.extrasGiven).toBe(2);
  });

  it('never exceeds the lives cap', () => {
    const s = newScore();
    s.lives = MAX_LIVES;
    addPoints(s, 30_000);
    expect(s.lives).toBe(MAX_LIVES);
  });
});

describe('breathing rhythm', () => {
  it('alternates ~20 s chase with a short rest', () => {
    const c = newClock();
    let t = 0;
    let flips: number[] = [];
    while (t < 60) {
      if (tickClock(c, FIXED_DT)) flips.push(Math.round(t));
      t += FIXED_DT;
    }
    flips = flips.slice(0, 3);
    expect(flips).toEqual([CHASE_SEC, CHASE_SEC + REST_SEC, 2 * CHASE_SEC + REST_SEC]);
  });
});

describe('basket release', () => {
  it('cats leave one by one in order', () => {
    const w = createWorld(1);
    w.god = true;
    const out: string[] = [];
    for (let i = 0; i < 60 * 17; i++) {
      stepWorld(w, FIXED_DT);
      for (const e of w.events) if (e.type === 'release' && e.cat) out.push(e.cat);
      w.events.length = 0;
    }
    expect(out).toEqual(['biscuit', 'tuxedo', 'ginger']);
  });
});

describe('level tuning curve', () => {
  it('cats speed up, are capped, and always slower than a pounce limit', () => {
    const speeds = [1, 2, 3, 5, 8, 12, 30].map((l) => tuning(l).catSpeed);
    for (let i = 1; i < speeds.length; i++) expect(speeds[i] as number).toBeGreaterThanOrEqual(speeds[i - 1] as number);
    expect(speeds[0]).toBeCloseTo(4.4);
    expect(speeds[speeds.length - 1]).toBeLessThanOrEqual(5.6 * 1.05);
  });

  it('drench time shrinks from 6 s to a 3 s floor', () => {
    expect(tuning(1).drenchSec).toBe(6);
    expect(tuning(2).drenchSec).toBeLessThan(6);
    expect(tuning(4).drenchSec).toBeCloseTo(3.6);
    expect(tuning(5).drenchSec).toBe(3);
    expect(MIN_DRENCH_SEC).toBe(3);
    expect(tuning(7).drenchSec).toBe(MIN_DRENCH_SEC);
    expect(tuning(99).drenchSec).toBe(MIN_DRENCH_SEC);
  });

  it('release delays tighten with level but stay ordered', () => {
    const a = tuning(1).releaseDelays;
    const b = tuning(10).releaseDelays;
    expect(a).toEqual([2, 6, 10, 15]);
    expect(b[3] as number).toBeLessThan(a[3] as number);
    expect([...b].sort((x, y) => x - y)).toEqual([...b]);
  });

  it('cycles mazes and changes colourway', () => {
    expect([1, 2, 3, 4, 5, 6].map(mazeIndex)).toEqual([0, 1, 2, 0, 1, 2]);
    expect(themeIndex(1)).not.toBe(themeIndex(2));
    expect(themeIndex(4)).not.toBe(themeIndex(1)); // same maze, new colours on the second lap
  });
});

describe('level flow', () => {
  it('eating the last crumb clears the level and spawns cheese twice along the way', () => {
    const w = createWorld(1);
    w.god = true;
    const { cols } = w.maze;
    let spawns = 0;
    w.items.forEach((it, idx) => {
      if (it === 0 || it === ITEM_PISTOL) return;
      w.pip.x = idx % cols;
      w.pip.y = Math.floor(idx / cols);
      stepWorld(w, 1e-4);
      for (const e of w.events) if (e.type === 'cheeseSpawn') spawns++;
      w.events.length = 0;
      w.cheese.active = false;
    });
    expect(spawns).toBe(2);
    expect(w.remaining).toBe(0);
    expect(w.cleared).toBe(true);
  });

  it('the demo AI plays without throwing and eats crumbs', () => {
    const w = createWorld(1, { ai: true });
    w.god = true;
    for (let i = 0; i < 60 * 30; i++) {
      stepWorld(w, FIXED_DT);
      w.events.length = 0;
    }
    expect(w.stats.crumbs).toBeGreaterThan(40);
  });
});
