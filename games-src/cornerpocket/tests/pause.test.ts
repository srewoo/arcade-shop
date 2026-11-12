import { describe, expect, it } from 'vitest';
import { Game } from '../src/game';
import type { GameEvent } from '../src/gameTypes';
import { RackMode } from '../src/modes/rackMode';
import { EightMode } from '../src/modes/eightMode';
import { crossedTick, initialRack, tickRack } from '../src/rack';

const rack = (g: Game): RackMode => g.ctl as RackMode;

describe('pause state', () => {
  it('a paused game freezes the Rack Attack clock and the simulation', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    g.shoot({ angle: 0, power: 0.5, spin: 0 }); // starts the clock
    const before = rack(g).state.time;
    const x = g.cue.x;
    g.setPaused(true);
    for (let i = 0; i < 100; i++) g.update(0.05);
    expect(rack(g).state.time).toBe(before);
    expect(g.cue.x).toBe(x);
    g.setPaused(false);
    g.update(0.05);
    expect(rack(g).state.time).toBeLessThan(before);
  });

  it('refuses to shoot while paused and cannot pause a finished game', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    g.setPaused(true);
    expect(g.shoot({ angle: 0, power: 0.5, spin: 0 })).toBe(false);
    g.setPaused(false);
    g.phase = 'over';
    g.setPaused(true);
    expect(g.paused).toBe(false);
  });

  it('the CPU does not think or shoot while paused', () => {
    const g = new Game({ mode: 'cpu', level: 'pro', seed: 3 });
    (g.ctl as EightMode).state = { ...(g.ctl as EightMode).state, current: 1 };
    g.setPaused(true);
    for (let i = 0; i < 100; i++) g.update(0.1);
    expect(g.phase).toBe('aim');
    g.setPaused(false);
    for (let i = 0; i < 40; i++) g.update(0.1);
    expect(g.phase).not.toBe('aim');
  });
});

describe('Rack Attack clock starts on the first shot', () => {
  it('does not decrement before the first shot (35.0 s after 5 s idle)', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    expect(rack(g).hud().stats[0]!.value).toBe('35.0s');
    for (let i = 0; i < 50; i++) g.update(0.1); // 5 s idle
    expect(rack(g).state.time).toBe(35);
    expect(rack(g).clock()).toBeNull();
    g.shoot({ angle: 0, power: 0.4, spin: 0 });
    expect(rack(g).clock()).toBe(35);
    g.update(0.5);
    expect(rack(g).state.time).toBeLessThan(35);
  });

  it('tickRack ignores dt until started', () => {
    const s = initialRack();
    tickRack(s, 10);
    expect(s.time).toBe(35);
    s.started = true;
    tickRack(s, 10);
    expect(s.time).toBe(25);
  });

  it('the status line tells the player the clock waits', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    expect(g.ctl.hud().status).toMatch(/start the clock/);
  });
});

describe('time-low tick', () => {
  it('ticks once per second under 10 s and twice per second under 5 s', () => {
    let n = 0;
    for (let t = 12; t > 0; t -= 0.05) if (crossedTick(t, t - 0.05)) n++;
    // 1 Hz from 10 s to 5 s (5 ticks) + 2 Hz from 5 s to 0 (10 ticks), within one tick of rounding
    expect(n).toBeGreaterThanOrEqual(14);
    expect(n).toBeLessThanOrEqual(16);
  });
  it('is silent above 10 s, at zero and when time goes up', () => {
    expect(crossedTick(12, 11.2)).toBe(false);
    expect(crossedTick(0.3, 0)).toBe(false);
    expect(crossedTick(5, 6)).toBe(false);
  });
  it('RackMode emits tick sfx events as the clock crosses seconds', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    const ev: GameEvent[] = [];
    g.on((e) => ev.push(e));
    rack(g).state.started = true; rack(g).state.time = 6.2;
    for (let i = 0; i < 20; i++) g.update(0.1);
    expect(ev.filter((e) => e.t === 'sfx' && e.name === 'tick').length).toBeGreaterThan(2);
  });
});
