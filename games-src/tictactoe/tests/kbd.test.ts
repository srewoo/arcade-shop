import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('kbd hint size', () => {
  it('uses a rem font size of at least 11px (0.6875rem)', () => {
    const css = readFileSync('src/style/base.css', 'utf8');
    const m = /kbd\s*\{[^}]*font:\s*\d+\s+([\d.]+)(rem|em)/.exec(css);
    expect(m).not.toBeNull();
    expect(m?.[2]).toBe('rem');
    expect(Number(m?.[1]) * 16).toBeGreaterThanOrEqual(11);
  });
});
