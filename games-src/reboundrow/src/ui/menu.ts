// Title screen: stats line and the level-select grid.
import { LEVELS, LEVEL_COUNT, countDestructible, type Cell } from '../levels';
import { PALETTE } from '../palette';
import { S } from '../strings';
import { $ } from './dom';
import { app } from './state';

const LOCK = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

export function renderTitleStats(): void {
  const p = app.progress;
  $('title-stats').textContent = S.statsLine(p.bestCampaign, p.unlocked, LEVEL_COUNT);
  $('btn-play').textContent = p.unlocked > 1 ? S.playFrom(p.unlocked) : S.play;
}

/** Mini brick-pattern SVG markup for a level (row hues; steel in grey). Pure string, no DOM. */
export function previewSvg(cells: readonly (readonly Cell[])[]): string {
  const rects: string[] = [];
  cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cell) return;
      const fill = cell.kind === 'steel' ? PALETTE.steel : (PALETTE.rows[r % PALETTE.rows.length] as string);
      const op = cell.kind === 'brick' && cell.hp > 1 ? '' : ' fill-opacity="0.8"';
      rects.push(`<rect x="${c + 0.06}" y="${r + 0.1}" width="0.88" height="0.8" rx="0.15" fill="${fill}"${op}/>`);
    }),
  );
  return `<svg class="preview" viewBox="0 0 12 ${Math.max(1, cells.length)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${rects.join('')}</svg>`;
}

export function renderLevelGrid(onPick: (level: number) => void): void {
  const host = $('levels-grid');
  host.replaceChildren(
    ...LEVELS.map((lv, i) => {
      const n = i + 1;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      const locked = n > app.progress.unlocked;
      b.disabled = locked;
      b.title = lv.name;
      b.setAttribute('aria-label', locked ? `${S.level} ${n}: ${S.locked}` : S.previewLabel(n, lv.name, countDestructible(lv.cells)));
      b.innerHTML = `${previewSvg(lv.cells)}<span class="num">${n}${locked ? LOCK : ''}</span>`;
      if (!locked) b.addEventListener('click', () => onPick(n));
      li.append(b);
      return li;
    }),
  );
}
