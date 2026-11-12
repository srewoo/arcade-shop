// Pure model of the end card: one hero figure, record badges, then the smaller breakdown.
import { formatElapsed } from '../core/scoring';
import type { Records } from '../bests';

export interface EndInput {
  readonly status: string;
  readonly assisted: boolean;
  readonly elapsedMs: number;
  readonly finalScore: number;
  readonly mistakes: number;
  readonly hintsUsed: number;
  readonly dashBreakdown: { readonly base: number; readonly bonus: number; readonly bestCombo: number } | null;
}

export interface EndModel {
  readonly hero: { readonly label: string; readonly value: string };
  readonly badges: readonly string[];
  readonly rows: readonly (readonly [string, string])[];
}

/** Hero is the score whenever the run has one (Dash, or a Classic win), otherwise the time. */
export function buildEndModel(s: EndInput, rec: Records): EndModel {
  const dash = s.dashBreakdown;
  const hasScore = s.status === 'won' || dash !== null;
  const hero = hasScore ? { label: 'Score', value: String(s.finalScore) } : { label: 'Time', value: formatElapsed(s.elapsedMs) };
  const rows: [string, string][] = [];
  if (hasScore) rows.push(['Time', formatElapsed(s.elapsedMs)]);
  if (dash && !s.assisted) {
    rows.push(['Digits', String(dash.base)], ['Time bonus', String(dash.bonus)], ['Best combo', `x${Math.max(1, dash.bestCombo)}`]);
  }
  rows.push(['Mistakes', String(s.mistakes)], ['Hints', String(s.hintsUsed)]);
  const badges: string[] = [];
  if (rec.newTime) badges.push('Best time');
  if (rec.newScore) badges.push('Best score');
  return { hero, badges, rows };
}
