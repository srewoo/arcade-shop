// Screen flow: title, play, pause (with in-page confirms), settings, game over.
import type { App } from './appState';
import { configureAudio, emit } from './audio';
import { createMatch, totals } from './match';
import { scoreFrames } from './scoring';
import { recordGame, saveScores } from './scores';
import { saveSettings, type SettingKey, type Settings } from './settings';
import { readFlag, writeFlag } from './storage';
import { S } from './strings';
import { applyAppearance } from './ui/appearance';
import { resetBoardCache } from './ui/board';
import { hideBanner } from './ui/controls';
import { burst } from './render/fx';
import { isReduced } from './appState';
import { closeOverlay, openOverlay } from './ui/overlay';
import { syncSettingsView } from './ui/settingsView';

const HINT_KEY = 'pp-onboarded';
let pendingConfirm: 'restart' | 'quit' | null = null;
let hintTimer = 0;
let overTimer = 0;
const HINT_FADE_MS = 14000;
const OVER_DELAY_MS = 900;

export const isRunning = (a: App): boolean => a.screen === 'play' && a.els.pauseOv.hidden && a.els.settingsOv.hidden && a.els.overOv.hidden;

export function renderStats(a: App): void {
  const s = a.scores;
  a.els.stats.textContent = `${S.best}: ${s.best} · ${S.gamesPlayed}: ${s.games} · ${S.fishCaught}: ${s.fish}`;
}

export function applySettings(a: App): void {
  applyAppearance(a.settings, a.systemReduced);
  configureAudio({ enabled: a.settings.sound, volume: a.settings.volume });
  syncSettingsView(document, a.els, a.settings);
}

export function changeSetting<K extends SettingKey>(a: App, key: K, value: Settings[K]): void {
  a.settings = { ...a.settings, [key]: value };
  saveSettings(a.settings);
  applySettings(a);
  emit('ui');
}

function showScreen(a: App, screen: App['screen']): void {
  a.screen = screen;
  const playing = screen !== 'title';
  a.els.title.hidden = playing;
  a.els.play.hidden = !playing;
  a.els.board.hidden = !playing;
  a.els.pause.hidden = !playing;
}

export function startGame(a: App): void {
  const seed = a.fixedSeed ?? (Math.random() * 0xffffffff) >>> 0;
  a.match = createMatch({ players: a.settings.players, difficulty: a.settings.difficulty, seed });
  a.fx.parts.length = 0; a.fx.bubbles.length = 0; a.fx.shake = 0;
  a.time = 0;
  resetBoardCache();
  hideBanner(a.els);
  closeOverlay(a.els.overOv);
  showScreen(a, 'play');
  window.clearTimeout(overTimer);
  window.clearTimeout(hintTimer);
  a.els.hint.hidden = readFlag(HINT_KEY);
  a.els.hintText.textContent = S.hint;
  if (!a.els.hint.hidden) hintTimer = window.setTimeout(() => dismissHint(a), HINT_FADE_MS);
  a.els.bowl.focus();
  emit('start');
}

export function toTitle(a: App): void {
  window.clearTimeout(overTimer);
  a.match = null;
  hideBanner(a.els);
  closeOverlay(a.els.overOv);
  showScreen(a, 'title');
  renderStats(a);
  a.els.playBtn.focus();
}

export function dismissHint(a: App): void {
  window.clearTimeout(hintTimer);
  if (!a.els.hint.hidden) { a.els.hint.hidden = true; writeFlag(HINT_KEY); }
}

export function pauseGame(a: App): void {
  if (a.screen !== 'play' || !a.els.pauseOv.hidden || !a.els.settingsOv.hidden || !a.els.overOv.hidden) return;
  a.els.pauseConfirm.hidden = true;
  pendingConfirm = null;
  openOverlay(a.els.pauseOv, a.els.pause, () => { pendingConfirm = null; a.els.pauseConfirm.hidden = true; }, a.els.pauseResume);
}

export function resumeGame(a: App): void {
  pendingConfirm = null;
  closeOverlay(a.els.pauseOv);
  a.els.bowl.focus();
}

export function openSettings(a: App, opener: HTMLElement): void {
  openOverlay(a.els.settingsOv, opener, () => undefined);
}

export const closeSettings = (a: App): void => closeOverlay(a.els.settingsOv);

