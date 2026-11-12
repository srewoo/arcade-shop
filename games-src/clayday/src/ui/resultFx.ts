// Results payoff: stars fill in and the hit count climbs, then the details card fades in.
import { countUp } from '../visuals';

const MS = 700;
let raf = 0;

export function renderStars(el: HTMLElement, filled: number, max = 5): void {
  el.replaceChildren(...Array.from({ length: max }, (_, i) => {
    const s = document.createElement('span');
    s.textContent = '★';
    s.className = i < filled ? 'on' : 'off';
    s.style.setProperty('--i', String(i));
    return s;
  }));
}

/** Count the big number up to `hits` (static text under Reduce motion). */
export function playCountUp(el: HTMLElement, hits: number, total: number, reduced: boolean): void {
  cancelAnimationFrame(raf);
  if (reduced) {
    el.textContent = `${hits} / ${total}`;
    return;
  }
  const start = performance.now();
  const tick = (now: number): void => {
    el.textContent = `${countUp(hits, now - start, MS)} / ${total}`;
    if (now - start < MS) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

export function stopPayoff(): void {
  cancelAnimationFrame(raf);
}
