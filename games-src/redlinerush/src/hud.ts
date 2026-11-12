// HUD: writes only when a value changes, so a 60 Hz loop does not thrash the DOM.
import { CONFIG } from './config';
import { multiplier } from './scoring';
import { score } from './sim';
import type { Sim } from './simTypes';
import { fmtTime } from './strings';
import { $ } from './ui/dom';

const cache = new Map<string, string>();

function put(id: string, value: string): void {
  if (cache.get(id) === value) return;
  cache.set(id, value);
  $(id).textContent = value;
}

export function updateHud(s: Sim): void {
  put('h-score', String(score(s)));
  put('h-speed', String(Math.round(s.speed * 4)));
  put('h-lives', `♥ ${s.lives}`);
  put('h-dist', `${Math.floor(s.z)} m`);
  put('h-combo', s.combo > 0 ? `x${multiplier(s.combo)} (${s.combo})` : '-');
  const pct = Math.round((s.fuel / CONFIG.fuel.max) * 100);
  put('h-fuel', `${pct}%`);
  const low = s.mode !== 'trial' && s.fuel < CONFIG.fuel.low;
  const fill = $('h-fuel-fill');
  const width = `${pct}%`;
  if (cache.get('fuel-w') !== width) {
    cache.set('fuel-w', width);
    fill.style.width = width;
  }
  $('h-fuel-box').dataset.low = low ? '1' : '0';
  $('h-fuel-low').hidden = !low;
  if (s.mode === 'trial') {
    put('h-time', fmtTime(s.timeLeft));
    put('h-check', `${Math.min(s.checkpoint + 1, CONFIG.trial.checkpoints)}/${CONFIG.trial.checkpoints}`);
  }
}
