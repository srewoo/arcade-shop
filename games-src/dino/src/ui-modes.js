// Mode selector on the title screen: tappable radio chips (also driven by <-/-> and 1-4 via controls.js).
import { MODES, MODE_ORDER, cycleMode } from './modes.js';
import { game, settings } from './state.js';
import { records } from './records.js';
import { saveSettings } from './storage.js';
import { applyRules, refreshTitle } from './session.js';
import { applySettings } from './apply-settings.js';
import { WEATHER_IDS, WEATHER_LABELS, WEATHER_HINTS, cycleWeather } from './world/weatherModes.js';

const el = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(5, '0');

/** Redraw chip labels / checked state / blurb (call after a mode change or a new best). */
export function renderModes() {
  const group = el('modes');
  if (!group.children.length) {
    for (const id of MODE_ORDER) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.mode = id;
      b.setAttribute('role', 'radio');
      b.addEventListener('click', (e) => {
        if (e.detail) b.blur(); // pointer click: let Space start the run afterwards
        selectMode(id);
      });
      group.appendChild(b);
    }
  }
  for (const b of group.children) {
    const m = MODES[b.dataset.mode];
    const on = m.id === game.mode;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1; // roving tabindex: arrow keys / digits move the selection
    b.replaceChildren(
      Object.assign(document.createElement('span'), { className: 'chip-name', textContent: `${m.digit} ${m.label}` }),
      Object.assign(document.createElement('span'), { className: 'chip-best', textContent: `BEST ${pad(records.best(m.id))}` }),
    );
    b.setAttribute('aria-label', `${m.label}: ${m.blurb}. Best ${records.best(m.id)}`);
  }
  el('mode-blurb').textContent = MODES[game.mode].blurb + (MODES[game.mode].board ? '' : ' - no leaderboard');
}

export function selectMode(id) {
  if (game.state !== 'title' || game.menuOpen || !MODES[id]) return;
  settings.mode = game.mode = id;
  saveSettings(settings);
  applyRules();
  refreshTitle();
  renderModes();
}

export const stepMode = (dir) => selectMode(cycleMode(game.mode, dir));

/** Environment chips under the mode row (Auto / Day / Night / Snow / Rain). */
export function renderWeather() {
  const host = el('weather-chips');
  if (!host.children.length) {
    for (const id of WEATHER_IDS) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'wchip', textContent: WEATHER_LABELS[id] });
      b.dataset.weather = id;
      b.title = WEATHER_HINTS[id];
      b.setAttribute('aria-label', `${WEATHER_LABELS[id]}: ${WEATHER_HINTS[id]}`);
      b.setAttribute('role', 'radio');
      b.addEventListener('click', (e) => {
        if (e.detail) b.blur();
        setWeather(id);
      });
      host.appendChild(b);
    }
  }
  for (const b of host.children) {
    const on = b.dataset.weather === settings.weather;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  }
}

/** Persist + apply an environment (title chips, W key, settings panel). Snow changes landings, so it is unranked. */
export function setWeather(id) {
  settings.weather = id;
  saveSettings(settings);
  applySettings();
  renderWeather();
}

export const stepWeather = () => game.state === 'title' && !game.menuOpen && setWeather(cycleWeather(settings.weather, 1));
