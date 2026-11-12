import { beforeEach, describe, expect, it } from 'vitest';
import { botHold } from '../src/bot';
import { Game } from '../src/game';
import type { Sfx } from '../src/audioCues';
import { BEST_KEY } from '../src/scores';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(), key: () => null, length: 0,
} as Storage;

const mk = (mode: 'endless' | 'daily' | 'practice' = 'practice'): { g: Game; sfx: Sfx[] } => {
  const sfx: Sfx[] = [];
  const g = new Game(mode, { now: () => new Date('2026-11-11T12:00:00Z'), rand: () => 0.5, emit: (s) => void sfx.push(s), onChange: () => undefined });
  return { g, sfx };
};
const crash = (g: Game): void => { for (let i = 0; i < 400 && g.phase === 'playing'; i++) g.frame(1 / 60); };

describe('game flow', () => {
  beforeEach(() => store.clear());

  it('waits in ready until the first press; sim does not advance', () => {
    const { g } = mk();
    g.start();
    expect(g.phase).toBe('ready');
    g.frame(1);
    expect(g.run?.sim.tick).toBe(0);
    g.press();
    expect(g.phase).toBe('playing');
    g.frame(0.1);
    expect(g.run?.sim.tick).toBeGreaterThan(0);
  });

  it('pause stops the sim, clears held input, and resume is manual', () => {
    const { g } = mk();
    g.start(); g.press(); g.frame(0.2);
    const t = g.run?.sim.tick;
    g.pause();
    expect(g.phase).toBe('paused');
    expect(g.hold).toBe(false);
    g.frame(2);
    expect(g.run?.sim.tick).toBe(t);
    g.resume();
    expect(g.phase).toBe('playing');
  });

  it('crash records best, emits cues, ends after the crash delay', () => {
    const { g, sfx } = mk('endless');
    g.start(); g.press();
    crash(g);
    expect(g.phase).toBe('crashed');
    expect(g.result?.score).toBeGreaterThanOrEqual(0);
    expect(sfx).toContain('crash');
    g.frame(1.5);
    expect(g.phase).toBe('over');
    expect(g.hold).toBe(false);
    expect(JSON.parse(store.get(BEST_KEY) ?? '{}').endless).toBe(g.result?.score);
  });

  it('a better practice run leaves a ghost that the next run replays', () => {
    const { g } = mk('practice');
    g.start();
    g.press();
    for (let i = 0; i < 300 && g.run?.sim.alive; i++) { g.hold = botHold(g.run.world, g.run.sim); g.frame(1 / 60); }
    g.pause();
    g.resume();
    for (let i = 0; i < 600 && g.phase === 'playing'; i++) g.frame(1 / 60);
    g.frame(1.5);
    expect(g.ghosts.practice?.seedKey).toBe('practice-v1');
    g.start();
    expect(g.hasGhost).toBe(true);
  });

  it('endless never has a ghost; daily seed is the date', () => {
    const e = mk('endless'); e.g.start();
    expect(e.g.hasGhost).toBe(false);
    const d = mk('daily'); d.g.start();
    expect(d.g.run?.seedKey).toBe('daily-2026-11-11');
  });

  it('quit to title discards the run without scoring', () => {
    const { g } = mk();
    g.start(); g.press(); g.frame(0.1); g.pause(); g.toTitle();
    expect(g.phase).toBe('title');
    expect(g.run).toBeNull();
    expect(store.has(BEST_KEY)).toBe(false);
  });
});
