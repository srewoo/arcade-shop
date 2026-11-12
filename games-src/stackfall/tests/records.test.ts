import { describe, expect, it } from 'vitest';
import { beatsRecord, liveBest, pace, recordDelta, RecordBook, recordValue, type ResultInfo } from '../src/records';
import { EMPTY_RECORDS } from '../src/settings';

const info = (o: Partial<ResultInfo> = {}): ResultInfo => ({ mode: 'marathon', status: 'over', score: 1000, lines: 20, ticks: 3600, pieces: 60, level: 3, seed: 5, ...o });

describe('record semantics (STACKFALL-21)', () => {
  it('a quit run never sets a record', () => {
    expect(recordValue(info({ status: 'quit' }))).toBeNull();
    expect(recordValue(info({ mode: 'ultra', status: 'quit', score: 9999 }))).toBeNull();
  });
  it('Zen keeps no records', () => {
    expect(recordValue(info({ mode: 'zen', status: 'over', score: 99999 }))).toBeNull();
    expect(beatsRecord(info({ mode: 'zen' }), EMPTY_RECORDS)).toBe(false);
  });
  it('score modes record finished runs; time modes need a win', () => {
    expect(recordValue(info())).toBe(1000);
    expect(recordValue(info({ mode: 'sprint', status: 'over' }))).toBeNull();
    expect(recordValue(info({ mode: 'sprint', status: 'won', ticks: 3600 }))).toBe(60000);
    expect(recordValue(info({ score: 0 }))).toBeNull();
  });
  it('RecordBook commits only better runs and reports the previous best', () => {
    const saved: unknown[] = [];
    const book = new RecordBook({ ...EMPTY_RECORDS, marathon: 500 }, (r) => saved.push(r));
    expect(book.commit(info({ score: 400 }))).toEqual({ previous: 500, newBest: false });
    expect(saved).toHaveLength(0);
    expect(book.commit(info({ score: 900 }))).toEqual({ previous: 500, newBest: true });
    expect(book.records.marathon).toBe(900);
    expect(saved).toHaveLength(1);
  });
  it('delta against the previous best, for scores and times', () => {
    expect(recordDelta(info({ score: 1500 }), 1000)).toEqual({ kind: 'score', amount: 500, better: true });
    expect(recordDelta(info({ score: 800 }), 1000)).toEqual({ kind: 'score', amount: 200, better: false });
    const faster = recordDelta(info({ mode: 'sprint', status: 'won', ticks: 3000 }), 60000);
    expect(faster).toEqual({ kind: 'time', amount: 10000, better: true });
    const slower = recordDelta(info({ mode: 'sprint', status: 'won', ticks: 4200 }), 60000);
    expect(slower).toEqual({ kind: 'time', amount: 10000, better: false });
    expect(recordDelta(info(), null)).toBeNull();
  });
  it('pace: shapes per second and lines per minute', () => {
    const p = pace(info({ ticks: 3600, pieces: 120, lines: 30 }));
    expect(p.pps).toBeCloseTo(2, 6);
    expect(p.lpm).toBeCloseTo(30, 6);
    expect(pace(info({ ticks: 0, pieces: 0, lines: 0 })).pps).toBe(0);
  });
  it('live best follows the score once the record is passed, and Zen shows none', () => {
    expect(liveBest('marathon', 1000, 400)).toEqual({ value: 1000, passed: false });
    expect(liveBest('marathon', 1000, 1200)).toEqual({ value: 1200, passed: true });
    expect(liveBest('marathon', null, 50)).toEqual({ value: null, passed: false });
    expect(liveBest('zen', 5, 99)).toEqual({ value: null, passed: false });
    expect(liveBest('sprint', 60000, 99999)).toEqual({ value: 60000, passed: false });
  });
});
