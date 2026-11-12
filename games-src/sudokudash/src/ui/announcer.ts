// Visually hidden aria-live region for play events (wrong digit, combo, time warning, pause).
import { $ } from './dom';

let timer = 0;

export function announce(text: string): void {
  const live = $('sr-live');
  window.clearTimeout(timer);
  live.textContent = '';
  // A short delay makes screen readers treat repeated identical messages as new.
  timer = window.setTimeout(() => {
    live.textContent = text;
  }, 40);
}
