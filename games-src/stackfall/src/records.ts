// Run results and records (pure, no DOM).
import { MODES, TICKS_PER_SECOND, type ModeId } from './core/modes';
import { isBetter, type Records } from './settings';

export interface ResultInfo {
  mode: ModeId;
  status: 'won' | 'over' | 'time' | 'quit';
  score: number;
  lines: number;
  ticks: number;
  pieces: number;
  level: number;
  seed: number;
}

export const ticksToMs = (ticks: number): number => Math.round((ticks * 1000) / TICKS_PER_SECOND);

/**
 * Value that counts towards this mode's record, or null if the run does not qualify.
 * Quit runs never count, Zen keeps no records, time modes need a win.
 */
export function recordValue(r: ResultInfo): number | null {
  if (r.status === 'quit' || r.mode === 'zen') return null;
  if (MODES[r.mode].best === 'time') return r.status === 'won' ? Math.max(1, ticksToMs(r.ticks)) : null;
  return r.score > 0 ? r.score : null;
}

export const beatsRecord = (r: ResultInfo, records: Records): boolean => {
  const v = recordValue(r);
  return v !== null && isBetter(r.mode, v, records[r.mode]);
};

/** Difference against the previous best: positive `better` means improved. */
export interface RecordDelta { kind: 'score' | 'time'; amount: number; better: boolean }

export function recordDelta(r: ResultInfo, previous: number | null): RecordDelta | null {
  const v = recordValue(r);
  if (v === null || previous === null) return null;
  const isTime = MODES[r.mode].best === 'time';
  const diff = isTime ? previous - v : v - previous;
  return { kind: isTime ? 'time' : 'score', amount: Math.abs(isTime ? v - previous : diff), better: diff > 0 };
}

/** Shapes per second and lines per minute over the whole run. */
export function pace(r: ResultInfo): { pps: number; lpm: number } {
  const seconds = Math.max(1, r.ticks / TICKS_PER_SECOND);
  return { pps: r.pieces / seconds, lpm: (r.lines * 60) / seconds };
}

/** Best value shown live in the HUD for score modes: the record or the current score, whichever is higher. */
export function liveBest(mode: ModeId, record: number | null, score: number): { value: number | null; passed: boolean } {
  if (mode === 'zen') return { value: null, passed: false };
  if (MODES[mode].best === 'time') return { value: record, passed: false };
  const passed = record !== null && score > record;
  return { value: passed ? score : record, passed };
}

/** Holds the stored records and commits qualifying runs through `save`. */
export class RecordBook {
  constructor(public records: Records, private readonly save: (r: Records) => void) {}

  /** Record the run if it qualifies; returns the previous best and whether it was beaten. */
  commit(info: ResultInfo): { previous: number | null; newBest: boolean } {
    const previous = this.records[info.mode];
    const v = recordValue(info);
    if (v === null || !beatsRecord(info, this.records)) return { previous, newBest: false };
    this.records = { ...this.records, [info.mode]: v };
    this.save(this.records);
    return { previous, newBest: true };
  }
}
