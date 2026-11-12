// Mode rules (pure data) and level/gravity helpers.
import { framesPerRow, LINES_PER_LEVEL, MAX_LEVEL, TICKS_PER_SECOND, TUNINGS, type Tuning } from '../config/tuning';

export { framesPerRow, MAX_LEVEL, TICKS_PER_SECOND };
export type ModeId = 'marathon' | 'sprint' | 'ultra' | 'zen' | 'dig';
export const MODE_IDS: readonly ModeId[] = ['marathon', 'sprint', 'ultra', 'zen', 'dig'];

export interface ModeRules {
  readonly id: ModeId;
  readonly label: string;
  readonly blurb: string;
  readonly goalLines: number | null;
  readonly timeLimitTicks: number | null;
  readonly gameOver: boolean;
  readonly progression: boolean; // level rises with lines
  readonly fixedLevel: number;
  readonly digRows: number;
  readonly best: 'score' | 'time'; // what a record means
}

const base = { goalLines: null, timeLimitTicks: null, gameOver: true, progression: false, fixedLevel: 1, digRows: 0 };

export const MODES: Record<ModeId, ModeRules> = {
  marathon: { ...base, id: 'marathon', label: 'Marathon', blurb: 'Clear 150 lines through levels 1 to 15.', goalLines: 150, progression: true, best: 'score' },
  sprint: { ...base, id: 'sprint', label: 'Sprint', blurb: 'Clear 40 lines as fast as you can.', goalLines: 40, fixedLevel: 3, best: 'time' },
  ultra: { ...base, id: 'ultra', label: 'Ultra', blurb: 'Score as much as possible in 2 minutes.', timeLimitTicks: 120 * TICKS_PER_SECOND, progression: true, best: 'score' },
  zen: { ...base, id: 'zen', label: 'Zen', blurb: 'No game over. Relax, or switch on rising garbage.', gameOver: false, best: 'score' },
  dig: { ...base, id: 'dig', label: 'Dig', blurb: 'Clear every garbage block from the pre-filled well.', fixedLevel: 2, digRows: 10, best: 'time' },
};

export function levelFor(rules: ModeRules, startLevel: number, lines: number, tuning: Tuning = TUNINGS.classic): number {
  if (rules.progression) return Math.min(tuning.maxLevel, startLevel + Math.floor(lines / LINES_PER_LEVEL));
  if (rules.id === 'sprint' && tuning.sprintLinesPerLevel !== null) {
    return Math.min(tuning.maxLevel, 1 + Math.floor(lines / tuning.sprintLinesPerLevel));
  }
  return rules.fixedLevel;
}
