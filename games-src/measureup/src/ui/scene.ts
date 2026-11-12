// The cave scene, drawn in code: lit stone arch, rising bars, a brass plate that
// shows the goal, a handle that turns when the gate opens, and Wick.
import { S } from '../strings';
import type { Goal } from '../jugs';
import { BACKDROP, FOREGROUND } from './sceneArt';

/** Wick, a small lamp sprite. Also used (alone) on the title screen. */
export const WICK = `
<g class="wick">
  <circle cx="160" cy="132" r="46" fill="url(#glow)"/>
  <path class="flame" d="M160 94c-10 9-10 17 0 22c10-5 10-13 0-22z" fill="#ff9b3a" stroke="#7a3d00" stroke-width="1.5"/>
  <path class="flame" d="M160 102c-4 4-4 8 0 10c4-2 4-6 0-10z" fill="#fff2b0"/>
  <circle cx="160" cy="138" r="24" fill="url(#wick-g)" stroke="#5b3a00" stroke-width="3"/>
  <path d="M141 126a22 22 0 0 1 20-10" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="146" cy="145" rx="4.5" ry="3" fill="#ff8a6b" opacity="0.5"/><ellipse cx="174" cy="145" rx="4.5" ry="3" fill="#ff8a6b" opacity="0.5"/>
  <circle cx="151" cy="134" r="4.6" fill="#fff"/><circle cx="169" cy="134" r="4.6" fill="#fff"/>
  <circle cx="151.4" cy="134.6" r="3" fill="#2a2118"/><circle cx="169.4" cy="134.6" r="3" fill="#2a2118"/>
  <circle cx="152.4" cy="133.2" r="1" fill="#fff"/><circle cx="170.4" cy="133.2" r="1" fill="#fff"/>
  <path class="brow-sad" d="M146 126l9 3M174 126l-9 3" stroke="#2a2118" stroke-width="2" stroke-linecap="round"/>
  <path class="mouth-sad" d="M151 150q9-7 18 0" fill="none" stroke="#2a2118" stroke-width="2.6" stroke-linecap="round"/>
  <path class="mouth-happy" d="M150 146q10 11 20 0z" fill="#2a2118"/>
</g>`;

const defs = `
<defs>
  <radialGradient id="wick-g" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.5" stop-color="#ffd36b"/><stop offset="1" stop-color="#e09a2a"/></radialGradient>
  <linearGradient id="stone-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8097"/><stop offset="0.5" stop-color="#6f6577"/><stop offset="1" stop-color="#4c4358"/></linearGradient>
  <linearGradient id="bar-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:color-mix(in srgb,var(--bar) 60%,#000)"/><stop offset="0.4" style="stop-color:color-mix(in srgb,var(--bar) 55%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--bar) 60%,#000)"/></linearGradient>
  <linearGradient id="bar-gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--bar) 55%,#fff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--bar) 60%,#000)"/></linearGradient>
  <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--plate) 70%,#fff)"/><stop offset="0.5" style="stop-color:var(--plate)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--plate) 80%,#7a4a00)"/></linearGradient>
  <radialGradient id="knob" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ff8f80"/><stop offset="0.5" stop-color="#c0392b"/><stop offset="1" stop-color="#6e1a12"/></radialGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5638"/><stop offset="1" stop-color="#4e2c1c"/></linearGradient>
  <linearGradient id="brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8097"/><stop offset="1" stop-color="#4f465b"/></linearGradient>
  <linearGradient id="inner" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient>
  <radialGradient id="open-glow" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="#fff4c4" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
  <clipPath id="door-clip"><path d="M110 190V104a50 50 0 0 1 100 0v86z"/></clipPath>
</defs>`;

const well = `
<g class="well">
  <ellipse cx="46" cy="193" rx="42" ry="5" fill="rgba(0,0,0,0.4)"/>
  <path d="M10 144l36-24l36 24z" fill="url(#wood)" stroke="#241c2b" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M20 138l26-17M34 140l12-8M58 140l-12-8M70 138l-24-16" stroke="rgba(0,0,0,0.3)" stroke-width="1.2"/>
  <path d="M20 144v48M72 144v48" stroke="#4a3f55" stroke-width="3.5"/><path d="M21.5 144v46" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <rect x="16" y="166" width="60" height="26" rx="3" fill="url(#brick)" stroke="#241c2b" stroke-width="2.5"/>
  <path d="M16 179h60M31 166v13M46 179v13M61 166v13" stroke="#241c2b" stroke-width="1.5" opacity="0.7"/>
  <path d="M46 147v12" stroke="#d9c9a6" stroke-width="2"/><rect x="40" y="157" width="12" height="9" rx="2" fill="#c4883f" stroke="#241c2b" stroke-width="1.5"/>
  <path class="water" d="M20 168q26 6 52 0" fill="none" stroke="#7dc4ff" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M26 169q8 2 14 0" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
</g>`;

const barXs = [122, 135, 148, 161, 174, 187];
const bars = barXs.map((x) => `<rect x="${x - 4}" y="40" width="5" height="150" rx="2" fill="url(#bar-g)" stroke="#2a2118" stroke-width="1"/>`).join('');
const rivets = barXs.flatMap((x) => [88.5, 142.5].map((y) => `<circle cx="${x - 1.5}" cy="${y}" r="1.6" fill="#2a2118" opacity="0.65"/>`)).join('');

