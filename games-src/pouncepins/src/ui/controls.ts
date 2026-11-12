// Meter, curve read-out, Bowl button and the chip above the lane. DOM is touched only on change.
import { CONFIG } from '../config';
import { currentFrame, type Match } from '../match';
import { pinsDown } from '../physics';
import { frameState } from '../scoring';
import { S } from '../strings';
import type { Els } from './dom';

const cache = new Map<string, string>();
function setText(key: string, node: HTMLElement, text: string): void {
  if (cache.get(key) === text) return;
  cache.set(key, text);
  node.textContent = text;
}

export const curveLabel = (curve: number): string =>
  curve === 0 ? S.straight : `${curve < 0 ? S.curveLeft : S.curveRight} ${'●'.repeat(Math.abs(curve))}`;

export function arrowSpeedLabel(m: Match): string {
  const { sweepMin, sweepMax, diff } = CONFIG.aim;
  const t = (m.aim.speed / diff[m.opts.difficulty] - sweepMin) / (sweepMax - sweepMin);
  const names = S.arrowSpeed;
  return names[Math.min(names.length - 1, Math.max(0, Math.floor(t * names.length)))] ?? '';
}

export function setupMeter(els: Els): void {
  const lo = CONFIG.power.sweetLo * 100, hi = CONFIG.power.sweetHi * 100;
  els.sweet.style.left = `${lo}%`;
  els.sweet.style.width = `${hi - lo}%`;
}

export function updateControls(els: Els, m: Match, alpha: number, assist: boolean): void {
  const power = m.phase === 'power' || m.phase === 'rolling' ? m.power.prev + (m.power.value - m.power.prev) * (m.phase === 'power' ? alpha : 1) : 0;
  const pct = Math.round(power * 100);
  els.meterFill.style.width = `${pct}%`;
  els.meter.setAttribute('aria-valuenow', String(pct));
  setText('meterLabel', els.meterLabel, assist ? `${S.power} (${S.sweet} ${Math.round(CONFIG.power.sweetLo * 100)}-${Math.round(CONFIG.power.sweetHi * 100)}%)` : S.power);
  setText('curve', els.curveOut, curveLabel(m.curve));
  const label = m.phase === 'aim' ? S.lockAim : m.phase === 'power' ? S.lockPower : S.waiting;
  setText('bowl', els.bowl, label);
  const canAct = m.phase === 'aim' || m.phase === 'power';
  els.bowl.setAttribute('aria-disabled', String(!canAct));
  els.bowl.style.opacity = canAct ? '1' : '0.6';
  els.curveL.disabled = els.curveR.disabled = !canAct;
  const st = frameState(m.players[m.current]?.rolls ?? []);
  const who = m.players.length > 1 ? `${m.players[m.current]?.name ?? ''} · ` : '';
  const fish = m.world.fish && !m.world.fish.taken ? ` · ${'🐟'}` : '';
  const detail = st.complete ? S.over : `${S.frame} ${currentFrame(m)} · Ball ${st.ball} · ${arrowSpeedLabel(m)}${fish}`;
  setText('chip', els.chip, who + detail);
  const down = m.phase === 'rolling' ? pinsDown(m.world) : 0;
  setText('down', els.down, down > 0 ? S.down(down) : '');
  els.down.dataset.show = String(down > 0);
}

let bannerTimer = 0;
export function showBanner(els: Els, text: string, ms: number): void {
  els.banner.textContent = text;
  els.banner.dataset.show = 'true';
  window.clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => { els.banner.dataset.show = 'false'; }, ms);
}
export const hideBanner = (els: Els): void => { window.clearTimeout(bannerTimer); els.banner.dataset.show = 'false'; cache.clear(); };
