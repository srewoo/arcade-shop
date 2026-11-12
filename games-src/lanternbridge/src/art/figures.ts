// Every character is drawn in code as inline SVG. Colour comes from CSS
// variables (--fig body, --line outline); a chest mark gives a non-colour cue.
import type { ArtKey } from '../puzzle/types';
import { scopeIds } from './scope';

interface PersonLook {
  readonly skin: string;
  readonly hat: string;
  readonly extra?: string;
  readonly kid?: boolean;
}

const HAIR = '#5b3b24';
const CAP = '#e9e4da';

const PEOPLE: Partial<Record<ArtKey, PersonLook>> = {
  courier: { skin: '#f1c9a5', hat: `<path d="M20 20a12 11 0 0 1 24 0z" fill="${CAP}"/><path d="M38 20h12v3H38z" fill="${CAP}"/>` },
  tinker: { skin: '#d9a77c', hat: `<path d="M21 18h22l-2-11H23z" fill="#9aa4ad"/><rect x="17" y="17" width="30" height="4" rx="2" fill="#7b858e"/>` },
  baker: { skin: '#f6d3b3', hat: `<path d="M22 15v-4a6 6 0 0 1 9-5 6 6 0 0 1 9 5v4z" fill="#ffffff"/>` },
  porter: { skin: '#b9835a', hat: `<path d="M21 17a11 10 0 0 1 22 0z" fill="#d94f3d"/><circle cx="32" cy="5" r="3.5" fill="#f2f2f2"/>` },
  herbalist: { skin: '#e8b98f', hat: `<ellipse cx="32" cy="16" rx="19" ry="4" fill="#7c6a3d"/><path d="M22 16a10 9 0 0 1 20 0z" fill="#948050"/>` },
  smith: { skin: '#c68e63', hat: `<rect x="21" y="16" width="22" height="5" rx="2" fill="#c0392b"/><path d="M22 26q10 15 20 0z" fill="${HAIR}"/>` },
  elder: { skin: '#f0cfb0', hat: `<circle cx="22" cy="20" r="4" fill="#f4f4f4"/><circle cx="42" cy="20" r="4" fill="#f4f4f4"/><circle cx="32" cy="11" r="4" fill="#f4f4f4"/>`, extra: '<path d="M54 40v28" stroke="#c9a46a" stroke-width="4" stroke-linecap="round"/>' },
  warden: { skin: '#e3b48a', hat: `<path d="M20 17a12 9 0 0 1 24 0z" fill="#27427a"/><rect x="17" y="16" width="30" height="4" rx="2" fill="#1c2f59"/><path d="M32 8l1.5 3.2 3.5.4-2.6 2.4.7 3.4-3.1-1.7-3.1 1.7.7-3.4-2.6-2.4 3.5-.4z" fill="#ffd166"/>` },
  pickpocket: { skin: '#e8c4a0', hat: `<path d="M21 17a11 9 0 0 1 22 0z" fill="#3a3a44"/><rect x="21" y="20" width="22" height="5" rx="2" fill="#17171c"/>`, extra: '<path d="M16 50h32M15 56h34M14 62h36" stroke="#17171c" stroke-width="2" opacity=".55"/>' },
  pa: { skin: '#d9a77c', hat: `<ellipse cx="32" cy="16" rx="16" ry="3.5" fill="#4b3a2a"/><path d="M23 16a9 8 0 0 1 18 0z" fill="#5d4a36"/>` },
  ma: { skin: '#f1c9a5', hat: `<circle cx="32" cy="8" r="6" fill="${HAIR}"/><path d="M21 21a11 12 0 0 1 22 0q-11-7-22 0z" fill="${HAIR}"/>` },
  boy: { skin: '#e8b98f', kid: true, hat: `<path d="M21 18a11 10 0 0 1 22 0z" fill="#3f8f5a"/><path d="M21 18h-6v3h6z" fill="#3f8f5a"/>` },
  girl: { skin: '#f1c9a5', kid: true, hat: `<path d="M21 20a11 11 0 0 1 22 0q-11-6-22 0z" fill="#8a4b2a"/><circle cx="18" cy="26" r="4" fill="#8a4b2a"/><circle cx="46" cy="26" r="4" fill="#8a4b2a"/>` },
  keeper: { skin: '#e3b48a', hat: `<path d="M19 28v-8a13 13 0 0 1 26 0v8l-6-4H25z" fill="#3b6f5f"/>` },
  farmer: { skin: '#e3b48a', hat: `<ellipse cx="32" cy="16" rx="20" ry="4" fill="#e3c26a"/><path d="M23 16a9 9 0 0 1 18 0z" fill="#f0d27f"/>` },
};

