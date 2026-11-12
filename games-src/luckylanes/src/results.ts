// Game-over results overlay: scores, per-game strike/spare counts, best for the mode and stars.
import { Dialog } from './dialog';
import { byId } from './dom';
import { humanScores, matchScore, winners, type Match } from './match';
import { detailLine, resultTier } from './resultsText';
import { S } from './strings';

export interface ResultsInfo {
  readonly match: Match;
  readonly ranks: readonly (number | null)[];
  /** Best score on the board for this mode, including the game just played. */
  readonly best: number;
}

const dialog = new Dialog(byId('results'), { onEscape: () => undefined });

export function showResults(info: ResultsInfo, onAgain: () => void, onMenu: () => void): void {
  const { match } = info;
  const list = byId('results-list');
  list.replaceChildren();
  const win = winners(match);
  match.players.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = `${p.name}: ${matchScore(match, i)}${match.players.length > 1 && win.includes(i) ? '  (winner)' : ''}`;
    list.append(li);
  });
  const tier = resultTier(match);
  const tierEl = byId('results-tier');
  tierEl.textContent = tier.label;
  tierEl.dataset.tier = String(tier.level);
  byId('results-big').textContent = String(Math.max(...match.players.map((_, i) => matchScore(match, i))));
  byId('results-detail').textContent = `${detailLine(match)}${info.best > 0 ? ` · ${S.best}: ${info.best}` : ''}`;
  const rank = info.ranks.find((r): r is number => r !== null);
  byId('results-note').textContent = rank ? `New high score! You placed #${rank} on the board.` : humanScores(match).length ? 'Good game. Try for a spot on the high-score board.' : '';
  byId('results-title').textContent = match.players.length > 1 && win.length === 1 ? `${match.players[win[0] as number]?.name} wins!` : match.mode === 'spare' ? 'Challenge complete' : 'Game over';
  byId('results').querySelector('.panel')?.classList.add('tiered');
  dialog.open(byId('results-again'));
  byId('results-again').onclick = () => { dialog.close(false); onAgain(); };
  byId('results-menu').onclick = () => { dialog.close(false); onMenu(); };
}

export const hideResults = (): void => dialog.close(false);
export const resultsOpen = (): boolean => dialog.isOpen;
