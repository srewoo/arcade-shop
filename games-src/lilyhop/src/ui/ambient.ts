// Seeded fireflies and ripples behind the board. Static under reduced motion (CSS hides the animation).
import { CONFIG } from '../config';
import { createRng } from '../rng';

export function buildAmbient(root: HTMLElement): void {
  const rng = createRng(CONFIG.ambientSeed);
  root.replaceChildren();
  for (let i = 0; i < CONFIG.fx.fireflies; i++) {
    const f = document.createElement('i');
    f.className = 'firefly';
    f.style.setProperty('--x', `${rng.int(96) + 2}%`);
    f.style.setProperty('--y', `${rng.int(80) + 4}%`);
    f.style.setProperty('--d', `${3 + rng.int(40) / 10}s`);
    f.style.setProperty('--delay', `-${rng.int(50) / 10}s`);
    root.append(f);
  }
  for (let i = 0; i < CONFIG.fx.ripples; i++) {
    const r = document.createElement('b');
    r.className = 'ripple';
    r.style.setProperty('--x', `${rng.int(90) + 5}%`);
    r.style.setProperty('--y', `${rng.int(80) + 10}%`);
    r.style.setProperty('--delay', `-${rng.int(60) / 10}s`);
    root.append(r);
  }
}

export function burstConfetti(container: HTMLElement, count: number, ms: number): void {
  container.replaceChildren();
  const rng = createRng(Date.now() & 0xffff);
  const colours = ['#b9ec5c', '#ffb347', '#fff3a0', '#7fd6e6'];
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + rng.next() * 0.4;
    const dist = 30 + rng.next() * 40;
    dot.className = 'dot';
    dot.style.setProperty('--dx', `${Math.cos(angle) * dist}%`);
    dot.style.setProperty('--dy', `${Math.sin(angle) * dist - 10}%`);
    dot.style.setProperty('--c', colours[i % colours.length] ?? '#fff');
    dot.style.setProperty('--delay', `${rng.int(120)}ms`);
    container.append(dot);
  }
  window.setTimeout(() => container.replaceChildren(), ms + 300);
}
