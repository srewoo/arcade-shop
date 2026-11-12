// Scoreboard: ten frame boxes per player, rebuilt only when the scores change.
import { CONFIG } from '../config';
import { currentFrame, frameBoxes, totals, type Match } from '../match';
import { provisionalMark, type ProvisionalMark } from '../provisional';
import { S } from '../strings';

let lastKey = '';

const make = (tag: string, cls: string, text = ''): HTMLElement => {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
};

function frameBox(i: number, marks: readonly string[], total: number | null, now: boolean, prov: ProvisionalMark | null): HTMLElement {
  const tenth = i === CONFIG.frames.count - 1;
  const box = make('div', 'f');
  box.dataset.tenth = String(tenth);
  box.dataset.now = String(now);
  if (now) box.setAttribute('aria-current', 'step');
  box.append(make('span', 'n', String(i + 1)));
  for (let m = 0; m < (tenth ? 3 : 2); m++) {
    const cell = make('span', 'm', marks[m] ?? '');
    if (prov && prov.index === m) cell.dataset.prov = 'true';
    box.append(cell);
  }
  box.append(make('b', 't', total === null ? '' : String(total)));
  return box;
}

export function renderBoard(root: HTMLElement, m: Match, pinsNow = 0): void {
  const cur = m.players[m.current];
  const prov = m.phase === 'rolling' && cur ? provisionalMark(cur.rolls, pinsNow) : null;
  const key = JSON.stringify([m.players.map((p) => p.rolls), m.players.map((p) => p.fish), m.current, m.phase === 'over', prov]);
  if (key === lastKey) return;
  lastKey = key;
  const sums = totals(m);
  root.replaceChildren(
    ...m.players.map((p, pi) => {
      const block = make('div', 'pl');
      const active = pi === m.current && m.phase !== 'over';
      block.dataset.active = String(active);
      const head = make('div', 'pl-head');
      const fishChip = make('span', 'fz', p.fish > 0 ? `🐟${sums[pi]?.fish ?? 0}` : '');
      if (p.fish > 0) fishChip.setAttribute('aria-label', `${S.fishBonus} +${sums[pi]?.fish ?? 0}`);
      head.append(make('span', 'nm', p.name + (active && m.players.length > 1 ? ' ◀' : '')), make('span', 'sc', String(sums[pi]?.score ?? 0)), fishChip);
      const grid = make('div', 'frames');
      const boxes = frameBoxes(m, pi);
      const frame = currentFrame(m);
      for (let i = 0; i < CONFIG.frames.count; i++) {
        const b = boxes[i];
        const mine = pi === m.current && prov?.frame === i ? prov : null;
        const marks = [...(b?.marks ?? [])];
        if (mine) marks[mine.index] = mine.mark;
        grid.append(frameBox(i, marks, b?.total ?? null, active && i + 1 === frame, mine));
      }
      block.append(head, grid);
      return block;
    }),
  );
}

export const resetBoardCache = (): void => { lastKey = ''; };
