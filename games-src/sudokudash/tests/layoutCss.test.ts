
const files = import.meta.glob<string>('../src/*.css', { query: '?raw', import: 'default', eager: true });
const gameCss = files['../src/game.css'] ?? '';
const boards = files;
const overlaysCss = files['../src/overlays.css'] ?? '';
import { describe, expect, it } from 'vitest';

describe('hint panel and coach toast layout (S3)', () => {
  it('keeps the hint panel in normal flow so it cannot cover the tool row', () => {
    const rule = /\.hint-panel\s*\{[^}]*\}/.exec(gameCss)?.[0] ?? '';
    expect(rule).toContain('position: static');
    expect(rule).not.toContain('position: absolute');
  });

  it('does not reflow the page for the coach toast and moves it off the board in landscape', () => {
    expect(overlaysCss).not.toMatch(/body:has\(\.coach/);
    expect(overlaysCss).toMatch(/body\.in-game \.coach \{ left: calc\(var\(--lb\)/);
  });

  it('draws hint reason cells in the neutral hint colour, never the error red', () => {
    const boardCss = boards['../src/board.css'] ?? '';
    const rule = /\.cell\.h-source\s*\{[^}]*\}/.exec(boardCss)?.[0] ?? '';
    expect(rule).toContain('var(--hint)');
    expect(rule).not.toContain('--bad');
    expect(rule).not.toContain('--pink');
  });

  it('gives the 9x9 grid equal fixed rows so a short board never squashes row 1', () => {
    const boardCss = boards['../src/board.css'] ?? '';
    expect(boardCss).toContain('grid-template-rows: repeat(9, minmax(0, 1fr))');
  });
});
