// Result banner over the board: shown after the win line has drawn, dismissible,
// and reset when the next round starts. Holds only its own "dismissed" flag.
import { CONFIG } from '../config';
import { isOver, type GameState } from '../game';
import type { Settings } from '../settings';
import { resultBanner } from '../status';
import { S } from '../strings';
import { el, later } from './dom';

export interface ResultView {
  render(s: GameState, opponent: Settings['opponent'], reducedMotion: boolean): void;
}

export function createResult(onNext: () => void): ResultView {
  let key = '';
  let cancel: (() => void) | null = null;
  const node = el('result');
  const hide = (): void => {
    cancel?.();
    cancel = null;
    node.hidden = true;
  };
  el('result-next').textContent = S.resultNext;
  el('result-view').textContent = S.resultView;
  el('result-next').addEventListener('click', () => {
    hide();
    onNext();
  });
  el('result-view').addEventListener('click', () => {
    hide();
    el('new-round').focus();
  });
  return {
    render(s, opponent, reducedMotion) {
      const banner = isOver(s) ? resultBanner(s, opponent) : null;
      if (!banner) {
        key = '';
        hide();
        return;
      }
      const next = `${s.moves}:${s.winner ?? 'd'}`;
      if (next === key) return;
      key = next;
      el('result-title').textContent = banner.title;
      el('result-sub').textContent = banner.sub;
      node.dataset.tone = banner.tone;
      const delay = reducedMotion ? 0 : CONFIG.fx.drawMs + CONFIG.fx.strokeStaggerMs + CONFIG.fx.strikeMs + CONFIG.ui.resultDelayMs;
      cancel?.();
      cancel = later(() => {
        cancel = null;
        node.hidden = false;
      }, delay);
    },
  };
}
