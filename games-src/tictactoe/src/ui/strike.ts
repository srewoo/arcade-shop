// Owns the win strike line: draws it once per finished round, keeps it aligned on resize.
import type { GameState } from '../game';
import { clearStrike, drawStrike } from './fx';
import { elSvg } from './dom';

export interface Strike {
  render(s: GameState, reducedMotion: boolean): void;
  relayout(s: GameState): void;
}

export function createStrike(board: HTMLElement, cells: readonly HTMLElement[]): Strike {
  let key = '';
  return {
    render(s, reducedMotion) {
      const svg = elSvg('strike');
      if (!s.line) {
        if (key) clearStrike(svg);
        key = '';
        return;
      }
      const next = `${s.line.join(',')}:${s.moves}`;
      if (next === key) return;
      key = next;
      drawStrike(svg, board, cells, s.line, !reducedMotion);
    },
    relayout(s) {
      const svg = elSvg('strike');
      if (s.line && svg.dataset.line) drawStrike(svg, board, cells, s.line, false);
    },
  };
}
