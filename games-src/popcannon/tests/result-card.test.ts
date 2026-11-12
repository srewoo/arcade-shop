import { describe, expect, it } from 'vitest';
import { accuracyPct, resultNote, resultStats } from '../src/result';
import { newGame } from '../src/state';
import { S } from '../src/strings';

describe('tiered result card data', () => {
  it('computes accuracy without dividing by zero', () => {
    expect(accuracyPct(0, 0)).toBe(0);
    expect(accuracyPct(8, 6)).toBe(75);
  });
  it('hides the level stat at level 1 (meaningless) and shows it later', () => {
    const g = newGame('arcade', { seed: 1 });
    g.status = 'lost';
    expect(resultStats(g).map((s) => s.label)).not.toContain(S.statLabels.level);
    g.level = 3;
    expect(resultStats(g).map((s) => s.label)).toContain(S.statLabels.level);
  });
  it('never shows level for puzzle or rush', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.level = 5;
    expect(resultStats(g).map((s) => s.label)).not.toContain(S.statLabels.level);
  });
  it('gives the cause as a note', () => {
    const g = newGame('arcade', { seed: 1 });
    g.status = 'lost';
    g.loseRow = 12;
    expect(resultNote(g)).toBe(S.result.lostBy);
    g.status = 'finished';
    expect(resultNote(g)).toBeUndefined();
  });
  it('explains stars on a puzzle win', () => {
    const g = newGame('puzzle', { puzzleIndex: 0, seed: 1 });
    g.status = 'won';
    g.stars = 2;
    expect(resultNote(g)).toBe(S.result.threeStars(g.par));
    g.stars = 3;
    expect(resultNote(g)).toBe(S.result.perfect);
  });
});

describe('layout rules', () => {
  it('hides the touch pad for fine pointers', async () => {
    const fsName: string = 'node:fs';
    const { readFileSync } = (await import(/* @vite-ignore */ fsName)) as { readFileSync(p: string, e: 'utf8'): string };
    const css = readFileSync(new URL('../src/style.css', import.meta.url).pathname, 'utf8');
    expect(css).toMatch(/@media \(pointer: fine\) and \(hover: hover\) \{ \.controls \{ display: none; \} \}/);
    expect(css).toMatch(/\.overlay \{\s*position: fixed; inset: 0/);
  });
});
