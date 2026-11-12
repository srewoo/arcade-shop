// Overlay cards: title (mode radio group + onboarding), pause, confirm, result.
import { MODE_IDS, MODES, type ModeId } from '../core/modes';
import { pace, recordDelta, ticksToMs, type ResultInfo } from '../records';
import type { Records } from '../settings';
import { S } from '../strings';
import { button, formatTime, h } from './dom';

export const formatRecord = (mode: ModeId, v: number | null): string =>
  v === null ? 'No record yet' : MODES[mode].best === 'time' ? `Best ${formatTime(v)}` : `Best ${v.toLocaleString()}`;

const recordText = (mode: ModeId, records: Records): string => (mode === 'zen' ? S.title.zenRecord : formatRecord(mode, records[mode]));

export interface TitleHandlers {
  onSelect(mode: ModeId): void;
  onPlay(): void;
  onSettings(): void;
  onZenGarbage(on: boolean): void;
  onHelpDismiss(): void;
}

export interface TitleInit { selected: ModeId; records: Records; zenGarbage: boolean; helpSeen: boolean; touch: boolean }

function helpStrip(touch: boolean): HTMLElement {
  return h('details', { class: 'help' }, h('summary', {}, S.help.summary),
    h('p', {}, S.help.goal), h('p', {}, touch ? S.help.touch : S.help.keys), h('p', {}, S.help.stash));
}

function modeButton(id: ModeId, records: Records, selected: boolean): HTMLElement {
  const m = MODES[id];
  return h('button', { type: 'button', class: 'mode', role: 'radio', 'aria-checked': String(selected), tabindex: selected ? 0 : -1, 'data-mode': id },
    h('b', {}, m.label), h('small', {}, m.blurb), h('span', { class: 'rec' }, recordText(id, records)));
}

/** Title card. Selecting a mode updates it in place so keyboard focus is never lost. */
export function titleCard(init: TitleInit, hd: TitleHandlers): HTMLElement {
  let selected = init.selected;
  const modes = h('div', { class: 'modes', role: 'radiogroup', 'aria-label': 'Game mode' });
  const buttons = MODE_IDS.map((id) => modeButton(id, init.records, id === selected));
  modes.append(...buttons);
  const blurb = h('p', { class: 'blurb', 'aria-live': 'polite' }, MODES[selected].blurb);
  const play = button(`${S.title.play} ${MODES[selected].label}`, 'btn', hd.onPlay, 'btn-play');
  const zen = h('label', { class: 'field check', id: 'zen-row' });
  const cb = h('input', { type: 'checkbox', id: 'zen-garbage' }) as HTMLInputElement;
  cb.checked = init.zenGarbage;
  cb.addEventListener('change', () => hd.onZenGarbage(cb.checked));
  zen.append(h('span', {}, S.title.risingGarbage), cb);

  const apply = (id: ModeId, focus: boolean): void => {
    selected = id;
    buttons.forEach((b) => {
      const on = b.dataset.mode === id;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    blurb.textContent = MODES[id].blurb;
    play.textContent = `${S.title.play} ${MODES[id].label}`;
    zen.hidden = id !== 'zen';
    hd.onSelect(id);
  };
  zen.hidden = selected !== 'zen';
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => apply(MODE_IDS[i] as ModeId, false));
    b.addEventListener('keydown', (e) => modeKey(e as KeyboardEvent, i, apply, hd.onPlay));
  });
  const card = h('div', { class: 'card title-card' }, h('h2', { id: 'card-title' }, S.title.heading));
  card.append(modes, blurb, zen, h('div', { class: 'row' }, play, button(S.title.settings, 'btn ghost', hd.onSettings)), helpStrip(init.touch));
  return card;
}

function modeKey(e: KeyboardEvent, i: number, apply: (id: ModeId, focus: boolean) => void, play: () => void): void {
  const n = MODE_IDS.length;
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
  if (step !== 0) {
    e.preventDefault();
    apply(MODE_IDS[(i + step + n) % n] as ModeId, true);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    play();
  }
}

export interface PauseHandlers { onResume(): void; onRestart(): void; onQuit(): void; onSettings(): void }

