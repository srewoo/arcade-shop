// HUD + title menu rendering. Reads game state; owns no game logic.
import { discCount } from '../board';
import { MODE_IDS, type ModeId } from '../config';
import { movesLeft, type GameState } from '../game';
import { bestFor, type Stats } from '../stats';
import { S, dailyLabel, modeButtonLabel } from '../strings';
import { el } from './dom';

const text = (id: string, value: string | number): void => {
  const node = el(id);
  const next = String(value);
  if (node.textContent !== next) node.textContent = next;
};

export function renderHud(s: GameState, best: number): void {
  text('v-score', s.score);
  text('v-best', Math.max(best, s.score));
  text('v-discs', discCount(s.board));
  const extra =
    s.mode === 'moves' ? [S.movesLeft, movesLeft(s)] : s.mode === 'endless' ? [S.nextColumn, s.riseIn] : [S.moves, s.moves];
  text('k-extra', extra[0] as string);
  text('v-extra', extra[1] as number);
  el('stat-target').hidden = s.mode !== 'moves';
  text('v-target', s.target);
  el('stat-target').classList.toggle('hit', s.mode === 'moves' && s.score >= s.target);
}

export function bumpScore(): void {
  const node = el('v-score').parentElement;
  if (!node) return;
  node.classList.remove('bump');
  void node.offsetWidth;
  node.classList.add('bump');
}

export function renderMenu(stats: Stats, today: string, onPick: (m: ModeId) => void): void {
  const host = el('modes');
  host.replaceChildren();
  for (const id of MODE_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode';
    b.dataset.mode = id;
    const best = bestFor(stats, id, today);
    b.setAttribute('aria-label', `${modeButtonLabel(S.modes[id].name, best)}. ${S.modes[id].blurb}`);
    const name = id === 'daily' ? `${S.modes[id].name}` : S.modes[id].name;
    b.innerHTML = '<span class="nm"></span><span class="bl"></span><span class="bs"></span>';
    (b.children[0] as HTMLElement).textContent = name;
    (b.children[1] as HTMLElement).textContent = id === 'daily' ? `${S.modes[id].blurb} (${dailyLabel(today)})` : S.modes[id].blurb;
    (b.children[2] as HTMLElement).textContent = `${S.best}: ${best}`;
    b.addEventListener('click', () => onPick(id));
    host.append(b);
  }
}

export function showScreen(screen: 'menu' | 'game'): void {
  el('app').dataset.screen = screen;
  const game = screen === 'game';
  for (const id of ['stats', 'board-slot', 'preview', 'actions', 'keys', 'pause']) el(id).hidden = !game;
  el('menu').hidden = game;
  el('onboard').hidden = !game;
  if (!game) el('onboard').classList.add('off');
}
