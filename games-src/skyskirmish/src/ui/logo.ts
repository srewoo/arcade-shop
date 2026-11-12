// The Sky Skirmish wordmark: an original plane glyph plus stacked text, built from static SVG.
import { S } from '../strings';
import { h } from './dom';

const GLYPH = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9fb8d4"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="#0b2a55" stroke="#35c2ff" stroke-width="3"/><path d="M8 44l24-12 24 12-6 3-18-8-18 8z" fill="#35c2ff" stroke="#06182f" stroke-width="2" stroke-linejoin="round"/><path d="M32 8l6 24 3 12-9 4-9-4 3-12z" fill="url(#lg)" stroke="#06182f" stroke-width="2" stroke-linejoin="round"/><path d="M32 18l3 10h-6z" fill="#1b6fa0"/></svg>`;

export function logo(): HTMLElement {
  const wrap = h('h1', { class: 'logo' });
  const icon = h('span', { 'aria-hidden': 'true' });
  icon.innerHTML = GLYPH;
  const [first = '', second = ''] = S.title.split(' ');
  const text = h('span', { class: 'logo-text' }, [h('span', { class: 'l1' }, [first]), h('span', { class: 'l2' }, [second])]);
  text.setAttribute('aria-label', S.title);
  wrap.append(icon, text);
  return wrap;
}
