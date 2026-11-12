// Screen shake and confetti. Both respect Reduce motion (confetti is skipped entirely).
import { CONFIG } from '../config';
import { createRng } from '../rng';
import { h } from './dom';

export const motionOn = (): boolean => document.documentElement.dataset.motion !== 'reduce';

export function shake(el: HTMLElement): void {
  if (!motionOn()) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), CONFIG.fx.shakeMs);
}

const COLORS = ['#ffd166', '#ff9d8a', '#8fe3a1', '#7fd3f7', '#c8a8ff', '#fff3c4'];
const SHAPES = ['', 'dot', 'dia'] as const;

export function confetti(host: HTMLElement, seed = 7): void {
  if (!motionOn()) return;
  const rng = createRng(seed);
  host.replaceChildren();
  for (let i = 0; i < CONFIG.fx.confettiCount; i++) {
    const bit = h('i', { class: `bit ${rng.pick(SHAPES)}` });
    const size = rng.int(6, 11);
    bit.style.cssText = `left:${rng.int(2, 98)}%;background:${rng.pick(COLORS)};animation-delay:${rng.int(0, 500)}ms;--dx:${rng.int(-70, 70)}px;width:${size}px;height:${size + rng.int(0, 5)}px`;
    host.append(bit);
  }
  setTimeout(() => host.replaceChildren(), CONFIG.fx.confettiMs + 600);
}
