// Boot: resolve the DOM, load validated settings, wire everything, start the loop.
import './style/tokens.css';
import './style/base.css';
import './style/play.css';
import './style/board.css';
import './style/title.css';
import type { App } from './appState';
import { installAudioUnlock } from './audio';
import { exposeDebug } from './debug';
import { applySettings, changeSetting, renderStats } from './flow';
import { installInput } from './input';
import { startLoop } from './loop';
import { newFx } from './render/fx';
import { createView } from './render/render';
import { paintTitleCats } from './render/titleArt';
import { loadScores } from './scores';
import { loadSettings } from './settings';
import { S } from './strings';
import { resolveEls } from './ui/dom';
import { installTrap, setBackground } from './ui/overlay';
import { setupMeter } from './ui/controls';
import { bindSettingsView } from './ui/settingsView';

function fillStatic(a: App): void {
  a.els.tagline.textContent = S.tagline;
  a.els.keys.textContent = S.keysHelp;
  a.els.howList.replaceChildren(...S.howToLines.map((l) => Object.assign(document.createElement('li'), { textContent: l })));
  paintTitleCats(a.els.titleArt);
  a.els.scene.setAttribute('aria-label', S.canvasLabel);
  const labels: Record<string, string> = { 'lg-players': S.players, 'lg-diff': S.difficulty, 'lg-sound': S.sound, 'lg-motion': S.reduceMotion, 'lg-assist': S.colorAssist, 'lg-text': S.textSize, 'lg-theme': S.theme, 'lbl-volume': S.volume };
  for (const [id, text] of Object.entries(labels)) { const n = document.getElementById(id); if (n) n.textContent = text; }
}

function boot(): void {
  const els = resolveEls();
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seedParam = new URLSearchParams(location.search).get('seed');
  const app: App = {
    els, view: createView(els.scene), fx: newFx(), settings: loadSettings(), scores: loadScores(), match: null,
    screen: 'title', time: 0, systemReduced: mq.matches, hitSounds: 0,
    fixedSeed: seedParam !== null && /^\d+$/.test(seedParam) ? Number(seedParam) : null,
  };
  mq.addEventListener('change', (e) => { app.systemReduced = e.matches; applySettings(app); });
  fillStatic(app);
  setupMeter(els);
  setBackground([els.app]);
  installTrap();
  installAudioUnlock();
  bindSettingsView(document, els, (key, value) => changeSetting(app, key, value));
  applySettings(app);
  renderStats(app);
  installInput(app);
  exposeDebug(app);
  startLoop(app);
  els.playBtn.focus();
}

boot();
