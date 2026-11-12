// DOM rendering for the board and option groups. Holds no game state.
import { CELLS, SIZE, nextToVanish, type Cell, type GameState } from './game';
import type { Settings } from './settings';

const SVG_X =
  '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="stroke" pathLength="1" d="M24 24L76 76"/><path class="stroke s2" pathLength="1" d="M76 24L24 76"/></svg>';
const SVG_O =
  '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="stroke" pathLength="1" cx="50" cy="50" r="27"/></svg>';

export function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing from index.html`);
  return node as T;
}

export function buildBoard(container: HTMLElement, onCell: (index: number) => void): HTMLButtonElement[] {
  const cells: HTMLButtonElement[] = [];
  for (let i = 0; i < CELLS; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.index = String(i);
    btn.setAttribute('role', 'gridcell');
    btn.addEventListener('click', () => onCell(i));
    container.append(btn);
    cells.push(btn);
  }
  return cells;
}

const describe = (c: Cell, i: number): string =>
  `Row ${Math.floor(i / SIZE) + 1}, column ${(i % SIZE) + 1}: ${c ?? 'empty'}`;

export function renderBoard(cells: readonly HTMLButtonElement[], s: GameState, locked: boolean): void {
  const fading = nextToVanish(s, s.turn);
  cells.forEach((btn, i) => {
    const mark = s.board[i] ?? null;
    if (btn.dataset.mark !== (mark ?? '')) {
      btn.dataset.mark = mark ?? '';
      btn.innerHTML = mark === 'X' ? SVG_X : mark === 'O' ? SVG_O : '';
    }
    btn.classList.toggle('fading', i === fading && !s.winner);
    btn.classList.toggle('win', s.line?.includes(i) ?? false);
    btn.disabled = locked || mark !== null;
    btn.setAttribute('aria-label', describe(mark, i));
  });
}

/** Reflect the current settings in the segmented option buttons. */
export function renderOptions(root: HTMLElement, settings: Settings): void {
  root.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((group) => {
    const key = group.dataset.setting as keyof Settings;
    group.querySelectorAll<HTMLButtonElement>('button[data-value]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(String(settings[key]) === btn.dataset.value));
    });
    if (key === 'level') group.disabled = settings.opponent !== 'cpu';
  });
}
