import { describe, expect, it } from 'vitest';
import { buildEndModel, type EndInput } from '../src/ui/endModel';

const base: EndInput = {
  status: 'won', assisted: false, elapsedMs: 125_000, finalScore: 4200, mistakes: 1, hintsUsed: 2,
  dashBreakdown: { base: 3000, bonus: 1200, bestCombo: 5 },
};
const none = { newTime: false, newScore: false };

describe('end card model', () => {
  it('leads with the Dash score and keeps the time in the breakdown', () => {
    const m = buildEndModel(base, none);
    expect(m.hero).toEqual({ label: 'Score', value: '4200' });
    expect(m.rows.map((r) => r[0])).toEqual(['Time', 'Digits', 'Time bonus', 'Best combo', 'Mistakes', 'Hints']);
    expect(m.badges).toEqual([]);
  });

  it('leads with the score for a Classic win and the time for a Classic loss', () => {
    expect(buildEndModel({ ...base, dashBreakdown: null }, none).hero).toEqual({ label: 'Score', value: '4200' });
    expect(buildEndModel({ ...base, dashBreakdown: null, status: 'lost' }, none).hero).toEqual({ label: 'Time', value: '2:05' });
  });

  it('drops the Dash breakdown when the solver was used', () => {
    const solver = buildEndModel({ ...base, assisted: true }, none);
    expect(solver.rows.map((r) => r[0])).toEqual(['Time', 'Mistakes', 'Hints']);
  });

  it('turns records into badges rather than stat tiles', () => {
    const m = buildEndModel(base, { newTime: true, newScore: true });
    expect(m.badges).toEqual(['Best time', 'Best score']);
    expect(m.rows.some((r) => r[0] === 'Record')).toBe(false);
  });

  it('floors the best combo at x1', () => {
    const m = buildEndModel({ ...base, dashBreakdown: { base: 0, bonus: 0, bestCombo: 0 } }, none);
    expect(m.rows.find((r) => r[0] === 'Best combo')?.[1]).toBe('x1');
  });
});
