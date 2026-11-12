// Static page frame: header buttons, three views, live region.
import { carrierSvg } from '../art/figures';
import { cogIcon } from '../art/icons';
import { S } from '../strings';
import { h, svgFrom } from './dom';

export type ViewName = 'menu' | 'levels' | 'play';

export interface Shell {
  readonly app: HTMLElement;
  readonly menu: HTMLElement;
  readonly levels: HTMLElement;
  readonly play: HTMLElement;
  readonly sound: HTMLButtonElement;
  readonly settings: HTMLButtonElement;
  readonly pause: HTMLButtonElement;
  readonly live: HTMLElement;
  show(view: ViewName): void;
  view(): ViewName;
}

const ICONS = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9v6h4l5 4V5L8 9z"/><path class="waves" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="slash" d="M17 9l5 6M22 9l-5 6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>',
};

const iconBtn = (id: string, label: string, icon: string, extra: Record<string, string | boolean> = {}): HTMLButtonElement => {
  const b = h('button', { id, class: 'icon-btn', type: 'button', 'aria-label': label, title: label, ...extra });
  b.append(svgFrom(icon));
  return b;
};

export function createShell(root: HTMLElement): Shell {
  const logo = h('h1', { class: 'logo' }, h('span', { class: 'logo-lamp' }), h('span', { text: S.title }));
  logo.firstElementChild?.append(svgFrom(carrierSvg('bridge')));
  const sound = iconBtn('sound', S.sound.on, ICONS.sound, { 'aria-pressed': 'true' });
  const settings = iconBtn('open-settings', S.menu.settings, cogIcon(), { 'aria-haspopup': 'dialog' });
  const pause = iconBtn('pause', `${S.actions.pause} (P)`, ICONS.pause, { 'aria-haspopup': 'dialog', hidden: true });
  const menu = h('section', { class: 'view', id: 'view-menu', 'aria-label': 'Main menu' });
  const levels = h('section', { class: 'view', id: 'view-levels', 'aria-label': 'Level select', hidden: true });
  const play = h('section', { class: 'view play', id: 'view-play', 'aria-label': 'Puzzle', hidden: true });
  const live = h('p', { class: 'sr-only', id: 'live', role: 'status', 'aria-live': 'polite' });
  root.append(h('header', { class: 'top' }, logo, h('div', { class: 'top-actions' }, sound, settings, pause)), menu, levels, play, live);
  let current: ViewName = 'menu';
  return {
    app: root, menu, levels, play, sound, settings, pause, live,
    view: () => current,
    show(view) {
      current = view;
      root.dataset.view = view;
      menu.hidden = view !== 'menu';
      levels.hidden = view !== 'levels';
      play.hidden = view !== 'play';
      pause.hidden = view !== 'play';
    },
  };
}
