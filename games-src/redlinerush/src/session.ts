// Glue between a finished sim, the records store and the result screen.
import { applyRun, saveRecords, type Records } from './records';
import { score } from './sim';
import type { Sim } from './simTypes';

export function finishRun(s: Sim, records: Records, day: string): { records: Records; newBest: boolean } {
  const out = applyRun(records, { mode: s.mode, score: score(s), outcome: s.outcome ?? 'crash', runTime: s.runT, day });
  if (out.newBest || out.records.trialTime !== records.trialTime) saveRecords(out.records);
  return out;
}
