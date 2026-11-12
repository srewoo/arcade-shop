// Title screen: level groups with stars and locks.
import { LEVELS, type Group, type Level } from '../levels';
import { isUnlocked, type Progress } from '../progress';
import { S } from '../strings';
import { pieceSvg } from './art';
import { el } from './dom';

export interface MenuHooks {
  readonly open: (level: Level) => void;
  readonly locked: (message: string) => void;
}

const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const starText = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

export function renderMenu(p: Progress, today: string, hooks: MenuHooks): void {
  const root = el('level-groups');
  root.replaceChildren();
  for (const group of ['classic', 'gaps', 'grid'] as Group[]) {
    const section = document.createElement('section');
    section.className = 'group';
    section.innerHTML = `<h2>${S.groups[group]}</h2><div class="level-row"></div>`;
    const row = section.querySelector('.level-row') as HTMLElement;
    for (const level of LEVELS.filter((l) => l.group === group)) row.append(levelButton(level, p, hooks));
    root.append(section);
  }
  const d = p.daily?.date === today ? p.daily : undefined;
  const stars = el('daily-stars');
  stars.textContent = d ? starText(d.stars) : '';
  stars.setAttribute('aria-label', d ? S.starsOf(d.stars) : '');
  el('play-next').textContent = Object.keys(p.levels).length > 0 ? S.playContinue : S.play;
}

function levelButton(level: Level, p: Progress, hooks: MenuHooks): HTMLButtonElement {
  const open = isUnlocked(p, level.id);
  const rec = p.levels[level.id];
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'level-btn';
  btn.dataset.id = level.id;
  btn.dataset.locked = String(!open);
  btn.setAttribute('aria-disabled', String(!open));
  const status = !open ? S.lockedShort : rec ? S.starsOf(rec.stars) : S.noStars;
  btn.setAttribute('aria-label', `${level.label}. ${status}`);
  const art = open ? `<span class="lv-art" aria-hidden="true">${pieceSvg('A')}${pieceSvg('B')}</span>` : `<span class="lv-art lock" aria-hidden="true">${LOCK}</span>`;
  btn.innerHTML = `${art}<span class="lv-text"><span class="lv-name">${level.label}</span><span class="lv-stars" aria-hidden="true">${open ? starText(rec?.stars ?? 0) : S.lockedShort}</span></span>`;
  btn.addEventListener('click', () => {
    if (open) hooks.open(level);
    else hooks.locked(S.locked(previousLabel(level)));
  });
  return btn;
}

function previousLabel(level: Level): string {
  const i = LEVELS.findIndex((l) => l.id === level.id);
  return LEVELS[i - 1]?.label ?? '';
}

/** First level the player has not finished yet (the last one when all are done). */
export function nextToPlay(p: Progress): Level {
  return LEVELS.find((l) => p.levels[l.id] === undefined && isUnlocked(p, l.id)) ?? (LEVELS[LEVELS.length - 1] as Level);
}
