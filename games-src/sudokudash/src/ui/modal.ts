// Modal helper for the non-<dialog> overlays (pause, end): makes the page behind inert, traps Tab
// inside the overlay, and returns focus to whatever opened it.
import { focusQuietly } from './dom';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const openers = new WeakMap<HTMLElement, HTMLElement | null>();

function setBackgroundInert(on: boolean): void {
  const app = document.getElementById('app');
  if (!app) return;
  if (on) app.setAttribute('inert', '');
  else app.removeAttribute('inert');
}

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest('[hidden]'));
}

export function openModal(el: HTMLElement, initial: HTMLElement | null): void {
  if (el.hidden) openers.set(el, document.activeElement instanceof HTMLElement ? document.activeElement : null);
  el.hidden = false;
  setBackgroundInert(true);
  focusQuietly(initial ?? visibleFocusables(el)[0]);
}

/** Hides the overlay and (unless `restore` is false) puts focus back on the opener if it still exists. */
export function closeModal(el: HTMLElement, restore = true): void {
  if (el.hidden) return;
  el.hidden = true;
  const others = ['pause', 'end'].filter((id) => id !== el.id && document.getElementById(id)?.hidden === false);
  if (others.length === 0) setBackgroundInert(false);
  const opener = openers.get(el);
  openers.delete(el);
  if (restore && opener?.isConnected && !opener.closest('[inert],[hidden]')) focusQuietly(opener);
}

/** Wraps Tab / Shift+Tab inside `el` (call once per overlay). */
export function trapTab(el: HTMLElement): void {
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = visibleFocusables(el);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !el.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !el.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  });
}
