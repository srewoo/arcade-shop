// Side/top panel while playing: level info, oil meter, status line, rules and actions.
import { S } from '../strings';
import type { Level } from '../puzzle/types';
import { h } from './dom';

export interface HudHandlers {
  cross(): void;
  undo(): void;
  hint(): void;
  restart(): void;
  menu(): void;
  dismissOnboard(): void;
}

export interface HudModel {
  readonly level: Level;
  readonly index: number;
  readonly total: number;
  readonly cost: number;
  readonly moves: number;
  readonly canUndo: boolean;
  readonly canCross: boolean;
  readonly over: boolean;
}

export interface Hud {
  readonly root: HTMLElement;
  update(m: HudModel): void;
  status(text: string, tone?: 'info' | 'bad'): void;
  setRules(level: Level): void;
  showOnboard(text: string | null): void;
}

const btn = (cls: string, text: string, key: string, onClick: () => void): HTMLButtonElement => {
  const b = h('button', { class: `btn ${cls}`, type: 'button' }, h('span', { text }), h('kbd', { text: key, 'aria-hidden': 'true' }));
  b.addEventListener('click', onClick);
  return b;
};

interface MeterParts { meter: HTMLElement; fill: HTMLElement; text: HTMLElement }

function updateMeter(p: MeterParts, m: HudModel): void {
  const { limit } = m.level;
  if (limit === null) {
    p.meter.hidden = true;
    p.text.textContent = S.hud.crossings(m.moves);
    return;
  }
  const pct = Math.min(100, (m.cost / limit) * 100);
  p.fill.style.width = `${pct}%`;
  p.meter.setAttribute('aria-valuemax', String(limit));
  p.meter.setAttribute('aria-valuenow', String(Math.min(m.cost, limit)));
  p.meter.setAttribute('aria-label', 'Lantern oil used');
  p.meter.classList.toggle('low', pct >= 80);
  p.text.textContent = S.hud.time(m.cost, limit);
  p.meter.hidden = false;
}

export function createHud(hd: HudHandlers): Hud {
  const title = h('h2', { class: 'lvl-title' });
  const sub = h('p', { class: 'lvl-sub' });
  const meterFill = h('div', { class: 'fill' });
  const meter = h('div', { class: 'meter', role: 'meter', 'aria-valuemin': 0 }, meterFill);
  const meterText = h('p', { class: 'meter-text' });
  const statusEl = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const rulesEl = h('details', { class: 'rules' }, h('summary', { text: S.rules.summary }));
  const starRule = h('p', { class: 'starrule', text: S.rules.stars });
  const onboardText = h('span');
  const close = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Dismiss hint', text: '×' });
  close.addEventListener('click', hd.dismissOnboard);
  const onboard = h('p', { class: 'banner', hidden: true }, onboardText, close);
  const cross = btn('primary big', S.actions.cross, 'C', hd.cross);
  const undo = btn('', S.actions.undo, 'U', hd.undo);
  const hint = btn('', S.actions.hint, 'H', hd.hint);
  hint.title = S.rules.hintCap;
  const restart = btn('', S.actions.restart, 'R', hd.restart);
  const menu = btn('ghost', S.actions.menu, '', hd.menu);
  const info = h('div', { class: 'hud-info' }, title, sub, meter, meterText, starRule, onboard, statusEl, rulesEl);
  const dock = h('div', { class: 'dock' }, cross, h('div', { class: 'dock-row' }, undo, hint));
  const actions = h('div', { class: 'actions' }, h('div', { class: 'row' }, restart, menu));
  const root = h('section', { class: 'hud', 'aria-label': 'Level panel' }, info, dock, actions);

  return {
    root,
    update(m) {
      const { level } = m;
      title.textContent = level.title;
      sub.textContent = level.id.startsWith('daily') ? level.blurb : S.hud.level(m.index + 1, m.total);
      updateMeter({ meter, fill: meterFill, text: meterText }, m);
      cross.disabled = !m.canCross || m.over;
      undo.disabled = !m.canUndo;
      hint.disabled = m.over;
    },
    status(text, tone = 'info') {
      statusEl.textContent = text;
      statusEl.dataset.tone = tone;
    },
    setRules(level) {
      const items = [...level.rules.map((r) => r.text), S.rules.base(level.pack, level.capacity)].map((t) => h('li', { text: t }));
      rulesEl.replaceChildren(h('summary', { text: S.rules.summaryFor(level.pack, level.capacity) }), h('ul', {}, ...items));
      rulesEl.open = window.innerWidth >= 700 && window.innerHeight >= 700;
    },
    showOnboard(text) {
      onboard.hidden = text === null;
      if (text) onboardText.textContent = text;
    },
  };
}
