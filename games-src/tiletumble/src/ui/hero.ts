// Title-screen hero: a tumbled heap of discs drawn as inline SVG (no assets).
import { shade } from './colour';
import { DISC_COLOURS, DISC_SYMBOLS, SYMBOL_INK, type SymbolId } from './palette';

const NS = 'http://www.w3.org/2000/svg';

interface Spot {
  readonly x: number;
  readonly y: number;
  readonly c: number;
  readonly r?: number;
}

// 7 columns of varying height, bottom up. Neighbours often share colours so it reads as a puzzle.
export const HERO_SPOTS: readonly Spot[] = [
  { x: 1, y: 3, c: 0 }, { x: 2, y: 3, c: 0 }, { x: 3, y: 3, c: 2 }, { x: 4, y: 3, c: 3 },
  { x: 0, y: 2, c: 3 }, { x: 1, y: 2, c: 1 }, { x: 2, y: 2, c: 0 }, { x: 3, y: 2, c: 2 }, { x: 4, y: 2, c: 3 }, { x: 5, y: 2, c: 1 },
  { x: 0, y: 1, c: 3 }, { x: 1, y: 1, c: 1 }, { x: 2, y: 1, c: 2 }, { x: 3, y: 1, c: 2 }, { x: 4, y: 1, c: 4 }, { x: 5, y: 1, c: 1 }, { x: 6, y: 1, c: 0 },
  { x: 0, y: 0, c: 0 }, { x: 1, y: 0, c: 4 }, { x: 2, y: 0, c: 2 }, { x: 3, y: 0, c: 2 }, { x: 4, y: 0, c: 4 }, { x: 5, y: 0, c: 3 }, { x: 6, y: 0, c: 0 },
];

const CELL = 40;
const COLS = 7;
const ROWS = 4;

function glyph(id: SymbolId): string {
  switch (id) {
    case 'ring': return 'M0 -9a9 9 0 1 0 0.01 0z';
    case 'square': return 'M-8 -8h16v16h-16z';
    case 'triangle': return 'M0 -10L10 8L-10 8z';
    case 'diamond': return 'M0 -11L9 0L0 11L-9 0z';
    default: return 'M-9 0H9M0 -9V9';
  }
}

function node(name: string, attrs: Record<string, string>): SVGElement {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

function defs(): SVGElement {
  const d = node('defs', {});
  DISC_COLOURS.forEach((c, i) => {
    const rim = node('linearGradient', { id: `hr${i}`, x1: '0', y1: '0', x2: '1', y2: '1' });
    rim.append(node('stop', { offset: '0', 'stop-color': shade(c, 0.55) }), node('stop', { offset: '0.5', 'stop-color': c }), node('stop', { offset: '1', 'stop-color': shade(c, -0.5) }));
    const body = node('radialGradient', { id: `hb${i}`, cx: '0.35', cy: '0.3', r: '0.75' });
    body.append(node('stop', { offset: '0', 'stop-color': shade(c, 0.5) }), node('stop', { offset: '0.4', 'stop-color': c }), node('stop', { offset: '1', 'stop-color': shade(c, -0.3) }));
    d.append(rim, body);
  });
  const plate = node('linearGradient', { id: 'hp', x1: '0', y1: '0', x2: '0.3', y2: '1' });
  plate.append(node('stop', { offset: '0', 'stop-color': '#2f3a6e' }), node('stop', { offset: '0.6', 'stop-color': '#1c2138' }), node('stop', { offset: '1', 'stop-color': '#12162c' }));
  const gloss = node('linearGradient', { id: 'hg', x1: '0', y1: '0', x2: '0', y2: '1' });
  gloss.append(node('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.8' }), node('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
  const sock = node('linearGradient', { id: 'hs', x1: '0', y1: '0', x2: '0', y2: '1' });
  sock.append(node('stop', { offset: '0', 'stop-color': '#060816', 'stop-opacity': '0.55' }), node('stop', { offset: '1', 'stop-color': '#7888ff', 'stop-opacity': '0.12' }));
  d.append(plate, gloss, sock);
  return d;
}

function socket(x: number, y: number): SVGElement {
  return node('rect', { x: String(x * CELL + 10), y: String((ROWS - 1 - y) * CELL + 10), width: String(CELL - 4), height: String(CELL - 4), rx: '8', fill: 'url(#hs)', stroke: 'rgba(150,165,255,.14)' });
}

function disc(spot: Spot, index: number): SVGElement {
  const g = node('g', { class: 'hd', transform: `translate(${spot.x * CELL + CELL / 2 + 8} ${(ROWS - 1 - spot.y) * CELL + CELL / 2 + 8})` });
  (g as SVGElement).style.setProperty('--d', `${(index % 7) * 0.35}s`);
  const id = DISC_SYMBOLS[spot.c] ?? 'ring';
  const c = spot.c;
  g.append(
    node('circle', { r: '18.2', cy: '1.5', fill: 'rgba(0,0,0,.45)' }),
    node('circle', { r: '18', fill: `url(#hr${c})` }),
    node('circle', { r: '15.6', fill: `url(#hb${c})` }),
    node('circle', { r: '10.6', fill: 'rgba(0,0,0,.12)', stroke: 'rgba(0,0,0,.22)', 'stroke-width': '1' }),
    node('ellipse', { cx: '-1', cy: '-9', rx: '11', ry: '6', fill: 'url(#hg)', opacity: '.75', transform: 'rotate(-14 -1 -9)' }),
    node('circle', { cx: '-8', cy: '-9', r: '1.4', fill: '#fff' }),
    node('path', {
      class: 'glyph', d: glyph(id), fill: id === 'square' || id === 'triangle' ? SYMBOL_INK : 'none', stroke: SYMBOL_INK,
      'stroke-width': '3', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', transform: 'scale(.8)',
    }),
  );
  return g;
}

function glint(x: number, y: number, delay: number): SVGElement {
  const g = node('path', { class: 'glint', d: 'M0 -7Q1 -1 7 0Q1 1 0 7Q-1 1 -7 0Q-1 -1 0 -7Z', fill: '#fff', transform: `translate(${x} ${y})` });
  (g as SVGElement).style.setProperty('--d', `${delay}s`);
  return g;
}

export function buildHero(): SVGElement {
  const svg = node('svg', { viewBox: `0 0 ${COLS * CELL + 16} ${ROWS * CELL + 16}`, class: 'hero', 'aria-hidden': 'true', focusable: 'false' });
  svg.append(defs(), node('rect', { x: '1', y: '1', width: String(COLS * CELL + 14), height: String(ROWS * CELL + 14), rx: '18', class: 'hero-plate' }));
  for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) svg.append(socket(x, y));
  HERO_SPOTS.forEach((s, i) => svg.append(disc(s, i)));
  svg.append(glint(70, 40, 0), glint(205, 100, 1.4), glint(150, 160, 2.6));
  return svg;
}
