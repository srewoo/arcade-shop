// Overlay screens: title, puzzle select, pause, confirm, help and result.
import { playEvent } from './audio';
import { button, h } from './dom';
import { PUZZLES, parseLevel } from './levels';
import { hideOverlay, overlayOpen, show } from './overlay';
import { Scores, Settings } from './settings';
import { Mode } from './state';
import { S } from './strings';

export { hideOverlay, overlayOpen };

export interface Actions {
  start(mode: Mode, puzzleIndex?: number): void;
  resume(): void;
  restart(): void;
  menu(): void;
  settings(patch: Partial<Settings>): void;
  openSettings(): void;
  openHelp(): void;
}

export interface TitleInfo {
  scores: Scores;
  symbols: boolean;
  dailyToday: number;
}

const stars = (n: number): string => '★'.repeat(n) + '☆'.repeat(3 - n);

export function showTitle(info: TitleInfo, a: Actions, focusKey?: string): void {
  const sc = info.scores;
  const chip = (key: 'daily' | 'puzzle' | 'rush', run: () => void): HTMLElement =>
    button(S.modeChips[key], run, 'btn chip', { 'data-key': key, 'aria-label': S.modeChipLabels[key] });
  show(S.title, [
    h('p', { class: 'lede' }, [S.lede]),
    button(S.play, () => a.start('arcade'), 'btn primary big', { 'data-key': 'arcade', 'aria-label': S.modes.arcade }),
    h('div', { class: 'chips' }, [
      chip('daily', () => a.start('daily')),
      chip('puzzle', () => a.start('puzzle', -1)),
      chip('rush', () => a.start('rush')),
    ]),
    h('div', { class: 'stack duo' }, [
      button(S.settings, a.openSettings, 'btn ghost', { 'data-key': 'settings' }),
      button(S.howTo, a.openHelp, 'btn ghost', { 'data-key': 'help' }),
    ]),
    h('p', { class: 'best', 'aria-label': 'High scores' }, [S.best(sc.arcade, sc.rush, sc.puzzle, info.dailyToday)]),
    h('p', { class: 'keys' }, [S.keys]),
  ], 'Main menu', { focusKey });
}

export function showPuzzles(scores: Scores, a: Actions): void {
  const tiles = PUZZLES.map((p, i) => {
    const limit = parseLevel(p).limit;
    return button('', () => a.start('puzzle', i), 'level', {
      'aria-label': S.tileLabel(i + 1, p.name, scores.stars[i] ?? 0, p.par, limit),
      'data-key': `lv${i}`,
    });
  });
  tiles.forEach((b, i) => {
    const p = PUZZLES[i];
    if (!p) return;
    b.append(
      h('b', {}, [String(i + 1)]), h('small', {}, [p.name]),
      h('small', { class: 'par' }, [`Par ${p.par}`, h('span', { class: 'lim' }, [` / limit ${parseLevel(p).limit}`])]),
      h('span', { 'aria-hidden': 'true' }, [stars(scores.stars[i] ?? 0)]),
    );
  });
  show(S.puzzleLevels, [h('div', { class: 'levels' }, tiles), button(S.back, a.menu, 'btn ghost')], 'Puzzle level select', { onBack: a.menu });
}

export function showPause(a: Actions, onRestart: () => void, onQuit: () => void, focusKey?: string): void {
  show(S.paused, [
    h('div', { class: 'stack' }, [
      button(S.resume, a.resume, 'btn primary', { 'data-key': 'resume' }),
      button(S.restart, onRestart, 'btn', { 'data-key': 'restart' }),
      button(S.settings, a.openSettings, 'btn', { 'data-key': 'settings' }),
      button(S.howTo, a.openHelp, 'btn', { 'data-key': 'help' }),
      button(S.quit, onQuit, 'btn ghost', { 'data-key': 'quit' }),
    ]),
  ], 'Paused', { onBack: a.resume, focusKey });
}

