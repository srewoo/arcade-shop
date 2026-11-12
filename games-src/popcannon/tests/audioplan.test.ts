import { describe, expect, it } from 'vitest';
import { comboSemis, note, soundPlan } from '../src/audioPlan';
import { EventType } from '../src/state';

const ALL: EventType[] = [
  'fire', 'swap', 'stick', 'pop', 'bomb', 'fall', 'ceiling', 'levelup', 'win', 'lose', 'finish',
  'warn', 'danger', 'tick', 'ui', 'start', 'pause', 'resume', 'best', 'star', 'locked',
];

describe('sound plan', () => {
  it('every event type has at least one voice with sane numbers', () => {
    for (const type of ALL) {
      const voices = soundPlan({ type, n: 5, combo: 2 });
      expect(voices.length, type).toBeGreaterThan(0);
      for (const v of voices) {
        expect(v.freq).toBeGreaterThan(0);
        expect(v.dur).toBeGreaterThan(0);
        expect(v.vol).toBeGreaterThan(0);
        expect(v.vol).toBeLessThanOrEqual(0.5);
        expect(v.delay ?? 0).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('pop pitch climbs with the combo', () => {
    const f = (combo: number): number => soundPlan({ type: 'pop', n: 3, combo })[0]?.freq ?? 0;
    expect(f(1)).toBeLessThan(f(2));
    expect(f(2)).toBeLessThan(f(5));
    expect(comboSemis(1)).toBe(0);
    expect(comboSemis(3)).toBe(4);
    expect(comboSemis(50)).toBe(12);
  });
  it('bigger groups ring more notes, up to four', () => {
    expect(soundPlan({ type: 'pop', n: 3 }).length).toBe(1);
    expect(soundPlan({ type: 'pop', n: 5 }).length).toBe(3);
    expect(soundPlan({ type: 'pop', n: 30 }).length).toBe(4);
  });
  it('stars rise in pitch', () => {
    const f = (n: number): number => soundPlan({ type: 'star', n })[0]?.freq ?? 0;
    expect(f(1)).toBeLessThan(f(3));
  });
  it('the worst stacked burst stays under unity before the compressor', () => {
    const burst = [...soundPlan({ type: 'bomb', n: 9 }), ...soundPlan({ type: 'fall', n: 6 }), ...soundPlan({ type: 'pop', n: 9, combo: 5 })];
    const sum = burst.reduce((a, v) => a + v.vol, 0);
    expect(sum * 0.7).toBeLessThan(1.0);
  });
  it('note maths', () => {
    expect(note(440, 12)).toBeCloseTo(880);
    expect(note(440, 0)).toBe(440);
  });
});
