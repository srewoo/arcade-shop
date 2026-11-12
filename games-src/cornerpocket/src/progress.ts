// Pure progress update after a game ends.
import type { OverInfo } from './gameTypes';
import type { Progress } from './settings';

export function recordResult(p: Progress, info: OverInfo): Progress {
  const out: Progress = { ...p, stars: [...p.stars] };
  if (info.mode === 'rack') {
    out.rackHigh = Math.max(out.rackHigh, info.score ?? 0);
    out.rackBest = Math.max(out.rackBest, info.rack ?? 0);
  } else if (info.mode === 'trick' && info.trick !== undefined) {
    out.stars[info.trick] = Math.max(out.stars[info.trick] ?? 0, info.stars ?? 0);
  } else if (info.mode === 'cpu') {
    if (info.won) out.cpuWins++; else out.cpuLosses++;
  }
  return out;
}

/** Rack Attack: compare a finished run with the stored best before recording it. */
export function withBest(p: Progress, info: OverInfo): OverInfo {
  if (info.mode !== 'rack') return info;
  const score = info.score ?? 0;
  return { ...info, newBest: score > p.rackHigh, best: Math.max(p.rackHigh, score) };
}
