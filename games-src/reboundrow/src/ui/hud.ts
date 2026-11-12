// HUD (drawn over the scene), power-up and combo chips, and the launch prompt.
import { CONFIG } from '../config';
import { PALETTE } from '../palette';
import type { Mode } from '../run';
import { comboMultiplier } from '../sim/scoring';
import type { World } from '../sim/world';
import { S } from '../strings';
import { $, setText } from './dom';
import type { PowerKind } from '../levels/format';

type Timed = Exclude<PowerKind, 'multi'>;
const TIMED: readonly Timed[] = ['wide', 'slow', 'laser'];
const DURATION: Record<Timed, number> = { wide: CONFIG.power.wideSec, slow: CONFIG.power.slowSec, laser: CONFIG.power.laserSec };
let lastChips = '';

export function updateHud(w: World, mode: Mode): void {
  setText($('hud-score'), String(w.score));
  setText($('hud-lives'), String(w.lives));
  setText($('hud-hearts'), '♥'.repeat(Math.min(w.lives, CONFIG.lives.max)));
  setText($('hud-level'), mode === 'endless' ? `∞ ${w.level}` : String(w.level));
}

const chipEl = (label: string, text: string, color: string, id: string): HTMLElement => {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.dataset.chip = id;
  chip.style.setProperty('--chip', color);
  const letter = document.createElement('b');
  letter.textContent = label;
  chip.append(letter, text);
  return chip;
};

export function updateChips(w: World): void {
  const active = TIMED.filter((k) => w.effects[k] > 0);
  const mult = comboMultiplier(w.combo);
  const key = active.map((k) => `${k}${Math.ceil(w.effects[k])}`).join('|') + `#${mult}`;
  const host = $('chips');
  if (key !== lastChips) {
    lastChips = key;
    const chips = active.map((k) => chipEl(S.powerLetter[k], `${S.power[k]} ${Math.ceil(w.effects[k])}s`, PALETTE.power[k], k));
    if (mult > 1) chips.unshift(chipEl('', `${S.combo(mult)} combo`, PALETTE.rows[2], 'combo'));
    host.replaceChildren(...chips);
  }
  for (const k of active) {
    const el = host.querySelector<HTMLElement>(`[data-chip="${k}"]`);
    el?.style.setProperty('--p', String(Math.min(1, w.effects[k] / DURATION[k])));
  }
}

export function setPrompt(visible: boolean): void {
  setText($('prompt'), visible ? S.launchPrompt : '');
}

export function resetHudCache(): void {
  lastChips = '';
}
