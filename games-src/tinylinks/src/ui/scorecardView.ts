// Renders the scorecard table and wires the scorecard dialog buttons.
import type { Card, Cell } from '../game/scorecard';
import { markInk } from '../render/ball';
import { colorHex, markerFor, MARKER_GLYPH, type Player } from '../game/players';

function cell(tag: 'td' | 'th', c: Cell, cls = ''): HTMLTableCellElement {
  const el = document.createElement(tag);
  if (c.current) el.classList.add('cur');
  if (cls) el.classList.add(...cls.split(' '));
  if (c.kind) {
    const s = document.createElement('span');
    s.className = `sc ${c.kind}`;
    s.textContent = c.text;
    s.setAttribute('aria-label', `${c.text}, ${c.kind}`);
    el.append(s);
  } else el.textContent = c.text;
  return el;
}

const th = (text: string, cls = ''): HTMLTableCellElement => {
  const el = document.createElement('th');
  el.scope = 'col';
  el.textContent = text;
  if (cls) el.classList.add(...cls.split(' '));
  return el;
};
const isSub = (h: string | undefined): boolean => h === 'Out' || h === 'In';

function headRow(card: Card, holeLabel: string): HTMLElement {
  const head = document.createElement('thead');
  const hr = document.createElement('tr');
  hr.append(th('Hole'));
  card.heads.forEach((h) => hr.append(th(h, [h === holeLabel ? 'cur' : '', isSub(h) ? 'sub' : ''].join(' ').trim())));
  hr.append(th('Total'), th('+/−'));
  head.append(hr);
  return head;
}

function parRow(card: Card): HTMLElement {
  const pr = document.createElement('tr');
  pr.className = 'parrow';
  const pl = document.createElement('th'); pl.scope = 'row'; pl.textContent = 'Par';
  pr.append(pl);
  card.par.forEach((c, i) => pr.append(cell('td', c, isSub(card.heads[i]) ? 'sub' : '')));
  const pt = document.createElement('td'); pt.textContent = card.parTotal; pt.className = 'tot';
  pr.append(pt, document.createElement('td'));
  return pr;
}

function playerRow(card: Card, r: Card['rows'][number], p: Player | undefined): HTMLElement {
  const tr = document.createElement('tr');
  const head = document.createElement('th');
  head.scope = 'row';
  if (p) {
    const mini = document.createElement('span');
    mini.className = 'mini';
    mini.setAttribute('aria-hidden', 'true');
    mini.style.background = colorHex(p.color);
    mini.style.color = markInk(p.color);
    mini.textContent = MARKER_GLYPH[markerFor(r.player)];
    head.append(mini);
  }
  head.append(document.createTextNode(r.name));
  tr.append(head);
  r.cells.forEach((c, i) => tr.append(cell('td', c, isSub(card.heads[i]) ? 'sub' : '')));
  const t = document.createElement('td'); t.textContent = r.total; t.className = 'tot';
  const rl = document.createElement('td'); rl.textContent = r.rel;
  tr.append(t, rl);
  return tr;
}

export function renderCard(table: HTMLElement, card: Card, players: readonly Player[], holeLabel: string): void {
  const body = document.createElement('tbody');
  body.append(parRow(card), ...card.rows.map((r) => playerRow(card, r, players[r.player])));
  table.replaceChildren(headRow(card, holeLabel), body);
}
