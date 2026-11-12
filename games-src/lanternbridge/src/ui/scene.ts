// The playfield: start bank | crossing | far bank. Travellers are real buttons
// (keyboard + 44px targets); moves between zones are animated with a small FLIP.
import { CONFIG } from '../config';
import { carrierSvg, figureSvg } from '../art/figures';
import { carrierBank } from '../puzzle/engine';
import type { Level, State } from '../puzzle/types';
import { createStars } from '../art/sky';
import { bankDecor } from '../art/decor';
import { firefliesHtml, glitterSvg, skylineSvg, waterSvg } from '../art/backdrop';
import { S } from '../strings';
import { h, svgFrom } from './dom';
import { motionOn } from './fx';

export interface SceneView {
  readonly level: Level;
  readonly state: State;
  readonly selected: readonly number[];
  readonly hint: readonly number[];
  readonly locked: boolean;
}

export interface Scene {
  readonly root: HTMLElement;
  mount(level: Level): void;
  render(view: SceneView, animate: boolean): void;
}

const plural = (n: number): string => `${n} minute${n === 1 ? '' : 's'}`;

function describe(level: Level, i: number): string {
  const a = level.actors[i];
  if (!a) return '';
  if (level.pack === 'bridge') return `${a.name}, ${plural(a.time)}`;
  return a.canRow ? `${a.name}, rower` : a.name;
}

function actorButton(level: Level, i: number, onPick: (i: number) => void): HTMLButtonElement {
  const a = level.actors[i];
  const badge =
    level.pack === 'bridge'
      ? h('span', { class: 'badge', 'aria-hidden': 'true' }, String(a?.time ?? 0), h('small', { text: S.min }))
      : a?.canRow ? h('span', { class: 'badge oar', 'aria-hidden': 'true', text: 'Row' }) : null;
  const fig = h('span', { class: 'fig-wrap', style: `--fig:var(--fig-${i % CONFIG.ui.figurePalette.length})` });
  fig.append(svgFrom(figureSvg(a?.art ?? 'courier', i)));
  const btn = h('button', { class: 'actor', type: 'button', 'data-i': i, 'aria-pressed': 'false' }, fig, h('span', { class: 'nm', text: a?.name ?? '' }), badge);
  btn.addEventListener('click', () => onPick(i));
  return btn;
}

export function createScene(onPick: (i: number) => void): Scene {
  const startSlot = h('div', { class: 'slot', 'data-bank': 'start' });
  const goalSlot = h('div', { class: 'slot', 'data-bank': 'goal' });
  const midSlot = h('div', { class: 'slot crossing' });
  const carrier = h('div', { class: 'carrier', 'aria-hidden': 'true' });
  const water = h('div', { class: 'water', 'aria-hidden': 'true' }, svgFrom(waterSvg()));
  const deck = h('div', { class: 'deck', 'aria-hidden': 'true' }, h('i', { class: 'rail back' }), h('i', { class: 'rail front' }), h('i', { class: 'lamp-pool' }));
  const mid = h('div', { class: 'zone mid', role: 'group', 'data-side': 'start' }, water, svgFrom(glitterSvg()), deck, carrier, midSlot);
  const startBank = h('div', { class: 'zone bank start', role: 'group', 'aria-label': 'Start bank' }, h('h3', { class: 'zl', text: 'Start' }), svgFrom(bankDecor('start')), startSlot);
  const goalBank = h('div', { class: 'zone bank goal', role: 'group', 'aria-label': 'Far bank' }, h('h3', { class: 'zl', text: 'Far bank' }), svgFrom(bankDecor('goal')), goalSlot);
  const confettiHost = h('div', { class: 'confetti', id: 'confetti', 'aria-hidden': 'true' });
  const flies = h('div', { class: 'fireflies', 'aria-hidden': 'true' });
  flies.innerHTML = firefliesHtml(3);
  const root = h('div', { class: 'scene' }, svgFrom(createStars(11)), h('i', { class: 'moon', 'aria-hidden': 'true' }), svgFrom(skylineSvg()), startBank, mid, goalBank, flies, h('i', { class: 'vignette', 'aria-hidden': 'true' }), confettiHost);
  let buttons: HTMLButtonElement[] = [];
  let carrierPack = '';

  const rects = (): Map<Element, DOMRect> => new Map([...buttons, carrier].map((b) => [b, b.getBoundingClientRect()]));

  return {
    root,
    mount(level) {
      buttons = level.actors.map((_, i) => actorButton(level, i, onPick));
      for (const slot of [startSlot, goalSlot, midSlot]) slot.replaceChildren();
      startSlot.append(...buttons);
      root.dataset.pack = level.pack;
      if (carrierPack !== level.pack) {
        carrier.replaceChildren(svgFrom(carrierSvg(level.pack)));
        carrierPack = level.pack;
      }
    },
    render(view, animate) {
      const { level, state, selected, hint, locked } = view;
      const focused = document.activeElement;
      const before = animate && motionOn() ? rects() : null;
      const bank = carrierBank(level, state);
      buttons.forEach((btn, i) => {
        const picked = selected.includes(i);
        const home = state.start & (1 << i) ? startSlot : goalSlot;
        (picked ? midSlot : home).append(btn);
        const usable = !locked && (picked || (bank & (1 << i)) !== 0);
        btn.setAttribute('aria-pressed', String(picked));
        btn.setAttribute('aria-disabled', String(!usable));
        btn.setAttribute('aria-label', `${describe(level, i)}${picked ? ', selected' : ''}`);
        btn.classList.toggle('picked', picked);
        btn.classList.toggle('hinted', hint.includes(i));
      });
      mid.dataset.side = state.carrierAtStart ? 'start' : 'goal';
      if (focused instanceof HTMLElement && buttons.includes(focused as HTMLButtonElement)) focused.focus();
      if (before) flip(before, [...buttons, carrier]);
    },
  };
}

function flip(before: Map<Element, DOMRect>, els: Element[]): void {
  for (const el of els) {
    const a = before.get(el);
    const b = el.getBoundingClientRect();
    if (!a) continue;
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: CONFIG.fx.moveMs, easing: 'ease-in-out' });
  }
}
