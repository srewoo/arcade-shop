import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../src/config';
import { Game } from '../src/game';
import type { SimEvent } from '../src/model/types';
import { dump } from './helpers';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

function make(): { game: Game; events: SimEvent[] } {
  const events: SimEvent[] = [];
  let seed = 100;
  const game = new Game({ seed: () => seed++, onSim: (e, attract) => { if (!attract) events.push(e); }, onChange: () => {} });
  return { game, events };
}
const run = (g: Game, sec: number): void => { for (let i = 0; i < Math.round(sec * 60); i++) g.frame(1 / 60); };

describe('flow', () => {
  it('title -> ready -> playing; the clock does not run during the intro', () => {
    const { game } = make();
    expect(game.phase).toBe('title');
    game.start();
    expect(game.phase).toBe('ready');
    run(game, CONFIG.flow.readySec / 2);
    expect(game.sim?.elapsed).toBe(0);
    run(game, CONFIG.flow.readySec);
    expect(game.phase).toBe('playing');
    run(game, 1);
    expect(game.sim?.elapsed).toBeGreaterThan(0.9);
  });
  it('pause stops the clock and resume continues; zaps are refused while paused or in the intro', () => {
    const { game } = make();
    game.start();
    expect(game.zapAt(0, 11)).toBe(false);
    run(game, 2);
    game.pause();
    expect(game.phase).toBe('paused');
    const t = game.sim!.elapsed;
    run(game, 3);
    expect(game.sim!.elapsed).toBe(t);
    expect(game.zapAt(0, 11)).toBe(false);
    game.resume();
    expect(game.phase).toBe('playing');
  });
  it('pausing during the intro resumes to the intro', () => {
    const { game } = make();
    game.start();
    game.pause();
    game.resume();
    expect(game.phase).toBe('ready');
  });
  it('quit to title drops the run', () => {
    const { game } = make();
    game.start();
    game.toTitle();
    expect(game.phase).toBe('title');
    expect(game.sim).toBeNull();
  });
});

describe('level progression', () => {
  it('clearing the target ends the level with a time bonus, then the next level carries the score', () => {
    const { game, events } = make();
    game.start();
    run(game, 2);
    const sim = game.sim!;
    // Make the level trivially short: one zap away.
    (sim.params as { target: number }).target = 2;
    let guard = 0;
    while (game.phase === 'playing' && guard++ < 50) { game.autoplayOnce(); run(game, 0.5); }
    run(game, CONFIG.flow.clearDelaySec + 0.2);
    expect(game.phase).toBe('cleared');
    expect(events.some((e) => e.t === 'cleared')).toBe(true);
    expect(game.clearInfo?.bonus).toBeGreaterThan(0);
    const carried = game.sim!.score;
    expect(game.clearInfo?.score).toBe(carried);
    game.nextLevel();
    expect(game.phase).toBe('ready');
    expect(game.level).toBe(2);
    expect(game.sim!.score).toBe(carried);
    expect(game.sim!.params.target).toBe(60);
    expect(game.sim!.params.seconds).toBe(90);
  });
  it('a bigger time-left share gives a bigger bonus', () => {
    const bonusAfter = (wait: number): number => {
      const { game } = make();
      game.start();
      run(game, 2 + wait);
      (game.sim!.params as { target: number }).target = 2;
      let guard = 0;
      while (game.phase === 'playing' && guard++ < 50) { game.autoplayOnce(); run(game, 0.5); }
      return game.clearInfo?.bonus ?? 0;
    };
    expect(bonusAfter(0)).toBeGreaterThan(bonusAfter(20));
  });
});

describe('game over and best score', () => {
  it('time up shows TIME reason, saves the best and flags a new best once', () => {
    const { game } = make();
    game.start();
    run(game, 2);
    const sim = game.sim!;
    (sim.params as { seconds: number }).seconds = 3;
    game.autoplayOnce();
    run(game, 3 + CONFIG.flow.endDelaySec + 0.5);
    expect(game.phase).toBe('over');
    expect(game.result?.reason).toBe('time');
    expect(game.result?.isNew).toBe(game.result!.score > 0);
    expect(game.scores.best).toBe(game.result!.score);
    expect(JSON.parse(store.get('zapchain:scores') ?? '{}').best).toBe(game.result!.score);
    // A second, worse run is not a new best.
    game.start();
    run(game, CONFIG.flow.readySec + 0.1);
    (game.sim!.params as { seconds: number }).seconds = 1;
    run(game, 3);
    expect(game.result?.isNew).toBe(false);
  });
  it('restart gives a fresh level-1 sim with zero score', () => {
    const { game } = make();
    game.start();
    run(game, 2);
    game.autoplayOnce();
    game.start();
    expect(game.level).toBe(1);
    expect(game.sim!.score).toBe(0);
    expect(game.sim!.cleared).toBe(0);
  });
});

describe('keyboard cursor', () => {
  it('first press reveals the cursor, then arrows move it within the board', () => {
    const { game } = make();
    game.start();
    game.moveAim(1, 0);
    expect(game.aim).toMatchObject({ source: 'kbd', col: 4, row: 9 });
    game.moveAim(1, 0);
    expect(game.aim?.col).toBe(5);
    for (let i = 0; i < 30; i++) game.moveAim(-1, 1);
    expect(game.aim).toMatchObject({ col: 0, row: CONFIG.grid.floorRow });
    for (let i = 0; i < 30; i++) game.moveAim(1, -1);
    expect(game.aim).toMatchObject({ col: 9, row: 1 });
  });
  it('Enter/Space zap uses the cursor cell and leaves the grid consistent', () => {
    const { game } = make();
    game.start();
    run(game, CONFIG.flow.readySec + 0.2);
    const m = game.sim!;
    const before = dump(m).join('');
    for (let r = 11; r >= 1 && game.sim!.score === 0; r--) {
      for (let c = 0; c < 10; c++) { game.aimAt(c, r, 'kbd'); if (game.zapAim()) break; }
    }
    expect(game.sim!.score).toBeGreaterThan(0);
    expect(dump(m).join('')).not.toBe(before);
  });
});
