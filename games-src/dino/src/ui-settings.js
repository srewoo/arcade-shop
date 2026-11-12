// Settings dialog: difficulty, volume, mute, graphics quality, text size, reduce motion, theme, camera shake,
// colour-blind assist, power-ups, skins.  Opened from the gear, the pause overlay or the S key, closed with Esc / DONE /
// a backdrop tap.  Opening it freezes the simulation (run.js tick).  Everything persists.
import { DIFFICULTIES, MOTION_MODES, THEMES, TEXT_SCALES } from './settings.js';
import { S } from './strings.js';
import { QUALITIES } from './qualityLevels.js';
import { SKINS, isSkinOpen, nextUnlock } from './skins.js';
import { records } from './records.js';
import { game, settings } from './state.js';
import { audio, hud } from './systems.js';
import { saveSettings } from './storage.js';
import { applySettings } from './apply-settings.js';
import { refreshTitle } from './session.js';
import { renderModes, renderWeather } from './ui-modes.js';
import { WEATHER_IDS, WEATHER_LABELS, WEATHER_HINTS } from './world/weatherModes.js';

const el = (id) => document.getElementById(id);
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex="0"]';
let opener = null;

/** Build a segmented button group; `onPick(id)` fires on click. */
function buildSeg(host, entries, onPick) {
  host.replaceChildren(
    ...entries.map(([id, label]) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'seg-btn', textContent: label });
      b.dataset.id = id;
      b.addEventListener('click', () => onPick(id));
      return b;
    }),
  );
}

function markSeg(host, current) {
  for (const b of host.children) b.setAttribute('aria-pressed', String(b.dataset.id === current));
}

function commit({ restartTitle = false } = {}) {
  saveSettings(settings);
  applySettings();
  if (restartTitle && game.state === 'title') refreshTitle();
  render();
}

function renderSkins() {
  const best = records.overall();
  const host = el('set-skins');
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.skin : undefined;
  host.replaceChildren(
    ...SKINS.map((s) => {
      const open = isSkinOpen(s.id, best, settings.unlockedSkins);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `skin${open ? '' : ' locked'}`;
      b.dataset.skin = s.id;
      b.setAttribute('aria-pressed', String(open && settings.skin === s.id));
      b.setAttribute('aria-disabled', String(!open));
      b.setAttribute('aria-label', open ? `${s.label} skin` : `${s.label} skin, locked: reach a best score of ${s.unlock}`);
      const dot = Object.assign(document.createElement('span'), { className: 'swatch' });
      dot.style.background = s.swatch ?? '#7f9e7c';
      b.append(dot, Object.assign(document.createElement('span'), { textContent: s.label }),
        Object.assign(document.createElement('small'), { textContent: open ? '' : `LOCKED ${s.unlock}` }));
      b.addEventListener('click', () => {
        if (!open) return hud.toast(`${s.label} unlocks at a best score of ${s.unlock}`);
        settings.skin = s.id;
        commit();
      });
      return b;
    }),
  );
  if (focused) host.querySelector(`[data-skin="${focused}"]`)?.focus();
  const next = nextUnlock(best);
  el('skin-note').textContent = next ? `(best ${best}, next at ${next.unlock})` : `(best ${best}, all unlocked)`;
}

function render() {
  markSeg(el('set-difficulty'), settings.difficulty);
  markSeg(el('set-quality'), settings.quality);
  markSeg(el('set-weather'), settings.weather);
  el('set-volume').value = String(Math.round(settings.volume * 100));
  el('vol-out').textContent = `${Math.round(settings.volume * 100)}%`;
  markSeg(el('set-text'), String(settings.textScale));
  markSeg(el('set-motion'), settings.motion);
  markSeg(el('set-theme'), settings.theme);
  el('set-mute').checked = settings.muted;
  el('set-assist').checked = settings.colorAssist;
  el('set-shake').checked = settings.shake;
  el('set-powerups').checked = settings.powerups;
  el('set-classicplus').checked = settings.classicPlus;
  renderSkins();
}

