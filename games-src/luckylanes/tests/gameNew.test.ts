import { describe, expect, it } from 'vitest';
import type { Banner } from '../src/announce';
import type { AudioEngine } from '../src/audio';
import { chooseShot } from '../src/cpu';
import { Game, type GameEvents } from '../src/game';
import { liveParticles } from '../src/particles';
import { knockedCount, simulate } from '../src/physics';
import { fullRack } from '../src/pins';
import { createRng } from '../src/rng';
import { analyseShot } from '../src/shotInfo';
import { TUNING } from '../src/tuning';
import type { Shot } from '../src/worldTypes';

const STRIKE: Shot = { x: 0, aim: -0.0045, power: 1, spin: 0 };

function spyAudio(): { audio: AudioEngine; calls: string[] } {
  const calls: string[] = [];
  const audio = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => { calls.push(`${name}(${args.join(',')})`); } }) as unknown as AudioEngine;
  return { audio, calls };
}

function make(seed = 1, ev: Partial<GameEvents> = {}): { game: Game; calls: string[]; banners: Banner[]; callouts: string[] } {
  const { audio, calls } = spyAudio();
  const banners: Banner[] = [];
  const callouts: string[] = [];
  const game = new Game(audio, { onChange: () => undefined, onBanner: (b) => banners.push(b), onOver: () => undefined, onCallout: (t) => callouts.push(t), ...ev }, seed);
  return { game, calls, banners, callouts };
}

const run = (g: Game, seconds: number): void => { for (let t = 0; t < seconds; t += 1 / 60) g.update(1 / 60); };

/** Seconds from throwing a gutter ball until the next human turn is ready. */
function turnaround(skip: boolean): number {
  const { game } = make(3);
  game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
  game.throwShot({ x: 0, aim: 0.07, power: 1, spin: 0 });
  let t = 0;
  for (; t < 30 && !(game.humanTurn && game.stage === 'ready' && game.match.rolls[0]?.length); t += 1 / 60) {
    if (skip) game.skip();
    game.update(1 / 60);
  }
  return t;
}

describe('pause', () => {
  it('freezes the simulation and the roll audio, then continues from the same state', () => {
    const { game, calls } = make();
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.throwShot(STRIKE);
    run(game, 0.4);
    expect(game.stage).toBe('rolling');
    game.setPaused(true);
    expect(calls).toContain('pause()');
    const t0 = game.stageT;
    const y0 = game.world.ball.y;
    run(game, 2);
    expect(game.stageT).toBe(t0);
    expect(game.world.ball.y).toBe(y0);
    game.setPaused(false);
    expect(calls).toContain('resume()');
    run(game, 0.2);
    expect(game.stageT).toBeGreaterThan(t0);
  });
  it('clears held keys and the drag trail, and blocks input while paused', () => {
    const { game } = make();
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.hold = 1;
    game.pres.dragTrail = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
    game.setPaused(true);
    expect(game.hold).toBe(0);
    expect(game.pres.dragTrail).toEqual([]);
    const before = game.input;
    game.confirm(); game.nudge(5); game.placeAt(9); game.back();
    game.throwShot(STRIKE);
    expect(game.input).toBe(before);
    expect(game.stage).toBe('ready');
    expect(game.skip()).toBe(false);
  });
  it('meters do not advance while paused (no timer runs in menus)', () => {
    const { game } = make();
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.confirm();
    run(game, 0.5);
    game.setPaused(true);
    const t = game.input.t;
    run(game, 3);
    expect(game.input.t).toBe(t);
  });
  it('starting a new game unpauses', () => {
    const { game } = make();
    game.setPaused(true);
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    expect(game.paused).toBe(false);
  });
});

describe('skip and fast CPU turns', () => {
  it('skipping the closing banner wait cuts the turn-around time', () => {
    const slow = turnaround(false);
    const fast = turnaround(true);
    expect(slow).toBeGreaterThan(2.5);
    expect(fast).toBeLessThan(slow - 0.8);
  });
  it('the pin-fall after a human throw cannot be skipped, then the banner can after its guard', () => {
    const { game } = make(3);
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.throwShot({ x: 0, aim: 0.07, power: 1, spin: 0 });
    for (let t = 0; t < 20 && game.stage !== 'settle'; t += 1 / 60) game.update(1 / 60);
    expect(game.stage).toBe('settle');
    expect(game.skip()).toBe(false);
    expect(game.canSkipNow).toBe(false);
    for (let t = 0; t < 5 && game.stage !== 'banner'; t += 1 / 60) game.update(1 / 60);
    expect(game.stage).toBe('banner');
    expect(game.skip()).toBe(false);
    run(game, 0.7);
    expect(game.canSkipNow).toBe(true);
    expect(game.skip()).toBe(true);
  });
  it('skip does not apply to a ball that is still rolling', () => {
    const { game } = make();
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.throwShot(STRIKE);
    expect(game.skip()).toBe(false);
  });
  it('fast CPU turns shorten the CPU rival waits', () => {
    const time = (fast: boolean): number => {
      const { game } = make(4);
      game.pacing.fastCpu = fast;
      game.start({ mode: 'cpu', players: 2, cpuLevel: 'casual' });
      let t = 0;
      let from = -1;
      for (; t < 90 && !(game.match.rolls[1]?.length); t += 1 / 60) {
        if (game.humanTurn) game.throwShot({ x: 0, aim: 0.07, power: 1, spin: 0 });
        game.update(1 / 60);
        if (from < 0 && game.stage === 'cpu') from = t;
      }
      return t - from;
    };
    expect(time(true)).toBeLessThan(time(false) * 0.7);
  });
});

