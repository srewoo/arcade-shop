import { scopeIds } from './scope';
// Foreground set dressing for the banks: grass, rocks, reeds, lamp posts. Pure markup, drawn in code.

const GRASS = (x: number, s = 1): string =>
  `<g transform="translate(${x} 100) scale(${s})" fill="none" stroke="#5f9a68" stroke-width="2" stroke-linecap="round"><path d="M0 0q-1-9-5-13M0 0q0-11 1-16M0 0q2-9 6-12"/></g>`;
const ROCK = (x: number, s = 1): string =>
  `<g transform="translate(${x} 100) scale(${s})"><path d="M-12 0q-2-10 6-12 8-3 14 2 4 4 3 10z" fill="#4d5d66" stroke="#2c3a40" stroke-width="1.5"/><path d="M-6-8q4-3 8 0" fill="none" stroke="#7e9099" stroke-width="1.5" stroke-linecap="round"/></g>`;
const REED = (x: number): string =>
  `<g transform="translate(${x} 100)" stroke="#3f6b4a" stroke-width="2" stroke-linecap="round" fill="none"><path d="M0 0v-26M5 0l3-20M-5 0l-3-17"/><ellipse cx="0" cy="-30" rx="2.2" ry="5" fill="#7a5a34" stroke="none"/></g>`;
const POST = (x: number): string =>
  `${LANTERN_POOL(x)}<g transform="translate(${x} 100)"><circle cx="0" cy="-46" r="30" fill="url(#lbglow)"/><path d="M-3 0h6l-1 -52h-4z" fill="#3a2e22"/><path d="M-1.6 0l.2-50" stroke="#6b5a44" stroke-width="1" opacity=".7"/><path d="M-6 0h12l-2-5h-8z" fill="#2a2118"/><path d="M-5-52h10l2.4 9h-14.8z" fill="#ffe9ae" stroke="#2a2118" stroke-width="1.8"/><path d="M-1.4-51.5v8.4M1.4-51.5v8.4" stroke="#2a2118" stroke-width=".8" opacity=".6"/><path d="M-7-53.5l7-4 7 4z" fill="#2a2118"/></g>`;

const FLOWER = (x: number, c: string): string =>
  `<g transform="translate(${x} 100)"><path d="M0 0v-9" stroke="#3f6b4a" stroke-width="1.4"/><circle cx="0" cy="-10" r="2.6" fill="${c}"/><circle cx="0" cy="-10" r="1" fill="#fff3c4"/></g>`;
const BUSH = (x: number, s = 1): string =>
  `<g transform="translate(${x} 100) scale(${s})"><ellipse cx="0" cy="-5" rx="14" ry="9" fill="#1d4130"/><ellipse cx="-6" cy="-9" rx="8" ry="6" fill="#2a5a40"/><ellipse cx="6" cy="-8" rx="7" ry="5" fill="#336a4b"/><path d="M-9-12q3-3 6-1" stroke="#5a9a6a" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
const LANTERN_POOL = (x: number): string => `<ellipse cx="${x}" cy="99" rx="26" ry="5" fill="url(#lbglow)" opacity=".7"/>`;

const wrap = (inner: string): string =>
  scopeIds(`<svg class="decor" viewBox="0 0 200 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><defs><radialGradient id="lbglow"><stop offset="0" stop-color="#ffc861" stop-opacity=".6"/><stop offset=".5" stop-color="#ffc861" stop-opacity=".18"/><stop offset="1" stop-color="#ffc861" stop-opacity="0"/></radialGradient></defs>${inner}</svg>`);

/** `side` picks the arrangement so the two banks are not mirror images. */
export function bankDecor(side: 'start' | 'goal'): string {
  return side === 'start'
    ? wrap(`${BUSH(10)}${GRASS(30, 1.1)}${ROCK(48, 0.9)}${FLOWER(66,"#ff9fb2")}${GRASS(80)}${FLOWER(104,"#ffd166")}${BUSH(124, 0.8)}${GRASS(142, 0.8)}${POST(176)}`)
    : wrap(`${POST(24)}${REED(58)}${REED(70)}${REED(80)}${FLOWER(100,"#a9c8ff")}${ROCK(124, 1.1)}${BUSH(150, 0.9)}${GRASS(166, 1.1)}${FLOWER(176,"#ffd166")}${GRASS(188)}`);
}