const ANIMALS: Partial<Record<ArtKey, string>> = {
  fox: '<path d="M14 30l8-18 10 10 10-10 8 18v14a18 16 0 0 1-36 0z" fill="var(--fig)" stroke="var(--line)" stroke-width="2.5"/><path d="M24 44h16l-8 10z" fill="#fff6ea"/><circle cx="25" cy="38" r="2.2" fill="#222"/><circle cx="39" cy="38" r="2.2" fill="#222"/><circle cx="32" cy="46" r="2.4" fill="#222"/>',
  hen: '<ellipse cx="32" cy="46" rx="21" ry="18" fill="var(--fig)" stroke="var(--line)" stroke-width="2.5"/><path d="M26 28q2-8 6-3 3-6 6 0 4-3 4 5z" fill="#d94f3d"/><path d="M46 44l9 4-9 3z" fill="#f0a830"/><circle cx="40" cy="40" r="2.4" fill="#222"/><path d="M18 46q6 10 16 0" fill="none" stroke="var(--line)" stroke-width="2"/>',
  grain: '<path d="M32 66V28M32 36l-10-8M32 36l10-8M32 46l-12-8M32 46l12-8M32 56l-12-8M32 56l12-8" stroke="var(--line)" stroke-width="3" stroke-linecap="round" fill="none"/><g fill="var(--fig)" stroke="var(--line)" stroke-width="1.5"><ellipse cx="32" cy="22" rx="4" ry="8"/><ellipse cx="20" cy="26" rx="3.5" ry="7" transform="rotate(-30 20 26)"/><ellipse cx="44" cy="26" rx="3.5" ry="7" transform="rotate(30 44 26)"/><ellipse cx="18" cy="38" rx="3.5" ry="7" transform="rotate(-35 18 38)"/><ellipse cx="46" cy="38" rx="3.5" ry="7" transform="rotate(35 46 38)"/></g>',
  magpie: '<path d="M12 56q4-30 26-30 12 0 14 10l8 3-8 4q-2 18-22 18-14 0-18-5z" fill="#2a2a38" stroke="var(--line)" stroke-width="2.5"/><path d="M22 56q6-12 18-12" stroke="var(--fig)" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="45" cy="34" r="2.2" fill="#fff"/><path d="M52 36l8 3-8 3z" fill="#f0a830"/>',
};

const MARKS = [
  '<circle cx="32" cy="57" r="4"/>',
  '<rect x="28" y="53" width="8" height="8"/>',
  '<path d="M32 52l5 9H27z"/>',
  '<path d="M32 51l5 6-5 6-5-6z"/>',
  '<path d="M30 51h4v5h5v4h-5v5h-4v-5h-5v-4h5z"/>',
  '<rect x="26" y="55" width="12" height="4"/>',
  '<circle cx="32" cy="57" r="4.5" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  '<path d="M32 51l1.8 3.8 4.2.5-3.1 2.9.8 4.1-3.7-2-3.7 2 .8-4.1-3.1-2.9 4.2-.5z"/>',
] as const;

const DEFS =
  '<defs><linearGradient id="lbshade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>' +
  '<radialGradient id="lbhead" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a2a10" stop-opacity=".3"/></radialGradient>' +
  '<radialGradient id="lbfoot"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>';
const BODY = 'M14 68c0-16 8-26 18-26s18 10 18 26z';
const SHADOW = '<ellipse cx="32" cy="69" rx="21" ry="3.2" fill="url(#lbfoot)"/>';

