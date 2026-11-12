import { describe, it, expect, vi } from 'vitest';
import { STATE_TRANSITIONS, canTransition, canPause, transitionState } from '../stateMachine.js';
import { canAutoPause, countdownNumber, escAction } from '../pauseMath.js';
import { FLOW } from '../tuning.js';

describe('state transition table', () => {
  it('allows the real game flow', () => {
    const flow = [['loading', 'title'], ['title', 'running'], ['running', 'crashed'], ['crashed', 'gameover'], ['gameover', 'running'], ['gameover', 'title'],
      ['running', 'stumble'], ['stumble', 'running'], ['running', 'gameover'], ['running', 'paused'], ['paused', 'running'], ['paused', 'stumble'], ['paused', 'title'], ['stumble', 'paused']];
    for (const [a, b] of flow) expect(canTransition(a, b), `${a} -> ${b}`).toBe(true);
  });
  it('forbids moves that would corrupt a run', () => {
    const bad = [['title', 'crashed'], ['crashed', 'running'], ['crashed', 'paused'], ['gameover', 'paused'], ['paused', 'gameover'], ['title', 'paused'], ['loading', 'running'], ['running', 'title']];
    for (const [a, b] of bad) expect(canTransition(a, b), `${a} -> ${b}`).toBe(false);
    expect(canTransition('nope', 'title')).toBe(false);
  });
  it('lists only known targets', () => {
    for (const targets of Object.values(STATE_TRANSITIONS)) for (const t of targets) expect(STATE_TRANSITIONS).toHaveProperty(t);
  });
  it('pauses only live play (not the crash cut-scene or menus)', () => {
    expect(canPause('running')).toBe(true);
    expect(canPause('stumble')).toBe(true);
    for (const s of ['title', 'crashed', 'gameover', 'paused', 'loading']) expect(canPause(s)).toBe(false);
  });
});

describe('transitionState guard', () => {
  it('moves and notifies on a legal request', () => {
    const game = { state: 'title' };
    const seen = vi.fn();
    expect(transitionState(game, 'running', seen)).toBe(true);
    expect(game.state).toBe('running');
    expect(seen).toHaveBeenCalledWith('title', 'running');
  });
  it('logs loudly and stays put on an illegal request', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const game = { state: 'crashed' };
    expect(transitionState(game, 'running')).toBe(false);
    expect(game.state).toBe('crashed');
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
  it('ignores a request for the current state', () => {
    const game = { state: 'running' };
    expect(transitionState(game, 'running')).toBe(false);
  });
});

describe('pause rules', () => {
  it('auto-pauses only mid-run and outside dialogs (so a blur never forfeits anything else)', () => {
    expect(canAutoPause({ state: 'running' })).toBe(true);
    expect(canAutoPause({ state: 'stumble' })).toBe(true);
    expect(canAutoPause({ state: 'running', menuOpen: true })).toBe(false);
    expect(canAutoPause({ state: 'running', resumeGrace: 0.4 })).toBe(true); // a blur during the 3-2-1 pauses again
    for (const s of ['title', 'gameover', 'crashed', 'paused']) expect(canAutoPause({ state: s })).toBe(false);
  });
  it('counts 3-2-1 over the resume grace', () => {
    expect(countdownNumber(FLOW.resumeGraceS)).toBe(3);
    expect(countdownNumber(FLOW.resumeGraceS * 0.5)).toBe(2);
    expect(countdownNumber(FLOW.resumeGraceS * 0.2)).toBe(1);
    expect(countdownNumber(0)).toBe(0);
    expect(countdownNumber(-1)).toBe(0);
  });
  it('layers Esc: settings, then the overlay, then game over; a live run only pauses', () => {
    expect(escAction({ state: 'paused', menuOpen: true })).toBe('closeSettings');
    expect(escAction({ state: 'paused', menuOpen: false })).toBe('pauseBack');
    expect(escAction({ state: 'gameover', menuOpen: false })).toBe('toTitle');
    expect(escAction({ state: 'running', menuOpen: false })).toBe('pause');
    expect(escAction({ state: 'title', menuOpen: false })).toBe('none');
    expect(escAction({ state: 'crashed', menuOpen: false })).toBe('none');
  });
  it('keeps the crash skip and the restart guard separate from the default 2 s ragdoll', () => {
    expect(FLOW.crashSkipAtS).toBeLessThan(2);
    expect(FLOW.overInputGuardS).toBeGreaterThan(0);
  });
});