/** In-page confirmation (never window.confirm). Focus starts on the safe choice. */
export function showConfirm(title: string, yes: string, onYes: () => void, onNo: () => void): void {
  show(title, [
    h('p', { class: 'line' }, [S.confirmBody]),
    h('div', { class: 'stack' }, [
      button(S.keepPlaying, onNo, 'btn primary', { 'data-key': 'no' }),
      button(yes, onYes, 'btn ghost', { 'data-key': 'yes' }),
    ]),
  ], title, { onBack: onNo, focusKey: 'no' });
}

export function showHelp(back: () => void): void {
  const list = (items: readonly string[]): HTMLElement => h('ul', { class: 'help' }, items.map((t) => h('li', {}, [t])));
  show(S.help.title, [
    h('p', { class: 'lede' }, [S.help.goal]),
    list(S.help.controls),
    list(S.help.specials),
    button(S.back, back, 'btn primary', { 'data-key': 'back' }),
  ], S.help.title, { onBack: back });
}

export interface Result {
  title: string;
  /** Plain-text summary for assistive tech. */
  lines: string[];
  /** Secondary stats shown in a grid under the score. */
  stats: { label: string; value: string }[];
  /** Cause / hint line under the stats. */
  note?: string;
  /** Stars to reveal one by one (puzzle wins). */
  stars?: number;
  /** Score for the animated count-up line. */
  score?: { value: number; best: boolean };
  retry: () => void;
  next?: { label: string; run: () => void };
}

function countUp(el: HTMLElement, to: number, reduced: boolean): void {
  const final = String(to);
  if (reduced || to === 0) {
    el.textContent = final;
    return;
  }
  const start = performance.now();
  const tick = (now: number): void => {
    if (!el.isConnected) return;
    const k = Math.min(1, (now - start) / 700);
    el.textContent = k >= 1 ? final : String(Math.round(to * k));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function revealStars(row: HTMLElement, n: number, reduced: boolean): void {
  const els = [...row.children] as HTMLElement[];
  els.forEach((el, i) => {
    if (i >= n) return;
    const on = (): void => {
      if (!el.isConnected) return;
      el.classList.add('on');
      playEvent({ type: 'star', n: i + 1 });
    };
    if (reduced) el.classList.add('on');
    else setTimeout(on, 300 + i * 350);
  });
}

export function showResult(r: Result, a: Actions, reduced: boolean): void {
  const buttons = [
    ...(r.next ? [button(r.next.label, r.next.run, 'btn primary', { 'data-key': 'next' })] : []),
    button(S.playAgain, r.retry, r.next ? 'btn' : 'btn primary', { 'data-key': 'again' }),
    button(S.menu, a.menu, 'btn ghost', { 'data-key': 'menu' }),
  ];
  const big = h('b', { class: 'bigscore', 'aria-hidden': 'true' });
  const score = h('div', { class: 'scorebox', 'aria-label': S.result.score(r.score?.value ?? 0, !!r.score?.best), role: 'text' }, [
    h('span', { class: 'label' }, [S.scoreLabel]),
    big,
    ...(r.score?.best && r.score.value > 0 ? [h('span', { class: 'badge' }, ['★ ' + S.newBest])] : []),
  ]);
  const starRow = r.stars ? h('p', { class: 'starrow', 'aria-label': `${r.stars} of 3 stars` }, [0, 1, 2].map(() => h('span', { 'aria-hidden': 'true' }, ['★']))) : null;
  const grid = h('dl', { class: 'stats', 'aria-label': r.lines.join('. ') },
    r.stats.map((st) => h('div', {}, [h('dt', {}, [st.label]), h('dd', {}, [st.value])])));
  show(r.title, [
    score,
    ...(starRow ? [starRow] : []),
    grid,
    ...(r.note ? [h('p', { class: 'note' }, [r.note])] : []),
    h('div', { class: 'stack' }, buttons),
  ], r.title, { onBack: a.menu, focusKey: r.next ? 'next' : 'again' });
  countUp(big, r.score?.value ?? 0, reduced);
  if (starRow && r.stars) revealStars(starRow, r.stars, reduced);
}
