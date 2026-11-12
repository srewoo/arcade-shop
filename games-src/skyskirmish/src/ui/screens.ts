// Title, pause, confirm, continue and end-of-run dialogs. Each builds DOM and wires callbacks;
// the app module decides what the callbacks do.
import { type DifficultyId, type ModeId } from '../config';
import type { Best } from '../scores';
import { S } from '../strings';
import { button, segmented } from './controls';
import { h } from './dom';
import type { Tier } from '../summary';
import { countUp } from './countUp';
import { logo } from './logo';
import { show } from './overlay';

export interface TitleDeps {
  difficulty: DifficultyId;
  mode: ModeId;
  best: Best;
  onDifficulty(v: DifficultyId): void;
  onMode(v: ModeId): void;
  onPlay(): void;
  onSettings(): void;
}

export function showTitle(d: TitleDeps, focusKey?: string): void {
  const levels = (Object.keys(S.levels) as DifficultyId[]).map((value) => ({ value, text: S.levels[value] }));
  const modes = (Object.keys(S.modes) as ModeId[]).map((value) => ({ value, text: S.modes[value] }));
  const k = S.keys;
  const key = (label: string, how: string, cls = ''): HTMLElement => h('li', { class: cls }, [h('b', {}, [`${label} `]), how]);
  show(S.title, [
    h('p', { class: 'tagline' }, [S.tagline]),
    segmented(S.difficulty, 'level', levels, d.difficulty, (v) => d.onDifficulty(v)),
    segmented(S.mode, 'mode', modes, d.mode, (v) => d.onMode(v)),
    h('p', { class: 'hint' }, [S.modeHint[d.mode]]),
    h('p', { class: 'best' }, [S.bestLine(d.best.score, d.best.wave)]),
    button(S.play, 'play', d.onPlay, 'primary'),
    button(S.settings, 'settings', d.onSettings),
    h('ul', { class: 'keys', 'aria-label': S.controlsTitle }, [
      key(k.move, k.moveKeys, 'kb'), key(k.fire, k.fireKeys, 'kb'), key(k.bomb, k.bombKeys, 'kb'), key(k.pause, k.pauseKeys, 'kb'),
      key(k.drag, k.dragTouch, 'touch-only'), key(k.fire, k.fireTouch, 'touch-only'), key(k.bomb, k.bombTouch, 'touch-only'), key(k.pause, k.pauseKeys, 'touch-only'),
    ]),
  ], { focusKey: focusKey ?? 'play', variant: 'title', heading: logo() });
}

export function showPause(onResume: () => void, onRestart: () => void, onSettings: () => void, onQuit: () => void, focusKey = 'resume'): void {
  show(S.paused, [
    button(S.resume, 'resume', onResume, 'primary'),
    button(S.restart, 'restart', onRestart),
    button(S.settings, 'settings', onSettings),
    button(S.quit, 'quit', onQuit, 'danger'),
  ], { onBack: onResume, focusKey });
}

export function showConfirm(title: string, text: string, onYes: () => void, onNo: () => void): void {
  show(title, [
    h('p', {}, [text]),
    button(S.confirmNo, 'no', onNo, 'primary'),
    h('div', { class: 'gap' }),
    button(S.confirmYes, 'yes', onYes, 'danger'),
  ], { onBack: onNo, focusKey: 'no' });
}

export interface RunSummary {
  score: number;
  wave: number;
  kills: number;
  accuracy: number;
  bestMult: number;
  bosses: number;
}

const statCell = (label: string, value: string): HTMLElement => h('div', {}, [h('dt', {}, [label]), h('dd', {}, [value])]);

function statsGrid(r: RunSummary, extra: [string, string][] = []): HTMLElement {
  const st = S.stats;
  const cells = [statCell(st.wave, String(r.wave)), statCell(st.kills, String(r.kills)), statCell(st.accuracy, `${r.accuracy}%`), statCell(st.combo, `x${r.bestMult}`)];
  for (const [label, value] of extra) cells.push(statCell(label, value));
  return h('dl', { class: 'stats-grid' }, cells);
}

export function showContinue(left: number, r: RunSummary, onYes: () => void, onNo: () => void, reduce: boolean): void {
  show(S.continueTitle, [
    h('p', { class: 'label' }, [S.continueSummary(r.wave)]),
    scoreNode(r.score, reduce),
    statsGrid(r),
    h('p', {}, [S.continueText(left)]),
    button(S.continueYes(left), 'continue', onYes, 'primary'),
    button(S.endRun, 'end', onNo, 'ghost'),
  ], { focusKey: 'continue', variant: 'result' });
}

export interface EndInfo {
  won: boolean;
  summary: RunSummary;
  tier: Tier;
  isBest: boolean;
  best: Best;
  continuesUsed: number;
}

function scoreNode(score: number, reduce: boolean): HTMLElement {
  const node = h('p', { class: 'big', 'aria-label': `${S.finalScore} ${score.toLocaleString('en-US')}` });
  countUp(node, score, 1100, reduce);
  return node;
}

/** Payoff first (rank, big score, gold best badge), then the stats, then the actions. */
export function showEnd(info: EndInfo, onAgain: () => void, onQuit: () => void, reduce: boolean): void {
  const r = info.summary;
  show(info.won ? S.winTitle : S.overTitle, [
    h('p', { class: 'rank' }, [S.tier[info.tier]]),
    scoreNode(r.score, reduce),
    info.isBest ? h('p', { class: 'badge' }, [S.newBest]) : h('p', { class: 'best' }, [S.bestLine(info.best.score, info.best.wave)]),
    statsGrid(r, [[S.stats.bosses, String(r.bosses)], [S.stats.continues, String(info.continuesUsed)]]),
    button(S.playAgain, 'again', onAgain, 'primary'),
    button(S.quit, 'quit', onQuit),
  ], { focusKey: 'again', variant: 'result' });
}
