// Status bar: timer / countdown, score, combo, mistakes. Painted from requestAnimationFrame, so
// every write is guarded to touch the DOM only when something changed.
import { CLASSIC_MISTAKE_LIMIT, comboWindowLeft, formatClock, formatElapsed, isLowTime } from '../core/scoring';
import type { Session } from '../session';
import { $, motionReduced } from './dom';

const LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' } as const;
const cache = new Map<string, string>();
let lastCombo = 1;

function setText(id: string, text: string): void {
  if (cache.get(id) === text) return;
  cache.set(id, text);
  $(id).textContent = text;
}

function setClass(el: HTMLElement, name: string, on: boolean): void {
  if (el.classList.contains(name) !== on) el.classList.toggle(name, on);
}

const modeName = (s: Session): string => {
  if (s.custom) return 'Custom';
  if (s.daily) return 'Daily';
  return s.mode === 'dash' ? 'Dash' : 'Classic';
};

/** `extraMs`: time since the last logic tick, so the clock glides between 100 ms ticks. */
export function renderHud(s: Session, extraMs = 0): void {
  const dash = s.dash;
  const hud = $('hud');
  setClass(hud, 'dash', dash !== null);
  setText('hud-mode', modeName(s));
  setText('hud-diff', LABEL[s.difficulty]);
  setText('hud-time-label', dash ? 'Time left' : 'Time');
  const ahead = s.playing ? extraMs : 0;
  const left = dash ? Math.max(dash.timeLeftMs > 0 ? 1 : 0, dash.timeLeftMs - ahead) : 0;
  setText('hud-time', dash ? formatClock(left) : formatElapsed(s.elapsedMs + ahead));
  const low = dash !== null && isLowTime(dash);
  setClass($('hud-time').closest('.stat') as HTMLElement, 'low', low);
  $('hud-score-wrap').hidden = !dash;
  $('hud-combo-wrap').hidden = !dash;
  $('timebar').hidden = !dash;
  if (dash) renderDash(s, dash, left, ahead, low);
  const limit = s.mode === 'classic' && s.mistakeLimit;
  setText('hud-mistakes', limit ? `${s.mistakes}/${CLASSIC_MISTAKE_LIMIT}` : String(s.mistakes));
}

function renderDash(s: Session, dash: NonNullable<Session['dash']>, left: number, ahead: number, low: boolean): void {
  setText('hud-score', String(dash.score));
  const combo = Math.max(1, dash.combo);
  setText('hud-combo', `x${combo}`);
  if (combo > lastCombo && !motionReduced()) {
    $('hud-combo-wrap').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  }
  lastCombo = combo;
  $('timebar-fill').style.transform = `scaleX(${Math.min(1, left / dash.startMs).toFixed(4)})`;
  setClass($('timebar'), 'low', low);
  const share = comboWindowLeft(dash, s.elapsedMs + ahead);
  $('combo-fill').style.transform = `scaleX(${share.toFixed(3)})`;
}

/** Forget cached text (a new session is attached). */
export function resetHud(): void {
  cache.clear();
  lastCombo = 1;
}