export function pauseCard(summary: string, hd: PauseHandlers): HTMLElement {
  return h('div', { class: 'card' }, h('h2', { id: 'card-title' }, S.pause.heading), h('p', {}, summary),
    h('div', { class: 'row' }, button(S.pause.resume, 'btn', hd.onResume, 'btn-resume'), button(S.pause.settings, 'btn ghost', hd.onSettings)),
    h('div', { class: 'row' }, button(S.pause.restart, 'btn ghost', hd.onRestart), button(S.pause.quit, 'btn ghost', hd.onQuit)));
}

export function confirmCard(kind: 'restart' | 'quit', onYes: () => void, onBack: () => void): HTMLElement {
  const c = S.confirm;
  const [title, body, yes] = kind === 'restart' ? [c.restartTitle, c.restartBody, c.restartYes] : [c.quitTitle, c.quitBody, c.quitYes];
  return h('div', { class: 'card confirm' }, h('h2', { id: 'card-title' }, title), h('p', {}, body),
    h('div', { class: 'row' }, button(c.keep, 'btn', onBack, 'btn-keep'), button(yes, 'btn ghost danger', onYes, 'btn-confirm')));
}

export interface ResultHandlers { onAgain(): void; onQuit(): void; onCopySeed(): void }

const titleOf = (r: ResultInfo): string => {
  const timeMode = MODES[r.mode].best === 'time';
  return r.status === 'won' ? (timeMode ? 'Finished!' : 'Goal reached!') : r.status === 'time' ? "Time's up" : r.status === 'quit' ? 'Run ended' : 'Game over';
};

function deltaLine(r: ResultInfo, previous: number | null, newBest: boolean): string {
  const d = recordDelta(r, previous);
  if (!d) return newBest ? S.result.newBest : recordText(r.mode, { [r.mode]: previous } as unknown as Records);
  const fmt = d.kind === 'time' ? formatTime(d.amount) : d.amount.toLocaleString();
  if (d.kind === 'time') return d.better ? S.result.deltaTimeFaster(fmt) : S.result.deltaTimeSlower(fmt);
  return d.better ? S.result.deltaScoreUp(fmt) : S.result.deltaScoreDown(fmt);
}

/** Result card. Buttons start disabled; the caller enables them after the grace period. */
export function resultCard(r: ResultInfo, previous: number | null, newBest: boolean, hd: ResultHandlers): HTMLElement {
  const pc = pace(r);
  const stat = (k: string, v: string): HTMLElement[] => [h('dt', {}, k), h('dd', {}, v)];
  const dl = h('dl', { class: 'stats' }, ...stat('Score', r.score.toLocaleString()), ...stat('Lines', String(r.lines)), ...stat('Level', String(r.level)),
    ...stat('Time', formatTime(ticksToMs(r.ticks))), ...stat('Shapes placed', String(r.pieces)),
    ...stat(S.result.ppm, pc.pps.toFixed(2)), ...stat(S.result.lpm, pc.lpm.toFixed(1)));
  const line = r.mode === 'zen' ? S.title.noRecords : deltaLine(r, previous, newBest);
  const lock = (b: HTMLButtonElement): HTMLButtonElement => { b.disabled = true; return b; };
  const again = lock(button(S.result.again, 'btn', hd.onAgain, 'btn-again'));
  const menu = lock(button(S.result.menu, 'btn ghost', hd.onQuit));
  const copy = lock(button(S.result.copySeed, 'btn ghost', hd.onCopySeed, 'btn-seed'));
  const won = r.status === 'won';
  return h('div', { class: won ? 'card result win' : 'card result', tabindex: -1, 'data-grace': 'on' },
    h('h2', { id: 'card-title' }, titleOf(r)), h('p', { class: 'hero', 'aria-label': `Score ${r.score.toLocaleString()}` }, r.score.toLocaleString()), h('p', {}, MODES[r.mode].label),
    h('p', { class: newBest ? 'newbest' : 'delta' }, newBest && r.mode !== 'zen' ? `${S.result.newBest} ${line === S.result.newBest ? '' : line}`.trim() : line),
    h('div', { class: 'row' }, again, menu), h('details', { class: 'more', open: r.status === 'won' }, h('summary', {}, S.result.details), dl), h('div', { class: 'row' }, copy), h('p', { class: 'seed-out', id: 'seed-out', 'aria-live': 'polite' }));
}
