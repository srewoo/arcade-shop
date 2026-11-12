// Score cards, vanish-mark pips, streak line.
import { CONFIG } from '../config';
import type { GameState } from '../game';
import { isOver } from '../game';
import type { Scores, Stats } from '../scores';
import type { Settings } from '../settings';
import { S } from '../strings';
import { el } from './dom';

function renderPips(id: string, owned: number, show: boolean): void {
  const node = el(id);
  node.hidden = !show;
  if (!show) return;
  const limit = CONFIG.rules.vanishLimit;
  node.innerHTML = Array.from({ length: limit }, (_, i) => `<i class="${i < owned ? 'on' : ''}"></i>`).join('');
}

export function renderScoreboard(
  s: GameState, scores: Scores, stats: Stats, settings: Settings, milestone: number | null,
): void {
  const vsCpu = settings.opponent === 'cpu';
  el('score-x').textContent = String(scores.X);
  el('score-o').textContent = String(scores.O);
  el('score-draw').textContent = String(scores.draw);
  el('label-x').textContent = vsCpu ? 'You (X)' : 'Player X';
  el('label-o').textContent = vsCpu ? 'CPU (O)' : 'Player O';
  const live = !isOver(s);
  el('card-x').classList.toggle('turn', live && s.turn === 'X');
  el('card-o').classList.toggle('turn', live && s.turn === 'O');
  const vanishing = s.variant === 'vanishing';
  renderPips('pips-x', s.marks.X.length, vanishing);
  renderPips('pips-o', s.marks.O.length, vanishing);
  const streak = el('streak');
  streak.hidden = !vsCpu || (stats.streak === 0 && stats.best === 0);
  streak.textContent = milestone ? `${S.streakMilestone(milestone)} ${S.streak(stats.streak, stats.best)}` : S.streak(stats.streak, stats.best);
  streak.classList.toggle('hot', stats.streak >= 3);
  streak.classList.toggle('pulse', milestone !== null);
}