describe('determinism of the physics', () => {
  it('hit-stop, interpolation and effects never change what the pins do', () => {
    const rng = createRng(31);
    for (let i = 0; i < 6; i++) {
      const shot = chooseShot(fullRack(), 'pro', rng);
      const expected = knockedCount(simulate(fullRack(), shot));
      const { game } = make(i + 1);
      game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
      game.throwShot(shot);
      run(game, 14);
      expect(game.match.rolls[0]?.[0]).toBe(expected);
    }
  });
  it('predicts a cleared rack exactly', () => {
    const rng = createRng(5);
    let clears = 0;
    for (let i = 0; i < 12; i++) {
      const shot = chooseShot(fullRack(), 'pro', rng);
      const info = analyseShot(fullRack(), shot);
      expect(info.clears).toBe(knockedCount(simulate(fullRack(), shot)) === 10);
      if (info.clears) clears++;
    }
    expect(clears).toBeGreaterThan(0);
  });
});

describe('impact juice', () => {
  const peakParticles = (reduced: boolean): { peak: number; shake: number } => {
    const { game } = make();
    game.pres.setReducedMotion(reduced);
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.throwShot(STRIKE);
    let peak = 0;
    let shake = 0;
    for (let t = 0; t < 8 && game.stage === 'rolling'; t += 1 / 120) {
      game.update(1 / 120);
      peak = Math.max(peak, liveParticles(game.pres.particles));
      shake = Math.max(shake, game.pres.juice.shake);
    }
    return { peak, shake };
  };
  it('a strike puts more than 25 particles up at impact and shakes the camera', () => {
    const r = peakParticles(false);
    expect(r.peak).toBeGreaterThan(25);
    expect(r.shake).toBeGreaterThanOrEqual(TUNING.juice.strikeShake);
  });
  it('reduced motion: no shake and 30% of the particles', () => {
    const full = peakParticles(false);
    const r = peakParticles(true);
    expect(r.shake).toBe(0);
    expect(r.peak).toBeLessThanOrEqual(Math.ceil(full.peak * 0.4));
  });
  it('hit-stop freezes stepping briefly on the first contact (not under reduced motion)', () => {
    const stops = (reduced: boolean): number => {
      const { game } = make();
      game.pres.setReducedMotion(reduced);
      game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
      game.throwShot(STRIKE);
      let max = 0;
      for (let t = 0; t < 8 && game.stage === 'rolling'; t += 1 / 120) { game.update(1 / 120); max = Math.max(max, game.pres.juice.hitStop); }
      return max;
    };
    expect(stops(false)).toBeGreaterThan(0.05);
    expect(stops(true)).toBe(0);
  });
});

describe('shot feedback and events', () => {
  it('calls out "pocket" for a human first ball that crosses the head-pin line near the pocket', () => {
    const { game, callouts } = make();
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.throwShot({ x: 9, aim: 0, power: 0.85, spin: 0 });
    expect(callouts).toEqual(['pocket']);
  });
  it('stays quiet for a gutter shot and reports each human throw once', () => {
    let throws = 0;
    const { game, callouts } = make(1, { onThrow: () => { throws++; } });
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.throwShot({ x: 0, aim: 0.07, power: 1, spin: 0 });
    expect(callouts).toEqual([]);
    expect(throws).toBe(1);
  });
  it('cues audio for meter locks, release and the strike crowd', () => {
    const { game, calls } = make();
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    game.confirm();
    expect(calls).toContain('tick(0)');
    game.confirm();
    expect(calls).toContain('tick(1)');
    game.throwShot(STRIKE);
    expect(calls).toContain('release()');
    run(game, 12);
    expect(calls.some((c) => c.startsWith('crowd'))).toBe(true);
    expect(calls.some((c) => c === 'jingle(strike)')).toBe(true);
  });
  it('every turn gets fresh meter offsets, so Space-mashing does not give the same shot twice', () => {
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) {
      const { game } = make(seed);
      game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
      game.confirm();
      firsts.add(game.input.aimU.toFixed(3));
    }
    expect(firsts.size).toBeGreaterThan(4);
  });
  it('wide-pocket assist flows into the next input', () => {
    const { game } = make();
    game.assist = true;
    game.start({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    expect(game.input.assist).toBe(true);
  });
  it('resize keeps the camera x and y', () => {
    const { game } = make();
    game.pres.cam.x = 7;
    game.pres.cam.y = 123;
    game.pres.resize(800, 500);
    expect(game.pres.cam.x).toBe(7);
    expect(game.pres.cam.y).toBe(123);
    expect(game.pres.size).toEqual({ w: 800, h: 500 });
  });
});
