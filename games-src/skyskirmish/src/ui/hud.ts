// HUD (DOM): only touches the DOM when a value actually changed. Lives and bombs are icons.
import { CONFIG, DIFFICULTY } from '../config';
import type { GameState } from '../types';
import { S } from '../strings';
import { byId } from './dom';

const last = new Map<string, string>();

const PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 9 8 6-1 2-7-2-1 5 2 1v1h-8v-1l2-1-1-5-7 2-1-2 8-6z"/></svg>';
const BOMB = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="14" r="7"/><path d="M16 8l3-3M18 3l1 2M20 5l2 1"/></svg>';

function put(id: string, value: string): void {
  if (last.get(id) === value) return;
  last.set(id, value);
  byId(id).textContent = value;
}

function chip(id: string, on: boolean, text: string): void {
  const node = byId(id);
  if (node.hidden === !on && last.get(id) === text) return;
  last.set(id, text);
  node.hidden = !on;
  node.textContent = text;
}

/** Row of icons: `filled` solid, the rest of `total` dimmed. Rebuilt only when counts change. */
function icons(id: string, svg: string, filled: number, total: number): void {
  const key = `${filled}/${total}`;
  if (last.get(id) === key) return;
  last.set(id, key);
  const node = byId(id);
  node.replaceChildren();
  for (let i = 0; i < total; i++) {
    const s = document.createElement('span');
    s.className = i < filled ? 'ico on' : 'ico off';
    s.innerHTML = svg;
    node.append(s);
  }
}

export function updateHud(s: GameState, bestScore: number): void {
  put('hud-score', s.score.toLocaleString('en-US'));
  put('hud-best', Math.max(bestScore, s.score).toLocaleString('en-US'));
  put('hud-wave', String(s.wave.index));
  const lives = Math.max(0, s.player.lives);
  icons('hud-lives', PLANE, lives, Math.max(lives, DIFFICULTY[s.difficulty].lives));
  byId('hud-lives').setAttribute('aria-label', S.hud.livesLabel(lives));
  icons('hud-bombs', BOMB, s.player.bombs, CONFIG.player.maxBombs);
  put('hud-mult', `x${s.mult}`);
  chip('chip-shield', s.player.shield > 0, `${S.power.shield} ${Math.ceil(s.player.shield)}s`);
  chip('chip-spread', s.player.spread > 0, `${S.power.spread} L${s.player.spreadLevel} ${Math.ceil(s.player.spread)}s`);
  const bomb = byId<HTMLButtonElement>('bomb-btn');
  bomb.disabled = s.player.bombs <= 0;
  bomb.setAttribute('aria-label', S.hud.bombLabel(s.player.bombs));
  byId('hud-mult').dataset.hot = String(s.mult >= CONFIG.score.multMax);
}

export function resetHud(): void {
  last.clear();
}
