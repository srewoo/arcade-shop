// Keeps the HUD (moves, best possible, timer, status line, button states) in step with the game.
import type { Play } from '../play';
import { formatTime, starThresholds } from '../scoring';
import { S } from '../strings';
import { el } from './dom';

export function renderHud(play: Play): void {
  const s = play.session;
  if (!s) return;
  el('moves').textContent = String(s.moves);
  el('optimal').textContent = String(s.optimal);
  el<HTMLButtonElement>('undo').disabled = s.moves === 0 || s.status === 'won';
  el<HTMLButtonElement>('hint').disabled = s.status === 'won';
  el('undo').dataset.urgent = String(s.status === 'stuck');
  el('status').dataset.state = s.status;
  el('moves').dataset.over = String(s.moves > s.optimal);
  const rule = el('star-rule');
  const two = starThresholds(s.optimal).two;
  rule.textContent = s.hints > 0 ? S.starRuleHinted(two) : S.starRule(starThresholds(s.optimal).three, two);
  rule.dataset.capped = String(s.hints > 0);
  renderTimer(play);
}

export function renderTimer(play: Play): void {
  el('timer').textContent = formatTime(play.elapsed());
}

export function say(message: string): void {
  const status = el('status');
  status.textContent = message;
  status.classList.remove('fresh');
  void status.offsetWidth;
  status.classList.add('fresh');
}

export function toast(message: string, ms: number): void {
  const t = el('toast');
  t.textContent = message;
  t.dataset.show = 'true';
  window.setTimeout(() => {
    if (t.textContent === message) t.dataset.show = 'false';
  }, ms);
}

export function hideToast(): void {
  el('toast').dataset.show = 'false';
}
