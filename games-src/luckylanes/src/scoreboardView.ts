// Scoreboard DOM: 10 frames with running totals per player (or spare-challenge rounds).
import { isSpare, matchScore, type Match } from './match';
import { currentFrame, scoreGame } from './scoring';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function headerRow(first: string, last: string, labels: readonly string[]): HTMLTableRowElement {
  const tr = el('tr');
  const h0 = el('th', 'name', first);
  h0.scope = 'col';
  tr.append(h0);
  for (const l of labels) {
    const th = el('th', '', l);
    th.scope = 'col';
    tr.append(th);
  }
  const hl = el('th', 'total', last);
  hl.scope = 'col';
  tr.append(hl);
  return tr;
}

function boxes(symbols: readonly string[], count: number): HTMLElement {
  const wrap = el('div', 'boxes');
  const padded = [...symbols];
  if (count === 2 && padded.length === 1 && padded[0] === 'X') padded.unshift('');
  while (padded.length < count) padded.push('');
  for (const s of padded) wrap.append(el('span', `box${s === 'X' || s === '/' ? ' mark' : ''}`, s));
  return wrap;
}

function bowlingRows(m: Match, p: number, active: boolean): HTMLTableRowElement[] {
  const frames = scoreGame(m.rolls[p] ?? []);
  const cur = active ? Math.min(9, currentFrame(m.rolls[p] ?? [])) : -1;
  const top = el('tr', active ? 'active' : '');
  const bottom = el('tr', active ? 'active' : '');
  const name = el('th', 'name', m.players[p]?.name ?? '');
  name.scope = 'row';
  name.rowSpan = 2;
  if (active) name.setAttribute('aria-current', 'true');
  top.append(name);
  for (let f = 0; f < 10; f++) {
    const fr = frames[f];
    const a = el('td', f === cur ? 'frame now' : 'frame');
    a.append(boxes(fr?.symbols ?? [], f === 9 ? 3 : 2));
    top.append(a);
    bottom.append(el('td', 'run', fr?.total != null ? String(fr.total) : ''));
  }
  const tot = el('td', 'total', String(matchScore(m, p)));
  tot.rowSpan = 2;
  top.append(tot);
  return [top, bottom];
}

function spareRows(m: Match): HTMLTableRowElement[] {
  const top = el('tr', 'active');
  const bottom = el('tr', 'active');
  const name = el('th', 'name', 'Leave');
  name.scope = 'row';
  name.rowSpan = 2;
  top.append(name);
  const played = m.rolls[0]?.length ?? 0;
  for (let i = 0; i < 10; i++) {
    const leave = m.leaves[i] ?? [];
    top.append(el('td', `frame leave${i === played ? ' now' : ''}`, leave.join('-')));
    const knocked = m.rolls[0]?.[i];
    const txt = knocked === undefined ? '' : knocked === leave.length ? 'Clear' : `${knocked}/${leave.length}`;
    bottom.append(el('td', 'run', txt));
  }
  const tot = el('td', 'total', String(matchScore(m, 0)));
  tot.rowSpan = 2;
  top.append(tot);
  return [top, bottom];
}

export function renderScoreboard(root: HTMLElement, m: Match): void {
  const table = el('table', 'sb');
  table.setAttribute('aria-label', isSpare(m) ? 'Spare challenge scoreboard' : 'Scoreboard');
  const labels = Array.from({ length: 10 }, (_, i) => String(i + 1));
  const thead = el('thead');
  thead.append(headerRow(isSpare(m) ? 'Round' : 'Player', 'Total', labels));
  const tbody = el('tbody');
  if (isSpare(m)) tbody.append(...spareRows(m));
  else m.players.forEach((_, p) => tbody.append(...bowlingRows(m, p, p === m.current && !m.over)));
  table.append(thead, tbody);
  root.replaceChildren(table);
  centreOnCurrent(root);
}

/** Scroll the board sideways (never the page) so the current frame is centred. */
export function centreOnCurrent(root: HTMLElement): void {
  const now = root.querySelector<HTMLElement>('.now');
  if (!now || root.scrollWidth <= root.clientWidth) return;
  const rect = now.getBoundingClientRect();
  const box = root.getBoundingClientRect();
  root.scrollLeft += rect.left - box.left - (box.width - rect.width) / 2;
}
