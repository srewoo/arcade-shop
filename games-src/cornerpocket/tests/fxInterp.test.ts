import { describe, expect, it } from 'vitest';
import { FX } from '../src/config/fx';
import { BALL_R, STEP } from '../src/constants';
import { Fx, compact, nearestPocket } from '../src/fx';
import { Game } from '../src/game';
import { numberMetrics } from '../src/renderBalls';
import { timerSpeech } from '../src/srTimer';

describe('render interpolation', () => {
  it('draws between the previous and current step while rolling', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    g.shoot({ angle: 0, power: 0.6, spin: 0 });
    g.update(STEP * 3.5); // three whole steps and half a step left over
    expect(g.alpha).toBeCloseTo(0.5, 5);
    const p = g.drawPos(0);
    expect(p.x).toBeGreaterThan(g.prevX[0]!);
    expect(p.x).toBeLessThan(g.cue.x);
    expect(p.x).toBeCloseTo(g.prevX[0]! + (g.cue.x - g.prevX[0]!) * g.alpha, 9);
  });
  it('is exact when nothing is rolling', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    expect(g.alpha).toBe(1);
    expect(g.drawPos(0)).toEqual({ x: g.cue.x, y: g.cue.y });
  });
  it('never changes the simulation: sampling the draw position gives identical tables', () => {
    const run = (sample: boolean): string => {
      const g = new Game({ mode: 'duo', level: 'easy' });
      g.shoot({ angle: 0.02, power: 1, spin: 0.5 });
      let guard = 0;
      while (g.phase === 'rolling' && guard++ < 5000) { g.update(1 / 144); if (sample) g.balls.forEach((_, i) => g.drawPos(i)); }
      return JSON.stringify(g.balls);
    };
    expect(run(true)).toBe(run(false));
  });
  it('does not smear a pocketed ball', () => {
    const g = new Game({ mode: 'rack', level: 'easy', seed: 1 });
    g.shoot({ angle: 0, power: 0.3, spin: 0 });
    g.update(STEP * 1.5);
    g.balls[1]!.pocketed = true;
    expect(g.drawPos(1)).toEqual({ x: g.balls[1]!.x, y: g.balls[1]!.y });
  });
});

describe('Fx', () => {
  it('compacts arrays in place without allocating', () => {
    const a = [1, 2, 3, 4, 5, 6];
    const ref = a;
    compact(a, (n) => n % 2 === 0);
    expect(a).toBe(ref);
    expect(a).toEqual([1, 3, 5]);
  });
  it('full motion: sparkle, drop, strike and shake all produce effects that expire', () => {
    const fx = new Fx(false);
    fx.sparkle(100, 100, '#fff'); fx.drop(10, 10, 3); fx.strike(200, 200, 1); fx.scratchShake();
    expect(fx.particles.length).toBe(FX.particles);
    expect(fx.flash.length).toBe(2);
    expect(fx.drops.length).toBe(1);
    expect(fx.shake).toBe(FX.shakeSeconds);
    for (let i = 0; i < 40; i++) fx.update(0.05);
    expect(fx.particles.length + fx.flash.length + fx.drops.length).toBe(0);
    expect(fx.shake).toBe(0);
  });
  it('reduced motion: no particles, flashes, drops, strike or shake; text stays and holds longer', () => {
    const fx = new Fx(true);
    fx.sparkle(100, 100, '#fff'); fx.drop(10, 10, 3); fx.strike(200, 200, 1); fx.scratchShake();
    fx.say('Miss', 'bad');
    expect(fx.particles.length + fx.flash.length + fx.drops.length).toBe(0);
    expect(fx.shake).toBe(0);
    expect(fx.texts[0]!.max).toBe(FX.textSecondsReduced);
  });
  it('a dropped ball heads for the nearest pocket', () => {
    expect(nearestPocket(30, 20)).toMatchObject({ x: 0, y: 0 });
    expect(nearestPocket(420, 390)).toMatchObject({ x: 400, y: 400 });
    const fx = new Fx(false);
    fx.drop(790, 10, 5);
    expect(fx.drops[0]).toMatchObject({ tx: 800, ty: 0 });
  });
  it('caps the floating text stack', () => {
    const fx = new Fx(false);
    for (let i = 0; i < 9; i++) fx.say(String(i), 'info');
    expect(fx.texts.length).toBe(FX.maxTexts);
  });
});

describe('ball number legibility', () => {
  it('keeps numbers at least 8 screen px tall at phone scale, original size at desktop scale', () => {
    for (const scale of [0.4, 0.5, 0.6, 0.688]) {
      const m = numberMetrics(scale, false);
      expect(m.font * scale).toBeGreaterThanOrEqual(Math.min(8, BALL_R * 1.4 * scale) - 1e-9);
      expect(m.badge).toBeLessThanOrEqual(BALL_R * 0.85 + 1e-9);
    }
    expect(numberMetrics(1.1, false).font * 1.1).toBeGreaterThanOrEqual(BALL_R * 0.7 * 1.1 - 1e-9); // desktop never shrinks
    expect(numberMetrics(0.5, true).font).toBeGreaterThanOrEqual(numberMetrics(0.5, false).font);
  });
  it('phone portrait numbers grew from 3.5 px to at least 7.9 px', () => {
    expect(numberMetrics(0.592, false).font * 0.592).toBeGreaterThan(7.9);
    expect(0.7 * BALL_R * 0.499).toBeLessThan(3.6);
  });
});

describe('screen-reader timer reuse', () => {
  it('is imported without side effects', () => { expect(timerSpeech(null, 12)).toBe('12 seconds left'); });
});
