import { describe, expect, it } from 'vitest';
import { hudModel, MAX_LIFE_ICONS } from '../src/hud';
import type { HudState } from '../src/hud';
import { createWorld } from '../src/world';
import { newScore } from '../src/scoring';

function state(over: Partial<HudState> = {}): HudState {
  const world = createWorld(1, { score: newScore(), seed: 1 });
  return { world, level: 1, lives: 3, score: 70, hi: 1234, muted: false, demo: false, time: 0, calm: false, ...over };
}

describe('hudModel', () => {
  it('pads score and hi to six digits', () => {
    const m = hudModel(state());
    expect(m.score).toBe('000070');
    expect(m.hi).toBe('001234');
  });
  it('caps life icons', () => {
    expect(hudModel(state({ lives: 12 })).lives).toBe(MAX_LIFE_ICONS);
  });
  it('hides the water meter without a drench and fills it with one', () => {
    const s = state();
    expect(hudModel(s).drench).toBe(0);
    s.world.drench.left = s.world.tuning.drenchSec;
    expect(hudModel(s).drench).toBe(1);
    expect(hudModel(s).drenchWarn).toBe(false);
  });
  it('warns steadily (no strobe) under reduced motion when the drench is nearly over', () => {
    const s = state({ calm: true });
    s.world.drench.left = 0.4;
    expect(hudModel(s).drenchWarn).toBe(true);
    expect(hudModel(s).drenchWarn).toBe(true);
  });
  it('flags grooming only during a real rest', () => {
    const s = state();
    s.world.clock.phase = 'rest';
    expect(hudModel(s).grooming).toBe(true);
    expect(hudModel({ ...s, demo: true }).grooming).toBe(false);
  });
});
