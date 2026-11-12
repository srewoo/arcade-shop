// DOM HUD (bundle class `dh`): score, bests, badges, toasts, coaching pill, countdown, flashes, pause button state.
// The game-over card is ui-over.js, the pause overlay ui-pause.js, power-up chips and the clock ui-power.js.
import { MODES } from './modes.js';
import { records } from './records.js';
import { PowerHud } from './ui-power.js';
import { GameOverCard } from './ui-over.js';
import { settings } from './state.js';

const el = (id) => document.getElementById(id);
const pad5 = (n) => String(Math.max(0, Math.floor(n))).padStart(5, '0');

export class Hud {
  constructor() {
    this.points = el('points');
    this.bestEl = el('best');
    this.title = el('title');
    this.mode = settings.mode;
    this.power = new PowerHud();
    this.over = new GameOverCard();
    this.shown = -1;
    this.coachTimer = 0;
    this.setScore(0);
    this.setMode(this.mode);
  }

  /** Switch the displayed best score / mode badge. */
  setMode(id) {
    this.mode = id;
    this.setBest(records.best(id));
    el('badge-mode').textContent = MODES[id].label.toUpperCase();
  }

  setScore(score) {
    if (score === this.shown) return;
    this.shown = score;
    this.points.textContent = pad5(score);
  }
  setBest(score) {
    this.bestEl.textContent = `BEST ${pad5(score)}`;
  }
  /** Restart the CSS "pop" animation on the score. */
  pop() {
    this.points.classList.remove('pop');
    void this.points.offsetWidth; // force reflow
    this.points.classList.add('pop');
  }

  showTitle(visible) {
    this.title.classList.toggle('hidden', !visible);
    document.body.classList.toggle('is-title', visible);
  }

  /** Delegates to the game-over card. */
  showGameOver(info) {
    this.setPlaying(false);
    this.over.show(info);
  }
  hideGameOver() {
    this.over.hide();
  }
  offerSave(score, mode, ranked) {
    return this.over.offerSave(score, mode, ranked);
  }
  get typing() {
    return this.over.typing;
  }

  setAuto(on) {
    el('badge-auto').classList.toggle('hidden', !on);
  }
  setMuted(on) {
    el('badge-mute').classList.toggle('hidden', !on);
  }
  setUiHidden(hidden) {
    document.body.classList.toggle('ui-hidden', hidden);
  }

  /** A live run: shows the pause button, and Zen's END RUN button (confirmed on the pause overlay). */
  setPlaying(on) {
    document.body.classList.toggle('is-playing', on);
    el('btn-pause').classList.toggle('hidden', !on);
    el('btn-help').classList.toggle('hidden', !on);
    if (on) document.body.classList.remove('hints-off', 'hints-show');
  }
  setRunning(running) {
    this.setPlaying(running);
    el('btn-end').classList.toggle('hidden', !(running && MODES[this.mode].onHit === 'stumble'));
  }

  /** Controls line: hide it for the rest of the run (the "?" button brings it back for a few seconds). */
  hideHints() {
    document.body.classList.add('hints-off');
  }
  peekHints(ms = 6000) {
    document.body.classList.add('hints-show');
    clearTimeout(this.peekTimer);
    this.peekTimer = setTimeout(() => document.body.classList.remove('hints-show'), ms);
  }

  /** Contextual one-time hint pill. */
  showCoach(text, ms) {
    const c = el('coach');
    c.textContent = text;
    c.classList.remove('hidden');
    clearTimeout(this.coachTimer);
    this.coachTimer = setTimeout(() => c.classList.add('hidden'), ms);
  }
  hideCoach() {
    clearTimeout(this.coachTimer);
    el('coach').classList.add('hidden');
  }

  /** 3-2-1 after a resume (0 hides it). */
  setCountdown(n) {
    const c = el('countdown');
    c.classList.toggle('hidden', n <= 0);
    if (n > 0 && c.textContent !== String(n)) c.textContent = String(n);
  }

  /** White flash with a bright screen edge (Shield break).  Callers skip it under reduced motion. */
  flash() {
    const f = el('flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  /** Polite off-screen announcement for assistive tech. */
  announce(text) {
    el('sr-status').textContent = text;
  }

  toast(text, ms) {
    this.power.toast(text, ms);
  }
  setClock(seconds) {
    this.power.setClock(seconds);
  }
  updatePowers(powers) {
    this.power.update(powers);
  }
}
