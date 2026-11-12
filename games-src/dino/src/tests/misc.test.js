import { describe, it, expect, vi } from 'vitest';
import { createEmitter } from '../events.js';
import { createTelemetry, recordDeath, summarize } from '../telemetry.js';
import { pickupBurstCount, confettiCount } from '../juice.js';
import { PowerupState, EXPIRY_WARN_S, POWERUPS } from '../powerups.js';
import { JUICE } from '../tuning.js';
import { ctaText } from '../strings.js';

describe('event emitter', () => {
  it('delivers payloads to every subscriber and supports unsubscribe', () => {
    const e = createEmitter();
    const a = vi.fn(), b = vi.fn();
    const off = e.on('score', a);
    e.on('score', b);
    e.emit('score', 7);
    off();
    e.emit('score', 8);
    expect(a.mock.calls).toEqual([[7]]);
    expect(b.mock.calls).toEqual([[7], [8]]);
    expect(() => e.emit('nothing')).not.toThrow();
  });
});

describe('balance telemetry', () => {
  it('counts deaths by kind and the median time to death', () => {
    const t = createTelemetry();
    recordDeath(t, 'cactus', 6.04);
    recordDeath(t, 'cactus', 12);
    recordDeath(t, 'meteor', 30);
    recordDeath(t, null, 3);
    expect(summarize(t)).toEqual({ runs: 4, byKind: { cactus: 2, meteor: 1, none: 1 }, medianS: 12 });
    expect(summarize(createTelemetry())).toEqual({ runs: 0, byKind: {}, medianS: 0 });
  });
  it('keeps a bounded history', () => {
    const t = createTelemetry();
    for (let i = 0; i < 600; i++) recordDeath(t, 'cactus', i);
    expect(t.timesToDeath.length).toBe(500);
  });
});

describe('juice budgets', () => {
  it('cuts every burst under reduced motion', () => {
    expect(pickupBurstCount({ reduced: true })).toBe(0);
    expect(confettiCount({ reduced: true })).toBe(0);
  });
  it('scales down on quality low and on mobile', () => {
    expect(pickupBurstCount()).toBe(JUICE.pickupBurst);
    expect(pickupBurstCount({ quality: 'low' })).toBe(JUICE.pickupBurst / 2);
    expect(pickupBurstCount({ mobile: true })).toBeLessThan(JUICE.pickupBurst);
    expect(confettiCount({ quality: 'low', mobile: true })).toBeLessThan(confettiCount());
  });
});

describe('power-up timers (feedback hooks)', () => {
  it('reports expiry without allocating on quiet frames', () => {
    const p = new PowerupState();
    const quiet = p.update(0.1);
    expect(quiet).toEqual([]);
    expect(p.update(0.1)).toBe(quiet); // the shared empty list
    p.grant('slowmo');
    expect(p.update(POWERUPS.slowmo.duration + 0.1)).toEqual(['slowmo']);
    expect(p.has('slowmo')).toBe(false);
  });
  it('flags the last seconds of an active power-up', () => {
    const p = new PowerupState();
    p.grant('score2');
    expect(p.expiring('score2')).toBe(false);
    p.update(POWERUPS.score2.duration - EXPIRY_WARN_S + 0.01);
    expect(p.expiring('score2')).toBe(true);
    expect(p.expiring('shield')).toBe(false);
  });
});

describe('title call-to-action', () => {
  it('names the key that really starts the run', () => {
    expect(ctaText(false, false)).toBe('PRESS SPACE TO RUN');
    expect(ctaText(true, false)).toBe('PRESS ENTER ON START');
    expect(ctaText(false, true)).toBe('TAP START TO RUN');
  });
});
