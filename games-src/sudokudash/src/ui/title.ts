// Title / menu screen rendering.
import { BALANCE, DASH } from '../config/dash';
import { parSeconds } from '../core/balance';
import { DIFFICULTIES, type Difficulty } from '../core/grader';
import { formatClock, formatElapsed } from '../core/scoring';
import type { Bests } from '../bests';
import type { Settings } from '../storage';
import { dashRulesLines } from '../strings';
import { $ } from './dom';

const NOTES: Readonly<Record<Difficulty, string>> = {
  easy: 'Naked and hidden singles only.',
  medium: 'Needs pairs, pointing or claiming.',
  hard: 'Needs an X-wing. Can take a few seconds to build.',
  expert: 'Needs trial and error beyond the human techniques.',
};
const NAMES: Readonly<Record<Difficulty, string>> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };

export interface TitleInfo {
  readonly hasSaved: boolean;
  readonly dailyDone: boolean;
  readonly streak: number;
}

function parNote(s: Settings): string {
  const d = s.difficulty;
  if (s.mode !== 'dash') return '';
  const start = formatClock(DASH.startSeconds[d] * 1000);
  return ` Dash starts at ${start}; par is about ${formatElapsed(parSeconds(d) * 1000)} (${BALANCE.referencePace[d]}s per cell).`;
}

export function renderTitle(settings: Settings, bests: Bests, info: TitleInfo): void {
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="mode"]')) r.checked = r.value === settings.mode;
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="difficulty"]')) r.checked = r.value === settings.difficulty;
  $<HTMLInputElement>('opt-limit').checked = settings.mistakeLimit;
  $<HTMLInputElement>('opt-autonotes').checked = settings.autoRemoveNotes;
  $('difficulty-note').textContent = `${NOTES[settings.difficulty]}${parNote(settings)}`;
  $('btn-continue').hidden = !info.hasSaved;
  $('btn-daily').textContent = info.dailyDone ? 'Daily puzzle (done today)' : 'Daily puzzle';
  const streak = $('daily-streak');
  streak.hidden = info.streak === 0;
  streak.textContent = info.streak === 0 ? '' : `Daily streak: ${info.streak} day${info.streak === 1 ? '' : 's'}`;
  renderBests(bests);
}

function renderBests(bests: Bests): void {
  const none = 'none yet';
  $('bests-body').replaceChildren(
    ...DIFFICULTIES.map((d) => {
      const tr = document.createElement('tr');
      const b = bests[d];
      const cells = [
        NAMES[d],
        b.classicTimeMs === null ? none : formatElapsed(b.classicTimeMs),
        b.dashScore > 0 ? String(b.dashScore) : none,
        b.dashTimeMs === null ? none : formatElapsed(b.dashTimeMs),
      ];
      cells.forEach((text, i) => {
        const td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) td.setAttribute('scope', 'row');
        td.textContent = text;
        tr.append(td);
      });
      return tr;
    }),
  );
}

export function renderRules(): void {
  $('rules-list').replaceChildren(
    ...dashRulesLines().map((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      return li;
    }),
  );
}
