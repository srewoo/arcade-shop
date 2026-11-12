// On-screen wheel and pedals (pointer events, multi-touch safe).
import type { Input } from './input';

export function bindTouch(input: Input, wheel: HTMLElement, pedals: HTMLElement[]): void {
  const wheelValue = (e: PointerEvent): number => {
    const r = wheel.getBoundingClientRect();
    return Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2.6));
  };
  const show = (v: number): void => {
    wheel.firstElementChild?.setAttribute('style', `transform: rotate(${(v * 110).toFixed(1)}deg)`);
    wheel.setAttribute('aria-valuenow', String(Math.round(v * 100)));
  };
  wheel.addEventListener('pointerdown', (e) => {
    wheel.setPointerCapture(e.pointerId);
    input.wheel = wheelValue(e);
    show(input.wheel);
  });
  wheel.addEventListener('pointermove', (e) => {
    if (input.wheel === null) return;
    input.wheel = wheelValue(e);
    show(input.wheel);
  });
  const release = (): void => {
    input.wheel = null;
    show(0);
  };
  wheel.addEventListener('pointerup', release);
  wheel.addEventListener('pointercancel', release);
  for (const p of pedals) bindPedal(input, p);
}

function bindPedal(input: Input, pedal: HTMLElement): void {
  const which = pedal.dataset.pedal as 'fwd' | 'rev' | 'brake';
  const set = (on: boolean): void => {
    input.pad[which] = on;
    pedal.classList.toggle('on', on);
  };
  pedal.addEventListener('pointerdown', (e) => {
    pedal.setPointerCapture(e.pointerId);
    set(true);
  });
  pedal.addEventListener('pointerup', () => set(false));
  pedal.addEventListener('pointercancel', () => set(false));
  pedal.addEventListener('lostpointercapture', () => set(false));
  pedal.addEventListener('contextmenu', (e) => e.preventDefault());
}
