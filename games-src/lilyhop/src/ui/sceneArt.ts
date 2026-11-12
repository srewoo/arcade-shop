// Pond backdrop: night water with a moon, light shafts and reflection, caustics,
// far lily pads with blossoms, and two reed layers. Pure decoration (seeded, deterministic).
import { createRng } from '../rng';

const DEFS = `<defs>
<linearGradient id="lh-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#238aa0"/><stop offset="0.45" stop-color="#11556a"/><stop offset="1" stop-color="#061f2b"/></linearGradient>
<radialGradient id="lh-moon" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#eaf3ff" stop-opacity="0.55"/><stop offset="1" stop-color="#cfe3ff" stop-opacity="0"/></radialGradient>
<linearGradient id="lh-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ecff" stop-opacity="0.2"/><stop offset="1" stop-color="#d9ecff" stop-opacity="0"/></linearGradient>
<linearGradient id="lh-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8e0" stop-opacity="0"/><stop offset="0.5" stop-color="#9fd8e0" stop-opacity="0.16"/><stop offset="1" stop-color="#9fd8e0" stop-opacity="0"/></linearGradient>
<radialGradient id="lh-vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
<radialGradient id="lh-fp" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#4fae6a"/><stop offset="1" stop-color="#1f6a45"/></radialGradient>
</defs>`;

function reeds(rng: ReturnType<typeof createRng>, xs: number[], cls: string, base: number, tall: number): string {
  return xs.map((x) => {
    const h = tall + rng.int(40);
    const lean = rng.int(16) - 8;
    const top = `${x + lean * 2} ${base - h}`;
    const head = rng.int(3) === 0 ? `<ellipse cx="${x + lean * 2}" cy="${base - h - 6}" rx="3" ry="8" class="cattail"/>` : '';
    return `<g class="${cls}"><path d="M${x} ${base}Q${x + lean} ${base - h / 2} ${top}" class="reed"/>${head}<path d="M${x + 3} ${base}Q${x + 14 + lean} ${base - h * 0.4} ${x + 10 + lean * 2} ${base - h * 0.7}" class="reed thin"/></g>`;
  }).join('');
}

function lotus(x: number, y: number, r: number, bloom: boolean): string {
  const petals = bloom
    ? `<g class="lotus" transform="translate(${x + r * 0.2} ${y - r * 0.28}) scale(${r / 20})"><ellipse rx="4" ry="9" transform="rotate(-40) translate(0 -5)"/><ellipse rx="4" ry="9" transform="rotate(40) translate(0 -5)"/><ellipse rx="4.5" ry="10" transform="translate(0 -6)"/><circle r="2.6" class="lotus-core"/></g>`
    : '';
  return `<g class="far-pad"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.45}" fill="url(#lh-fp)"/><path d="M${x} ${y}L${x + r} ${y - r * 0.1}" class="far-vein"/>${petals}</g>`;
}

function reflection(): string {
  return Array.from({ length: 9 }, (_, i) => `<rect class="refl" x="${262 - 14 + i * 1.5}" y="${92 + i * 14}" width="${28 - i * 2.2}" height="2.6" rx="1.3" style="--i:${i}"/>`).join('');
}

const stars = (rng: ReturnType<typeof createRng>): string =>
  Array.from({ length: 16 }, () => `<circle cx="${30 + rng.int(340)}" cy="${6 + rng.int(60)}" r="${0.8 + rng.int(12) / 10}" class="star"/>`).join('');

export function sceneSvg(): string {
  const rng = createRng(7);
  const rays = '<polygon points="256,40 280,40 330,240 150,240" fill="url(#lh-ray)" class="ray"/><polygon points="262,40 272,40 250,240 210,240" fill="url(#lh-ray)" class="ray r2"/>';
  const caustics = [[80, 120, 40], [200, 170, 54], [330, 130, 44], [140, 210, 36]].map(([x, y, w], i) => `<ellipse class="caustic" cx="${x}" cy="${y}" rx="${w}" ry="${(w ?? 0) * 0.14}" style="--i:${i}"/>`).join('');
  const back = reeds(rng, [8, 24, 40, 56, 346, 364, 384], 'reeds back', 132, 36);
  const front = reeds(rng, [-2, 14, 34, 372, 392], 'reeds front', 150, 62);
  return `${DEFS}<rect width="400" height="240" fill="url(#lh-water)"/>${stars(rng)}
<circle cx="268" cy="40" r="46" fill="url(#lh-moon)"/><circle cx="268" cy="40" r="16" class="moon"/><circle cx="262" cy="36" r="3" class="crater"/><circle cx="274" cy="46" r="2" class="crater"/>
${rays}${reflection()}${caustics}
<rect y="108" width="400" height="26" fill="url(#lh-mist)" class="mist"/>
${back}${lotus(58, 205, 20, true)}${lotus(112, 224, 14, false)}${lotus(330, 210, 22, true)}${lotus(372, 188, 14, false)}${lotus(210, 232, 12, true)}${lotus(30, 160, 12, false)}${lotus(380, 140, 12, true)}
${front}<rect width="400" height="240" fill="url(#lh-vig)"/>`;
}
