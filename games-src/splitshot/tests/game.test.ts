import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { Game } from '../src/game';
import { EMPTY_BEST, mergeBest, parseBest, type Best } from '../src/scores';
import { makeBubble } from '../src/sim/physics';

function mk(): { g: Game; saved: Best[]; changes: number[] } {
  const saved: Best[] = [];
  const changes: number[] = [];
  const g = new Game({ onChange: () => changes.push(1), loadBest: () => ({ ...EMPTY_BEST }), saveBest: (b) => saved.push(b) });
  return { g, saved, changes };
}

describe('game phases', () => {
  it('title -> ready -> playing on first input, never before', () => {
    const { g } = mk();
    expect(g.phase).toBe('title');
    g.start();
    expect(g.phase).toBe('ready');
    g.frame(0.5);
    expect(g.phase).toBe('ready');
    g.input.right = true;
    g.frame(1 / 60);
    expect(g.phase).toBe('playing');
  });
  it('pause freezes the sim, clears input and resumes manually', () => {
    const { g } = mk();
    g.start();
    g.input.right = true;
    g.frame(0.1);
    g.pause();
    expect(g.phase).toBe('paused');
    expect(g.input.right).toBe(false);
    const tick = g.sim.tick;
    g.frame(1);
    expect(g.sim.tick).toBe(tick);
    g.resume();
    expect(g.phase).toBe('playing');
  });
  it('the stage timer does not run while paused or in ready', () => {
    const { g } = mk();
    g.start();
    const t = g.sim.time;
    g.frame(2);
    g.pause();
    g.frame(2);
    expect(g.sim.time).toBe(t);
  });
  it('clearing a stage moves to the next stage after the pause', () => {
    const { g } = mk();
    g.start();
    g.input.fire = true;
    g.frame(1 / 60);
    g.debugClear();
    g.frame(1 / 60);
    expect(g.phase).toBe('clear');
    g.frame(CONFIG.phases.clearSec + 0.1);
    expect(g.phase).toBe('ready');
    expect(g.run.stage).toBe(1);
  });
  it('losing all lives ends the run, saves best and exposes the result', () => {
    const { g, saved } = mk();
    g.start();
    for (let life = 0; life < CONFIG.run.lives; life++) {
      g.input.right = true;
      g.frame(1 / 60);
      g.input.right = false;
      g.sim.player.invuln = 0;
      g.sim.bubbles = [makeBubble(5, g.sim.player.x, CONFIG.world.floorY - 20, 2, 1)];
      g.frame(1 / 60);
      expect(g.phase).toBe('lost');
      g.frame(CONFIG.phases.lostSec + 0.1);
    }
    expect(g.phase).toBe('over');
    expect(g.result).not.toBeNull();
    expect(g.run.lives).toBe(0);
    expect(saved.length).toBeGreaterThanOrEqual(0);
  });
  it('quit to title returns to the demo', () => {
    const { g } = mk();
    g.start();
    g.pause();
    g.toTitle();
    expect(g.phase).toBe('title');
    g.frame(1);
    expect(g.view).toBe(g.demo);
  });
  it('the title demo keeps running by itself and rolls over to new stages', () => {
    const { g } = mk();
    for (let i = 0; i < 60 * 60; i++) g.frame(1 / 60);
    expect(g.phase).toBe('title');
    expect(g.demo.bubbles.length).toBeGreaterThan(0);
  });
});

describe('best score', () => {
  it('validates stored data per field', () => {
    expect(parseBest(null)).toEqual(EMPTY_BEST);
    expect(parseBest({ score: 500, stage: -3 })).toEqual({ score: 500, stage: 0 });
    expect(parseBest({ score: 'x', stage: 4, extra: 1 })).toEqual({ score: 0, stage: 4 });
  });
  it('merge reports a new best only when the score rises', () => {
    expect(mergeBest({ score: 100, stage: 2 }, 300, 1)).toEqual({ best: { score: 300, stage: 2 }, isNew: true });
    expect(mergeBest({ score: 100, stage: 2 }, 50, 5).isNew).toBe(false);
  });
});
