// Scoring: line clears, twists, combo, back-to-back, all-clear.
import { dropPoints, TUNINGS, type ScoreTables } from '../config/tuning';
import type { TwistKind } from './twist';

export interface ScoreContext {
  lines: number;
  twist: TwistKind;
  level: number;
  combo: number; // consecutive clearing locks before this one (-1 = none)
  b2b: boolean; // previous difficult clear still "live"
  allClear: boolean;
  tables?: ScoreTables; // defaults to the classic ladder
}

export interface ScoreResult {
  points: number;
  combo: number;
  b2b: boolean;
  difficult: boolean;
  b2bApplied: boolean;
  label: string;
}

export function clearLabel(lines: number, twist: TwistKind): string {
  const names = ['', 'Single', 'Double', 'Triple', 'Quad'];
  const base = names[lines] ?? '';
  if (twist === 'twist') return lines ? `Twist ${base}` : 'Twist';
  if (twist === 'mini') return lines ? `Mini Twist ${base}` : 'Mini Twist';
  return base;
}

export function scoreLock(c: ScoreContext): ScoreResult {
  const t = c.tables ?? TUNINGS.classic.scores;
  const lines = Math.min(4, Math.max(0, c.lines));
  const table = c.twist === 'twist' ? t.twist : c.twist === 'mini' ? t.mini : t.line;
  let points = (table[lines] ?? 0) * c.level;
  const difficult = lines > 0 && (lines === 4 || c.twist !== 'none');
  const b2bApplied = difficult && c.b2b;
  if (b2bApplied) points += Math.floor((points * t.b2bPercent) / 100);
  const combo = lines > 0 ? c.combo + 1 : -1;
  if (combo > 0) points += t.comboStep * combo * c.level;
  if (c.allClear && lines > 0) points += (t.allClear[lines] ?? 0) * c.level;
  const b2b = lines > 0 ? difficult : c.b2b;
  return { points, combo, b2b, difficult, b2bApplied, label: clearLabel(lines, c.twist) };
}

export const softDropPoints = (rows: number): number => rows * dropPoints.softPerRow;
export const hardDropPoints = (rows: number): number => rows * dropPoints.hardPerRow;
