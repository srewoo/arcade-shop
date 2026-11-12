import { describe, expect, it, vi } from 'vitest';
import { Game } from '../src/flow';
import type { GameDeps, Phase, RunResult } from '../src/flow';
import { TUNING } from '../src/config/tuning';
import { HIGHSCORE_KEY } from '../src/storage';
import type { KeyValueStore } from '../src/storage';
import { FIXED_DT } from '../src/types';
import type { GameEvent } from '../src/world';

function mem(): KeyValueStore & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

function make(extra: Partial<GameDeps> = {}) {
  const phases: Phase[] = [];
  const pauses: [boolean, boolean][] = [];
  const events: GameEvent[] = [];
  const runs: RunResult[] = [];
  const store = mem();
  const g = new Game({
    storage: store, reducedMotion: false,
    onEvent: (e) => events.push(e), onPhase: (p) => phases.push(p),
    onPause: (p, a) => pauses.push([p, a]), onRunEnd: (r) => runs.push(r), ...extra,
  });
  return { g, phases, pauses, events, runs, store };
}

function tick(g: Game, secs: number): void {
  for (let i = 0; i < Math.round(secs * 60); i++) g.update(FIXED_DT);
}

function playing() {
  const m = make();
  m.g.startGame();
  tick(m.g, TUNING.flow.readySec + 0.1);
  expect(m.g.phase).toBe('play');
  return m;
}

describe('pause', () => {
  it('toggles during play, stops the simulation and clears held input', () => {
    const { g, pauses } = playing();
    g.press('D');
    expect(g.world.pip.want).toBe('D');
    g.togglePause();
    expect(g.paused).toBe(true);
    expect(g.world.pip.want).toBe('N');
    expect(pauses).toEqual([[true, false]]);
    const t = g.world.time;
    tick(g, 2);
    expect(g.world.time).toBe(t);
    g.togglePause();
    expect(g.paused).toBe(false);
    expect(pauses[1]).toEqual([false, false]);
  });

  it('input and actions are ignored while paused', () => {
    const { g } = playing();
    g.togglePause();
    g.press('L');
    expect(g.world.pip.want).toBe('N');
    g.action();
    expect(g.phase).toBe('play');
  });

  it('auto-pause is flagged as automatic, and resume stays manual', () => {
    const { g, pauses } = playing();
    g.autoPause();
    expect(g.paused).toBe(true);
    expect(g.autoPaused).toBe(true);
    expect(pauses).toEqual([[true, true]]);
    tick(g, 3);
    expect(g.paused).toBe(true); // nothing resumes it by itself
    g.autoPause();
    expect(pauses.length).toBe(1); // not re-announced
    g.resume();
    expect(g.paused).toBe(false);
    expect(g.autoPaused).toBe(false);
  });

  it('cannot be paused on the title screen', () => {
    const { g } = make();
    g.togglePause();
    g.autoPause();
    expect(g.paused).toBe(false);
  });

  it('timers (READY countdown) stop while paused', () => {
    const { g } = make();
    g.startGame();
    tick(g, 1);
    g.togglePause();
    tick(g, 10);
    expect(g.phase).toBe('ready');
    g.togglePause();
    tick(g, TUNING.flow.readySec - 1 + 0.1);
    expect(g.phase).toBe('play');
  });
});

describe('frozen by a settings dialog', () => {
  it('stops timers and input, and release continues where it left off', () => {
    const { g } = playing();
    const t = g.world.time;
    g.setFrozen(true);
    tick(g, 3);
    g.press('L');
    expect(g.world.time).toBe(t);
    expect(g.world.pip.want).toBe('N');
    expect(g.interpolating).toBe(false);
    g.setFrozen(false);
    tick(g, 1);
    expect(g.world.time).toBeGreaterThan(t);
  });

  it('togglePause does not start a pause underneath a frozen modal', () => {
    const { g } = playing();
    g.setFrozen(true);
    g.togglePause();
    expect(g.paused).toBe(false);
  });
});

