// Layered night backdrop drawn in code: far ridges, a pine line, mist, a moon reflection and water ripples.
import { createRng } from '../rng';
import { scopeIds } from './scope';

const pine = (x: number, h: number, shade: string): string => {
  const w = h * 0.36;
  const tiers = [0, 1, 2].map((t) => {
    const y = 60 - h + t * (h * 0.24);
    const half = w * (0.55 + t * 0.22);
    return `<path d="M${x} ${y.toFixed(1)}l${half.toFixed(1)} ${(h * 0.34).toFixed(1)}h${(-half * 2).toFixed(1)}z"/>`;
  }).join('');
  return `<g fill="${shade}">${tiers}<rect x="${x - 0.8}" y="${60 - h * 0.1}" width="1.6" height="${h * 0.14}"/></g>`;
};

function pines(seed: number): string {
  const rng = createRng(seed);
  let out = '';
  for (let i = 0; i < 22; i++) {
    const left = i % 2 === 0;
    const x = left ? rng.int(0, 150) : rng.int(250, 400);
    out += pine(x, rng.int(14, 30), i % 3 === 0 ? '#0e2218' : '#143024');
  }
  return out;
}

/** Ridges + pines + mist, sitting on the bank horizon. viewBox 400x60, bottom aligned. */
export function skylineSvg(): string {
  return scopeIds(`<svg class="skyline" viewBox="0 0 400 60" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs><linearGradient id="lbridge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3d6e"/><stop offset="1" stop-color="#1a2850"/></linearGradient>
<linearGradient id="lbridge2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a55"/><stop offset="1" stop-color="#142041"/></linearGradient>
<linearGradient id="lbmist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa6dc" stop-opacity="0"/><stop offset="1" stop-color="#8fa6dc" stop-opacity=".28"/></linearGradient></defs>
<path d="M0 60V30l30-14 28 12 34-20 40 24 36-12 42 22 38-26 44 24 30-10 34 16 44-24 0 38z" fill="url(#lbridge)"/>
<path d="M0 60V42l40-10 46 12 52-18 60 14 54-10 60 16 40-12 48 8V60z" fill="url(#lbridge2)"/>
${pines(23)}
<rect y="30" width="400" height="30" fill="url(#lbmist)"/></svg>`);
}

/** Rippling water tile: 256px period, drawn at 2x so ripples stay small (animated by CSS translate). */
export function waterSvg(): string {
  const rng = createRng(17);
  const arcs = Array.from({ length: 34 }, () => {
    const x = rng.int(0, 112);
    const y = rng.int(4, 596);
    const w = rng.int(6, 14);
    const o = (rng.int(2, 6) / 10 + y / 1800).toFixed(2);
    return `<path d="M${x} ${y}q${w / 2} -3 ${w} 0t${w} 0" fill="none" stroke="#8db6ee" stroke-width="1.2" stroke-linecap="round" opacity="${o}"/>`;
  }).join('');
  return scopeIds(`<svg class="water-tile" width="512" height="1200" viewBox="0 0 256 600" aria-hidden="true" focusable="false"><g id="lbtile">${arcs}</g><use href="#lbtile" x="128"/></svg>`);
}

/** Moon glitter on the river: short horizontal dashes that thin out downwards. */
export function glitterSvg(): string {
  const rng = createRng(29);
  const dashes = Array.from({ length: 16 }, (_, i) => {
    const y = 6 + i * 12 + rng.int(0, 5);
    const w = Math.max(3, 22 - i * 1.2 + rng.int(-3, 3));
    const x = 20 - w / 2 + rng.int(-3, 3);
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="1.6" rx=".8" fill="#f7f1d2" opacity="${(0.75 - i * 0.04).toFixed(2)}"/>`;
  }).join('');
  return `<svg class="glitter" viewBox="0 0 40 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">${dashes}</svg>`;
}

export function firefliesHtml(seed: number, count = 9): string {
  const rng = createRng(seed);
  return Array.from({ length: count }, () =>
    `<i style="left:${rng.int(4, 96)}%;top:${rng.int(28, 88)}%;--d:${rng.int(5, 9)}s;--dl:-${rng.int(0, 8)}s;--dx:${rng.int(-24, 24)}px"></i>`).join('');
}
