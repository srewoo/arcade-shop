// DOM helpers: HUD, game-over overlay, trick picker, menu bests, live-region announcements. No game rules here.
import { makeGrace } from './grace';
import { isPrimaryStat, isUrgentClock } from './hudFormat';
import { resultStats, resultTier } from './results';
import type { Hud, Mode, OverInfo } from './gameTypes';
import type { Progress } from './settings';
import { STR } from './strings';
import { TRICKS } from './tricks';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};
export { $ };

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

/** HUD stats are not a live region (the clock changes 10x a second); announcements go through #sr-status. */
export function renderHud(h: Hud): void {
  const hud = $('hud');
  const key = h.stats.map((s) => s.label).join('|');
  if (hud.dataset['key'] !== key) {
    hud.dataset['key'] = key;
    hud.innerHTML = h.stats.map((s, i) => `<div class="stat${isPrimaryStat(s.label) ? ' primary' : ''}"${s.label === 'Time' ? ' aria-hidden="true"' : ''}><span>${esc(s.label)}</span><b data-i="${i}"></b></div>`).join('')
      + '<p class="hint" id="hint"></p>';
  }
  h.stats.forEach((s, i) => {
    const el = hud.querySelector<HTMLElement>(`b[data-i="${i}"]`);
    if (!el) return;
    const box = el.parentElement!;
    box.classList.toggle('urgent', isUrgentClock(s.label, s.value));
    if (el.textContent === s.value) return;
    const had = el.textContent !== '';
    el.textContent = s.value;
    if (had && isPrimaryStat(s.label)) { box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
  });
  const hint = hud.querySelector<HTMLElement>('#hint');
  if (hint && hint.textContent !== h.status) { hint.textContent = h.status; hint.title = h.status; }
}

/** Polite, once-per-event announcement for screen readers. */
let flip = false;
export function announce(text: string): void {
  flip = !flip;
  $('sr-status').textContent = flip ? text : `${text}\u00a0`; // one DOM change per event; the NBSP toggle re-announces repeats
}

let lastTimerSpeech = '';
export function announceTimer(text: string): void {
  if (text === lastTimerSpeech) return;
  lastTimerSpeech = text;
  $('sr-timer').textContent = text;
}

let lastPower = -1;
let lastShootDisabled: boolean | null = null;
export function setPower(p: number): void {
  const v = Math.round(p * 100);
  if (v === lastPower) return;
  lastPower = v;
  const m = $('power');
  (m.firstElementChild as HTMLElement).style.width = `${v}%`;
  m.setAttribute('aria-valuenow', String(v));
}
export function setShootDisabled(d: boolean): void {
  if (d === lastShootDisabled) return;
  lastShootDisabled = d;
  ($('shoot') as HTMLButtonElement).disabled = d;
}

export const starText = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

export interface OverlayActions { retry: () => void; next: (() => void) | null; menu: () => void }

const overlayGrace = makeGrace();
const trickGrace = makeGrace();

export function showOverlay(info: OverInfo, actions: OverlayActions): void {
  const o = $('overlay');
  overlayGrace.arm();
  const guard = (fn: () => void) => (): void => { if (!overlayGrace.blocked()) fn(); };
  const stars = info.stars !== undefined
    ? `<p class="stars" aria-label="${info.stars} of 3 stars">${starText(info.stars)} <span class="starnum">${info.stars}/3</span></p>` : '';
  const badge = info.mode === 'rack' && info.newBest
    ? `<p class="badge">${esc(STR.newBest)}</p>` : '';
  const best = info.mode === 'rack' && info.best !== undefined ? `<p class="bestline">${esc(STR.best(info.best))}</p>` : '';
  const tier = resultTier(info);
  const chips = resultStats(info).map((s) => `<div><span>${esc(s.label)}</span><b>${esc(s.value)}</b></div>`).join('');
  o.innerHTML = `<div class="card pop" role="dialog" aria-modal="true" aria-labelledby="ov-title">
    <h2 id="ov-title">${esc(info.title)}</h2>${tier ? `<p class="tier">${esc(tier)}</p>` : ''}${badge}${stars}${chips ? `<div class="stats">${chips}</div>` : ''}${info.mode === 'rack' ? '' : `<p>${esc(info.detail)}</p>`}${best}
    <div class="row"><button class="btn primary" id="ov-retry" type="button">${info.mode === 'rack' ? 'Play again' : 'Retry'}</button>
    ${actions.next ? '<button class="btn" id="ov-next" type="button">Next puzzle</button>' : ''}
    <button class="btn ghost" id="ov-menu" type="button">Menu</button></div></div>`;
  o.hidden = false;
  $('ov-retry').addEventListener('click', guard(actions.retry));
  document.getElementById('ov-next')?.addEventListener('click', guard(() => actions.next?.()));
  $('ov-menu').addEventListener('click', guard(actions.menu));
  $('ov-retry').focus();
}

export function hideOverlay(): void { $('overlay').hidden = true; $('overlay').innerHTML = ''; }

export function renderTrickGrid(p: Progress, pick: (i: number) => void): void {
  const grid = $('trick-grid');
  grid.innerHTML = '';
  trickGrace.arm();
  TRICKS.forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'trick';
    const s = p.stars[i] ?? 0;
    b.setAttribute('aria-label', `Puzzle ${i + 1}, ${t.name}, ${s} of 3 stars, limit ${t.limit} shots`);
    b.innerHTML = `<small>${i + 1}</small><strong>${esc(t.name)}</strong><span class="stars">${starText(s)} <span class="starnum">${s}/3</span></span><em>${t.limit} shots</em>`;
    b.addEventListener('click', (e) => { if (e.detail > 1 || trickGrace.blocked()) return; pick(i); });
    grid.appendChild(b);
  });
}

/** Per-mode bests live on each mode card; the hero button names the last-played mode. */
export function renderBest(p: Progress, last: Mode): void {
  const total = p.stars.reduce((a, b) => a + b, 0);
  const text: Record<Mode, string> = {
    rack: STR.bestRack(p.rackHigh),
    trick: STR.bestStars(total, TRICKS.length * 3),
    cpu: STR.bestCpu(p.cpuWins, p.cpuLosses),
    duo: '',
  };
  for (const [mode, t] of Object.entries(text)) {
    const el = document.querySelector<HTMLElement>(`[data-best="${mode}"]`);
    if (el) el.textContent = t;
  }
  $('play-last').textContent = STR.playLast(STR.modeNames[last]);
}
