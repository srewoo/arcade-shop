// Decorative mini grid + bolt for the title card. Cells fade in over 400 ms (see fx.css).
import { $ } from './dom';

const NS = 'http://www.w3.org/2000/svg';
const SAMPLE = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

const DEFS = `<linearGradient id="hg-board" x1="0" y1="0" x2="0" y2="1"><stop class="hs1" offset="0"/><stop class="hs2" offset="1"/></linearGradient>
<linearGradient id="hg-bolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient>
<radialGradient id="hg-glow"><stop offset="0" stop-color="#ffd23f" stop-opacity=".75"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>`;

const SPARKS: readonly (readonly [number, number, number])[] = [[78, 12, 5], [10, 84, 4], [84, 76, 3.2], [8, 10, 3]];
const star = (x: number, y: number, r: number): string =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

export function renderHero(): void {
  const svg = $('hero');
  const unit = 10;
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = DEFS;
  const nodes: SVGElement[] = [defs];
  nodes.push(el('rect', { class: 'hero-card', x: '-1', y: '-1', width: '92', height: '92', rx: '4', fill: 'url(#hg-board)' }));
  nodes.push(el('rect', { class: 'hero-box', x: '30', y: '30', width: '30', height: '30' }));
  nodes.push(el('circle', { class: 'hero-glow', cx: '47', cy: '46', r: '30', fill: 'url(#hg-glow)' }));
  for (let i = 0; i <= 9; i++) {
    const cls = i % 3 === 0 ? 'g t' : 'g';
    nodes.push(el('line', { class: cls, x1: String(i * unit), y1: '0', x2: String(i * unit), y2: String(9 * unit) }));
    nodes.push(el('line', { class: cls, x1: '0', y1: String(i * unit), x2: String(9 * unit), y2: String(i * unit) }));
  }
  let n = 0;
  [...SAMPLE].forEach((ch, i) => {
    if (ch === '.') return;
    const t = el('text', { x: String((i % 9) * unit + 5), y: String(Math.floor(i / 9) * unit + 7.4), style: `--i:${n++}` });
    t.textContent = ch;
    nodes.push(t);
  });
  nodes.push(el('path', { class: 'bolt-path', d: 'M52 14 34 48h12l-5 28 26-38H54z', style: `--i:${n + 2}` }));
  nodes.push(el('path', { class: 'bolt-shine', d: 'M50 19 40 41h5.5z' }));
  SPARKS.forEach(([x, y, r], i) => nodes.push(el('path', { class: 'spark', d: star(x, y, r), style: `--k:${i}` })));
  svg.replaceChildren(...nodes);
}