describe('restart and quit', () => {
  it('quit ends the run, records it as abandoned and returns to the title', () => {
    const { g, runs, store } = playing();
    g.grant(1234);
    g.togglePause();
    g.quitToTitle();
    expect(g.phase).toBe('title');
    expect(g.paused).toBe(false);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ score: 1234, abandoned: true, newHigh: true });
    expect(store.data[HIGHSCORE_KEY]).toBe('1234');
  });

  it('restart begins a fresh level 1 with full lives and keeps the high score', () => {
    const { g, runs } = playing();
    g.grant(500);
    g.restart();
    expect(g.phase).toBe('ready');
    expect(g.level).toBe(1);
    expect(g.world.score.score).toBe(0);
    expect(g.world.score.lives).toBe(3);
    expect(g.hi).toBe(500);
    expect(runs).toHaveLength(1);
  });

  it('are no-ops on the title screen', () => {
    const { g, runs } = make();
    g.restart();
    g.quitToTitle();
    expect(runs).toHaveLength(0);
    expect(g.phase).toBe('title');
  });
});

describe('run end', () => {
  it('running out of lives reports a finished (not abandoned) run with totals', () => {
    const { g, runs, phases } = playing();
    g.world.score.lives = 1;
    g.world.stats.splashes = 3;
    g.world.stats.bestChain = 2;
    g.world.score.score = 900;
    for (const c of g.world.cats) { c.mode = 'active'; c.x = g.world.pip.x; c.y = g.world.pip.y; }
    tick(g, 0.2);
    tick(g, TUNING.flow.dyingSec + 0.5);
    expect(phases).toContain('gameover');
    expect(runs[0]).toMatchObject({ score: 900, level: 1, splashes: 3, bestChain: 2, abandoned: false });
  });

  it('a level clear banks its stats into the run total', () => {
    const { g } = playing();
    g.world.stats.splashes = 2;
    g.world.stats.bestChain = 3;
    g.world.cleared = true;
    tick(g, 0.1);
    expect(g.phase).toBe('clearing');
    expect(g.summary?.bestChain).toBe(3);
    expect(g.runTotals()).toEqual({ splashes: 2, bestChain: 3 });
    tick(g, TUNING.flow.clearingSec + TUNING.flow.summaryInputDelaySec + 0.2);
    expect(g.phase).toBe('summary');
    g.action();
    expect(g.level).toBe(2);
    g.world.stats.splashes = 1;
    g.world.stats.bestChain = 1;
    expect(g.runTotals()).toEqual({ splashes: 3, bestChain: 3 });
  });
});

describe('hit-stop and shake', () => {
  it('a death freezes the sim for ~80 ms and starts a short shake', () => {
    const { g } = playing();
    for (const c of g.world.cats) { c.mode = 'active'; c.x = g.world.pip.x; c.y = g.world.pip.y; }
    g.update(FIXED_DT);
    expect(g.phase).toBe('dying');
    expect(g.shakeLeft).toBeGreaterThan(0.1);
    const t = g.phaseT;
    g.update(FIXED_DT);
    expect(g.phaseT).toBe(t); // frozen by hit-stop
    tick(g, 0.1);
    expect(g.phaseT).toBeGreaterThan(t);
  });

  it('is not triggered by the title demo', () => {
    const onEvent = vi.fn();
    const { g } = make({ onEvent });
    tick(g, 30);
    expect(g.shakeLeft).toBe(0);
  });
});

describe('RunTracker', () => {
  it('only flags a new high score when the run beats the high at its start', async () => {
    const { RunTracker } = await import('../src/runStats');
    const r = new RunTracker();
    r.start(5000);
    expect(r.result(4000, 2, { splashes: 1, bestChain: 1 }, false).newHigh).toBe(false);
    expect(r.result(5001, 2, { splashes: 1, bestChain: 1 }, false).newHigh).toBe(true);
    expect(r.result(0, 1, { splashes: 0, bestChain: 0 }, true).newHigh).toBe(false);
    r.start(0);
    expect(r.result(0, 1, { splashes: 0, bestChain: 0 }, false).newHigh).toBe(false);
  });
});
