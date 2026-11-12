// Screen switching, the title stats and the campaign level grid.
import { CONFIG } from '../config';
import type { Ctx, ScreenName } from '../ctx';
import { LEVELS } from '../levels';
import { planLevels } from '../levelList';
import { totalStars, unlockedUpTo } from '../progress';
import { starText } from '../scoring';
import { S } from '../strings';
import { el } from './dom';

const SCREENS: readonly ScreenName[] = ['title', 'levels', 'play'];

export function showScreen(ctx: Ctx, name: ScreenName): void {
  ctx.screen = name;
  for (const s of SCREENS) el(`screen-${s}`).hidden = s !== name;
  el('back').hidden = name === 'title';
  el('pause').hidden = name !== 'play';
  document.body.dataset.screen = name;
}

export function refreshTitle(ctx: Ctx): void {
  const max = LEVELS.length * 3;
  const text = S.totalStars(totalStars(ctx.progress), max);
  el('title-stars').textContent = `${S.stars}: ${text}`;
  el('levels-stars').textContent = `(${text})`;
}

type Level = (typeof LEVELS)[number];

function levelButton(ctx: Ctx, level: Level, locked: boolean, onOpen: (id: number) => void): HTMLButtonElement {
  const best = ctx.progress[level.id];
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lv' + (best ? ' done' : '');
  btn.setAttribute('aria-label', S.levelBtn(level.id, level.name, best?.stars ?? 0, locked));
  const stars = locked ? S.lockedShort : starText(best?.stars ?? 0);
  btn.innerHTML = `<b>${level.id}</b><span class="nm" aria-hidden="true"></span><span class="st" aria-hidden="true">${stars}</span>`;
  (btn.querySelector('.nm') as HTMLElement).textContent = level.name;
  if (locked) btn.setAttribute('aria-disabled', 'true');
  btn.addEventListener('click', () => (locked ? el('toast').replaceChildren(S.lockedLevel) : onOpen(level.id)));
  return btn;
}

/** Build the level buttons. Returns the one to focus (first unfinished level). */
export function buildLevelGrid(ctx: Ctx, onOpen: (id: number) => void): HTMLElement | null {
  const grid = el('level-grid');
  grid.replaceChildren();
  const open = unlockedUpTo(ctx.progress, LEVELS.length);
  const plan = planLevels(LEVELS, open, CONFIG.progress.peekAhead);
  let firstOpen: HTMLElement | null = null;
  for (const group of plan.groups) {
    const section = document.createElement('div');
    section.className = 'lv-group';
    const h = document.createElement('h3');
    h.className = 'lv-head';
    h.textContent = S.levelGroup(group.jugs);
    const row = document.createElement('div');
    row.className = 'lv-row';
    for (const level of group.items) {
      const btn = levelButton(ctx, level, level.id > open, onOpen);
      if (!ctx.progress[level.id] && level.id <= open && !firstOpen) {
        btn.classList.add('next');
        firstOpen = btn;
      }
      row.append(btn);
    }
    section.append(h, row);
    grid.append(section);
  }
  if (plan.hidden > 0) {
    const more = document.createElement('p');
    more.className = 'lv-more muted';
    more.textContent = S.moreLevels(plan.hidden);
    grid.append(more);
  }
  return firstOpen ?? (grid.querySelector('.lv') as HTMLElement | null);
}
