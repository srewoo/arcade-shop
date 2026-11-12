// Arcade banner (STRIKE! / SPARE! / TURKEY!), the small "Pocket!" callout, and the off-screen live region.
// Reduced motion gets a plain fade via CSS (html[data-rm='on']).
import type { Banner } from './announce';
import { TUNING } from './tuning';

let bannerTimer = 0;
let calloutTimer = 0;

/** Announce text to screen readers through the polite live region. */
export function announce(text: string): void {
  const el = document.getElementById('sr-live');
  if (!el) return;
  el.textContent = '';
  window.setTimeout(() => { el.textContent = text; }, 30);
}

function restart(el: HTMLElement): void {
  el.classList.remove('show');
  void el.offsetWidth; // restart the animation
  el.classList.add('show');
}

export function showBanner(b: Banner): void {
  const el = document.getElementById('banner');
  if (!el) return;
  const text = document.getElementById('banner-text');
  if (text) text.textContent = b.text;
  el.dataset.kind = b.kind;
  restart(el);
  announce(b.text);
  window.clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => el.classList.remove('show'), TUNING.timing.bannerShowMs);
}

export function showCallout(text: string): void {
  const el = document.getElementById('callout');
  if (!el) return;
  el.textContent = text;
  restart(el);
  announce(text);
  window.clearTimeout(calloutTimer);
  calloutTimer = window.setTimeout(() => el.classList.remove('show'), TUNING.timing.calloutShowMs);
}

/** Hide the banner and callout at once (new game, quit). */
export function clearBanners(): void {
  window.clearTimeout(bannerTimer);
  window.clearTimeout(calloutTimer);
  document.getElementById('banner')?.classList.remove('show');
  document.getElementById('callout')?.classList.remove('show');
}
