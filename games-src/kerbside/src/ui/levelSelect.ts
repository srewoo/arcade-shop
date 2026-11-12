// Level grid: stars, best time, locked state.
import type { Level } from '../levels/types';
import type { Progress } from '../progress';
import { isUnlocked, totalStars } from '../progress';
import { formatTime, starGlyphs } from '../scoring';
import { S } from '../strings';
import { el } from './dom';

export function renderLevelGrid(levels: readonly Level[], progress: Progress, onPick: (id: number) => void): void {
  const grid = el('level-grid');
  grid.replaceChildren();
  for (const level of levels) {
    const rec = progress[level.id];
    const open = isUnlocked(progress, level.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.setAttribute('role', 'listitem');
    card.classList.toggle('locked', !open);
    card.classList.toggle('played', Boolean(rec));
    card.dataset.level = String(level.id);
    card.setAttribute('aria-disabled', String(!open));
    const stars = rec?.stars ?? 0;
    card.setAttribute('aria-label', `Level ${level.id}, ${level.name}. ${open ? `${rec ? `${stars} of 3 stars, best ${formatTime(rec.bestTime)}` : 'not played yet'}` : S.locked}`);
    card.innerHTML = `<span class="num">${level.id}${open ? '' : ' 🔒'}</span><span class="nm"></span><span class="st" aria-hidden="true">${open ? starGlyphs(rec ? stars : undefined) : ''}</span>`;
    (card.querySelector('.nm') as HTMLElement).textContent = level.name;
    card.addEventListener('click', () => {
      if (open) onPick(level.id);
    });
    grid.append(card);
  }
  const total = totalStars(progress);
  el('levels-stars').textContent = `${total} / ${levels.length * 3}`;
  el('title-stars').textContent = total > 0 ? `${total} of ${levels.length * 3} stars collected` : '';
}