const arch = `
<path d="M96 190V104a64 64 0 0 1 128 0v86h-14V104a50 50 0 0 0-100 0v86z" fill="url(#stone-g)" stroke="#241c2b" stroke-width="3"/>
<path d="M103 190V104a57 57 0 0 1 114 0v86" fill="none" stroke="rgba(20,14,28,0.55)" stroke-width="14" stroke-dasharray="1.6 14.4" stroke-dashoffset="-6"/>
<path d="M98 190V104a62 62 0 0 1 62-62" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.6"/>
<path d="M150 38h20l3 17h-26z" fill="#9a90a7" stroke="#241c2b" stroke-width="2"/>
<rect x="90" y="182" width="26" height="10" rx="2" fill="#4c4358" stroke="#241c2b" stroke-width="2"/><rect x="204" y="182" width="26" height="10" rx="2" fill="#4c4358" stroke="#241c2b" stroke-width="2"/>
<path d="M96 190h128" stroke="#241c2b" stroke-width="3"/>
<g clip-path="url(#door-clip)">
  <rect x="100" y="54" width="120" height="136" fill="#241c2b"/><rect x="100" y="54" width="120" height="136" fill="url(#glow)"/>
  <rect class="open-glow" x="100" y="54" width="120" height="136" fill="url(#open-glow)"/>
  ${WICK}
  <g class="gate-bars">${bars}<rect x="108" y="86" width="104" height="5" fill="url(#bar-gv)" stroke="#2a2118"/><rect x="108" y="140" width="104" height="5" fill="url(#bar-gv)" stroke="#2a2118"/>${rivets}</g>
  <rect x="100" y="54" width="120" height="136" fill="url(#inner)"/>
</g>`;

const plate = `
<g>
  <path d="M126 -20V14M194 -20V14" stroke="#17111c" stroke-width="4"/><path d="M126 -20V14M194 -20V14" stroke="#7d718a" stroke-width="2.4" stroke-dasharray="4 2.4"/>
  <rect x="116" y="12" width="88" height="40" rx="8" fill="url(#brass)" stroke="#5b3a00" stroke-width="3"/>
  <rect x="120" y="16" width="80" height="32" rx="5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
  <circle cx="123" cy="19" r="1.8" fill="#5b3a00"/><circle cx="197" cy="19" r="1.8" fill="#5b3a00"/><circle cx="123" cy="45" r="1.8" fill="#5b3a00"/><circle cx="197" cy="45" r="1.8" fill="#5b3a00"/>
  <text id="plate-top" x="160" y="26" text-anchor="middle" font-size="11" font-weight="800" fill="var(--plate-ink)" font-family="system-ui,sans-serif"></text>
  <text id="plate-num" x="160" y="46" text-anchor="middle" font-size="22" font-weight="900" fill="var(--plate-ink)" font-family="system-ui,sans-serif"></text>
</g>
  <rect x="284" y="150" width="16" height="40" rx="4" fill="url(#stone-g)" stroke="#241c2b" stroke-width="2"/>
  <rect x="289" y="160" width="6" height="14" rx="2" fill="#17111c"/>
<g class="handle">
  <line x1="292" y1="150" x2="292" y2="112" stroke="#17111c" stroke-width="7" stroke-linecap="round"/>
  <line x1="292" y1="150" x2="292" y2="112" stroke="url(#bar-g)" stroke-width="5" stroke-linecap="round"/>
  <circle cx="292" cy="108" r="8" fill="url(#knob)" stroke="#241c2b" stroke-width="2"/><circle cx="289.5" cy="105.5" r="2" fill="#fff" opacity="0.8"/>
</g>`;

export const SCENE_MARKUP = defs + BACKDROP + well + arch + plate + FOREGROUND;

export function buildScene(svg: SVGSVGElement): void {
  svg.innerHTML = SCENE_MARKUP;
  svg.setAttribute('aria-label', S.sceneLabel);
}

/** The title hero is the whole gate scene. Every id is prefixed so its gradients
 * and clip do not clash with the play scene's copies (a hidden SVG cannot
 * supply them). */
export function buildTitleArt(svg: SVGSVGElement): void {
  svg.innerHTML = SCENE_MARKUP.replace(/id="([\w-]+)"/g, 'id="t-$1"').replace(/url\(#([\w-]+)\)/g, 'url(#t-$1)');
  setGoal(svg, { amount: 3, count: 1 });
}

export function setGoal(svg: SVGSVGElement, goal: Goal): void {
  const top = svg.querySelector('#plate-top, #t-plate-top');
  const num = svg.querySelector('#plate-num, #t-plate-num');
  if (top) top.textContent = goal.count > 1 ? `${S.plateHold} ${S.plateTwo}` : S.plateHold;
  if (num) num.textContent = goal.count > 1 ? `${goal.amount} + ${goal.amount}` : String(goal.amount);
}

export function setGate(svg: SVGSVGElement, open: boolean): void {
  svg.dataset.open = String(open);
  svg.setAttribute('aria-label', `${S.sceneLabel} ${open ? S.gateOpen : S.gateShut}`);
}