export function askConfirm(a: App, kind: 'restart' | 'quit'): void {
  pendingConfirm = kind;
  a.els.confirmText.textContent = kind === 'restart' ? S.confirmRestart : S.confirmQuit;
  a.els.confirmYes.textContent = kind === 'restart' ? S.yesRestart : S.yesQuit;
  a.els.pauseConfirm.hidden = false;
  a.els.confirmNo.focus();
}

export function confirmYes(a: App): void {
  const kind = pendingConfirm;
  pendingConfirm = null;
  a.els.pauseConfirm.hidden = true;
  closeOverlay(a.els.pauseOv);
  if (kind === 'restart') startGame(a);
  else if (kind === 'quit') toTitle(a);
}

export function confirmNo(a: App): void {
  pendingConfirm = null;
  a.els.pauseConfirm.hidden = true;
  a.els.pauseResume.focus();
}

/** Count strikes/spares across a finished player's rolls. */
function tally(rolls: readonly number[]): { strikes: number; spares: number } {
  const marks = scoreFrames(rolls).flatMap((f) => f.marks);
  return { strikes: marks.filter((m) => m === 'X').length, spares: marks.filter((m) => m === '/').length };
}

/** Show the results sheet and bank lifetime stats (once per game). */
export function finishGame(a: App): void {
  const m = a.match;
  if (!m || a.screen === 'over') return;
  a.screen = 'over';
  const sums = totals(m);
  const mine = a.settings.players === 1 ? [0] : [0, 1];
  const prevBest = a.scores.best;
  for (const i of mine) {
    const t = tally(m.players[i]?.rolls ?? []);
    a.scores = recordGame(a.scores, { score: sums[i]?.score ?? 0, ...t, fish: m.players[i]?.fish ?? 0 });
  }
  saveScores(a.scores);
  fillResults(a, sums, prevBest);
  // Let the last roll's payoff play on the lane (confetti, banner) before the card covers it.
  const reduce = isReduced(a);
  if (!reduce) burst(a.fx, 'confetti', 1250, 0, false);
  const open = (): void => { if (a.screen === 'over') openOverlay(a.els.overOv, null, () => toTitle(a), a.els.overAgain); };
  window.clearTimeout(overTimer);
  if (reduce) open();
  else overTimer = window.setTimeout(open, OVER_DELAY_MS);
}

function fillResults(a: App, sums: ReturnType<typeof totals>, prevBest: number): void {
  const m = a.match;
  if (!m) return;
  const top = Math.max(...sums.map((s) => s.score));
  const winner = sums.findIndex((s) => s.score === top);
  const tied = sums.filter((s) => s.score === top).length > 1;
  const solo = m.players.length === 1;
  a.els.overRank.textContent = solo ? (top > prevBest && prevBest > 0 ? S.newBest : S.rank(top)) : tied ? 'A tie!' : `${m.players[winner]?.name ?? ''} wins!`;
  a.els.overScore.textContent = solo ? String(top) : sums.map((s) => s.score).join(' – ');
  const best = Math.max(prevBest, top);
  a.els.overBest.textContent = solo && top > prevBest && prevBest > 0 ? `${S.bestLine(top)} (was ${prevBest})` : S.bestLine(best);
  const noFish = m.players.every((p) => p.fish === 0);
  a.els.overTip.hidden = !noFish;
  a.els.overTip.textContent = S.fishTip;
  const lines = m.players.flatMap((p, i) => {
    const t = tally(p.rolls);
    const pre = solo ? '' : `${p.name}: `;
    return [`${pre}${S.bowlingScore} ${sums[i]?.bowling ?? 0}, ${S.fishScore} ${sums[i]?.fish ?? 0}`, `${pre}${S.strikesLabel} ${t.strikes}, ${S.sparesLabel} ${t.spares}`];
  });
  a.els.overLines.replaceChildren(...lines.map((l) => Object.assign(document.createElement('li'), { textContent: l })));
  a.els.live.textContent = `${S.over}. ${a.els.overRank.textContent} ${a.els.overScore.textContent}`;
}

/** Called each tick: moves to the results sheet when the match ends. */
export function checkOver(a: App): void {
  if (a.match?.phase === 'over' && a.screen === 'play') finishGame(a);
}
