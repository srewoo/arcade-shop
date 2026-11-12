import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { S } from '../src/strings';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('index.html and strings', () => {
  it('every data-s and data-s-aria key exists in the strings module as text', () => {
    const keys = [...html.matchAll(/data-s(?:-aria)?="(\w+)"/g)].map((m) => m[1] as string);
    expect(keys.length).toBeGreaterThan(30);
    for (const k of keys) expect(typeof S[k as keyof typeof S], k).toBe('string');
  });
  it('every element id is unique', () => {
    const ids = [...html.matchAll(/\sid="([\w-]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('dialogs are labelled modal dialogs', () => {
    const dialogs = [...html.matchAll(/<div id="[\w-]+-overlay"[^>]*>/g)].map((m) => m[0]);
    expect(dialogs.length).toBe(6);
    for (const d of dialogs) {
      expect(d).toMatch(/role="(alert)?dialog"/);
      expect(d).toContain('aria-modal="true"');
      expect(d).toContain('aria-labelledby');
    }
  });
  it('pause and settings options exist (volume, motion, assist, text size, theme)', () => {
    for (const k of ['volume', 'reduceMotion', 'colorAssist', 'textSize', 'theme']) expect(html).toContain(k);
  });
});
