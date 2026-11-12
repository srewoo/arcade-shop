// Frog (team A) and toad (team B). Colours come from --b / --d (set per team in CSS).
import type { Team } from '../board';
import { uid } from './svgId';

const stop = (o: number, css: string): string => `<stop offset="${o}" style="stop-color:${css}"/>`;

function defs(u: string, iris: [string, string]): string {
  return `<defs><radialGradient id="${u}b" cx="0.36" cy="0.28" r="0.9">${stop(0, 'color-mix(in srgb,var(--b) 48%,#fff)')}${stop(0.5, 'var(--b)')}${stop(1, 'color-mix(in srgb,var(--b) 62%,var(--d))')}</radialGradient>
<radialGradient id="${u}i" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="${iris[0]}"/><stop offset="1" stop-color="${iris[1]}"/></radialGradient></defs>`;
}

const frog = (u: string): string => `${defs(u, ['#fff2a6', '#d39a12'])}
<ellipse cx="34" cy="72" rx="19" ry="12" transform="rotate(-18 34 72)" fill="url(#${u}b)" class="o"/>
<path d="M22 82l-9 3M25 85l-7 6M30 86l-3 8" class="toe"/><ellipse cx="22" cy="80" rx="9" ry="5" fill="url(#${u}b)" class="o"/>
<ellipse cx="50" cy="62" rx="30" ry="21" fill="url(#${u}b)" class="o"/>
<ellipse cx="55" cy="73" rx="19" ry="7" class="belly"/>
<path d="M30 56Q50 43 70 56" class="fd"/><path d="M32 51Q50 38 68 51" class="hi"/>
<circle cx="40" cy="55" r="3" class="fd"/><circle cx="53" cy="52" r="2.6" class="fd"/><circle cx="46" cy="64" r="2.2" class="fd"/>
<ellipse cx="68" cy="48" rx="17" ry="14" fill="url(#${u}b)" class="o"/><ellipse cx="73" cy="55" rx="5" ry="2.6" class="blush"/>
<circle cx="64" cy="34" r="9" class="eye o"/><circle cx="78" cy="38" r="8" class="eye o"/>
<circle cx="66" cy="35" r="5.2" fill="url(#${u}i)"/><circle cx="80" cy="39" r="4.6" fill="url(#${u}i)"/>
<circle cx="67" cy="35" r="3" class="pupil"/><circle cx="80.6" cy="39" r="2.7" class="pupil"/>
<circle cx="65.6" cy="33.4" r="1.3" class="glint"/><circle cx="79.4" cy="37.6" r="1.1" class="glint"/>
<path d="M56 32Q64 24 73 31" class="lid"/><path d="M71 36Q78 29 86 36" class="lid"/>
<circle cx="86" cy="46" r="1.1" class="nostril"/><path d="M70 56Q80 60 87 54" class="mouth"/>
<ellipse cx="66" cy="72" rx="9" ry="5" fill="url(#${u}b)" class="o"/><path d="M72 75l4 3M68 77l2 4" class="toe"/>`;

const toad = (u: string): string => `${defs(u, ['#ffd08a', '#a8530a'])}
<ellipse cx="30" cy="78" rx="16" ry="9" fill="url(#${u}b)" class="o"/><path d="M18 84l-7 3M23 86l-5 6M30 87l-2 7" class="toe"/>
<ellipse cx="50" cy="64" rx="34" ry="22" fill="url(#${u}b)" class="o"/>
<ellipse cx="55" cy="75" rx="21" ry="7" class="belly"/>
<g class="warts"><circle cx="32" cy="58" r="4.2" class="fd"/><circle cx="46" cy="50" r="3.6" class="fd"/><circle cx="57" cy="62" r="4.2" class="fd"/><circle cx="40" cy="70" r="3.2" class="fd"/><circle cx="26" cy="68" r="2.6" class="fd"/><circle cx="66" cy="68" r="2.8" class="fd"/>
<circle cx="31" cy="56.6" r="1.4" class="glint"/><circle cx="45" cy="48.8" r="1.2" class="glint"/><circle cx="56" cy="60.6" r="1.4" class="glint"/></g>
<path d="M34 46Q50 38 62 46" class="hi"/>
<ellipse cx="70" cy="52" rx="18" ry="13" fill="url(#${u}b)" class="o"/><ellipse cx="58" cy="50" rx="6" ry="4" class="blush"/>
<path d="M52 44Q70 38 86 46" class="ridge"/>
<circle cx="64" cy="40" r="8" class="eye o"/><circle cx="78" cy="42" r="7" class="eye o"/>
<circle cx="65" cy="40.5" r="4.7" fill="url(#${u}i)"/><circle cx="79" cy="42.5" r="4.1" fill="url(#${u}i)"/>
<rect x="63" y="37.5" width="4.6" height="6.6" rx="2.2" class="pupil"/><rect x="77" y="39.5" width="4" height="6" rx="2" class="pupil"/>
<circle cx="64" cy="38.6" r="1.1" class="glint"/><circle cx="78" cy="40.6" r="1" class="glint"/>
<path d="M56 38Q64 31 72 37" class="lid"/><path d="M71 40Q78 34 85 40" class="lid"/>
<path d="M62 58Q76 63 88 56" class="mouth"/><circle cx="85" cy="48" r="1" class="nostril"/>
<ellipse cx="66" cy="74" rx="9" ry="5" fill="url(#${u}b)" class="o"/><path d="M72 77l4 3M68 79l2 4" class="toe"/>`;

export function pieceSvg(team: Team): string {
  const u = uid('pc');
  return `<svg viewBox="0 0 100 100" class="piece-art" aria-hidden="true">${team === 'A' ? frog(u) : toad(u)}</svg>`;
}
