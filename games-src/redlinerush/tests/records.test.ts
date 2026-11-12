import { describe, expect, it } from 'vitest';
import { applyRun, dailyBest, EMPTY_RECORDS, parseRecords } from '../src/records';

const run = { mode: 'endless', score: 100, outcome: 'crash', runTime: 20, day: '2026-11-11' } as const;

describe('records', () => {
  it('parses per field with fallbacks', () => {
    expect(parseRecords('junk')).toEqual(EMPTY_RECORDS);
    const r = parseRecords({ endless: 500, trial: -3, trialTime: 'x', daily: 7.5, dailyDay: '2026-11-11' });
    expect(r.endless).toBe(500);
    expect(r.trial).toBe(0);
    expect(r.trialTime).toBe(0);
    expect(r.daily).toBe(0);
    expect(r.dailyDay).toBe('2026-11-11');
  });
  it('rejects a malformed day string', () => {
    expect(parseRecords({ dailyDay: 'yesterday' }).dailyDay).toBe('');
  });
  it('endless best only rises', () => {
    const a = applyRun(EMPTY_RECORDS, run);
    expect(a.newBest).toBe(true);
    expect(a.records.endless).toBe(100);
    const b = applyRun(a.records, { ...run, score: 50 });
    expect(b.newBest).toBe(false);
    expect(b.records.endless).toBe(100);
  });
  it('daily best belongs to its day', () => {
    const a = applyRun(EMPTY_RECORDS, { ...run, mode: 'daily', score: 300 });
    expect(dailyBest(a.records, '2026-11-11')).toBe(300);
    expect(dailyBest(a.records, '2026-11-12')).toBe(0);
    const b = applyRun(a.records, { ...run, mode: 'daily', score: 10, day: '2026-11-12' });
    expect(b.newBest).toBe(true);
    expect(b.records.dailyDay).toBe('2026-11-12');
  });
  it('trial keeps the fastest finish only for finished runs', () => {
    const a = applyRun(EMPTY_RECORDS, { ...run, mode: 'trial', outcome: 'time', score: 50, runTime: 30 });
    expect(a.records.trialTime).toBe(0);
    const b = applyRun(a.records, { ...run, mode: 'trial', outcome: 'finish', score: 900, runTime: 80.123 });
    expect(b.records.trialTime).toBe(80.12);
    const c = applyRun(b.records, { ...run, mode: 'trial', outcome: 'finish', score: 800, runTime: 90 });
    expect(c.records.trialTime).toBe(80.12);
  });
});
