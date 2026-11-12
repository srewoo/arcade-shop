import { describe, expect, it } from 'vitest';
import { defaultConfig, NO_INPUT, type GameEvent, type TickInput } from '../src/core/state';
import { MAX_CATCHUP_STEPS, Session, STEP } from '../src/session';

function make(poll: () => TickInput = () => NO_INPUT) {
  const seen: GameEvent[][] = [];
  const ends: string[] = [];
  const s = new Session(poll, { onEvents: (e) => seen.push([...e]), onEnd: (st) => ends.push(st) });
  return { s, seen, ends };
}

describe('Session pause state (conventions section 1)', () => {
  it('does not advance while paused, in the title, or after the end', () => {
    const { s } = make();
    s.advance(1);
    expect(s.game).toBeNull();
    s.start(defaultConfig({ seed: 4 }));
    s.advance(STEP * 3);
    const t = s.game?.ticks ?? 0;
    expect(t).toBe(3);
    expect(s.pause()).toBe(true);
    s.advance(5);
    expect(s.game?.ticks).toBe(t);
    expect(s.phase).toBe('paused');
  });
  it('pause only works while playing; resume only while paused', () => {
    const { s } = make();
    expect(s.pause()).toBe(false);
    s.start(defaultConfig());
    expect(s.resume()).toBe(false);
    expect(s.pause()).toBe(true);
    expect(s.pause()).toBe(false);
    expect(s.autoPause()).toBe(false);
    expect(s.resume()).toBe(true);
    expect(s.phase).toBe('playing');
  });
  it('autoPause pauses an active run (tab hidden / window blur) and clears the backlog on resume', () => {
    const { s } = make();
    s.start(defaultConfig());
    s.advance(STEP * 2.5);
    expect(s.autoPause()).toBe(true);
    s.resume();
    expect(s.alpha).toBe(0);
  });
  it('caps catch-up so a long stall does not fast-forward the run', () => {
    const { s } = make();
    s.start(defaultConfig());
    s.advance(STEP * 100);
    expect(s.game?.ticks).toBe(MAX_CATCHUP_STEPS);
  });
  it('alpha is the interpolation factor between steps and 1 when not playing', () => {
    const { s } = make();
    s.start(defaultConfig());
    s.advance(STEP * 1.5);
    expect(s.alpha).toBeCloseTo(0.5, 6);
    s.pause();
    expect(s.alpha).toBe(1);
  });
  it('reports the end once and moves to the ended phase', () => {
    const { s, ends } = make();
    s.start(defaultConfig({ mode: 'ultra' }));
    if (s.game) s.game.ticks = (s.game.rules.timeLimitTicks ?? 0) - 1;
    s.advance(STEP * 4);
    expect(s.phase).toBe('ended');
    expect(ends).toEqual(['time']);
    s.advance(1);
    expect(ends).toHaveLength(1);
  });
  it('records the previous piece snapshot for interpolation', () => {
    const { s } = make();
    s.start(defaultConfig());
    s.advance(STEP);
    expect(s.prev).not.toBeNull();
  });
});
