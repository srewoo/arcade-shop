// Pause overlay: Resume (default focus), Restart, Settings, Quit to title.  Restart, Quit and End run ask for an in-page
// confirmation first (never window.confirm).  Esc resumes (or backs out of a confirmation); Tab stays inside.
import { game } from './state.js';
import { audio } from './systems.js';
import { S } from './strings.js';
import { MODES } from './modes.js';
import { resumeGame, restartFromPause, quitFromPause, endRunFromPause } from './pause.js';
import { openSettings } from './ui-settings.js';

const P = S.pause;
let root = null;
let card = null;
let confirming = null; // 'restart' | 'quit' | 'end' | null

const CONFIRMS = {
  restart: { text: P.confirmRestart, run: restartFromPause },
  quit: { text: P.confirmQuit, run: quitFromPause },
  end: { text: P.confirmEnd, run: endRunFromPause },
};

function button(label, cls, onClick, snd = 'tick') {
  const b = Object.assign(document.createElement('button'), { type: 'button', className: `btn ${cls}`.trim(), textContent: label });
  b.dataset.ui = '';
  b.dataset.snd = snd;
  b.addEventListener('click', onClick);
  return b;
}

function heading(sub) {
  const h = Object.assign(document.createElement('h2'), { id: 'pause-title', textContent: P.title });
  const p = Object.assign(document.createElement('p'), { className: 'sub', textContent: sub });
  return [h, p];
}

function renderMain() {
  confirming = null;
  const reason = game.pauseReason === 'blur' ? P.reasonBlur : game.pauseReason === 'hidden' ? P.reasonHidden : P.sub;
  const resume = button(P.resume, '', resumeGame, 'confirm');
  resume.id = 'btn-resume';
  const items = [...heading(reason), resume, button(P.restart, 'ghost danger-gap', () => askConfirm('restart')), button(P.settings, 'ghost', openSettings)];
  if (MODES[game.mode].onHit === 'stumble') items.push(button(P.endRun, 'ghost', () => askConfirm('end')));
  items.push(button(P.quit, 'ghost', () => askConfirm('quit')));
  card.replaceChildren(...items);
  resume.focus({ preventScroll: true });
}

function askConfirm(kind) {
  confirming = kind;
  const c = CONFIRMS[kind];
  const text = Object.assign(document.createElement('p'), { className: 'confirm-text', textContent: c.text });
  const no = button(P.no, '', renderMain, 'back');
  const yes = button(P.yes, 'ghost', () => c.run(), 'confirm');
  const row = Object.assign(document.createElement('div'), { className: 'row2' });
  row.append(no, yes);
  card.replaceChildren(...heading(P.title).slice(0, 1), text, row);
  no.focus({ preventScroll: true }); // the safe answer is the default
}

/** Esc on the overlay: back out of a confirmation first, else resume.  Returns true when it handled the key. */
export function pauseBack() {
  if (root.classList.contains('hidden')) return false;
  if (confirming) renderMain();
  else resumeGame();
  return true;
}

export function showPause() {
  root.classList.remove('hidden'); // visible first: a hidden element can not take focus
  renderMain();
  document.body.classList.add('is-paused');
}

export function hidePause() {
  if (!root) return;
  root.classList.add('hidden');
  document.body.classList.remove('is-paused');
  confirming = null;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

/** Ask to end the run (Zen's END RUN button): pause first, then confirm on the overlay. */
export function showEndConfirm() {
  askConfirm('end');
}

function trapTab(e) {
  if (e.key !== 'Tab') return;
  const items = [...card.querySelectorAll('button')];
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function initPauseUi() {
  root = Object.assign(document.createElement('div'), { id: 'pause', className: 'hidden' });
  root.dataset.ui = '';
  card = Object.assign(document.createElement('section'), { className: 'card' });
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'pause-title');
  root.appendChild(card);
  document.getElementById('ui').appendChild(root);
  root.addEventListener('keydown', trapTab);
  root.addEventListener('click', (e) => e.target === root && audio.ui('back'));
}
