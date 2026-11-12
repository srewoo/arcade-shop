import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = (f: string): string => readFileSync(new URL(`../src/style/${f}`, import.meta.url), 'utf8');

describe('short landscape layout guards (large text on a phone on its side)', () => {
  const hud = css('hud.css');
  const base = css('base.css');
  it('compacts the HUD chips and stops the stage sizing the grid rows', () => {
    const block = hud.slice(hud.indexOf('max-height: 520px'));
    expect(block).toMatch(/\.chip\s*\{[^}]*flex-direction:\s*row/);
    expect(block).toMatch(/\.stage\s*\{[^}]*contain:\s*size/);
  });
  it('shrinks the hint banner over the field', () => {
    const block = base.slice(base.indexOf('max-height: 520px'));
    expect(block).toMatch(/max-height:\s*45%/);
  });
  it('keeps the screen-reader status out of the page scroll extent', () => {
    expect(base).toMatch(/\.sr-only\s*\{[^}]*top:\s*0/);
  });
});
