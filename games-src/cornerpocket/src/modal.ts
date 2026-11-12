// One modal layer for pause, confirmation and settings. Traps Tab, restores focus to the opener.
import { $ } from './ui';

let opener: HTMLElement | null = null;
let wired = false;

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trap(e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const items = Array.from($('modal').querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) return;
  const first = items[0]!; const last = items[items.length - 1]!;
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !$('modal').contains(active))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (active === last || !$('modal').contains(active))) { e.preventDefault(); first.focus(); }
}

export const modalOpen = (): boolean => !$('modal').hidden;

/** Show a dialog card. `focus` is a selector for the control that gets focus (the safe default). */
export function showModal(html: string, focus: string): HTMLElement {
  const m = $('modal');
  if (!wired) { m.addEventListener('keydown', trap); wired = true; }
  if (m.hidden) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  m.innerHTML = html;
  m.hidden = false;
  m.querySelector<HTMLElement>(focus)?.focus();
  return m;
}

export function hideModal(focusFallback?: HTMLElement | null): void {
  const m = $('modal');
  m.hidden = true; m.innerHTML = '';
  const target = opener && document.contains(opener) && opener.offsetParent !== null ? opener : focusFallback;
  opener = null;
  target?.focus();
}