function person(look: PersonLook, mark: string): string {
  const body = `<path d="${BODY}" fill="var(--fig)" stroke="var(--line)" stroke-width="2.5"/><path d="${BODY}" fill="url(#lbshade)"/><path d="M20 47q-4 6-4.5 13" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" stroke-linecap="round"/><path d="M22 44q10 7 20 0l1.5 3.6q-11.5 7-23 0z" fill="#000" fill-opacity=".2"/><path d="M15 62h34" stroke="#000" stroke-opacity=".18" stroke-width="1.4"/>`;
  const head = `<circle cx="32" cy="29" r="12" fill="${look.skin}" stroke="var(--line)" stroke-width="2.5"/><circle cx="32" cy="29" r="12" fill="url(#lbhead)"/><ellipse cx="25" cy="33.5" rx="2.6" ry="1.7" fill="#e86a6a" fill-opacity=".32"/><ellipse cx="39" cy="33.5" rx="2.6" ry="1.7" fill="#e86a6a" fill-opacity=".32"/><circle cx="27.5" cy="30" r="1.8" fill="#222"/><circle cx="36.5" cy="30" r="1.8" fill="#222"/><circle cx="28" cy="29.4" r=".6" fill="#fff"/><circle cx="37" cy="29.4" r=".6" fill="#fff"/><path d="M25 26.2q2.5-1.6 5 0M34 26.2q2.5-1.6 5 0" fill="none" stroke="#3a2415" stroke-width="1.1" stroke-linecap="round"/><path d="M29.5 34q2.5 1.8 5 0" fill="none" stroke="#7a3b2a" stroke-width="1.1" stroke-linecap="round"/>`;
  const markG = `<g class="mark" fill="var(--mark)" color="var(--mark)">${mark}</g>`;
  const inner = `${look.extra ?? ''}${body}${head}<g transform="translate(0 7)">${look.hat}</g>${markG}`;
  return look.kid ? `<g transform="translate(6 12) scale(.82)">${inner}</g>` : inner;
}

/** Inline SVG markup for a character. `markIndex` picks the chest symbol. */
export function figureSvg(art: ArtKey, markIndex: number): string {
  const mark = MARKS[markIndex % MARKS.length] as string;
  const look = PEOPLE[art];
  const inner = SHADOW + (look ? person(look, mark) : `${ANIMALS[art] ?? ''}`);
  const tag = look ? '' : `<g class="mark" fill="var(--mark)" color="var(--mark)" transform="translate(22 8) scale(.6)">${mark}</g>`;
  return `<svg class="fig" viewBox="6 0 52 72" aria-hidden="true" focusable="false">${scopeIds(`${DEFS}${inner}${tag}`)}</svg>`;
}

export const carrierSvg = (pack: 'bridge' | 'raft'): string =>
  pack === 'bridge'
    ? '<svg viewBox="0 0 40 52" aria-hidden="true"><path d="M14 8a6 6 0 0 1 12 0" fill="none" stroke="#8a6a3a" stroke-width="3"/><rect x="10" y="12" width="20" height="5" rx="2" fill="#6b5130"/><path d="M12 17h16l2 22H10z" fill="#ffd98a" stroke="#6b5130" stroke-width="2.5"/><path d="M20 38c-5-5-3-9 0-13 3 4 5 8 0 13z" fill="#ff9a2e"/><rect x="9" y="39" width="22" height="5" rx="2" fill="#6b5130"/></svg>'
    : '<svg viewBox="0 0 80 36" aria-hidden="true"><path d="M4 16h72l-8 16H12z" fill="#a9803f" stroke="#5a3f18" stroke-width="3" stroke-linejoin="round"/><path d="M14 16v14M28 16v16M42 16v16M56 16v16M66 16v14" stroke="#5a3f18" stroke-width="2"/><path d="M40 16V3l16 8z" fill="#f4e4c1" stroke="#5a3f18" stroke-width="2"/></svg>';
