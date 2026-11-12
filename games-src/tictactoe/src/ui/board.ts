// Board rendering. Holds no game state; everything is derived from GameState.
import { CELLS, SIZE, isOver, lastMove, nextToVanish, type Cell, type GameState, type Player } from '../game';
import { S } from '../strings';
import { ghostSvg, markSvg } from './marks';

export interface BoardOptions {
  /** Cell whose mark just vanished (animated out), or null. */
  readonly vanished: number | null;
  /** Buffered premove cell, or null. */
  readonly queued: number | null;
  readonly reducedMotion: boolean;
  readonly vanishMs: number;
}

export function buildBoard(container: HTMLElement, onCell: (index: number) => void): HTMLButtonElement[] {
  const cells: HTMLButtonElement[] = [];
  for (let i = 0; i < CELLS; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.index = String(i);
    btn.tabIndex = i === 4 ? 0 : -1;
    btn.dataset.tag = S.nextOut;
    btn.addEventListener('click', () => onCell(i));
    container.append(btn);
    cells.push(btn);
  }
  return cells;
}

function describe(c: Cell, i: number, fade: 'none' | 'now' | 'later'): string {
  const what = c ?? S.empty;
  const base = S.cellLabel(Math.floor(i / SIZE) + 1, (i % SIZE) + 1, what);
  if (fade === 'now') return base + S.willDisappear;
  return fade === 'later' ? base + S.willDisappearLater : base;
}

function fadeKind(s: GameState, i: number): 'none' | 'now' | 'later' {
  if (isOver(s)) return 'none';
  if (nextToVanish(s, s.turn) === i) return 'now';
  return nextToVanish(s, s.turn === 'X' ? 'O' : 'X') === i ? 'later' : 'none';
}

/** Content key: what markup the cell should hold (mark, or the hover ghost). */
function contentFor(mark: Cell, turn: Player, over: boolean): { key: string; html: string } {
  if (mark) return { key: mark, html: markSvg(mark) };
  if (over) return { key: '', html: '' };
  return { key: `ghost${turn}`, html: ghostSvg(turn) };
}

function fadeOut(btn: HTMLButtonElement, oldHtml: string, ms: number): void {
  const ghost = document.createElement('span');
  ghost.className = 'vanishing';
  ghost.innerHTML = oldHtml;
  ghost.style.setProperty('--vanish-ms', `${ms}ms`);
  const remove = (): void => ghost.remove();
  ghost.addEventListener('animationend', remove);
  window.setTimeout(remove, ms + 200);
  btn.append(ghost);
}

export function renderBoard(cells: readonly HTMLButtonElement[], s: GameState, opts: BoardOptions): void {
  const over = isOver(s);
  const last = over ? null : lastMove(s);
  cells.forEach((btn, i) => {
    const mark = s.board[i] ?? null;
    const content = contentFor(mark, s.turn, over);
    if (btn.dataset.content !== content.key) {
      const old = btn.dataset.mark ? btn.querySelector('svg.mark')?.outerHTML : undefined;
      btn.innerHTML = content.html;
      btn.dataset.content = content.key;
      if (old && mark === null && opts.vanished === i && !opts.reducedMotion) fadeOut(btn, old, opts.vanishMs);
    }
    btn.dataset.mark = mark ?? '';
    const fade = fadeKind(s, i);
    btn.classList.toggle('fading', fade !== 'none');
    btn.classList.toggle('next-out', fade === 'now');
    btn.classList.toggle('win', s.line?.includes(i) ?? false);
    btn.classList.toggle('last', i === last);
    btn.classList.toggle('queued', i === opts.queued);
    btn.setAttribute('aria-disabled', String(over || mark !== null));
    btn.setAttribute('aria-label', describe(mark, i, fade));
  });
}
