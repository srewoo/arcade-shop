import { describe, expect, it } from 'vitest';

interface Fs {
  readFileSync(path: string, enc: 'utf8'): string;
}
const fsName: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsName)) as Fs;
const css = readFileSync(new URL('../src/style.css', import.meta.url).pathname, 'utf8');
const marker = '/* Large text on short landscape phones';
const block = css.slice(css.indexOf(marker));

describe('large text on short landscape phones (S3)', () => {
  it('has a dedicated short-landscape block', () => {
    expect(css.indexOf(marker)).toBeGreaterThan(-1);
    expect(block.slice(marker.length, 400)).toContain('@media (orientation: landscape) and (max-height: 520px)');
  });

  it('covers both 125% and 150% text sizes', () => {
    expect(block).toContain("html[data-text='125'] .hud");
    expect(block).toContain("html[data-text='150'] .hud");
  });

  it('narrows the side columns and stacks the HUD in one column', () => {
    expect(block).toMatch(/--side: clamp\(/);
    expect(block).toMatch(/\.hud \{ grid-template-columns: 1fr;/);
  });

  it('keeps touch targets at 44 px regardless of the rem scale', () => {
    expect(block).toMatch(/min-height: 44px/);
    expect(block).toMatch(/\.pad \{ min-height: 48px/);
  });

  it('gives non-coach modals the whole viewport so panels are not squeezed by the canvas stage', () => {
    expect(block).toMatch(/\.overlay:not\(\[data-mode='coach'\]\)[^}]*position: fixed; inset: 0/);
  });

  it('lays out the level grid in six columns', () => {
    expect(block).toMatch(/\.levels \{ grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  });
});
