import { describe, expect, it } from 'vitest';
import { makeGrace } from '../src/grace';
import { Game } from '../src/game';
import { EightMode } from '../src/modes/eightMode';

describe('input grace', () => {
  it('blocks activations until the window has passed', () => {
    const g = makeGrace(600);
    expect(g.blocked(0)).toBe(false); // never armed
    g.arm(1000);
    expect(g.blocked(1100)).toBe(true);
    expect(g.blocked(1599)).toBe(true);
    expect(g.blocked(1600)).toBe(false);
  });
  it('re-arming restarts the window', () => {
    const g = makeGrace(600);
    g.arm(0); g.arm(5000);
    expect(g.blocked(5300)).toBe(true);
    expect(g.blocked(5600)).toBe(false);
  });
});

describe('8-ball ball-in-hand status', () => {
  it('shows the placement hint only while placing, not after the ball is placed', () => {
    const g = new Game({ mode: 'cpu', level: 'easy', seed: 1 });
    const m = g.ctl as EightMode;
    m.state = { ...m.state, current: 0, ballInHand: true };
    g.phase = 'place';
    expect(m.hud().status).toMatch(/Ball in hand/);
    g.confirmPlace();
    expect(g.phase).toBe('aim');
    expect(m.hud().status).not.toMatch(/Ball in hand/);
  });
});
