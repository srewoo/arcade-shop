// Pause, settings, result, route and help dialogs.
import { S } from '../strings';
import type { Settings } from '../settings';
import type { Level } from '../puzzle/types';
import { h } from './dom';
import { createModal, type Modal } from './dialogs';
import { winCopy, type StarState } from '../puzzle/resultCopy';

const button = (text: string, cls: string, onClick: () => void, extra: Record<string, string | boolean> = {}): HTMLButtonElement => {
  const b = h('button', { class: `btn ${cls}`, type: 'button', text, ...extra });
  b.addEventListener('click', onClick);
  return b;
};

function starRow(states: readonly StarState[], awarded: number): HTMLElement {
  const stars = states.map((st, i) => h('span', { class: `bs ${st}`, style: `--i:${i}`, text: st === 'earned' ? '\u2605' : '\u2606', ...(st === 'capped' ? { title: S.result.starCapped } : {}) }));
  return h('p', { class: 'big-stars', role: 'img', 'aria-label': `${S.stars(awarded)}${states.includes('capped') ? `, ${S.result.starCapped}` : ''}` }, ...stars);
}

export interface PauseHandlers { resume(): void; restart(): void; settings(): void; quit(): void }

export function createPause(hd: PauseHandlers): Modal {
  const m = createModal('dlg-pause', S.pause.title);
  m.body.append(
    button(S.pause.resume, 'primary', hd.resume, { autofocus: true }),
    button(S.pause.restart, '', hd.restart),
    button(S.pause.settings, '', hd.settings),
    button(S.pause.quit, 'danger-ghost', hd.quit),
  );
  m.el.addEventListener('cancel', (e) => { e.preventDefault(); hd.resume(); });
  return m;
}

export function createHelp(): Modal {
  const m = createModal('dlg-help', S.help.title, true);
  m.body.append(h('ul', { class: 'help' }, ...S.help.lines.map((l) => h('li', { text: l }))), button(S.settings.close, 'primary', () => m.close(), { autofocus: true }));
  return m;
}

export interface ResultInfo { level: Level; won: boolean; cost: number; moves: number; stars: number; hinted: boolean; hasNext: boolean }
export interface ResultHandlers { next(): void; retry(): void; route(): void; levels(): void; undo(): void }

export function createResult(hd: ResultHandlers): { modal: Modal; show(info: ResultInfo): void } {
  const m = createModal('dlg-result', S.result.won);
  const title = m.el.querySelector('h2') as HTMLElement;
  return {
    modal: m,
    show(info) {
      const { level } = info;
      title.textContent = info.won ? S.result.won : S.result.lost;
      const lines: HTMLElement[] = [];
      if (info.won) {
        const copy = winCopy(level, info.cost, info.moves, info.hinted);
        lines.push(starRow(copy.stars, info.stars));
        for (const l of copy.lines) lines.push(h('p', { class: l.tone === 'plain' ? '' : l.tone, text: l.text }));
      } else {
        lines.push(h('p', { text: S.result.lostBody(info.cost, level.limit ?? 0) }));
      }
      const row = info.won
        ? [info.hasNext ? button(S.result.next, 'primary', hd.next, { autofocus: true }) : null, button(S.result.retry, info.hasNext ? '' : 'primary', hd.retry), button(S.result.route, '', hd.route), button(S.result.levels, 'ghost', hd.levels)]
        : [button(S.result.undo, 'primary', hd.undo, { autofocus: true }), button(S.result.restart, '', hd.retry), button(S.result.levels, 'ghost', hd.levels)];
      m.body.replaceChildren(...lines, h('div', { class: 'stack' }, ...row.filter((x): x is HTMLButtonElement => x !== null)));
    },
  };
}

export function createRoute(): { modal: Modal; show(level: Level, path: readonly (readonly number[])[]): void } {
  const m = createModal('dlg-route', S.route.title, true);
  return {
    modal: m,
    show(level, path) {
      let atStart = true;
      const items = path.map((group) => {
        const names = group.map((g) => level.actors[g]?.name ?? '').join(' + ');
        const cost = level.pack === 'bridge' ? ` (${Math.max(...group.map((g) => level.actors[g]?.time ?? 0))} min)` : '';
        const line = `${names} ${atStart ? 'cross' : 'return'}${cost}`;
        atStart = !atStart;
        return h('li', { text: line });
      });
      const total = level.pack === 'bridge' ? `Total ${level.par} min` : `${level.par} crossings`;
      m.body.replaceChildren(h('ol', { class: 'route' }, ...(items.length ? items : [h('li', { text: S.route.empty })])), h('p', { class: 'note', text: total }), button(S.settings.close, 'primary', () => m.close(), { autofocus: true }));
    },
  };
}

export interface SettingsHandlers {
  change<K extends keyof Settings>(key: K, value: Settings[K]): void;
  reset(): void;
  closed(): void;
}

export function createSettings(hd: SettingsHandlers, get: () => Settings): { modal: Modal; sync(): void } {
  const m = createModal('dlg-settings', S.settings.title);
  const vol = h('input', { id: 'set-volume', type: 'range', min: 0, max: 100, step: 1 });
  vol.addEventListener('input', () => hd.change('volume', Number(vol.value)));
  const chips = <K extends keyof Settings>(key: K, label: string, opts: readonly [Settings[K], string][]): { el: HTMLElement; sync(): void } => {
    const bs = opts.map(([v, text]) => {
      const b = h('button', { class: 'chip', type: 'button', text, 'aria-pressed': 'false' });
      b.addEventListener('click', () => hd.change(key, v));
      return { b, v };
    });
    const el = h('fieldset', { class: 'field' }, h('legend', { text: label }), h('div', { class: 'chips' }, ...bs.map((x) => x.b)));
    return { el, sync: () => bs.forEach(({ b, v }) => b.setAttribute('aria-pressed', String(get()[key] === v))) };
  };
  const o = S.settings;
  const groups = [
    chips('reduceMotion', o.motion, [['system', o.motionOpts.system], ['on', o.motionOpts.on], ['off', o.motionOpts.off]]),
    chips('colorAssist', o.assist, [[false, o.onOff.off], [true, o.onOff.on]]),
    chips('textSize', o.text, [[100, '100%'], [125, '125%'], [150, '150%']]),
    chips('theme', o.theme, [['system', o.themeOpts.system], ['light', o.themeOpts.light], ['dark', o.themeOpts.dark]]),
  ];
  m.body.append(
    h('div', { class: 'field' }, h('label', { for: 'set-volume', text: o.volume }), vol),
    ...groups.map((g) => g.el),
    button(o.reset, 'danger-ghost', hd.reset),
    button(o.close, 'primary', () => m.close(), { autofocus: true }),
  );
  m.el.addEventListener('close', hd.closed);
  return { modal: m, sync() { vol.value = String(get().volume); groups.forEach((g) => g.sync()); } };
}

