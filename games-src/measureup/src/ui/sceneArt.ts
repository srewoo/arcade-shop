// Cave backdrop and decor (SVG markup strings): lit rock layers, stalactites, crystals,
// wall torches, a flagstone floor, a light beam and drifting dust. Pure strings, no DOM.

export const ART_DEFS = `
<defs>
  <linearGradient id="cave-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#443859"/><stop offset="0.55" stop-color="#2c2338"/><stop offset="1" stop-color="#1c1722"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.62" r="0.5"><stop offset="0" stop-color="#ffd36b" stop-opacity="0.6"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
  <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffb347" stop-opacity="0.5"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
  <radialGradient id="crys-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#6fd8ff" stop-opacity="0.55"/><stop offset="1" stop-color="#6fd8ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="crys" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9f4ff"/><stop offset="0.5" stop-color="#4fb8e8"/><stop offset="1" stop-color="#1f5a9c"/></linearGradient>
  <linearGradient id="floor-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3044"/><stop offset="1" stop-color="#120d17"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b0" stop-opacity="0.2"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient>
  <linearGradient id="stal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c4d70"/><stop offset="1" stop-color="#241c2e"/></linearGradient>
  <radialGradient id="vign" cx="0.5" cy="0.5" r="0.72"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
</defs>`;

const FAR = 'M-20 -20H340V26l-12 16-14-12-16 22-14-20-18 20-16-24-20 22-18-18-22 24-20-22-24 22-18-18-20 20-16-16-22 18-18-22-20 20-16-16-22 18z';
const MID = 'M-20 -20H340V12l-16 14-14-14-18 20-16-22-20 16-20-18-24 22-20-20-22 22-24-24-24 22-20-14-22 16-18-18-22 14z';

function stalactite(x: number, len: number, w: number): string {
  return `<path d="M${x - w} -4Q${x - w * 0.3} ${len * 0.5} ${x} ${len}Q${x + w * 0.3} ${len * 0.5} ${x + w} -4z" fill="url(#stal)"/>` +
    `<path d="M${x - w * 0.5} 4Q${x - w * 0.1} ${len * 0.5} ${x} ${len - 3}" fill="none" stroke="rgba(180,200,255,0.3)" stroke-width="1"/>`;
}

function crystal(x: number, y: number, s: number, rot: number): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-5 0L-3 -22L0 -30L3 -22L5 0z" fill="url(#crys)" stroke="#12304f" stroke-width="1"/><path d="M0 -30L0 0" stroke="rgba(255,255,255,0.55)" stroke-width="1"/></g>`;
}

const crystals = (cx: number, cy: number): string =>
  `<g class="crystals"><ellipse cx="${cx}" cy="${cy - 10}" rx="34" ry="26" fill="url(#crys-glow)"/>${crystal(cx - 10, cy, 1, -18)}${crystal(cx + 2, cy + 2, 1.35, 4)}${crystal(cx + 14, cy, 0.9, 22)}</g>`;

function torch(x: number, y: number): string {
  return `<ellipse cx="${x}" cy="${y - 6}" rx="46" ry="42" fill="url(#warm)"/>` +
    `<path d="M${x - 4} ${y + 8}L${x - 6} ${y + 26}h12L${x + 4} ${y + 8}z" fill="#3a3040" stroke="#17111c" stroke-width="1.5"/>` +
    `<path d="M${x - 7} ${y + 8}h14l-2 -6h-10z" fill="#5a4a66" stroke="#17111c" stroke-width="1.5"/>` +
    `<path class="tflame" d="M${x} ${y - 14}c-7 7-7 13 0 16c7-3 7-9 0-16z" fill="#ffb347"/><path class="tflame" d="M${x} ${y - 7}c-3 3-3 6 0 7c3-1 3-4 0-7z" fill="#fff2b0"/>`;
}

const floor = `
<rect x="-20" y="188" width="360" height="40" fill="url(#floor-g)"/>
<path d="M-20 188H340" stroke="rgba(190,170,220,0.35)" stroke-width="1.2"/>
<g stroke="rgba(0,0,0,0.35)" stroke-width="1"><path d="M-20 199H340M-20 211H340"/><path d="M40 188L10 228M110 188L96 228M180 188L180 228M250 188L266 228M320 188L350 228"/></g>
<ellipse cx="160" cy="198" rx="62" ry="9" fill="url(#glow)"/>`;

const motes = [[70, 40, 0], [130, 70, 1.5], [200, 30, 0.7], [240, 90, 2.2], [100, 120, 3], [180, 140, 0.4], [270, 60, 1.1]]
  .map(([x, y, d]) => `<circle class="mote" cx="${x}" cy="${y}" r="1.3" fill="#ffe9b0" style="--d:${d}s"/>`).join('');

export const BACKDROP = `${ART_DEFS}
<rect x="-400" y="-400" width="1120" height="436" fill="#150f1a"/>
<rect x="-20" y="-20" width="360" height="212" fill="url(#cave-g)"/>
<g stroke="rgba(0,0,0,0.3)" fill="none" stroke-width="1.2"><path d="M20 60l12 20-8 18 10 14"/><path d="M290 70l-10 16 8 14-6 18"/><path d="M60 150l14-10 10 6"/></g>
<path d="${FAR}" fill="#33294a"/>
<path d="${MID}" fill="#211b2e"/><path d="${MID}" fill="none" stroke="rgba(150,175,255,0.22)" stroke-width="1.2"/>
${stalactite(36, 44, 9)}${stalactite(70, 30, 6)}${stalactite(258, 36, 7)}${stalactite(296, 50, 10)}
<polygon class="beam" points="132,-20 188,-20 232,190 88,190" fill="url(#beam)"/>
${crystals(34, 92)}${crystals(288, 64)}
${torch(86, 96)}${torch(234, 96)}
${floor}
<g class="drain"><rect x="236" y="194" width="34" height="9" rx="2" fill="#0c0910" stroke="#4a3f55" stroke-width="1.5"/><path d="M243 194v9M250 194v9M257 194v9M264 194v9" stroke="#4a3f55" stroke-width="1.5"/></g>`;

export const FOREGROUND = `
<g class="motes">${motes}</g>
<rect x="-20" y="-20" width="360" height="240" fill="url(#vign)" pointer-events="none"/>`;
