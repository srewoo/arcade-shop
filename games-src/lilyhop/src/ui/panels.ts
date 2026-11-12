// Overlays: pause, confirm, result, how-to, settings. Every open/close tells `changed` so the clock can follow.
import { emit } from '../audio';
import type { Summary } from '../play';
import { formatTime, resultKind } from '../scoring';
import type { Settings } from '../settings';
import { S } from '../strings';
import { coerceValue } from './chips';
import { el } from './dom';
import { closeOverlay, closeTop, openOverlay, topOverlay } from './overlay';

export interface PanelCtx {
  readonly changed: () => void;
  readonly canPause: () => boolean;
  readonly moves: () => number;
  readonly restart: () => void;
  readonly quit: () => void;
  readonly setting: (key: keyof Settings, value: unknown) => void;
}

export interface ResultInfo {
  readonly summary: Summary;
  readonly newBest: boolean;
  readonly bestLine: string;
  readonly hasNext: boolean;
}

export interface Panels {
  openPause(auto: boolean): void;
  openSettings(opener: HTMLElement): void;
  openHowto(opener: HTMLElement): void;
  openResult(info: ResultInfo): void;
  openConfirm(text: string, yes: string, onYes: () => void): void;
  togglePause(): void;
  closeAll(): void;
}

type Nodes = Record<'pause' | 'confirm' | 'result' | 'howto' | 'settings', HTMLElement>;
type ResultActions = { next: () => void; replay: () => void; menu: () => void };

interface Core {
  open(node: HTMLElement, opener: HTMLElement | null, focus?: HTMLElement): void;
  shut(node: HTMLElement): void;
  confirm(text: string, yes: string, onYes: () => void): void;
  pause(auto: boolean): void;
  settings(opener: HTMLElement): void;
}

function makeCore(ctx: PanelCtx, nodes: Nodes): Core {
  const active = (): HTMLElement | null => (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const core: Core = {
    open(node, opener, focus) {
      openOverlay(node, opener, ctx.changed, focus);
      emit('open');
      ctx.changed();
    },
    shut(node) {
      closeOverlay(node);
      ctx.changed();
    },
    confirm(text, yes, onYes) {
      el('confirm-text').textContent = text;
      el('confirm-yes').textContent = yes;
      el('confirm-yes').onclick = () => { core.shut(nodes.confirm); onYes(); };
      core.open(nodes.confirm, active(), el('confirm-no'));
    },
    pause(auto) {
      if (!ctx.canPause() || topOverlay()) return;
      el('pause-note').textContent = auto ? S.pausedAuto : S.pausedNote;
      core.open(nodes.pause, active() ?? el('pause'), el('pause-resume'));
    },
    settings: (opener) => core.open(nodes.settings, opener),
  };
  return core;
}

function bindPause(ctx: PanelCtx, core: Core, nodes: Nodes): void {
  el('pause').addEventListener('click', () => core.pause(false));
  el('pause-resume').addEventListener('click', () => void closeTop());
  el('pause-settings').addEventListener('click', (e) => core.settings(e.currentTarget as HTMLElement));
  el('pause-restart').addEventListener('click', () => {
    if (ctx.moves() === 0) { core.shut(nodes.pause); ctx.restart(); return; }
    core.confirm(S.restartConfirm, S.confirmRestartYes, () => { core.shut(nodes.pause); ctx.restart(); });
  });
  el('pause-quit').addEventListener('click', () => {
    core.confirm(S.quitConfirm, S.confirmQuitYes, () => { core.shut(nodes.pause); ctx.quit(); });
  });
  for (const id of ['confirm-no', 'howto-close', 'settings-close']) el(id).addEventListener('click', () => void closeTop());
}

function bindResult(core: Core, nodes: Nodes, actions: ResultActions): void {
  const wire = (id: string, run: () => void): void => el(id).addEventListener('click', () => { core.shut(nodes.result); run(); });
  wire('result-next', actions.next);
  wire('result-replay', actions.replay);
  wire('result-menu', actions.menu);
}

function showResult(core: Core, nodes: Nodes, info: ResultInfo): void {
  const { summary: r } = info;
  const stars = el('result-stars');
  stars.textContent = '\u2605'.repeat(r.stars) + '\u2606'.repeat(3 - r.stars);
  stars.setAttribute('aria-label', S.starsOf(r.stars));
  const kind = resultKind(r.moves, r.optimal, r.hints);
  el('result-title').textContent = S.resultTitle[kind];
  stars.dataset.stars = String(r.stars);
  el('result-note').textContent = S.resultNote(r.moves, r.optimal, r.hints);
  el('result-line').textContent = S.resultLine(formatTime(r.ms), r.undos, r.hints);
  el('result-best').textContent = info.newBest ? S.newBest : info.bestLine;
  el('result-next').hidden = !info.hasNext;
  core.open(nodes.result, document.activeElement instanceof HTMLElement ? document.activeElement : null, info.hasNext ? el('result-next') : el('result-replay'));
}

export function initPanels(ctx: PanelCtx, actions: ResultActions): Panels {
  const nodes: Nodes = { pause: el('pause-overlay'), confirm: el('confirm-overlay'), result: el('result-overlay'), howto: el('howto-overlay'), settings: el('settings-overlay') };
  const core = makeCore(ctx, nodes);
  bindPause(ctx, core, nodes);
  bindResult(core, nodes, actions);
  bindSettings(ctx, nodes.settings);
  return {
    openPause: core.pause,
    openSettings: core.settings,
    openConfirm: core.confirm,
    openHowto(opener) {
      el('howto-list').innerHTML = S.howto.map((line) => `<li>${line}</li>`).join('');
      core.open(nodes.howto, opener);
    },
    openResult: (info) => showResult(core, nodes, info),
    togglePause: () => (topOverlay() === nodes.pause ? void closeTop() : core.pause(false)),
    closeAll: () => { while (topOverlay()) closeTop(); },
  };
}

function bindSettings(ctx: PanelCtx, node: HTMLElement): void {
  const volume = el<HTMLInputElement>('volume');
  volume.addEventListener('input', () => ctx.setting('volume', Number(volume.value)));
  volume.addEventListener('change', () => emit('tap'));
  node.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-value]');
    const key = btn?.closest<HTMLFieldSetElement>('fieldset')?.dataset.setting;
    if (btn && key && btn.dataset.value !== undefined) ctx.setting(key as keyof Settings, coerceValue(btn.dataset.value));
  });
}
