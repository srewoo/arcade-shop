export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

/** True when effects should be calm: Settings "On", or "System" with prefers-reduced-motion. */
export const motionReduced = (): boolean => document.documentElement.dataset.motion === 'reduce';

/** Moves keyboard focus without scrolling the page (used when overlays open and close). */
export function focusQuietly(el: HTMLElement | null | undefined): void {
  el?.focus({ preventScroll: true });
}
