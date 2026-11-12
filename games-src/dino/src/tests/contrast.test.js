import { describe, it, expect } from 'vitest';

// Colour tokens from css/base.css, checked against WCAG AA (4.5:1 text, 3:1 large text / UI).
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const LIGHT = { ink: '#3a332b', cream: '#fff6e6', accent: '#b8301c', onAccent: '#fff6e6', pill: '#fff6e6', bg: '#f7dfc2' };
const DARK = { ink: '#fff6e6', cream: '#2a241d', accent: '#ff8f78', onAccent: '#2a241d', pill: '#2a241d', bg: '#1d1a16' };

describe.each([['light', LIGHT], ['dark', DARK]])('%s theme text contrast', (_name, T) => {
  it('ink text on the pill backing (blurb, CTA, hints, score, quip)', () => expect(ratio(T.ink, T.pill)).toBeGreaterThanOrEqual(4.5));
  it('cream text on ink buttons / chips / badges', () => expect(ratio(T.cream, T.ink)).toBeGreaterThanOrEqual(4.5));
  it('on-accent text on the accent (NEW BEST, UNLOCK, AUTOPLAY, coach pill)', () => expect(ratio(T.onAccent, T.accent)).toBeGreaterThanOrEqual(4.5));
  it('accent text on the pill (low clock, save message accents)', () => expect(ratio(T.accent, T.pill)).toBeGreaterThanOrEqual(4.5));
  it('ink on the page background (loading screen)', () => expect(ratio(T.ink, T.bg)).toBeGreaterThanOrEqual(4.5));
});

describe('contrast of the old values (regression record)', () => {
  it('the old accent failed on cream, the new one passes', () => {
    expect(ratio('#e0442e', '#fff6e6')).toBeLessThan(4.5);
    expect(ratio('#b8301c', '#fff6e6')).toBeGreaterThanOrEqual(5.5);
  });
  it('the blink trough used to be near invisible; ink on cream is far above AA', () => {
    expect(ratio('#3a332b', '#fff6e6')).toBeGreaterThan(10);
  });
  it('the big logo accent line passes the 3:1 large-text rule over the sand sky', () => {
    expect(ratio('#b8301c', '#ecd6a8')).toBeGreaterThanOrEqual(3);
  });
});
