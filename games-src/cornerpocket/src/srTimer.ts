// Screen-reader countdown: announced every 10 s and at 5, 3, 2, 1, never ten times a second.
import { STR } from './strings';

const SPOKEN = new Set([5, 3, 2, 1]);

/** Text to put in the timer element, or null to leave it unchanged. */
export function timerSpeech(prev: number | null, cur: number | null): string | null {
  if (cur === null) return null;
  const now = Math.ceil(cur);
  if (prev === null) return STR.srTimer(now);
  const before = Math.ceil(prev);
  if (now === before || now <= 0) return null;
  return now % 10 === 0 || SPOKEN.has(now) ? STR.srTimer(now) : null;
}