export function openSettings() {
  if (game.menuOpen || !['title', 'gameover', 'paused'].includes(game.state)) return;
  opener = document.activeElement;
  game.menuOpen = true;
  render();
  el('settings-backdrop').classList.remove('hidden');
  el('settings').focus();
}

export function closeSettings() {
  if (!game.menuOpen) return;
  game.menuOpen = false;
  el('settings-backdrop').classList.add('hidden');
  saveSettings(settings);
  renderModes();
  renderWeather();
  if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
  else if (game.state === 'paused') document.getElementById('btn-resume')?.focus();
  else document.activeElement?.blur?.();
}

/** Keep Tab inside the dialog and let Esc close it (stopPropagation: the global Esc handler must not also fire). */
function onDialogKey(e) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    closeSettings();
  } else if (e.key === 'Tab') {
    const items = [...el('settings').querySelectorAll(FOCUSABLE)];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === el('settings'))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/** Fill the labels that come from strings.js. */
function labelSettings() {
  const T = S.settings;
  const set = (id, text) => (el(id).textContent = text);
  set('lg-text', T.textSize);
  set('lg-motion', T.motion);
  set('lg-theme', T.theme);
  set('lbl-assist', T.colorAssist);
  set('lbl-mute', T.mute);
  set('lbl-powerups', T.powerups);
  set('sub-powerups', T.powerupsSub);
  set('lbl-classicplus', T.classicPlus);
  set('sub-classicplus', T.classicPlusSub);
}

/** Segmented groups: [element id, settings key, [value, label] entries, commit options, parse]. */
const SEGMENTS = () => [
  ['set-text', 'textScale', TEXT_SCALES.map((n) => [String(n), `${Math.round(n * 100)}%`]), {}, Number],
  ['set-motion', 'motion', MOTION_MODES.map((m) => [m, S.settings.motionOpts[m]]), {}],
  ['set-theme', 'theme', THEMES.map((t) => [t, S.settings.themeOpts[t]]), {}],
  ['set-difficulty', 'difficulty', Object.values(DIFFICULTIES).map((d) => [d.id, `${d.label} x${d.mult}`]), { restartTitle: true }],
  ['set-quality', 'quality', QUALITIES.map((q) => [q, q[0].toUpperCase() + q.slice(1)]), {}],
  ['set-weather', 'weather', WEATHER_IDS.map((w) => [w, WEATHER_LABELS[w]]), {}],
];

function initSegments() {
  for (const [id, key, entries, opts, parse = String] of SEGMENTS()) {
    buildSeg(el(id), entries, (value) => {
      settings[key] = parse(value);
      commit(opts);
    });
  }
  for (const b of el('set-weather').children) b.title = WEATHER_HINTS[b.dataset.id];
}

function initToggles() {
  el('set-mute').addEventListener('change', (e) => {
    audio.setMuted(e.currentTarget.checked);
    hud.setMuted(audio.muted);
    settings.muted = audio.muted;
    commit();
  });
  for (const [id, key, restartTitle] of [['set-shake', 'shake'], ['set-assist', 'colorAssist'], ['set-powerups', 'powerups', true], ['set-classicplus', 'classicPlus', true]]) {
    el(id).addEventListener('change', (e) => {
      settings[key] = e.currentTarget.checked;
      commit({ restartTitle });
    });
  }
}

export function initSettings() {
  labelSettings();
  initSegments();
  initToggles();
  const volume = el('set-volume');
  volume.addEventListener('input', () => {
    settings.volume = Number(volume.value) / 100;
    el('vol-out').textContent = `${volume.value}%`;
    audio.setVolume(settings.volume);
  });
  volume.addEventListener('change', () => {
    audio.unlock();
    audio.pickup(); // audible feedback at the new level
    commit();
  });
  el('btn-settings').addEventListener('click', () => {
    audio.unlock();
    openSettings();
  });
  el('settings-close').addEventListener('click', closeSettings);
  el('settings-backdrop').addEventListener('click', (e) => e.target === e.currentTarget && closeSettings());
  el('settings').addEventListener('keydown', onDialogKey);
  render();
}
